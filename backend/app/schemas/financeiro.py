from pydantic import BaseModel
from datetime import date, datetime
from decimal import Decimal
from typing import Optional, List


class ItemVendaBase(BaseModel):
    produto: str
    quantidade: int
    preco_unitario: Decimal
    total: Decimal


class ItemVendaCreate(ItemVendaBase):
    pass


class ItemVendaResponse(ItemVendaBase):
    id: int
    venda_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class VendaSemanalBase(BaseModel):
    semana_inicio: date
    semana_fim: date
    total_investido: Decimal
    total_arrecadado: Decimal
    valor_dinheiro: Decimal = Decimal("0")
    valor_pix: Decimal = Decimal("0")
    observacoes: Optional[str] = None
    evento_id: Optional[int] = None


class VendaSemanalCreate(VendaSemanalBase):
    itens: List[ItemVendaCreate] = []


class VendaSemanalUpdate(BaseModel):
    total_investido: Optional[Decimal] = None
    total_arrecadado: Optional[Decimal] = None
    valor_dinheiro: Optional[Decimal] = None
    valor_pix: Optional[Decimal] = None
    observacoes: Optional[str] = None
    evento_id: Optional[int] = None


class VendaSemanalResponse(VendaSemanalBase):
    id: int
    lucro_liquido: Decimal
    itens: List[ItemVendaResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DistribuicaoItem(BaseModel):
    jovem_id: int
    valor: Decimal


class DistribuirGanhosRequest(BaseModel):
    venda_id: int
    distribuicoes: List[DistribuicaoItem]


class GanhoJovemResponse(BaseModel):
    id: int
    jovem_id: int
    jovem_nome: str
    venda_id: int
    valor: Decimal
    created_at: datetime

    class Config:
        from_attributes = True


class GanhoMensalJovem(BaseModel):
    jovem_id: int
    jovem_nome: str
    total_mensal: Decimal


class ResumoFinanceiro(BaseModel):
    total_dinheiro: Decimal
    total_pix: Decimal
    total_caixa: Decimal
    total_investido: Decimal
    total_arrecadado: Decimal
    lucro_liquido: Decimal


class RelatorioSemanal(BaseModel):
    venda: VendaSemanalResponse
    lucro_liquido: Decimal


class RelatorioFiltro(BaseModel):
    semana_inicio: Optional[date] = None
    semana_fim: Optional[date] = None
    mes: Optional[int] = None
    ano: Optional[int] = None
