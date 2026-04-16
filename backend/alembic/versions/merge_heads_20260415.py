"""merge add_perfil_to_jovem and remove_email_from_jovem heads
Revision ID: merge_heads_20260415
Revises: add_perfil_to_jovem, remove_email_from_jovem
Create Date: 2026-04-15
"""
from alembic import op

# revision identifiers, used by Alembic.
revision = 'merge_heads_20260415'
down_revision = ('add_perfil_to_jovem', 'remove_email_from_jovem')
branch_labels = None
depends_on = None

def upgrade():
    pass

def downgrade():
    pass
