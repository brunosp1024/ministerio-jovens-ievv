"""remove projetos feature

Revision ID: 4f2b6f0d8b91
Revises: 2dc105fe368d
Create Date: 2026-04-03 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "4f2b6f0d8b91"
down_revision: Union[str, None] = "2dc105fe368d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_constraint("eventos_projeto_id_fkey", "eventos", type_="foreignkey")
    op.drop_column("eventos", "projeto_id")

    op.drop_constraint("vendas_semanais_projeto_id_fkey", "vendas_semanais", type_="foreignkey")
    op.drop_column("vendas_semanais", "projeto_id")

    op.drop_index(op.f("ix_projetos_id"), table_name="projetos")
    op.drop_table("projetos")


def downgrade() -> None:
    op.create_table(
        "projetos",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("nome", sa.String(length=200), nullable=False),
        sa.Column("descricao", sa.Text(), nullable=True),
        sa.Column("ativo", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("now()"), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_projetos_id"), "projetos", ["id"], unique=False)
    op.execute(
        """
        INSERT INTO projetos (id, nome, descricao, ativo)
        VALUES (1, 'Projeto restaurado', 'Projeto placeholder criado no downgrade.', true)
        """
    )

    op.add_column("vendas_semanais", sa.Column("projeto_id", sa.Integer(), nullable=True))
    op.execute("UPDATE vendas_semanais SET projeto_id = 1 WHERE projeto_id IS NULL")
    op.alter_column("vendas_semanais", "projeto_id", nullable=False)
    op.create_foreign_key(
        "vendas_semanais_projeto_id_fkey",
        "vendas_semanais",
        "projetos",
        ["projeto_id"],
        ["id"],
    )

    op.add_column("eventos", sa.Column("projeto_id", sa.Integer(), nullable=True))
    op.create_foreign_key(
        "eventos_projeto_id_fkey",
        "eventos",
        "projetos",
        ["projeto_id"],
        ["id"],
    )