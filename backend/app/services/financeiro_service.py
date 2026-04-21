from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, extract
from sqlalchemy.orm import selectinload
from typing import List, Optional
from decimal import Decimal
from datetime import date
from app.models.financeiro import VendaSemanal, ItemVenda, GanhoJovem, ResumoCaixa
from app.models.jovem import Jovem
from app.schemas.financeiro import (
    VendaSemanalCreate, VendaSemanalUpdate, DistribuirGanhosRequest,
    GanhoMensalJovem, ResumoFinanceiro, ResumoCaixa as ResumoCaixaResponse
)


class FinanceiroService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def zerar_ganhos_jovens(self) -> int:
        # Busca IDs das vendas com ganhos
        result = await self.db.execute(select(GanhoJovem.venda_id).where(GanhoJovem.venda_id != None))
        venda_ids = {row[0] for row in result.fetchall() if row[0] is not None}
        # Zera ganhos
        deleted = await self.db.execute(GanhoJovem.__table__.delete())
        # Inativa apenas as vendas associadas
        if venda_ids:
            await self.db.execute(
                VendaSemanal.__table__.update().where(VendaSemanal.id.in_(venda_ids)).values(ativo=False)
            )
        await self.db.commit()
        return deleted.rowcount

    async def get_vendas(
        self,
        semana_inicio: Optional[date] = None,
        semana_fim: Optional[date] = None,
        mes: Optional[int] = None,
        ano: Optional[int] = None,
        evento_id: Optional[int] = None,
    ) -> List[VendaSemanal]:
        query = select(VendaSemanal).options(selectinload(VendaSemanal.itens)).where(VendaSemanal.ativo == True)
        if semana_inicio:
            query = query.where(VendaSemanal.semana_inicio >= semana_inicio)
        if semana_fim:
            query = query.where(VendaSemanal.semana_fim <= semana_fim)
        if mes:
            query = query.where(extract("month", VendaSemanal.semana_inicio) == mes)
        if ano:
            query = query.where(extract("year", VendaSemanal.semana_inicio) == ano)
        if evento_id:
            query = query.where(VendaSemanal.evento_id == evento_id)
        query = query.order_by(VendaSemanal.semana_inicio.desc())
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_venda_by_id(self, venda_id: int) -> Optional[VendaSemanal]:
        result = await self.db.execute(
            select(VendaSemanal)
            .options(selectinload(VendaSemanal.itens))
            .where(VendaSemanal.id == venda_id)
        )
        return result.scalar_one_or_none()

    async def create_venda(self, data: VendaSemanalCreate) -> VendaSemanal:
        venda_data = data.model_dump(exclude={"itens"})
        if "ativo" not in venda_data or venda_data["ativo"] is None:
            venda_data["ativo"] = True
        venda = VendaSemanal(**venda_data)
        self.db.add(venda)
        await self.db.flush()
        for item_data in data.itens:
            item = ItemVenda(**item_data.model_dump(), venda_id=venda.id)
            self.db.add(item)
        await self.db.commit()
        await self.atualizar_resumo_caixa_em_nova_venda(venda)
        return await self.get_venda_by_id(venda.id)

    async def update_venda(self, venda_id: int, data: VendaSemanalUpdate) -> Optional[VendaSemanal]:
        venda = await self.get_venda_by_id(venda_id)
        if not venda:
            return None
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(venda, field, value)
        await self.db.commit()
        return await self.get_venda_by_id(venda_id)

    async def delete_venda(self, venda_id: int) -> bool:
        venda = await self.get_venda_by_id(venda_id)
        if not venda:
            return False
        await self.db.delete(venda)
        await self.db.commit()
        return True

    async def distribuir_ganhos(self, data: DistribuirGanhosRequest) -> List[GanhoJovem]:
        existing = await self.db.execute(
            select(GanhoJovem).where(GanhoJovem.venda_id == data.venda_id)
        )
        ganhos_anteriores = {g.jovem_id: g for g in existing.scalars().all()}

        ganhos = []
        for dist in data.distribuicoes:
            jovem_id = dist.jovem_id
            valor_novo = dist.valor
            ganho_antigo = ganhos_anteriores.get(jovem_id)
            if ganho_antigo:
                ganho_antigo.valor = valor_novo
                ganhos.append(ganho_antigo)
            else:
                # Novo ganho para este jovem nesta venda
                ganho = GanhoJovem(
                    jovem_id=jovem_id,
                    venda_id=data.venda_id,
                    valor=valor_novo,
                )
                self.db.add(ganho)
                ganhos.append(ganho)

        # Remove ganhos que não estão mais na distribuição
        ids_distribuidos = {d.jovem_id for d in data.distribuicoes}
        for jovem_id, ganho in ganhos_anteriores.items():
            if jovem_id not in ids_distribuidos:
                await self.db.delete(ganho)

        await self.db.commit()
        for g in ganhos:
            await self.db.refresh(g)
        return ganhos

    async def get_ganhos_mensais(
        self, mes: int, ano: int
    ) -> List[GanhoMensalJovem]:
        jovens = await self.db.execute(
            select(Jovem.id, Jovem.nome)
            .where(Jovem.habilitado_financeiro == True, Jovem.ativo == True)
            .order_by(Jovem.nome)
        )
        jovens_list = jovens.all()
        ganhos_por_jovem = {}
        datas_ultimos_ganhos = {}
        for jovem_id, jovem_nome in jovens_list:
            # Ganhos por venda
            ganhos_venda = await self.db.execute(
                select(func.coalesce(func.sum(GanhoJovem.valor), 0))
                .join(VendaSemanal, VendaSemanal.id == GanhoJovem.venda_id)
                .where(
                    GanhoJovem.jovem_id == jovem_id
                )
            )
            total_vendas = ganhos_venda.scalar_one()

            # Ganhos manuais (sem venda)
            ganhos_manuais = await self.db.execute(
                select(func.coalesce(func.sum(GanhoJovem.valor), 0))
                .where(GanhoJovem.jovem_id == jovem_id, GanhoJovem.venda_id == None)
            )
            total_manuais = ganhos_manuais.scalar_one()
            total_geral = total_vendas + total_manuais

            # Data do último ganho
            data_ultimo = await self.db.execute(
                select(func.coalesce(func.max(GanhoJovem.created_at), func.now()))
                .where(GanhoJovem.jovem_id == jovem_id)
            )
            datas_ultimos_ganhos[jovem_id] = data_ultimo.scalar_one()

            ganhos_por_jovem[jovem_id] = GanhoMensalJovem(
                jovem_id=jovem_id,
                jovem_nome=jovem_nome,
                total_mensal=total_geral,
            )
        # Ordena do mais recente para o mais antigo
        ordenados = sorted(
            ganhos_por_jovem.values(),
            key=lambda g: datas_ultimos_ganhos.get(g.jovem_id) or 0,
            reverse=True
        )
        return ordenados

    async def adicionar_ganho_manual(self, jovem_id: int, valor: Decimal):
        result = await self.db.execute(
            select(GanhoJovem).where(GanhoJovem.jovem_id == jovem_id, GanhoJovem.venda_id == None)
        )
        ganho = result.scalar_one_or_none()
        if ganho:
            ganho.valor += valor
        else:
            ganho = GanhoJovem(jovem_id=jovem_id, venda_id=None, valor=valor)
            self.db.add(ganho)
        await self.db.commit()
        await self.db.refresh(ganho)
        return ganho

    async def get_resumo(self) -> ResumoFinanceiro:
        result = await self.db.execute(
            select(
                func.coalesce(func.sum(VendaSemanal.valor_dinheiro), 0).label("total_dinheiro"),
                func.coalesce(func.sum(VendaSemanal.valor_pix), 0).label("total_pix"),
                func.coalesce(func.sum(VendaSemanal.total_investido), 0).label("total_investido"),
                func.coalesce(func.sum(VendaSemanal.total_arrecadado), 0).label("total_arrecadado"),
            )
        )
        row = result.one()
        total_dinheiro = Decimal(str(row.total_dinheiro))
        total_pix = Decimal(str(row.total_pix))
        total_investido = Decimal(str(row.total_investido))
        total_arrecadado = Decimal(str(row.total_arrecadado))

        return ResumoFinanceiro(
            total_dinheiro=total_dinheiro,
            total_pix=total_pix,
            total_caixa=total_dinheiro + total_pix,
            total_investido=total_investido,
            total_arrecadado=total_arrecadado,
            lucro_liquido=total_arrecadado - total_investido,
        )

    async def get_ganhos_por_venda(self, venda_id: int) -> List[GanhoJovem]:
        result = await self.db.execute(
            select(GanhoJovem).where(GanhoJovem.venda_id == venda_id)
        )
        return list(result.scalars().all())

    async def atualizar_resumo_caixa_manual(self, resumo_data: ResumoCaixaResponse) -> ResumoCaixa:
        resumo = await self.db.execute(select(ResumoCaixa).limit(1))
        resumo_obj = resumo.scalar_one_or_none()
        if not resumo_obj:
            resumo_obj = ResumoCaixa(
                total_caixa=resumo_data.total_caixa,
                total_dinheiro=resumo_data.total_dinheiro,
                total_pix=resumo_data.total_pix,
            )
            self.db.add(resumo_obj)
            await self.db.flush()
        else:
            resumo_obj.total_caixa = resumo_data.total_caixa
            resumo_obj.total_dinheiro = resumo_data.total_dinheiro
            resumo_obj.total_pix = resumo_data.total_pix
        await self.db.commit()
        await self.db.refresh(resumo_obj)
        return resumo_obj

    async def atualizar_resumo_caixa_em_nova_venda(self, venda: VendaSemanal):
        resumo = await self.db.execute(select(ResumoCaixa).limit(1))
        resumo_obj = resumo.scalar_one_or_none()
        if not resumo_obj:
            resumo_obj = ResumoCaixa(
                total_caixa=Decimal(0),
                total_dinheiro=Decimal(0),
                total_pix=Decimal(0),
            )
            self.db.add(resumo_obj)
            await self.db.flush()
        # Atualiza os campos
        resumo_obj.total_caixa += venda.lucro_liquido
        await self.db.commit()
        return resumo_obj
