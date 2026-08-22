"""Initial schema — jobs and match_results tables.

Revision ID: 0001
Revises: None
Create Date: 2026-08-22

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "jobs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("title", sa.String(255), nullable=True),
        sa.Column("description_text", sa.Text(), nullable=False),
        sa.Column("profile_json", sa.JSON(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )

    op.create_table(
        "match_results",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "job_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("jobs.id"),
            nullable=False,
        ),
        sa.Column("candidate_name", sa.String(255), nullable=True),
        sa.Column("candidate_email", sa.String(255), nullable=True),
        sa.Column("candidate_phone", sa.String(100), nullable=True),
        sa.Column("resume_filename", sa.String(255), nullable=False),
        sa.Column("skill_score", sa.Float(), nullable=True),
        sa.Column("semantic_score", sa.Float(), nullable=True),
        sa.Column("experience_score", sa.Float(), nullable=True),
        sa.Column("education_score", sa.Float(), nullable=True),
        sa.Column("final_score", sa.Float(), nullable=True),
        sa.Column("recommendation", sa.String(50), nullable=True),
        sa.Column("resume_profile_json", sa.JSON(), nullable=True),
        sa.Column("reasoning_json", sa.JSON(), nullable=True),
        sa.Column("match_details_json", sa.JSON(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )

    # Index for common query: candidates by job, ordered by score
    op.create_index(
        "ix_match_results_job_score",
        "match_results",
        ["job_id", "final_score"],
    )


def downgrade() -> None:
    op.drop_index("ix_match_results_job_score", table_name="match_results")
    op.drop_table("match_results")
    op.drop_table("jobs")
