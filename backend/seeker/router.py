from datetime import datetime
from typing import Any, Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from seeker.search import search_seeker_products

router = APIRouter(
    prefix="/seeker",
    tags=["Seeker Search"]
)


class SeekerSearchRequest(BaseModel):
    description: str = Field(..., min_length=1, description="Natural language requirements text")
    fromTimestamp: Optional[str] = Field(None, description="Start timestamp or date (ISO format or YYYY-MM-DD)")
    toTimestamp: Optional[str] = Field(None, description="End timestamp or date (ISO format or YYYY-MM-DD)")
    location: Optional[dict] = Field(
        None,
        description="Seeker delivery location with latitude, longitude, and optional address"
    )


@router.post("/search", summary="Search Products for Seeker Requirement")
def search_products_endpoint(payload: SeekerSearchRequest):
    """
    Parses natural language requirements using LLM Parser,
    combines with fromTimestamp and toTimestamp,
    searches products in Firestore, resolves provider location via providerId,
    and returns products ordered by:
      1. Best availability
      2. Lowest price
      3. Nearest location
    """
    try:
        results = search_seeker_products(
            description=payload.description,
            from_timestamp=payload.fromTimestamp,
            to_timestamp=payload.toTimestamp,
            seeker_location=payload.location
        )
        return {
            "success": True,
            "data": results
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to execute seeker search: {str(e)}"
        )
