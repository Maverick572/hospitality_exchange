from datetime import datetime, timezone
from typing import Any
from fastapi import HTTPException


def serialize_firestore_doc(data: Any) -> Any:
    """
    Recursively converts datetime objects, DatetimeWithNanoseconds,
    and nested structures in Firestore documents into JSON-serializable types.
    """
    if data is None:
        return None

    if isinstance(data, datetime):
        if data.tzinfo is None:
            data = data.replace(tzinfo=timezone.utc)
        return data.isoformat()

    # Handle google.api_core.datetime_helpers or custom timestamp objects if present
    if hasattr(data, "isoformat") and callable(data.isoformat):
        return data.isoformat()

    if isinstance(data, dict):
        return {key: serialize_firestore_doc(val) for key, val in data.items()}

    if isinstance(data, (list, tuple, set)):
        return [serialize_firestore_doc(item) for item in data]

    return data


def standard_response(
    data: Any = None,
    message: str | None = None,
    success: bool = True
) -> dict:
    """
    Constructs a uniform API response envelope matching backend conventions:
    {
        "success": True,
        "data": ...,
        "message": ... (optional)
    }
    """
    payload = {"success": success}
    if message is not None:
        payload["message"] = message
    if data is not None:
        payload["data"] = data
    return payload


def get_doc_or_404(db, collection_name: str, doc_id: str, error_detail: str | None = None) -> tuple[Any, dict]:
    """
    Fetches a document from Firestore or raises a 404 HTTPException.
    Returns (document_reference, document_dict_with_id).
    """
    doc_ref = db.collection(collection_name).document(doc_id)
    doc_snap = doc_ref.get()

    if not doc_snap.exists:
        raise HTTPException(
            status_code=404,
            detail=error_detail or f"{collection_name[:-1] if collection_name.endswith('s') else collection_name} not found."
        )

    doc_data = doc_snap.to_dict() or {}
    return doc_ref, doc_data
