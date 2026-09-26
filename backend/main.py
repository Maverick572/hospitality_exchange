from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from users import router as users_router
from drivers import router as drivers_router
from transactions import router as transactions_router


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
        "http://localhost:5173",
        "http://127.0.0.1:5173",

        # Production frontend
        # "https://hack-celestial.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# API ROUTES
# ============================================================

# User profile endpoints
app.include_router(
    users_router,
    prefix="/api/v1"
)

# Driver profile endpoints
app.include_router(
    drivers_router,
    prefix="/api/v1"
)

# Transaction endpoints
app.include_router(
    transactions_router,
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