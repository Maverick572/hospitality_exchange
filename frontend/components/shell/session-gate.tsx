"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { LogOutIcon, RotateCwIcon, ServerCrashIcon } from "lucide-react";

import { EmptyState, LoadingState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { ApiError, driversApi, usersApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { BusinessSessionContext, DriverSessionContext } from "@/lib/session";
import type { DriverProfile, UserProfile } from "@/lib/types";

function GateError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  const { signOut } = useAuth();
  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <EmptyState
        icon={ServerCrashIcon}
        className="max-w-md"
        title="Couldn't load your account"
        description={error.message}
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onRetry}>
              <RotateCwIcon data-icon="inline-start" />
              Try again
            </Button>
            <Button variant="ghost" size="sm" onClick={() => void signOut()}>
              <LogOutIcon data-icon="inline-start" />
              Sign out
            </Button>
          </div>
        }
      />
    </div>
  );
}

export function BusinessGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { status } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const fetchProfile = useCallback(async () => {
    setError(null);
    try {
      const p = await usersApi.getMe();
      setProfile(p);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.replace("/login");
        return;
      }
      if (err instanceof ApiError && err.status === 404) {
        // Check if this account is actually a driver
        try {
          const driverProf = await driversApi.getMe();
          if (driverProf) {
            router.replace("/driver");
            return;
          }
        } catch {
          // Not a driver either -> onboarding
        }
        router.replace("/onboarding");
        return;
      }
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, [router]);

  useEffect(() => {
    if (status === "signedOut") router.replace("/login");
    if (status === "signedIn") void fetchProfile();
  }, [status, router, fetchProfile]);

  if (error) return <GateError error={error} onRetry={() => void fetchProfile()} />;
  if (!profile) return <LoadingState className="min-h-svh" label="Loading your workspace…" />;
  return (
    <BusinessSessionContext.Provider value={{ profile, reload: fetchProfile }}>
      {children}
    </BusinessSessionContext.Provider>
  );
}

export function DriverGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { status } = useAuth();
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const fetchProfile = useCallback(async () => {
    setError(null);
    try {
      const p = await driversApi.getMe();
      setProfile(p);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.replace("/driver/login");
        return;
      }
      if (err instanceof ApiError && err.status === 404) {
        // Check if this account is actually a business user
        try {
          const userProf = await usersApi.getMe();
          if (userProf) {
            router.replace("/dashboard");
            return;
          }
        } catch {
          // Not a business user either -> driver onboarding
        }
        router.replace("/driver/onboarding");
        return;
      }
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, [router]);

  useEffect(() => {
    if (status === "signedOut") router.replace("/driver/login");
    if (status === "signedIn") void fetchProfile();
  }, [status, router, fetchProfile]);

  if (error) return <GateError error={error} onRetry={() => void fetchProfile()} />;
  if (!profile) return <LoadingState className="min-h-svh" label="Loading your driver workspace…" />;
  return (
    <DriverSessionContext.Provider value={{ profile, reload: fetchProfile }}>
      {children}
    </DriverSessionContext.Provider>
  );
}

