"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRightIcon, PhoneIcon, UserIcon } from "lucide-react";

import { AuthSplit } from "@/components/auth/auth-split";
import { LoadingState } from "@/components/states";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Spinner } from "@/components/ui/spinner";
import { ApiError, driversApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { VEHICLE_TYPES } from "@/lib/constants";

export default function DriverOnboardingPage() {
  const router = useRouter();
  const { status, user } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [vehicleType, setVehicleType] = useState(VEHICLE_TYPES[2]);
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [capacity, setCapacity] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === "signedOut") router.replace("/driver/login");
  }, [status, router]);

  useEffect(() => {
    if (user?.displayName) setName((current) => current || user.displayName || "");
  }, [user]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await driversApi.createProfile({
        name,
        phone: phone.replace(/\s+/g, ""),
        vehicleType,
        vehicleNumber: vehicleNumber.toUpperCase(),
        capacity: Number(capacity),
        licenseNumber: licenseNumber || null,
      });
      router.push("/driver");
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        router.push("/driver");
        return;
      }
      setError(err instanceof Error ? err.message : "Couldn't save your vehicle details.");
      setSaving(false);
    }
  }

  if (status !== "signedIn") return <LoadingState className="min-h-svh" />;

  return (
    <AuthSplit
      heading="Register your vehicle."
      subheading="Capacity decides which deliveries fit on your routes. Your licence number is optional for now and will be used for verification later."
      previewTitle="Getting on the road"
      steps={[
        { title: "Create your login", description: user?.email ?? "Done", tag: "Done" },
        { title: "Vehicle details", description: "Type, number and capacity", tag: "Step 2", active: true },
      ]}
    >
      <Card>
        <CardHeader>
          <CardTitle>Vehicle details</CardTitle>
          <CardDescription>Businesses see your name, vehicle and rating when you take a delivery.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="name">Full name</FieldLabel>
                <div className="relative">
                  <UserIcon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="pl-8" minLength={2} required />
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
                    placeholder="+919876543210"
                    className="pl-8"
                    required
                  />
                </div>
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="vehicleType">Vehicle type</FieldLabel>
                  <NativeSelect
                    id="vehicleType"
                    className="w-full"
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                  >
                    {VEHICLE_TYPES.map((type) => (
                      <NativeSelectOption key={type} value={type}>
                        {type}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </Field>
                <Field>
                  <FieldLabel htmlFor="vehicleNumber">Vehicle number</FieldLabel>
                  <Input
                    id="vehicleNumber"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    placeholder="MH 43 AB 1234"
                    minLength={4}
                    maxLength={20}
                    required
                  />
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="capacity">Capacity (kg)</FieldLabel>
                <Input
                  id="capacity"
                  type="number"
                  min={1}
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  placeholder="750"
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="license">Driving licence number</FieldLabel>
                <Input
                  id="license"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  placeholder="Optional"
                />
                <FieldDescription>Optional. Used for DigiLocker verification later.</FieldDescription>
              </Field>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Field>
                <Button className="w-full" disabled={saving}>
                  {saving && <Spinner data-icon="inline-start" />}
                  {saving ? "Saving…" : "Open driver dashboard"}
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
