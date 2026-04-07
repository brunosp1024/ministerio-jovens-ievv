from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from sqlalchemy.orm import selectinload
from typing import List
from app.models.notificacao import Notificacao
from app.models.jovem import Jovem
from app.schemas.notificacao import NotificacaoCreate


class NotificacaoService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self, apenas_nao_lidas: bool = False) -> List[Notificacao]:
        query = (
            select(Notificacao)
            .options(selectinload(Notificacao.jovem))
            .order_by(Notificacao.created_at.desc())
        )
        if apenas_nao_lidas:
            query = query.where(Notificacao.lida == False)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_nao_lidas_count(self) -> int:
        result = await self.db.execute(
            select(Notificacao).where(Notificacao.lida == False)
        )
        return len(result.scalars().all())

    async def create(self, data: NotificacaoCreate) -> Notificacao:
        notificacao = Notificacao(**data.model_dump())
        self.db.add(notificacao)
        await self.db.commit()
        await self.db.refresh(notificacao)
        return notificacao

    async def marcar_lida(self, notificacao_id: int) -> bool:
        result = await self.db.execute(
            select(Notificacao).where(Notificacao.id == notificacao_id)
        )
        notificacao = result.scalar_one_or_none()
        if not notificacao:
            return False
        notificacao.lida = True
        await self.db.commit()
        return True

    async def marcar_todas_lidas(self) -> int:
        result = await self.db.execute(
            select(Notificacao).where(Notificacao.lida == False)
        )
        notificacoes = result.scalars().all()
        count = 0
        for n in notificacoes:
            n.lida = True
            count += 1
        await self.db.commit()
        return count

    async def criar_notificacoes_aniversario(self) -> List[Notificacao]:
        from datetime import date
        hoje = date.today()
        result = await self.db.execute(
            select(Jovem).where(Jovem.ativo == True)
        )
        jovens = result.scalars().all()
        criadas = []
        for jovem in jovens:
            if jovem.data_nascimento and jovem.data_nascimento.month == hoje.month and jovem.data_nascimento.day == hoje.day:
                idade = hoje.year - jovem.data_nascimento.year
                notificacao = Notificacao(
                    jovem_id=jovem.id,
                    titulo=f"🎂 Aniversário de {jovem.nome}",
                    mensagem=f"{jovem.nome} está fazendo {idade} anos hoje! Não esqueça de parabenizá-lo(a).",
                    lida=False,
                )
                self.db.add(notificacao)
                criadas.append(notificacao)
        if criadas:
            await self.db.commit()
            for n in criadas:
                await self.db.refresh(n)
        return criadas
