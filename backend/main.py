from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from users import router as users_router
from drivers import router as drivers_router


app = FastAPI(
    title="Hospitality Resource Exchange API",
    description="Backend API for the Hospitality Resource Exchange",
    version="1.0.0"
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # React/Vite development
        "http://127.0.0.1:5173",
        # "https://your-frontend.vercel.app",  # Production frontend
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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