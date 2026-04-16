"""
Revision ID: add_perfil_to_jovem
Revises: 8b8df0f9c4aa
Create Date: 2026-04-14
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_perfil_to_jovem'
down_revision = '8b8df0f9c4aa'
branch_labels = None
depends_on = None

def upgrade():
    op.add_column('jovens', sa.Column('perfil', sa.String(length=30), nullable=True))

def downgrade():
    op.drop_column('jovens', 'perfil')
