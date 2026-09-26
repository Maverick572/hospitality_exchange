"use client";

import type { ReactNode } from "react";

import { useAuth } from "@/lib/auth";
import { useBusinessSession, useDriverSession } from "@/lib/session";

import { AppShell } from "./app-shell";
import { BUSINESS_SHELL, DRIVER_SHELL } from "./nav-config";
import { BusinessGate, DriverGate } from "./session-gate";

function BusinessFrame({ children }: { children: ReactNode }) {
  const { profile } = useBusinessSession();
  const { user } = useAuth();
  return (
    <AppShell
      config={BUSINESS_SHELL}
      navbar={{
        workspaceName: profile.businessName || profile.name || "My business",
        workspaceMeta: profile.location?.address ?? "Business account",
        userName: profile.name || user?.displayName || "You",
        userEmail: profile.email || user?.email || "",
        rating: profile.rating ?? 0,
        totalRatings: profile.totalRatings ?? 0,
      }}
    >
      {children}
    </AppShell>
  );
}

function DriverFrame({ children }: { children: ReactNode }) {
  const { profile } = useDriverSession();
  const { user } = useAuth();
  return (
    <AppShell
      config={DRIVER_SHELL}
      navbar={{
        workspaceName: profile.name,
        workspaceMeta: `${profile.vehicleType} · ${profile.vehicleNumber}`,
        userName: profile.name,
        userEmail: profile.email || user?.email || "",
        rating: profile.rating ?? 0,
        totalRatings: profile.totalRatings ?? 0,
      }}
    >
      {children}
    </AppShell>
  );
}

export function BusinessLayout({ children }: { children: ReactNode }) {
  return (
    <BusinessGate>
      <BusinessFrame>{children}</BusinessFrame>
    </BusinessGate>
  );
}

export function DriverLayout({ children }: { children: ReactNode }) {
  return (
    <DriverGate>
      <DriverFrame>{children}</DriverFrame>
    </DriverGate>
  );
}
