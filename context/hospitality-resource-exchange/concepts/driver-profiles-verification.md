---
type: concept
status: stable
tags: [project/hospitality-resource-exchange, drivers, auth]
updated: 2026-09-26
---

# Driver Profiles & Verification

extends:: [[business-profiles-ratings]]
depends_on:: [[projects/hospitality-resource-exchange/architecture/tech-stack]]

## Summary

[stated] Drivers are a dedicated user category in the Hospitality Resource Exchange, responsible for transporting shared resources between providers and seekers.

[decided] Driver profiles are stored in Firestore under `drivers/{firebase_uid}` and managed via FastAPI endpoints (`POST /drivers/profile`, `GET /drivers/me`, `GET /drivers/auth/status`). See D009.

## Core Schema & Attributes

[verified] Driver documents contain:
- Personal details: `name`, `email`, `phone`
- Transport specs: `vehicleType` (e.g. Tata Ace, Pickup), `vehicleNumber`, `capacity` (kg/units)
- Performance & state: `rating`, `totalRatings`, `status` (`active` | `inactive`)
- Identity & compliance: `licenseNumber` (driving license), `verificationStatus` (`unverified` | `pending` | `verified` | `rejected`)
- Timestamps: `createdAt`, `updatedAt`

## Authentication & Onboarding Flow

[decided] Drivers authenticate using Firebase Authentication (supporting Google Sign-In and email/password):
1. **Google Sign-In:** Driver logs in on the client via Firebase Auth, returning a Firebase ID token.
2. **Auth Status Check:** Client calls `GET /drivers/auth/status`.
   - If profile exists: returns `hasDriverProfile: true`, redirecting to Driver Dashboard.
   - If new driver: returns `hasDriverProfile: false`, allowing the client to pre-fill Google name and email into the vehicle registration form.
3. **Role Stamping:** Upon calling `POST /drivers/profile`, Firebase Admin SDK sets custom user claims: `role: "driver"`. Subsequent ID tokens carry this claim for role-based authorization.

## Verification Roadmap (DigiLocker)

[planned] Identity and driving license validation will be integrated using DigiLocker APIs:
- Driver inputs license number or verifies via DigiLocker OAuth flow.
- Verification status transitions: `unverified` → `pending` → `verified`.
- Verified status will be factored into route matching priority and seeker trust badges.
