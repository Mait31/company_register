"""initial schema

Revision ID: 202605150001
Revises:
Create Date: 2026-05-15
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "202605150001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def timestamps() -> list[sa.Column]:
    return [
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    ]


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("mobile", sa.String(length=50), nullable=True),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("role", sa.String(length=50), nullable=False),
        sa.Column("status", sa.String(length=30), nullable=False),
        *timestamps(),
    )
    op.create_table(
        "customers",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("mobile", sa.String(length=50), nullable=True),
        sa.Column("wechat", sa.String(length=100), nullable=True),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("nationality", sa.String(length=100), nullable=True),
        sa.Column("current_visa_type", sa.String(length=100), nullable=True),
        sa.Column("source", sa.String(length=100), nullable=True),
        sa.Column("remark", sa.Text(), nullable=True),
        *timestamps(),
    )
    op.create_table(
        "wecom_users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("wecom_userid", sa.String(length=128), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=True),
        sa.Column("department", sa.String(length=255), nullable=True),
        sa.Column("mobile", sa.String(length=50), nullable=True),
        sa.Column("email", sa.String(length=255), nullable=True),
        *timestamps(),
    )
    op.create_index("ix_wecom_users_wecom_userid", "wecom_users", ["wecom_userid"], unique=True)
    op.create_table(
        "wechat_users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("openid", sa.String(length=128), nullable=False),
        sa.Column("unionid", sa.String(length=128), nullable=True),
        sa.Column("nickname", sa.String(length=100), nullable=True),
        sa.Column("avatar_url", sa.String(length=500), nullable=True),
        *timestamps(),
    )
    op.create_index("ix_wechat_users_openid", "wechat_users", ["openid"], unique=True)
    op.create_index("ix_wechat_users_unionid", "wechat_users", ["unionid"])
    op.create_table(
        "registration_orders",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("order_no", sa.String(length=50), nullable=False),
        sa.Column("customer_id", sa.Integer(), sa.ForeignKey("customers.id"), nullable=True),
        sa.Column("sales_user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("assigned_user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("public_token", sa.String(length=255), nullable=False),
        sa.Column("is_urgent", sa.Boolean(), nullable=False),
        sa.Column("need_registered_address", sa.Boolean(), nullable=False),
        sa.Column("need_bank_account", sa.Boolean(), nullable=False),
        sa.Column("need_tax_registration", sa.Boolean(), nullable=False),
        sa.Column("need_accounting", sa.Boolean(), nullable=False),
        sa.Column("need_work_permit_later", sa.Boolean(), nullable=False),
        sa.Column("remark", sa.Text(), nullable=True),
        *timestamps(),
    )
    op.create_index("ix_registration_orders_order_no", "registration_orders", ["order_no"], unique=True)
    op.create_index(
        "ix_registration_orders_public_token", "registration_orders", ["public_token"], unique=True
    )
    op.create_index("ix_registration_orders_status", "registration_orders", ["status"])
    op.create_table(
        "company_drafts",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("order_id", sa.Integer(), sa.ForeignKey("registration_orders.id"), nullable=False),
        sa.Column("company_name_1", sa.String(length=255), nullable=True),
        sa.Column("company_name_2", sa.String(length=255), nullable=True),
        sa.Column("company_name_3", sa.String(length=255), nullable=True),
        sa.Column("company_type", sa.String(length=100), nullable=True),
        sa.Column("country", sa.String(length=100), nullable=True),
        sa.Column("city", sa.String(length=100), nullable=True),
        sa.Column("legal_address", sa.Text(), nullable=True),
        sa.Column("registered_capital_amount", sa.Numeric(18, 2), nullable=True),
        sa.Column("registered_capital_currency", sa.String(length=20), nullable=True),
        sa.Column("is_capital_paid", sa.Boolean(), nullable=True),
        sa.Column("business_scope", sa.Text(), nullable=True),
        sa.Column("tax_regime", sa.String(length=100), nullable=True),
        *timestamps(),
    )
    op.create_index("uq_company_drafts_order_id", "company_drafts", ["order_id"], unique=True)
    op.create_table(
        "registration_invitations",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("token", sa.String(length=255), nullable=False),
        sa.Column("customer_id", sa.Integer(), sa.ForeignKey("customers.id"), nullable=True),
        sa.Column("order_id", sa.Integer(), sa.ForeignKey("registration_orders.id"), nullable=True),
        sa.Column("sales_user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("purpose", sa.String(length=100), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("bound_openid", sa.String(length=128), nullable=True),
        sa.Column("max_participants", sa.Integer(), nullable=True),
        sa.Column("allow_forward", sa.Boolean(), nullable=False),
        sa.Column("remark", sa.Text(), nullable=True),
        *timestamps(),
    )
    op.create_index(
        "ix_registration_invitations_token", "registration_invitations", ["token"], unique=True
    )
    op.create_index(
        "ix_registration_invitations_bound_openid", "registration_invitations", ["bound_openid"]
    )
    op.create_table(
        "persons",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("order_id", sa.Integer(), sa.ForeignKey("registration_orders.id"), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("name_en", sa.String(length=150), nullable=True),
        sa.Column("nationality", sa.String(length=100), nullable=True),
        sa.Column("passport_no", sa.String(length=100), nullable=True),
        sa.Column("passport_expiry_date", sa.Date(), nullable=True),
        sa.Column("mobile", sa.String(length=50), nullable=True),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("residential_address", sa.Text(), nullable=True),
        sa.Column("current_visa_type", sa.String(length=100), nullable=True),
        sa.Column("is_director", sa.Boolean(), nullable=False),
        sa.Column("is_contact_person", sa.Boolean(), nullable=False),
        *timestamps(),
    )
    op.create_index("ix_persons_order_id", "persons", ["order_id"])
    op.create_table(
        "files",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("order_id", sa.Integer(), sa.ForeignKey("registration_orders.id"), nullable=True),
        sa.Column("owner_type", sa.String(length=100), nullable=False),
        sa.Column("owner_id", sa.Integer(), nullable=True),
        sa.Column("file_name", sa.String(length=255), nullable=False),
        sa.Column("file_ext", sa.String(length=20), nullable=True),
        sa.Column("mime_type", sa.String(length=100), nullable=True),
        sa.Column("file_size", sa.Integer(), nullable=False),
        sa.Column("storage_path", sa.String(length=500), nullable=False),
        sa.Column("uploaded_by", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
        *timestamps(),
    )
    op.create_index("ix_files_order_id", "files", ["order_id"])
    op.create_table(
        "invitation_participants",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "invitation_id",
            sa.Integer(),
            sa.ForeignKey("registration_invitations.id"),
            nullable=False,
        ),
        sa.Column("wechat_user_id", sa.Integer(), sa.ForeignKey("wechat_users.id"), nullable=True),
        sa.Column("role", sa.String(length=50), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=True),
        sa.Column("mobile", sa.String(length=50), nullable=True),
        sa.Column("submitted_fields_json", sa.JSON(), nullable=True),
        *timestamps(),
    )
    op.create_index(
        "ix_invitation_participants_invitation_id",
        "invitation_participants",
        ["invitation_id"],
    )
    op.create_table(
        "shareholders",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("order_id", sa.Integer(), sa.ForeignKey("registration_orders.id"), nullable=False),
        sa.Column("shareholder_type", sa.String(length=50), nullable=False),
        sa.Column("person_id", sa.Integer(), sa.ForeignKey("persons.id"), nullable=True),
        sa.Column("company_name", sa.String(length=255), nullable=True),
        sa.Column("company_registration_no", sa.String(length=100), nullable=True),
        sa.Column("nationality_or_country", sa.String(length=100), nullable=True),
        sa.Column("share_percent", sa.Numeric(5, 2), nullable=False),
        sa.Column("address", sa.Text(), nullable=True),
        *timestamps(),
    )
    op.create_index("ix_shareholders_order_id", "shareholders", ["order_id"])
    op.create_table(
        "quotations",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("order_id", sa.Integer(), sa.ForeignKey("registration_orders.id"), nullable=False),
        sa.Column("quotation_no", sa.String(length=50), nullable=False),
        sa.Column("currency", sa.String(length=20), nullable=False),
        sa.Column("total_amount", sa.Numeric(18, 2), nullable=False),
        sa.Column("discount_amount", sa.Numeric(18, 2), nullable=False),
        sa.Column("final_amount", sa.Numeric(18, 2), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("confirmed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_by", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
        *timestamps(),
    )
    op.create_index("ix_quotations_order_id", "quotations", ["order_id"])
    op.create_index("ix_quotations_quotation_no", "quotations", ["quotation_no"], unique=True)
    op.create_table(
        "quotation_items",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("quotation_id", sa.Integer(), sa.ForeignKey("quotations.id"), nullable=False),
        sa.Column("item_name", sa.String(length=255), nullable=False),
        sa.Column("item_type", sa.String(length=100), nullable=True),
        sa.Column("amount", sa.Numeric(18, 2), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("subtotal", sa.Numeric(18, 2), nullable=False),
        sa.Column("is_required", sa.Boolean(), nullable=False),
        sa.Column("remark", sa.Text(), nullable=True),
        *timestamps(),
    )
    op.create_index("ix_quotation_items_quotation_id", "quotation_items", ["quotation_id"])
    op.create_table(
        "order_materials",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("order_id", sa.Integer(), sa.ForeignKey("registration_orders.id"), nullable=False),
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
    op.create_index("ix_order_materials_order_id", "order_materials", ["order_id"])
    op.create_table(
        "generated_documents",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("order_id", sa.Integer(), sa.ForeignKey("registration_orders.id"), nullable=False),
        sa.Column("document_type", sa.String(length=100), nullable=False),
        sa.Column("document_name", sa.String(length=255), nullable=False),
        sa.Column("template_id", sa.String(length=100), nullable=True),
        sa.Column("file_id", sa.Integer(), sa.ForeignKey("files.id"), nullable=True),
        sa.Column("generated_by", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("generated_at", sa.DateTime(timezone=True), nullable=True),
        *timestamps(),
    )
    op.create_index("ix_generated_documents_order_id", "generated_documents", ["order_id"])
    op.create_table(
        "company_archives",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("order_id", sa.Integer(), sa.ForeignKey("registration_orders.id"), nullable=False),
        sa.Column("company_name", sa.String(length=255), nullable=False),
        sa.Column("company_type", sa.String(length=100), nullable=True),
        sa.Column("registration_no", sa.String(length=100), nullable=True),
        sa.Column("tax_no", sa.String(length=100), nullable=True),
        sa.Column("legal_address", sa.Text(), nullable=True),
        sa.Column("registered_capital_amount", sa.Numeric(18, 2), nullable=True),
        sa.Column("registered_capital_currency", sa.String(length=20), nullable=True),
        sa.Column("business_scope", sa.Text(), nullable=True),
        sa.Column("director_person_id", sa.Integer(), sa.ForeignKey("persons.id"), nullable=True),
        sa.Column("registration_date", sa.Date(), nullable=True),
        sa.Column("tax_regime", sa.String(length=100), nullable=True),
        sa.Column("bank_account_status", sa.String(length=100), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=False),
        *timestamps(),
    )
    op.create_index("uq_company_archives_order_id", "company_archives", ["order_id"], unique=True)
    op.create_table(
        "workflow_logs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("order_id", sa.Integer(), sa.ForeignKey("registration_orders.id"), nullable=False),
        sa.Column("from_status", sa.String(length=50), nullable=True),
        sa.Column("to_status", sa.String(length=50), nullable=False),
        sa.Column("operator_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("comment", sa.Text(), nullable=True),
        *timestamps(),
    )
    op.create_index("ix_workflow_logs_order_id", "workflow_logs", ["order_id"])
    op.create_table(
        "audit_logs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("action", sa.String(length=100), nullable=False),
        sa.Column("target_type", sa.String(length=100), nullable=False),
        sa.Column("target_id", sa.Integer(), nullable=True),
        sa.Column("before_json", sa.JSON(), nullable=True),
        sa.Column("after_json", sa.JSON(), nullable=True),
        sa.Column("ip", sa.String(length=100), nullable=True),
        *timestamps(),
    )


def downgrade() -> None:
    for table in [
        "audit_logs",
        "workflow_logs",
        "company_archives",
        "generated_documents",
        "order_materials",
        "quotation_items",
        "quotations",
        "shareholders",
        "files",
        "persons",
        "company_drafts",
        "invitation_participants",
        "registration_invitations",
        "registration_orders",
        "wechat_users",
        "wecom_users",
        "customers",
        "users",
    ]:
        op.drop_table(table)
