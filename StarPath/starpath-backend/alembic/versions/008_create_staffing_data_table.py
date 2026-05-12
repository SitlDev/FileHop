"""Add staffing_data table

Revision ID: 010_staffing_data
Revises: 009_add_pbj_tables
Create Date: 2026-05-12 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '010_staffing_data'
down_revision = '007_create_notifications_table'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'staffing_data',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('facility_id', sa.String(), nullable=False),
        sa.Column('report_date', sa.Date(), nullable=True),
        sa.Column('report_period', sa.String(), nullable=True),
        sa.Column('total_rn', sa.Integer(), nullable=True),
        sa.Column('total_lpn', sa.Integer(), nullable=True),
        sa.Column('total_cna', sa.Integer(), nullable=True),
        sa.Column('total_other', sa.Integer(), nullable=True),
        sa.Column('rn_hours_per_100_bed_days', sa.Float(), nullable=True),
        sa.Column('lpn_hours_per_100_bed_days', sa.Float(), nullable=True),
        sa.Column('cna_hours_per_100_bed_days', sa.Float(), nullable=True),
        sa.Column('total_hours_per_100_bed_days', sa.Float(), nullable=True),
        sa.Column('rn_turnover_rate', sa.Float(), nullable=True),
        sa.Column('lpn_turnover_rate', sa.Float(), nullable=True),
        sa.Column('cna_turnover_rate', sa.Float(), nullable=True),
        sa.Column('total_staff_turnover_rate', sa.Float(), nullable=True),
        sa.Column('rn_adequate', sa.Boolean(), nullable=True),
        sa.Column('lpn_adequate', sa.Boolean(), nullable=True),
        sa.Column('cna_adequate', sa.Boolean(), nullable=True),
        sa.Column('data_source', sa.String(), nullable=True),
        sa.Column('data_source_date', sa.Date(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['facility_id'], ['facilities.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_staffing_data_facility_id'), 'staffing_data', ['facility_id'], unique=False)
    op.create_index(op.f('ix_staffing_data_id'), 'staffing_data', ['id'], unique=False)
    op.create_index(op.f('ix_staffing_data_report_date'), 'staffing_data', ['report_date'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_staffing_data_report_date'), table_name='staffing_data')
    op.drop_index(op.f('ix_staffing_data_id'), table_name='staffing_data')
    op.drop_index(op.f('ix_staffing_data_facility_id'), table_name='staffing_data')
    op.drop_table('staffing_data')
