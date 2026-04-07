from sqlalchemy import String, Boolean, Date, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import date, datetime
from app.db.session import Base


class Jovem(Base):
    __tablename__ = "jovens"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    nome: Mapped[str] = mapped_column(String(150), nullable=False)
    email: Mapped[str | None] = mapped_column(String(150), unique=True, nullable=True)
    telefone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    data_nascimento: Mapped[date] = mapped_column(Date, nullable=False)
    endereco: Mapped[str | None] = mapped_column(String(250), nullable=True)
    foto_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    habilitado_financeiro: Mapped[bool] = mapped_column(Boolean, default=True)
    ativo: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    ganhos: Mapped[list["GanhoJovem"]] = relationship("GanhoJovem", back_populates="jovem")
    notificacoes: Mapped[list["Notificacao"]] = relationship("Notificacao", back_populates="jovem")
