import os
import sys

# Ensure root and backend directories are in Python path
root_dir = os.path.abspath(os.path.dirname(__file__))
backend_dir = os.path.join(root_dir, "backend")

if root_dir not in sys.path:
    sys.path.insert(0, root_dir)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from backend.main import app

if __name__ == "__main__":
    import uvicorn
    raw_port = os.environ.get("PORT", "8000")
    try:
        port = int(raw_port)
    except (ValueError, TypeError):
        port = 8000
    print(f"Starting server on 0.0.0.0:{port}", flush=True)
    uvicorn.run("backend.main:app", host="0.0.0.0", port=port, reload=False)
