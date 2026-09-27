"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRightIcon, FlaskConicalIcon, LockKeyholeIcon, MailIcon, UserIcon } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { ApiError, driversApi, usersApi } from "@/lib/api";
import { authErrorMessage, useAuth } from "@/lib/auth";

type Mode = "login" | "signup";
type Audience = "business" | "driver";

const COPY: Record<Audience, Record<Mode, { title: string; description: string; cta: string }>> = {
  business: {
    login: {
      title: "Log in",
      description: "Enter your account details to open your business dashboard.",
      cta: "Log in",
    },
    signup: {
      title: "Create account",
      description: "Create your login first, then add your business details.",
      cta: "Continue to business profile",
    },
  },
  driver: {
    login: {
      title: "Driver log in",
      description: "Sign in to see your routes and delivery jobs.",
      cta: "Log in",
    },
    signup: {
      title: "Become a driver",
      description: "Create your login first, then register your vehicle.",
      cta: "Continue to vehicle details",
    },
  },
};

export function AuthForm({ mode, audience }: { mode: Mode; audience: Audience }) {
  const router = useRouter();
  const { signIn, signUp, signInWithGoogle, signOut, demoMode } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const driver = audience === "driver";
  const copy = COPY[audience][mode];
  const home = driver ? "/driver" : "/dashboard";
  const onboarding = driver ? "/driver/onboarding" : "/onboarding";
  const base = driver ? "/driver" : "";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        await signUp(email, password, name, { driver });
        router.push(onboarding);
      } else {
        await signIn(email, password, { driver });
        // In login mode, verify account exists in the database
        try {
          if (driver) await driversApi.getMe();
          else await usersApi.getMe();
          router.push(home);
        } catch (err) {
          if (err instanceof ApiError && err.status === 404) {
            await signOut();
            setError("No account found for this email. Please sign up to create an account.");
            setLoading(false);
            return;
          }
          throw err;
        }
      }
    } catch (err) {
      setError(authErrorMessage(err));
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
      if (mode === "signup") {
        router.push(onboarding);
      } else {
        try {
          if (driver) await driversApi.getMe();
          else await usersApi.getMe();
          router.push(home);
        } catch (err) {
          if (err instanceof ApiError && err.status === 404) {
            await signOut();
            setError("No account found for this Google account. Please create an account via Sign up.");
            setLoading(false);
            return;
          }
          throw err;
        }
      }
    } catch (err) {
      setError(authErrorMessage(err));
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{copy.title}</CardTitle>
        <CardDescription>{copy.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            {demoMode && (
              <Alert>
                <FlaskConicalIcon />
                <AlertDescription>
                  Demo mode: Firebase isn&apos;t configured, so any email works and the
                  password is ignored. Add the Firebase keys to <code>.env.local</code> for
                  real accounts.
                </AlertDescription>
              </Alert>
            )}
            {mode === "signup" && (
              <Field>
                <FieldLabel htmlFor="name">Your name</FieldLabel>
                <div className="relative">
                  <UserIcon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder={driver ? "Ravi Kumar" : "Priya Sharma"}
                    className="pl-8"
                    required
                  />
                </div>
              </Field>
            )}
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <div className="relative">
                <MailIcon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder={driver ? "you@example.com" : "contact@hotelabc.com"}
                  className="pl-8"
                  required
                />
              </div>
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <div className="relative">
                <LockKeyholeIcon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={mode === "signup" ? "At least 6 characters" : "Enter your password"}
                  className="pl-8"
                  minLength={demoMode ? undefined : 6}
                  required={!demoMode}
                />
              </div>
            </Field>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Field>
              <Button className="w-full" disabled={loading}>
                {loading && <Spinner data-icon="inline-start" />}
                {loading ? (mode === "signup" ? "Creating…" : "Logging in…") : copy.cta}
                {!loading && <ArrowRightIcon data-icon="inline-end" />}
              </Button>
            </Field>
            {!demoMode && <FieldSeparator>or</FieldSeparator>}
            <Field>
              {!demoMode && (
                <Button variant="outline" className="w-full" type="button" onClick={handleGoogle}>
                  Continue with Google
                </Button>
              )}
              <FieldDescription className="text-center">
                {mode === "login" ? (
                  <>
                    New here?{" "}
                    <Link
                      href={`${base}/signup`}
                      className="font-medium text-foreground underline-offset-4 hover:underline"
                    >
                      Create an account
                    </Link>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <Link
                      href={`${base}/login`}
                      className="font-medium text-foreground underline-offset-4 hover:underline"
                    >
                      Log in
                    </Link>
                  </>
                )}
              </FieldDescription>
              <FieldDescription className="text-center">
                {driver ? (
                  <Link href="/login" className="underline-offset-4 hover:text-foreground hover:underline">
                    Are you a business? Log in here
                  </Link>
                ) : (
                  <Link href="/driver/login" className="underline-offset-4 hover:text-foreground hover:underline">
                    Driving for us? Driver log in
                  </Link>
                )}
              </FieldDescription>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
