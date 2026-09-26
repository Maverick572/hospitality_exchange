import os
import requests
from dotenv import load_dotenv

load_dotenv()

# ============================================================
# CONFIG
# ============================================================

BASE_URL = "http://127.0.0.1:8000/api/v1"

FIREBASE_WEB_API_KEY = os.getenv("FIREBASE_WEB_API_KEY")

TEST_EMAIL = os.getenv("TEST_EMAIL", "test@gmail.com")
TEST_PASSWORD = os.getenv("TEST_PASSWORD", "testpassword@1234")


# ============================================================
# FIREBASE AUTHENTICATION
# ============================================================

def get_id_token():
    if not FIREBASE_WEB_API_KEY:
        raise RuntimeError(
            "FIREBASE_WEB_API_KEY is missing from .env"
        )

    url = (
        "https://identitytoolkit.googleapis.com/v1/"
        f"accounts:signInWithPassword?key={FIREBASE_WEB_API_KEY}"
    )

    response = requests.post(
        url,
        json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
            "returnSecureToken": True
        },
        timeout=10
    )

    if response.status_code != 200:
        print("\nFirebase authentication failed.")
        print("Status:", response.status_code)
        print(response.text)
        raise SystemExit(1)

    data = response.json()

    print("\nFirebase authentication successful.")
    print("Test user:", TEST_EMAIL)
    print("User ID:", data.get("localId"))

    return data["idToken"], data.get("localId")


# ============================================================
# API REQUEST HELPER
# ============================================================

def request(method, endpoint, token, data=None):
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    response = requests.request(
        method,
        f"{BASE_URL}{endpoint}",
        headers=headers,
        json=data,
        timeout=30
    )

    print("\n" + "=" * 70)
    print(f"{method} {endpoint}")
    print("=" * 70)
    print("Status:", response.status_code)

    try:
        print("Response:")
        print(response.json())
    except Exception:
        print(response.text)

    return response


def require_status(response, expected):
    if response.status_code != expected:
        raise RuntimeError(
            f"Expected HTTP {expected}, "
            f"got {response.status_code}: {response.text}"
        )


# ============================================================
# TRANSACTION LIFECYCLE
# ============================================================

