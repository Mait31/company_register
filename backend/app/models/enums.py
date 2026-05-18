from enum import StrEnum


class OrderStatus(StrEnum):
    DRAFT = "draft"
    PENDING_QUOTE = "pending_quote"
    PENDING_CUSTOMER_CONFIRM = "pending_customer_confirm"
    COLLECTING_MATERIALS = "collecting_materials"
    REVIEWING_MATERIALS = "reviewing_materials"
    NEED_MORE_MATERIALS = "need_more_materials"
    MATERIALS_READY = "materials_ready"
    PROCESSING_REGISTRATION = "processing_registration"
    REGISTERED = "registered"
    ARCHIVED = "archived"
    CANCELLED = "cancelled"


class UserRole(StrEnum):
    SALES = "sales"
    MATERIAL_REVIEWER = "material_reviewer"
    REGISTRATION_HANDLER = "registration_handler"
    FINANCE = "finance"
    ADMIN = "admin"


class MaterialStatus(StrEnum):
    MISSING = "missing"
    UPLOADED = "uploaded"
    REVIEWING = "reviewing"
    APPROVED = "approved"
    REJECTED = "rejected"
    EXPIRED = "expired"


class QuotationStatus(StrEnum):
    DRAFT = "draft"
    SENT = "sent"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
