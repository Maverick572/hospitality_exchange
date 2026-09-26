from fastapi import Header, HTTPException
from firebase_admin import auth

from core.firebase import db


def get_current_user(
    authorization: str | None = Header(default=None)
):
    """
    Verify the Firebase ID token supplied by the frontend.
    """

    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Authorization header is missing."
        )

    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Invalid authorization header."
        )

    token = authorization.split("Bearer ", 1)[1]

    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token

    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired Firebase ID token."
        )