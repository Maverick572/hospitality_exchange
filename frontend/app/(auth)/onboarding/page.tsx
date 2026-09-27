"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRightIcon, Building2Icon, PhoneIcon, UserIcon } from "lucide-react";

import { AuthSplit } from "@/components/auth/auth-split";
import { LocationField } from "@/components/location-field";
import { LoadingState } from "@/components/states";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { ApiError, usersApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { GeoLocation } from "@/lib/types";

export default function BusinessOnboardingPage() {
  const router = useRouter();
  const { status, user } = useAuth();
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === "signedOut") router.replace("/login");
  }, [status, router]);

  useEffect(() => {
    if (user?.displayName) setName((current) => current || user.displayName || "");
  }, [user]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!location) {
      setError("Press Find next to the address so we can pin your location.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await usersApi.createProfile({
        name,
        businessName,
        phone,
        location,
        userId: user?.uid,
        email: user?.email,
      });
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        router.push("/dashboard");
        return;
      }
      setError(err instanceof Error ? err.message : "Couldn't save your profile.");
      setSaving(false);
    }
  }

  if (status !== "signedIn") return <LoadingState className="min-h-svh" />;

  return (
    <AuthSplit
      heading="Tell us about your business."
      subheading="Your location is used to rank nearby providers and to price deliveries. You can change any of this later from your profile."
      previewTitle="Getting set up"
      steps={[
        { title: "Create your login", description: user?.email ?? "Done", tag: "Done" },
        { title: "Business profile", description: "Name, phone and location for matching", tag: "Step 2", active: true },
      ]}
    >
      <Card>
        <CardHeader>
          <CardTitle>Business profile</CardTitle>
          <CardDescription>This is what other businesses see on your listings and requests.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="name">Contact name</FieldLabel>
                <div className="relative">
                  <UserIcon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="pl-8" required />
                </div>
              </Field>
              <Field>
                <FieldLabel htmlFor="business">Business name</FieldLabel>
                <div className="relative">
                  <Building2Icon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="business"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Hotel ABC"
                    className="pl-8"
                    required
                  />
                </div>
              </Field>
              <Field>
                <FieldLabel htmlFor="phone">Phone</FieldLabel>
                <div className="relative">
                  <PhoneIcon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="pl-8"
                    required
                  />
                </div>
              </Field>
              <Field>
                <FieldLabel htmlFor="location">Business location</FieldLabel>
                <LocationField id="location" value={location} onChange={setLocation} />
                <FieldDescription>Where your resources are usually picked up from.</FieldDescription>
              </Field>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Field>
                <Button className="w-full" disabled={saving}>
                  {saving && <Spinner data-icon="inline-start" />}
                  {saving ? "Saving…" : "Open dashboard"}
                  {!saving && <ArrowRightIcon data-icon="inline-end" />}
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </AuthSplit>
  );
}
