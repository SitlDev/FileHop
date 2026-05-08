"""Create facilities table

Revision ID: 002_facilities
Revises: 000_users
Create Date: 2026-05-08 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '002_facilities'
down_revision = '000_users'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'facilities',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('cms_provider_id', sa.String(10), nullable=False, unique=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('address', sa.JSON(), nullable=True),
        sa.Column('ownership', sa.String(100), nullable=True),
        sa.Column('bed_count', sa.Integer(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.Index('idx_facilities_cms_provider_id', 'cms_provider_id'),
        sa.Index('idx_facilities_is_active', 'is_active'),
    )


def downgrade() -> None:
    op.drop_table('facilities')
