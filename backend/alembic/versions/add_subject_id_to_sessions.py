"""Add subject_id to sessions

Revision ID: add_subject_id_sessions
Revises: 4acf101a2e7e
Create Date: 2025-01-20 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_subject_id_sessions'
down_revision = '4acf101a2e7e'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Adicionar coluna subject_id na tabela sessions
    op.add_column('sessions', sa.Column('subject_id', postgresql.UUID(as_uuid=True), nullable=True))
    # Criar foreign key constraint
    op.create_foreign_key(
        'fk_sessions_subject_id',
        'sessions',
        'subjects',
        ['subject_id'],
        ['id'],
        ondelete='SET NULL'
    )


def downgrade() -> None:
    # Remover foreign key constraint
    op.drop_constraint('fk_sessions_subject_id', 'sessions', type_='foreignkey')
    # Remover coluna subject_id
    op.drop_column('sessions', 'subject_id')

