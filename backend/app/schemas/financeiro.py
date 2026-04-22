from decimal import Decimal
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
    observacoes: Optional[str] = None
    evento_id: Optional[int] = None
    ativo: Optional[bool] = True


class VendaSemanalCreate(VendaSemanalBase):
    itens: List[ItemVendaCreate] = []


class VendaSemanalUpdate(BaseModel):
    total_investido: Optional[Decimal] = None
    total_arrecadado: Optional[Decimal] = None
    observacoes: Optional[str] = None
    evento_id: Optional[int] = None
    ativo: Optional[bool] = None
    itens: Optional[List[ItemVendaCreate]] = None


class VendaSemanalResponse(VendaSemanalBase):
    id: int
    lucro_liquido: Decimal
    itens: List[ItemVendaResponse] = []
    created_at: datetime
    updated_at: datetime
    ativo: bool

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


class GanhoManualRequest(BaseModel):
    jovem_id: int
    valor: Decimal


class ResumoFinanceiro(BaseModel):
    total_dinheiro: Decimal
    total_pix: Decimal
    total_caixa: Decimal
    total_investido: Decimal
    total_arrecadado: Decimal
    lucro_liquido: Decimal


class ResumoCaixa(BaseModel):
    total_caixa: Decimal
    total_dinheiro: Decimal
    total_pix: Decimal

    class Config:
        from_attributes = True


class RelatorioSemanal(BaseModel):
    venda: VendaSemanalResponse
    lucro_liquido: Decimal


class RelatorioFiltro(BaseModel):
    semana_inicio: Optional[date] = None
    semana_fim: Optional[date] = None
    mes: Optional[int] = None
    ano: Optional[int] = None
