from fastapi import APIRouter

from app.api.routes import admin, health, invitations, public, wechat, wecom

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(public.router, prefix="/public", tags=["public"])
api_router.include_router(invitations.router)
api_router.include_router(wecom.router, prefix="/wecom", tags=["wecom"])
api_router.include_router(wechat.router, prefix="/wechat", tags=["wechat"])
