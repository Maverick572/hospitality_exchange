"use client";

import { createContext, useContext } from "react";

import type { DriverProfile, UserProfile } from "@/lib/types";

type SessionValue<T> = {
  profile: T;
  reload: () => Promise<void>;
};

export const BusinessSessionContext = createContext<SessionValue<UserProfile> | null>(null);
export const DriverSessionContext = createContext<SessionValue<DriverProfile> | null>(null);

/** Business profile of the signed-in user. Only valid under /dashboard. */
export function useBusinessSession() {
  const value = useContext(BusinessSessionContext);
  if (!value) throw new Error("useBusinessSession must be used inside the business app shell.");
  return value;
}

/** Driver profile of the signed-in user. Only valid under the driver app. */
export function useDriverSession() {
  const value = useContext(DriverSessionContext);
  if (!value) throw new Error("useDriverSession must be used inside the driver app shell.");
  return value;
}
