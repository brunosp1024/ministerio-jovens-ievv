from typing import Optional
from sqlalchemy import String, Numeric, Integer, Date, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import date, datetime
from decimal import Decimal
from app.db.session import Base


class ResumoCaixa(Base):
    __tablename__ = "resumo_caixa"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    total_caixa: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    total_dinheiro: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    total_pix: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())


class VendaSemanal(Base):
    __tablename__ = "vendas_semanais"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    semana_inicio: Mapped[date] = mapped_column(Date, nullable=False)
    semana_fim: Mapped[date] = mapped_column(Date, nullable=False)
    total_investido: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    total_arrecadado: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    valor_dinheiro: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    valor_pix: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    observacoes: Mapped[str | None] = mapped_column(String(500), nullable=True)
    evento_id: Mapped[int | None] = mapped_column(ForeignKey("eventos.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())
    ativo: Mapped[bool] = mapped_column(default=True)
    evento: Mapped["Evento"] = relationship("Evento")
    itens: Mapped[list["ItemVenda"]] = relationship(
        "ItemVenda", back_populates="venda", cascade="all, delete-orphan"
    )
    ganhos: Mapped[list["GanhoJovem"]] = relationship(
        "GanhoJovem", back_populates="venda", cascade="all, delete-orphan"
    )

    @property
    def lucro_liquido(self) -> Decimal:
        return self.total_arrecadado - self.total_investido


class ItemVenda(Base):
    __tablename__ = "itens_venda"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    venda_id: Mapped[int] = mapped_column(ForeignKey("vendas_semanais.id"), nullable=False)
    produto: Mapped[str] = mapped_column(String(200), nullable=False)
    quantidade: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    preco_unitario: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    total: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    venda: Mapped["VendaSemanal"] = relationship("VendaSemanal", back_populates="itens")


class GanhoJovem(Base):
    __tablename__ = "ganhos_jovens"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    jovem_id: Mapped[int] = mapped_column(ForeignKey("jovens.id"), nullable=False)
    venda_id: Mapped[Optional[int]] = mapped_column(ForeignKey("vendas_semanais.id"), nullable=True)
    valor: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    jovem: Mapped["Jovem"] = relationship("Jovem", back_populates="ganhos")
    venda: Mapped[Optional["VendaSemanal"]] = relationship("VendaSemanal", back_populates="ganhos")
