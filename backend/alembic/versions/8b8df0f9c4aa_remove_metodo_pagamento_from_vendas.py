"""remove metodo_pagamento from vendas

Revision ID: 8b8df0f9c4aa
Revises: 4f2b6f0d8b91
Create Date: 2026-04-03 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "8b8df0f9c4aa"
down_revision: Union[str, None] = "4f2b6f0d8b91"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_column("vendas_semanais", "metodo_pagamento")
    op.execute("DROP TYPE IF EXISTS metodopagamento")


def downgrade() -> None:
    metodo_pagamento = sa.Enum("DINHEIRO", "PIX", "MISTO", name="metodopagamento")
    metodo_pagamento.create(op.get_bind(), checkfirst=True)
    op.add_column(
        "vendas_semanais",
        sa.Column("metodo_pagamento", metodo_pagamento, nullable=True),
    )
    op.execute("UPDATE vendas_semanais SET metodo_pagamento = 'MISTO' WHERE metodo_pagamento IS NULL")
    op.alter_column("vendas_semanais", "metodo_pagamento", nullable=False)