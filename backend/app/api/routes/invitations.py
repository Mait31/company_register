from fastapi import APIRouter

from app.modules.intake.api import router as intake_router
from app.modules.registration.api import router as registration_router

router = APIRouter()
router.include_router(registration_router)
router.include_router(intake_router)
