import os
import requests
from dotenv import load_dotenv


# ============================================================
# CONFIGURATION
# ============================================================

load_dotenv()

BASE_URL = "http://127.0.0.1:8000/api/v1"

FIREBASE_WEB_API_KEY = os.getenv("FIREBASE_WEB_API_KEY")

TEST_EMAIL = "test@gmail.com"
TEST_PASSWORD = "testpassword@1234"


# ============================================================
# FIREBASE AUTHENTICATION
# ============================================================

def get_id_token():
    """
    Sign in the test Firebase user and obtain a Firebase ID token.
    """

    if not FIREBASE_WEB_API_KEY:
        print("ERROR:")
        print("FIREBASE_WEB_API_KEY is missing from .env")
        raise SystemExit(1)

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

        try:
            print(response.json())
        except Exception:
            print(response.text)

        raise SystemExit(1)

    data = response.json()

    print("\nFirebase authentication successful.")
    print("Test user:", TEST_EMAIL)

    return data["idToken"]


# ============================================================
# REQUEST HELPER
# ============================================================

def request(method, endpoint, token, data=None):
    """
    Make an authenticated request to the FastAPI backend.
    """

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    url = f"{BASE_URL}{endpoint}"

    response = requests.request(
        method,
        url,
        headers=headers,
        json=data,
        timeout=10
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


# ============================================================
# USER TESTS
# ============================================================

def test_user(token):

    print("\n")
    print("#" * 70)
    print("USER TESTS")
    print("#" * 70)

    # --------------------------------------------------------
    # GET USER
    # --------------------------------------------------------

    response = request(
        "GET",
        "/users/me",
        token
    )

    # --------------------------------------------------------
    # CREATE USER PROFILE
    # --------------------------------------------------------

    user_profile = {
        "name": "Test Hotel",
        "phone": "+919999999999",
        "businessName": "Test Hospitality Pvt Ltd",
        "location": {
            "address": "Vashi, Navi Mumbai",
            "latitude": 19.0760,
            "longitude": 72.8777
        },
        "profileImage": ""
    }

    request(
        "POST",
        "/users/profile",
        token,
        user_profile
    )

    # --------------------------------------------------------
    # GET USER AGAIN
    # --------------------------------------------------------

    request(
        "GET",
        "/users/me",
        token
    )

    # --------------------------------------------------------
    # UPDATE USER
    # --------------------------------------------------------

    updated_profile = {
        "name": "Updated Test Hotel",
        "phone": "+919888888888",
        "businessName": "Updated Hospitality Pvt Ltd"
    }

    request(
        "PATCH",
        "/users/me",
        token,
        updated_profile
    )

    # --------------------------------------------------------
    # GET USER AGAIN
    # --------------------------------------------------------

    request(
        "GET",
        "/users/me",
        token
    )


# ============================================================
# DRIVER TESTS
# ============================================================

def test_driver(token):

    print("\n")
    print("#" * 70)
    print("DRIVER TESTS")
    print("#" * 70)

    # --------------------------------------------------------
    # GET DRIVER
    # --------------------------------------------------------

    request(
        "GET",
        "/drivers/me",
        token
    )

    # --------------------------------------------------------
    # CREATE DRIVER PROFILE
    # --------------------------------------------------------

    driver_profile = {
        "name": "Test Driver",
        "phone": "+919777777777",
        "vehicleType": "Truck",
        "vehicleNumber": "MH01AB1234",
        "capacity": 1000
    }

    request(
        "POST",
        "/drivers/profile",
        token,
        driver_profile
    )

    # --------------------------------------------------------
    # GET DRIVER AGAIN
    # --------------------------------------------------------

    request(
        "GET",
        "/drivers/me",
        token
    )


# ============================================================
# MAIN
# ============================================================

if __name__ == "__main__":

    print("=" * 70)
    print("HOSPITALITY RESOURCE EXCHANGE")
    print("USER + DRIVER BACKEND TEST")
    print("=" * 70)

    # --------------------------------------------------------
    # Authenticate test Firebase account
    # --------------------------------------------------------

    token = get_id_token()

    # --------------------------------------------------------
    # Test users.py
    # --------------------------------------------------------

    test_user(token)

    # --------------------------------------------------------
    # Test drivers.py
    # --------------------------------------------------------

    test_driver(token)

    # --------------------------------------------------------
    # Finished
    # --------------------------------------------------------

    print("\n")
    print("=" * 70)
    print("ALL TESTS COMPLETED")
    print("=" * 70)