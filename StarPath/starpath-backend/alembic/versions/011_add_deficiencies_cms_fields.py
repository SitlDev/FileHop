"""Add CMS compliance fields to deficiencies

Revision ID: 011_deficiencies_cms_fields
Revises: 010_create_benchmarks_table
Create Date: 2026-05-12 12:03:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '011_deficiencies_cms_fields'
down_revision = '010_create_benchmarks_table'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('deficiencies', sa.Column('severity_level', sa.String(), nullable=True))
    op.add_column('deficiencies', sa.Column('regulatory_citation', sa.String(), nullable=True))
    op.add_column('deficiencies', sa.Column('remediation_date', sa.Date(), nullable=True))
    op.add_column('deficiencies', sa.Column('remediation_verified', sa.Boolean(), nullable=True))
    op.add_column('deficiencies', sa.Column('remediation_notes', sa.String(), nullable=True))
    op.add_column('deficiencies', sa.Column('updated_at', sa.DateTime(), nullable=True))
    op.create_index(op.f('ix_deficiencies_severity_level'), 'deficiencies', ['severity_level'], unique=False)
    op.create_index(op.f('ix_deficiencies_remediation_date'), 'deficiencies', ['remediation_date'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_deficiencies_remediation_date'), table_name='deficiencies')
    op.drop_index(op.f('ix_deficiencies_severity_level'), table_name='deficiencies')
    op.drop_column('deficiencies', 'updated_at')
    op.drop_column('deficiencies', 'remediation_notes')
    op.drop_column('deficiencies', 'remediation_verified')
    op.drop_column('deficiencies', 'remediation_date')
    op.drop_column('deficiencies', 'regulatory_citation')
    op.drop_column('deficiencies', 'severity_level')
