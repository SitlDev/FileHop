"""Create deficiencies table

Revision ID: 004_deficiencies
Revises: 003_health_inspections
Create Date: 2026-05-08 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '004_deficiencies'
down_revision = '003_health_inspections'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'deficiencies',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('health_inspection_id', sa.String(36), nullable=False),
        sa.Column('f_tag', sa.String(10), nullable=False),
        sa.Column('scope', sa.String(1), nullable=False),
        sa.Column('severity', sa.String(1), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_substandard_qoc', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('is_immediate_jeopardy', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('is_past_non_compliance', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('points', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['health_inspection_id'], ['health_inspections.id'], ),
        sa.Index('idx_deficiencies_health_inspection', 'health_inspection_id'),
        sa.Index('idx_deficiencies_f_tag', 'f_tag'),
    )


def downgrade() -> None:
    op.drop_table('deficiencies')
