"""
Migration para adicionar o campo 'ativo' na tabela vendas_semanais corretamente
"""
# Alembic identifiers
revision = 'add_ativo_vendas_20260420'
down_revision = '9674bdcd23c2'
branch_labels = None
depends_on = None
from alembic import op
import sqlalchemy as sa

def upgrade():
    # 1. Adiciona a coluna como nullable com default True
    op.add_column('vendas_semanais', sa.Column('ativo', sa.Boolean(), nullable=True, server_default=sa.true()))
    # 2. Atualiza todos os registros existentes para True
    op.execute('UPDATE vendas_semanais SET ativo = TRUE')
    # 3. Altera a coluna para NOT NULL
    op.alter_column('vendas_semanais', 'ativo', nullable=False)

def downgrade():
    op.drop_column('vendas_semanais', 'ativo')
