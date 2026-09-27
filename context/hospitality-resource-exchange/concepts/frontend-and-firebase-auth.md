# Frontend & Firebase Authentication Integration

## Summary
The system features a Next.js 16 (App Router, Turbopack, TailwindCSS, Radix/shadcn UI) frontend integrated directly into the `main` branch. It communicates with the FastAPI backend (`http://127.0.0.1:8000/api/v1`) and uses Google Firebase Authentication for real-world identity management with seamless onboarding gates.

## Architecture & Authentication Lifecycle

```
[Browser / Next.js]
  │
  ├── 1. Sign In / Sign Up (Firebase Client SDK)
  │      - Email/Password or Google Auth Provider
  │      - Mints Firebase ID Token (JWT)
  │
  ├── 2. Auth State Sync (lib/auth.tsx)
  │      - onAuthStateChanged tracks session state
  │      - getIdToken() ensures authStateReady() before fetching token
  │      - Bearer <idToken> attached to all API requests
  │
  ├── 3. Session Gate (components/shell/session-gate.tsx)
  │      - BusinessGate calls GET /api/v1/users/me
  │      - DriverGate calls GET /api/v1/drivers/me
  │      - If profile exists (200) -> Mounts dashboard workspace
  │      - If profile does NOT exist (404) -> Routes to /onboarding or /driver/onboarding
  │
  └── 4. Backend Verification (backend/core/auth.py)
         - FastAPI verifies Bearer token with Firebase Admin SDK
         - Decodes UID, email, and custom claims (e.g. role="driver")
         - Queries Firestore users/{uid} or drivers/{uid}
```

## Dual-Mode Operation (Live & Demo)
- **Live Mode (Primary)**: When `NEXT_PUBLIC_FIREBASE_*` are configured in `frontend/.env.local`, the app operates with real Google Firebase Auth and live Firestore documents.
- **Offline / Demo Mode (Fallback)**: When Firebase credentials are intentionally omitted or the backend is offline, the API client (`frontend/lib/api/client.ts`) and `mockStore` provide realistic mock data and mock session persistence (`test-<slug>` tokens) so development and offline demonstration remain fully operational without breaking.

## Key Files
- `frontend/lib/firebase.ts`: Firebase Web App initialization (`initializeApp`, `getAuth`, `getStorage`).
- `frontend/lib/auth.tsx`: React Context for auth state (`useAuth`, `getIdToken`, `signIn`, `signUp`, `signInWithGoogle`, `signOut`).
- `frontend/lib/api/client.ts`: Typed fetch wrapper with Bearer token injection, envelope unwrapping, and selective 404 propagation for profile gates.
- `frontend/components/shell/session-gate.tsx`: Workspace gatekeeper routing users to onboarding or dashboard based on profile existence.
- `backend/core/auth.py`: FastAPI `get_current_user` dependency verifying tokens with `firebase_admin.auth.verify_id_token`.
- `backend/core/firebase.py`: Backend Firebase Admin SDK initialization supporting service account JSON or environment variables.
