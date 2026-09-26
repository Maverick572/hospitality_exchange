import sys
import os
from unittest.mock import MagicMock

# Ensure backend directory is in sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Mock core.firebase if firebase-service-account.json does not exist
service_account = os.path.join(backend_dir, "firebase-service-account.json")
if not os.path.exists(service_account):
    import types
    fake_firebase = types.ModuleType("core.firebase")
    fake_firebase.db = MagicMock()
    fake_firebase.SERVICE_ACCOUNT_FILE = service_account
    sys.modules["core.firebase"] = fake_firebase
