from fastapi import APIRouter

router = APIRouter()


@router.get("/health", tags=["health"])
async def health_check() -> dict[str, str]:
    """Return a simple health response for local environment verification."""
    return {"status": "ok", "service": "smartclass-api"}
