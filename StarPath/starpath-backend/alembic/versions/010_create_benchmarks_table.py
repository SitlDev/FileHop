"""Add benchmarks table

Revision ID: 010_benchmarks
Revises: 009_quality_measures
Create Date: 2026-05-12 12:02:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '010_benchmarks'
down_revision = '009_quality_measures'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'benchmarks',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('state', sa.String(), nullable=True),
        sa.Column('report_date', sa.Date(), nullable=True),
        sa.Column('report_period', sa.String(), nullable=True),
        sa.Column('overall_rating_median', sa.Float(), nullable=True),
        sa.Column('overall_rating_25th_percentile', sa.Float(), nullable=True),
        sa.Column('overall_rating_75th_percentile', sa.Float(), nullable=True),
        sa.Column('health_inspection_median', sa.Float(), nullable=True),
        sa.Column('health_inspection_25th_percentile', sa.Float(), nullable=True),
        sa.Column('health_inspection_75th_percentile', sa.Float(), nullable=True),
        sa.Column('staffing_median', sa.Float(), nullable=True),
        sa.Column('staffing_25th_percentile', sa.Float(), nullable=True),
        sa.Column('staffing_75th_percentile', sa.Float(), nullable=True),
        sa.Column('quality_measures_median', sa.Float(), nullable=True),
        sa.Column('quality_measures_25th_percentile', sa.Float(), nullable=True),
        sa.Column('quality_measures_75th_percentile', sa.Float(), nullable=True),
        sa.Column('resident_satisfaction_median', sa.Float(), nullable=True),
        sa.Column('resident_satisfaction_25th_percentile', sa.Float(), nullable=True),
        sa.Column('resident_satisfaction_75th_percentile', sa.Float(), nullable=True),
        sa.Column('rn_hours_per_100_bed_days_median', sa.Float(), nullable=True),
        sa.Column('rn_hours_per_100_bed_days_25th_percentile', sa.Float(), nullable=True),
        sa.Column('rn_hours_per_100_bed_days_75th_percentile', sa.Float(), nullable=True),
        sa.Column('total_hours_per_100_bed_days_median', sa.Float(), nullable=True),
        sa.Column('total_hours_per_100_bed_days_25th_percentile', sa.Float(), nullable=True),
        sa.Column('total_hours_per_100_bed_days_75th_percentile', sa.Float(), nullable=True),
        sa.Column('pressure_ulcer_median', sa.Float(), nullable=True),
        sa.Column('readmission_rate_median', sa.Float(), nullable=True),
        sa.Column('hospital_transfer_rate_median', sa.Float(), nullable=True),
        sa.Column('antipsychotic_median', sa.Float(), nullable=True),
        sa.Column('facility_count', sa.String(), nullable=True),
        sa.Column('data_source', sa.String(), nullable=True),
        sa.Column('source_url', sa.String(), nullable=True),
        sa.Column('notes', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_benchmarks_id'), 'benchmarks', ['id'], unique=False)
    op.create_index(op.f('ix_benchmarks_report_date'), 'benchmarks', ['report_date'], unique=False)
    op.create_index(op.f('ix_benchmarks_state'), 'benchmarks', ['state'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_benchmarks_state'), table_name='benchmarks')
    op.drop_index(op.f('ix_benchmarks_report_date'), table_name='benchmarks')
    op.drop_index(op.f('ix_benchmarks_id'), table_name='benchmarks')
    op.drop_table('benchmarks')
