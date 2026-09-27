import sys
from core.firebase import db, SERVICE_ACCOUNT_FILE

COLLECTIONS = [
    "users",
    "resources",
    "requirements",
    "requests",
    "bookings",
    "reviews",
    "notifications",
    "drivers",
    "driverRoutes",
    "deliveryRequests",
    "escrow",
    "conditionEvidence",
]


def delete_collection(collection_name: str, batch_size: int = 100):
    """
    Deletes all documents in a Firestore collection.
    """
    if db is None:
        print("  [ERROR] Firestore db client is not initialized.")
        return 0

    col_ref = db.collection(collection_name)
    total_deleted = 0

    while True:
        docs = list(col_ref.limit(batch_size).stream())
        if not docs:
            break

        batch = db.batch()
        for doc in docs:
            print(f"  [DELETE] {collection_name}/{doc.id}")
            batch.delete(doc.reference)

        batch.commit()
        total_deleted += len(docs)

    return total_deleted


def clear_all_collections(skip_prompt: bool = False):
    """
    Clears all application collections in Firestore.
    """
    if db is None:
        print("\n[ERROR] Could not connect to Firestore. Check your service account credentials.")
        return False

    project_id = getattr(db, "project", "unknown")
    print(f"\nFirebase Project: {project_id}")
    print(f"Service Account File: {SERVICE_ACCOUNT_FILE}")

    print("\nScanning Firestore collections...\n")
    collections_with_docs = {}

    for name in COLLECTIONS:
        try:
            docs = list(db.collection(name).stream())
            count = len(docs)
            collections_with_docs[name] = count
            status_str = f"{count} document(s)" if count > 0 else "empty"
            print(f"  - {name:<20}: {status_str}")
        except Exception as e:
            print(f"  - {name:<20}: ERROR ({e})")

    total_all = sum(collections_with_docs.values())
    print("-" * 70)
    print(f"Total documents found: {total_all}")
    print("=" * 70)

    if total_all == 0:
        print("\nAll collections are already empty. Nothing to clear.")
        return True

    if not skip_prompt:
        confirmation = input("\nType CLEAR to permanently delete all data above: ").strip()
        if confirmation != "CLEAR":
            print("Operation cancelled. No documents were deleted.")
            return False

    print("\nDeleting documents from Firestore...\n")

    for name in COLLECTIONS:
        try:
            deleted_count = delete_collection(name)
            if deleted_count > 0:
                print(f"[DONE] Cleared {name}: {deleted_count} document(s) deleted.")
            else:
                print(f"[EMPTY] {name}: No documents.")
        except Exception as e:
            print(f"[ERROR] Failed to clear {name}: {e}")

    print("\n" + "=" * 70)
    print("FIRESTORE CLEAR COMPLETED")
    print("=" * 70)
    return True


def main():
    print("=" * 70)
    print("FIRESTORE CLEAR")
    print("=" * 70)
    clear_all_collections(skip_prompt=False)


if __name__ == "__main__":
    main()