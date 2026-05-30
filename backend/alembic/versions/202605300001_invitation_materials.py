"""add invitation materials

Revision ID: 202605300001
Revises: 202605150001
Create Date: 2026-05-30
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "202605300001"
down_revision: Union[str, None] = "202605150001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def timestamps() -> list[sa.Column]:
    return [
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    ]


def upgrade() -> None:
    op.create_table(
        "invitation_materials",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "invitation_id",
            sa.Integer(),
            sa.ForeignKey("registration_invitations.id"),
            nullable=False,
        ),
        sa.Column("material_type", sa.String(length=100), nullable=False),
        sa.Column("material_name", sa.String(length=255), nullable=False),
        sa.Column("required", sa.Boolean(), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("file_id", sa.Integer(), sa.ForeignKey("files.id"), nullable=True),
        sa.Column("review_comment", sa.Text(), nullable=True),
        sa.Column("reviewed_by", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        *timestamps(),
    )
    op.create_index(
        "ix_invitation_materials_invitation_id",
        "invitation_materials",
        ["invitation_id"],
    )
    op.create_index(
        "ix_invitation_materials_material_type",
        "invitation_materials",
        ["material_type"],
    )
    op.create_unique_constraint(
        "uq_invitation_materials_invitation_type",
        "invitation_materials",
        ["invitation_id", "material_type"],
    )


def downgrade() -> None:
    op.drop_constraint(
        "uq_invitation_materials_invitation_type",
        "invitation_materials",
        type_="unique",
    )
    op.drop_index("ix_invitation_materials_material_type", table_name="invitation_materials")
    op.drop_index("ix_invitation_materials_invitation_id", table_name="invitation_materials")
    op.drop_table("invitation_materials")
