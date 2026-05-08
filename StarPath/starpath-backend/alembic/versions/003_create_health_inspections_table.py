"""Create health_inspections table

Revision ID: 003_health_inspections
Revises: 002_facilities
Create Date: 2026-05-08 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '003_health_inspections'
down_revision = '002_facilities'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'health_inspections',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('facility_id', sa.String(36), nullable=False),
        sa.Column('survey_date', sa.Date(), nullable=False),
        sa.Column('survey_type', sa.String(50), nullable=False),
        sa.Column('cycle', sa.Integer(), nullable=True),
        sa.Column('revisit_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['facility_id'], ['facilities.id'], ),
        sa.Index('idx_health_inspections_facility', 'facility_id'),
        sa.Index('idx_health_inspections_survey_date', 'survey_date'),
    )


def downgrade() -> None:
    op.drop_table('health_inspections')