def test_full_transaction_lifecycle(token, user_id):

    print("\n" + "#" * 70)
    print("REAL FIREBASE TRANSACTION LIFECYCLE")
    print("#" * 70)

    # --------------------------------------------------------
    # STEP 1: Seeker posts a resource request
    # --------------------------------------------------------

    res1 = request(
        "POST",
        "/requests",
        token,
        {
            "providerId": user_id,
            "resourceId": "res_banquet_tables",
            "requestedQuantity": 20,
            "offeredPrice": 4000.0,
            "message": "Need 20 tables for wedding."
        }
    )

    require_status(res1, 201)

    req_data = res1.json()["data"]

    request_id = req_data["requestId"]

    print(f"\nCreated request: {request_id}")

    # --------------------------------------------------------
    # STEP 2: Provider checks requests
    # --------------------------------------------------------

    res_list = request(
        "GET",
        "/requests/provider?status=pending",
        token
    )

    require_status(res_list, 200)

    requests_data = res_list.json()["data"]

    if not any(
        r["requestId"] == request_id
        for r in requests_data
    ):
        raise RuntimeError(
            "Created request was not found in provider requests."
        )

    # --------------------------------------------------------
    # STEP 3: Provider makes counter-offer
    # --------------------------------------------------------

    res_counter = request(
        "POST",
        f"/requests/{request_id}/counter",
        token,
        {
            "price": 4500.0,
            "quantity": 20,
            "message": "We can do 20 tables for ₹4,500."
        }
    )

    require_status(res_counter, 200)

    counter_data = res_counter.json()["data"]

    if counter_data["status"] != "countered":
        raise RuntimeError(
            "Request was not moved to countered state."
        )

    # --------------------------------------------------------
    # STEP 4: Seeker accepts offer
    # --------------------------------------------------------

    res_accept = request(
        "POST",
        f"/requests/{request_id}/accept",
        token,
        {
            "deliveryAmount": 500.0,
            "pickupLocation": {
                "address": "Vashi"
            },
            "deliveryLocation": {
                "address": "Belapur"
            }
        }
    )

    require_status(res_accept, 200)

    accept_data = res_accept.json()["data"]

    booking_id = accept_data["bookingId"]

    print(f"\nCreated booking: {booking_id}")

    # --------------------------------------------------------
    # STEP 5: View booking
    # --------------------------------------------------------

    res_booking = request(
        "GET",
        f"/bookings/{booking_id}",
        token
    )

    require_status(res_booking, 200)

    booking = res_booking.json()["data"]

    print("\nBooking amounts:")
    print("Resource:", booking.get("resourceAmount"))
    print("Delivery:", booking.get("deliveryAmount"))
    print("Deposit:", booking.get("depositAmount"))
    print("Total:", booking.get("totalAmount"))

    # --------------------------------------------------------
    # STEP 6: Fund escrow
    # --------------------------------------------------------

    escrow_id = booking["escrowId"]

    res_fund = request(
        "POST",
        f"/escrow/{escrow_id}/fund",
        token,
        {
            "paymentReference": "real_firebase_test_payment_001"
        }
    )

    require_status(res_fund, 200)

    fund_data = res_fund.json()["data"]

    print("\nEscrow status:", fund_data["status"])

    # --------------------------------------------------------
    # STEP 7: Upload condition evidence
    # --------------------------------------------------------

    res_ev = request(
        "POST",
        "/condition-evidence",
        token,
        {
            "bookingId": booking_id,
            "stage": "PICKUP",
            "type": "resource_condition",
            "imageUrl": "https://storage.googleapis.com/test-bucket/tables_pickup.png",
            "description": "20 tables in flawless condition."
        }
    )

    require_status(res_ev, 201)

    evidence_id = res_ev.json()["data"]["evidenceId"]

    print("\nEvidence:", evidence_id)

    # --------------------------------------------------------
    # STEP 8: Confirm receipt
    # --------------------------------------------------------

    res_receipt = request(
        "POST",
        f"/bookings/{booking_id}/confirm-receipt",
        token,
        {
            "received": True,
            "conditionConfirmed": True
        }
    )

    require_status(res_receipt, 200)

    receipt_data = res_receipt.json()["data"]

    print("\nBooking status:", receipt_data["status"])

    # --------------------------------------------------------
    # STEP 9: Release escrow
    # --------------------------------------------------------

    res_release = request(
        "POST",
        f"/escrow/{escrow_id}/release",
        token,
        {
            "bookingId": booking_id,
            "conditionConfirmed": True,
            "penaltyAmount": 0.0
        }
    )

    require_status(res_release, 200)

    release_data = res_release.json()["data"]

    print("\nEscrow status:", release_data["status"])
    print("Provider amount:", release_data["providerAmount"])
    print("Driver amount:", release_data["driverAmount"])
    print("Deposit returned:", release_data["depositReturned"])

    # --------------------------------------------------------
    # STEP 10: Review provider
    # --------------------------------------------------------

    res_review = request(
        "POST",
        "/reviews",
        token,
        {
            "bookingId": booking_id,
            "providerId": user_id,
            "rating": 5,
            "comment": "Tables were clean and sturdy."
        }
    )

    require_status(res_review, 201)

    # --------------------------------------------------------
    # STEP 11: Check provider reviews
    # --------------------------------------------------------

    res_reviews = request(
        "GET",
        f"/users/{user_id}/reviews",
        token
    )

    require_status(res_reviews, 200)

    reviews_data = res_reviews.json()["data"]

    print("\nProvider rating:", reviews_data["rating"])
    print("Total ratings:", reviews_data["totalRatings"])
    print("Reviews:", len(reviews_data["reviews"]))

    print("\n" + "=" * 70)
    print("REAL FIREBASE TRANSACTION TEST COMPLETED")
    print("=" * 70)


# ============================================================
# MAIN
# ============================================================

if __name__ == "__main__":

    print("=" * 70)
    print("HOSPITALITY RESOURCE EXCHANGE")
    print("REAL FIREBASE TRANSACTION INTEGRATION TEST")
    print("=" * 70)

    # Authenticate against REAL Firebase Authentication
    token, user_id = get_id_token()

    # Execute transaction against REAL FastAPI + Firestore
    test_full_transaction_lifecycle(token, user_id)