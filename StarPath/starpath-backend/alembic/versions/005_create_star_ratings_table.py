"""Create star_ratings table

Revision ID: 005_star_ratings
Revises: 004_deficiencies
Create Date: 2026-05-08 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '005_star_ratings'
down_revision = '004_deficiencies'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'star_ratings',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('facility_id', sa.String(36), nullable=False),
        sa.Column('effective_date', sa.Date(), nullable=False),
        sa.Column('health_inspection_rating', sa.Integer(), nullable=True),
        sa.Column('staffing_rating', sa.Integer(), nullable=True),
        sa.Column('qm_rating', sa.Integer(), nullable=True),
        sa.Column('overall_rating', sa.Integer(), nullable=True),
        sa.Column('health_inspection_score', sa.Numeric(10, 2), nullable=True),
        sa.Column('staffing_score', sa.Integer(), nullable=True),
        sa.Column('qm_score', sa.Integer(), nullable=True),
        sa.Column('calculation_details', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['facility_id'], ['facilities.id'], ),
        sa.Index('idx_star_ratings_facility', 'facility_id'),
        sa.Index('idx_star_ratings_effective_date', 'effective_date'),
    )


def downgrade() -> None:
    op.drop_table('star_ratings')
