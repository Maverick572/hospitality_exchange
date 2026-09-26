from typing import Optional
from fastapi import HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
import firebase_admin
from firebase_admin import auth

security = HTTPBearer(auto_error=False)

def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Security(security)) -> dict:
    """
    Verify Firebase ID token and return user payload including custom claims (e.g. role).
    Supports dev/test token bypass when credentials contain 'test-token'.
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing or invalid"
        )

    token = credentials.credentials

    # Development / Testing bypass
    if token.startswith("test-"):
        return {
            "uid": token.replace("test-", "user_"),
            "email": f"{token}@example.com",
            "role": "driver" if "driver" in token else None
        }

    try:
        decoded_token = auth.verify_id_token(token)
        return {
            "uid": decoded_token.get("uid"),
            "email": decoded_token.get("email"),
            "role": decoded_token.get("role"),
            "decoded_token": decoded_token
        }
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication token: {str(exc)}"
        )
