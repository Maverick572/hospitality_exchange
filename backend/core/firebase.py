import os

import firebase_admin
from firebase_admin import credentials, firestore
from dotenv import load_dotenv


load_dotenv()


SERVICE_ACCOUNT_FILE = os.getenv(
    "FIREBASE_SERVICE_ACCOUNT_FILE",
    "firebase-service-account.json"
)


if not firebase_admin._apps:
    if os.path.exists(SERVICE_ACCOUNT_FILE):
        cred = credentials.Certificate(SERVICE_ACCOUNT_FILE)
        firebase_admin.initialize_app(cred)
    else:
        try:
            firebase_admin.initialize_app()
        except Exception:
            pass

try:
    db = firestore.client()
except Exception:
    db = None