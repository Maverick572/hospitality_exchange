import sys
import os

backend_dir = os.path.abspath(os.path.dirname(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

try:
    from users import router as users_router
    from drivers import router as drivers_router
    from transactions import router as transactions_router
    from services.llm_parser import parse_requirement, ParserServiceError
except ImportError:
    from backend.users import router as users_router
    from backend.drivers import router as drivers_router
    from backend.transactions import router as transactions_router
    from backend.services.llm_parser import parse_requirement, ParserServiceError


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
# REQUIREMENTS PARSER
# ============================================================

class RequirementParseRequest(BaseModel):
    description: str


@app.post("/api/v1/requirements/parse", tags=["Requirements"])
def parse_requirement_endpoint(payload: RequirementParseRequest):
    """Parse natural language requirement into structured hospitality resources."""
    try:
        items = parse_requirement(payload.description)
        return {
            "success": True,
            "data": {
                "description": payload.description,
                "items": [item.model_dump(mode="json") for item in items]
            }
        }
    except ParserServiceError as exc:
        return {
            "success": False,
            "error": str(exc)
        }


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