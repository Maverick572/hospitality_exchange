from fastapi import Header, HTTPException
from firebase_admin import auth

from core.firebase import db


def get_current_user(
    authorization: str | None = Header(default=None)
):
    """
    Verify the Firebase ID token supplied by the frontend.
    Supports development/test token bypass when token starts with 'test-'.
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

    # Testing / Development bypass
    if token.startswith("test-"):
        token_lower = token.lower()
        matched_uid = None
        for key, canonical_id in [
            ("taj-lands", "usr_taj_lands_end"),
            ("tajlandsend", "usr_taj_lands_end"),
            ("itc", "usr_itc_maratha"),
            ("trident", "usr_trident_bkc"),
            ("renaissance", "usr_renaissance_powai"),
            ("sahara", "usr_sahara_star"),
            ("jio", "usr_jio_convention"),
            ("gymkhana", "usr_bombay_gymkhana"),
            ("nesco", "usr_nesco_goregaon"),
            ("palace", "usr_taj_colaba"),
            ("bluesea", "usr_blue_sea_worli"),
            ("amit", "drv_amit_deshmukh"),
            ("rajesh", "drv_rajesh_shinde"),
            ("vikram", "drv_vikram_jadhav"),
            ("suresh", "drv_suresh_patil"),
            ("sunil", "drv_sunil_gaikwad"),
            ("ramesh", "drv_ramesh_kadam"),
            ("ganesh", "drv_ganesh_sawant"),
            ("pradeep", "drv_pradeep_more"),
        ]:
            if key in token_lower:
                matched_uid = canonical_id
                break

        uid = matched_uid or token.replace("test-", "user_")
        return {
            "uid": uid,
            "email": f"{token}@example.com",
            "role": "driver" if "driver" in token else None
        }

    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token

    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired Firebase ID token."
        )
