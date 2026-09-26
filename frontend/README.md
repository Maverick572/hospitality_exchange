# Resource Exchange — Frontend

Next.js (App Router) frontend for the Hospitality Resource Exchange. It talks to the FastAPI backend in `../backend` and uses Firebase Authentication for login. The UI follows the LetterStack design system (shadcn/radix components, split-screen auth, icon-rail app shell).

## Running locally

You need the backend and the frontend running at the same time, in two terminals.

**1. Backend** (from the repo root, with the Python venv active):

```powershell
uvicorn backend.main:app --reload --port 8000
```

The backend reads the root `.env` (Firebase service account, Groq key).

**2. Frontend:**

```powershell
cd frontend
npm install
copy .env.local.example .env.local   # then fill in the Firebase web config
npm run dev
```

Open http://localhost:5173/login.

> The dev server runs on **port 5173** on purpose: the backend's CORS only allows `localhost:5173`. On any other port, every API call is blocked by the browser.

### Environment

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend base URL, default `http://127.0.0.1:8000/api/v1` |
| `NEXT_PUBLIC_FIREBASE_*` | Firebase **web app** config (Console → Project settings → Your apps). Not the service-account key. |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Optional. Enables photo uploads; without it you can paste image links. |

With no Firebase config the app runs in **demo mode**: any email signs in, using the backend's `test-` token bypass.

In the Firebase console, enable **Email/Password** and **Google** under Authentication → Sign-in method.

## The app

There are two areas, each with its own login.

**Business** (`/login` → `/dashboard`): one account can both rent out and rent resources.

- **Find resources**: natural-language search with dates and delivery location, parsed items, ranked results, send request, bundle across providers, find a delivery driver
- **My resources**: list, edit and deactivate listings
- **Requirements**: saved needs with a live "what we understood" preview
- **Requests**: accept, counter or decline incoming offers (accepting creates a booking)
- **Bookings**: status timeline, escrow payment and release, confirm receipt, condition photos, reviews
- **Notifications**: bell menu and full page; seekers answer counter-offers from here

**Driver** (`/driver/login` → `/driver`):

- **My routes**: publish, edit and deactivate routes; view matched delivery opportunities
- **Deliveries**: move jobs through picked up → in transit → delivered, with pickup and delivery photos

The landing page (`/`) is designed separately.

## Code map

```
app/
  (auth)/            login, signup, onboarding (business)
  driver/(auth)/     login, signup, onboarding (driver)
  dashboard/         business app pages
  driver/(app)/      driver app pages
components/
  shell/             top navbar, icon rail, notifications, session gates
  auth/              split-screen auth frame and form
  search/ resources/ requirements/ requests/ bookings/ driver/
  ui/                shadcn components (copied from LetterStack)
lib/
  api/               API client + one service object per backend area
  auth.tsx           Firebase auth provider (with demo mode)
  types.ts           response shapes from the backend
hooks/use-api.ts     load / error / reload helper for pages
```

Every API call goes through `lib/api/client.ts`, which attaches the Firebase ID token, unwraps `{ success, data }`, and normalises the backend's error shapes.

## Backend endpoints not built yet

These screens are finished but show a "Not live yet" state until the endpoint ships:

- `/resources/*` and `/requirements/*` CRUD (search returns nothing until resources can be listed)
- `/logistics/match-routes`, `/driver-routes/{id}/matches`, `/delivery-requests/*`
