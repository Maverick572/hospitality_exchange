"use client";

import { useState } from "react";
import Link from "next/link";
import { StarIcon } from "lucide-react";
import { toast } from "sonner";

import { LocationField } from "@/components/location-field";
import { Page, PageHeader } from "@/components/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ChartCard } from "@/components/ui/chart-card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { usersApi } from "@/lib/api";
import { initials, shortDate } from "@/lib/format";
import { useBusinessSession } from "@/lib/session";
import type { GeoLocation } from "@/lib/types";

export default function ProfilePage() {
  const { profile, reload } = useBusinessSession();
  const [name, setName] = useState(profile.name ?? "");
  const [businessName, setBusinessName] = useState(profile.businessName ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [location, setLocation] = useState<GeoLocation | null>(profile.location ?? null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!location) {
      setError("Set your location (type an address and press Find).");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await usersApi.updateMe({ name, businessName, phone, location });
      await reload();
      toast.success("Profile saved");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save your profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Page className="max-w-3xl">
      <PageHeader title="Profile" description="How your business appears on listings, requests and reviews." />

      <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
        <Avatar className="size-14 rounded-xl">
          <AvatarFallback className="rounded-xl bg-primary text-lg font-bold text-primary-foreground">
            {initials(profile.businessName || profile.name, "B")}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-semibold">{profile.businessName || "Your business"}</p>
          <p className="truncate text-sm text-muted-foreground">
            {profile.email} · member since {shortDate(profile.createdAt)}
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/dashboard/providers/${profile.userId}`}>
            <StarIcon data-icon="inline-start" className="fill-amber-400 text-amber-400" />
            {profile.totalRatings ? `${profile.rating.toFixed(1)} · ${profile.totalRatings}` : "No ratings"}
          </Link>
        </Button>
      </div>

      <ChartCard title="Business details">
        <form onSubmit={save} className="p-4">
          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="p-name">Contact name</FieldLabel>
                <Input id="p-name" value={name} onChange={(e) => setName(e.target.value)} required />
              </Field>
              <Field>
                <FieldLabel htmlFor="p-business">Business name</FieldLabel>
                <Input id="p-business" value={businessName} onChange={(e) => setBusinessName(e.target.value)} required />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="p-email">Email</FieldLabel>
                <Input id="p-email" value={profile.email ?? ""} disabled />
                <FieldDescription>Comes from your login.</FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="p-phone">Phone</FieldLabel>
                <Input id="p-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="p-location">Business location</FieldLabel>
              <LocationField id="p-location" value={location} onChange={setLocation} />
            </Field>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div>
              <Button disabled={saving}>
                {saving && <Spinner data-icon="inline-start" />}
                Save changes
              </Button>
            </div>
          </FieldGroup>
        </form>
      </ChartCard>
    </Page>
  );
}
