"""Create PBJ submission and daily staffing tables

Revision ID: 007_pbj
Revises: 006_notifications
Create Date: 2026-05-08 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '007_pbj'
down_revision = '006_notifications'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'pbj_submissions',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('facility_id', sa.String(36), nullable=False),
        sa.Column('quarter', sa.String(6), nullable=False),
        sa.Column('submission_date', sa.Date(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['facility_id'], ['facilities.id'], ),
        sa.Index('idx_pbj_submissions_facility', 'facility_id'),
        sa.Index('idx_pbj_submissions_quarter', 'quarter'),
    )
    
    op.create_table(
        'pbj_daily_staffing',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('pbj_submission_id', sa.String(36), nullable=False),
        sa.Column('work_date', sa.Date(), nullable=False),
        sa.Column('employee_id', sa.String(50), nullable=True),
        sa.Column('job_code', sa.Integer(), nullable=False),
        sa.Column('hours', sa.Numeric(5, 2), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['pbj_submission_id'], ['pbj_submissions.id'], ),
        sa.Index('idx_pbj_daily_staffing_submission', 'pbj_submission_id'),
        sa.Index('idx_pbj_daily_staffing_work_date', 'work_date'),
    )


def downgrade() -> None:
    op.drop_table('pbj_daily_staffing')
    op.drop_table('pbj_submissions')
