"""remove email from jovem
Revision ID: remove_email_from_jovem
Revises: 
Create Date: 2026-04-15

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'remove_email_from_jovem'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    with op.batch_alter_table('jovens') as batch_op:
        batch_op.drop_column('email')

def downgrade():
    with op.batch_alter_table('jovens') as batch_op:
        batch_op.add_column(sa.Column('email', sa.String(length=150), nullable=True))