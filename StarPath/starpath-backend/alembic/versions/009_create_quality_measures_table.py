"""Add quality_measures table

Revision ID: 009_quality_measures
Revises: 008_create_staffing_data_table
Create Date: 2026-05-12 12:01:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '009_quality_measures'
down_revision = '008_create_staffing_data_table'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'quality_measures',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('facility_id', sa.String(), nullable=False),
        sa.Column('report_date', sa.Date(), nullable=True),
        sa.Column('report_period', sa.String(), nullable=True),
        sa.Column('pressure_ulcer_percentage', sa.Float(), nullable=True),
        sa.Column('uti_percentage', sa.Float(), nullable=True),
        sa.Column('delirium_percentage', sa.Float(), nullable=True),
        sa.Column('depression_percentage', sa.Float(), nullable=True),
        sa.Column('antipsychotic_percentage', sa.Float(), nullable=True),
        sa.Column('postop_pain_percentage', sa.Float(), nullable=True),
        sa.Column('physical_restraints_percentage', sa.Float(), nullable=True),
        sa.Column('readmission_rate', sa.Float(), nullable=True),
        sa.Column('hospital_transfer_rate', sa.Float(), nullable=True),
        sa.Column('ed_visit_rate', sa.Float(), nullable=True),
        sa.Column('antipsychotic_short_stay_percentage', sa.Float(), nullable=True),
        sa.Column('overall_satisfaction_score', sa.Float(), nullable=True),
        sa.Column('care_quality_score', sa.Float(), nullable=True),
        sa.Column('cleanliness_score', sa.Float(), nullable=True),
        sa.Column('staff_responsiveness_score', sa.Float(), nullable=True),
        sa.Column('data_source', sa.String(), nullable=True),
        sa.Column('data_source_date', sa.Date(), nullable=True),
        sa.Column('notes', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['facility_id'], ['facilities.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_quality_measures_facility_id'), 'quality_measures', ['facility_id'], unique=False)
    op.create_index(op.f('ix_quality_measures_id'), 'quality_measures', ['id'], unique=False)
    op.create_index(op.f('ix_quality_measures_report_date'), 'quality_measures', ['report_date'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_quality_measures_report_date'), table_name='quality_measures')
    op.drop_index(op.f('ix_quality_measures_id'), table_name='quality_measures')
    op.drop_index(op.f('ix_quality_measures_facility_id'), table_name='quality_measures')
    op.drop_table('quality_measures')
