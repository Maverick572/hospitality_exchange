from datetime import datetime, timezone
import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status

from core.auth import get_current_user
from transactions.helpers import get_doc_or_404, serialize_firestore_doc, standard_response
from transactions.notifications import emit_notification

db = None
try:
    from core.firebase import db as _db
    db = _db
except Exception:
    db = None

router = APIRouter(
    tags=["Reviews & Ratings"]
)


# ============================================================
# 1. SUBMIT REVIEW
# ============================================================

@router.post("/reviews", status_code=status.HTTP_201_CREATED)
def create_review(
    payload: dict,
    current_user: dict = Depends(get_current_user)
):
    """
    Submit a review and rating for a completed booking.
    Atomically updates provider aggregate rating and totalRatings count.
    Firestore Schema (schema.txt):
      - reviewId
      - bookingId
      - reviewerId
      - providerId
      - rating
      - comment
      - createdAt
      - updatedAt
    """
    reviewer_id = current_user["uid"]
    booking_id = payload.get("bookingId")
    provider_id = payload.get("providerId")
    raw_rating = payload.get("rating")
    comment = payload.get("comment", "")

    if not booking_id or not provider_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="bookingId and providerId are required."
        )

    if raw_rating is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Rating is required."
        )

    try:
        rating = int(raw_rating)
        if rating < 1 or rating > 5:
            raise ValueError()
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Rating must be an integer between 1 and 5."
        )

    if db is None:
        raise HTTPException(status_code=500, detail="Database client unavailable.")

    # 1. Check for duplicate review by same reviewer for same booking
    try:
        existing_reviews = db.collection("reviews").where("bookingId", "==", booking_id).stream()
        for rev in existing_reviews:
            r_data = rev.to_dict() or {}
            if r_data.get("reviewerId") == reviewer_id:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="You have already submitted a review for this booking."
                )
    except HTTPException:
        raise
    except Exception:
        pass

    now = datetime.now(timezone.utc)
    review_id = f"review_{uuid.uuid4().hex[:12]}"

    review_data = {
        "reviewId": review_id,
        "bookingId": booking_id,
        "reviewerId": reviewer_id,
        "providerId": provider_id,
        "rating": rating,
        "comment": comment,
        "createdAt": now,
        "updatedAt": now
    }

    # 2. Save review document
    db.collection("reviews").document(review_id).set(review_data)

    # 3. Update provider's aggregate rating in users/{providerId}
    try:
        user_ref = db.collection("users").document(provider_id)
        user_snap = user_ref.get()
        if user_snap.exists:
            user_data = user_snap.to_dict() or {}
            old_total = int(user_data.get("totalRatings", 0))
            old_rating = float(user_data.get("rating", 0.0))
            new_total = old_total + 1
            new_rating = round(((old_rating * old_total) + float(rating)) / new_total, 2)
            user_ref.update({
                "rating": new_rating,
                "totalRatings": new_total,
                "updatedAt": now
            })
    except Exception as e:
        print(f"[Warning] Failed to update aggregate provider rating: {e}")

    # 4. Notify provider
    emit_notification(
        user_id=provider_id,
        type="REVIEW_RECEIVED",
        title="New Review Received",
        message=f"You received a {rating}-star review for booking {booking_id}.",
        reference_id=review_id
    )

    return standard_response(
        data={
            "reviewId": review_id,
            "bookingId": booking_id,
            "providerId": provider_id,
            "rating": rating,
            "comment": comment
        },
        message="Review submitted successfully."
    )


# ============================================================
# 2. GET PROVIDER RATING & REVIEWS
# ============================================================

@router.get("/users/{user_id}/reviews")
def get_user_reviews(
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get provider overall rating, totalRatings count, and list of reviews.
    """
    if db is None:
        raise HTTPException(status_code=500, detail="Database client unavailable.")

    # 1. Fetch provider details
    rating = 0.0
    total_ratings = 0
    try:
        user_snap = db.collection("users").document(user_id).get()
        if user_snap.exists:
            u_data = user_snap.to_dict() or {}
            rating = float(u_data.get("rating", 0.0))
            total_ratings = int(u_data.get("totalRatings", 0))
    except Exception:
        pass

    # 2. Fetch reviews
    reviews_list = []
    try:
        docs = db.collection("reviews").where("providerId", "==", user_id).stream()
        for doc in docs:
            r = doc.to_dict() or {}
            r["reviewId"] = doc.id

            # Enrich reviewerName if missing
            if "reviewerName" not in r:
                rev_id = r.get("reviewerId")
                if rev_id:
                    try:
                        u_rev_snap = db.collection("users").document(rev_id).get()
                        if u_rev_snap.exists:
                            u_rev_data = u_rev_snap.to_dict() or {}
                            r["reviewerName"] = u_rev_data.get("businessName") or u_rev_data.get("name") or "Anonymous"
                        else:
                            r["reviewerName"] = rev_id
                    except Exception:
                        r["reviewerName"] = rev_id
                else:
                    r["reviewerName"] = "Anonymous"

            reviews_list.append(serialize_firestore_doc(r))
    except Exception:
        pass

    return standard_response(
        data={
            "rating": rating,
            "totalRatings": total_ratings,
            "reviews": reviews_list
        }
    )
