from fastapi import FastAPI

from users import router as users_router
from drivers import router as drivers_router


app = FastAPI(
    title="Hospitality Resource Exchange API",
    description="Backend API for the Hospitality Resource Exchange",
    version="1.0.0"
)


# ============================================================
# API ROUTES
# ============================================================

app.include_router(
    users_router,
    prefix="/api/v1"
)

app.include_router(
    drivers_router,
    prefix="/api/v1"
)


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():
    return {
        "success": True,
        "message": "Hospitality Resource Exchange API is running"
    }


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
def health_check():
    return {
        "success": True,
        "status": "healthy"
    }