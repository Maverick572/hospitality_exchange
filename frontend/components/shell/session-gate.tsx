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

type Kind = "business" | "driver";

const ROUTES: Record<Kind, { login: string; onboarding: string }> = {
  business: { login: "/login", onboarding: "/onboarding" },
  driver: { login: "/driver/login", onboarding: "/driver/onboarding" },
};

/**
 * Guards an app area: signed-out visitors go to login, signed-in people
 * without a profile go to onboarding, and everyone else gets their profile
 * through context.
 */
function useProfileGate<T>(kind: Kind, load: () => Promise<T>) {
  const router = useRouter();
  const { status } = useAuth();
  const [profile, setProfile] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const fetchProfile = useCallback(async () => {
    setError(null);
    try {
      setProfile(await load());
    } catch (err) {
      if (err instanceof ApiError && err.status === 404 && !err.notImplemented) {
        router.replace(ROUTES[kind].onboarding);
        return;
      }
      if (err instanceof ApiError && err.status === 401) {
        router.replace(ROUTES[kind].login);
        return;
      }
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, [kind, load, router]);

  useEffect(() => {
    if (status === "signedOut") router.replace(ROUTES[kind].login);
    if (status === "signedIn") void fetchProfile();
  }, [status, kind, router, fetchProfile]);

  return { profile, error, reload: fetchProfile };
}

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
  const { profile, error, reload } = useProfileGate<UserProfile>("business", usersApi.getMe);
  if (error) return <GateError error={error} onRetry={() => void reload()} />;
  if (!profile) return <LoadingState className="min-h-svh" label="Loading your workspace…" />;
  return (
    <BusinessSessionContext.Provider value={{ profile, reload }}>{children}</BusinessSessionContext.Provider>
  );
}

export function DriverGate({ children }: { children: ReactNode }) {
  const { profile, error, reload } = useProfileGate<DriverProfile>("driver", driversApi.getMe);
  if (error) return <GateError error={error} onRetry={() => void reload()} />;
  if (!profile) return <LoadingState className="min-h-svh" label="Loading your driver workspace…" />;
  return (
    <DriverSessionContext.Provider value={{ profile, reload }}>{children}</DriverSessionContext.Provider>
  );
}
