"use client";

import { ShieldCheckIcon, StarIcon, TruckIcon } from "lucide-react";

import { Page, PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChartCard } from "@/components/ui/chart-card";
import { Separator } from "@/components/ui/separator";
import { initials, shortDate } from "@/lib/format";
import { useDriverSession } from "@/lib/session";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

export default function DriverProfilePage() {
  const { profile } = useDriverSession();

  return (
    <Page className="max-w-3xl">
      <PageHeader title="Profile" description="What businesses see when you take one of their deliveries." />

      <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
        <Avatar className="size-14">
          <AvatarFallback className="bg-primary text-lg font-bold text-primary-foreground">{initials(profile.name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-semibold">{profile.name}</p>
          <p className="truncate text-sm text-muted-foreground">
            {profile.email} · driving since {shortDate(profile.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-1 text-sm">
          <StarIcon className="size-4 fill-amber-400 text-amber-400" />
          {profile.totalRatings ? `${profile.rating.toFixed(1)} (${profile.totalRatings})` : "No ratings yet"}
        </div>
      </div>

      <ChartCard title="Vehicle" icon={TruckIcon}>
        <Row label="Type" value={profile.vehicleType} />
        <Separator />
        <Row label="Registration" value={profile.vehicleNumber} />
        <Separator />
        <Row label="Capacity" value={`${profile.capacity} kg`} />
        <Separator />
        <Row label="Phone" value={profile.phone} />
      </ChartCard>

      <ChartCard title="Verification" icon={ShieldCheckIcon}>
        <Row label="Status" value={<StatusBadge status={profile.verificationStatus} />} />
        <Separator />
        <Row label="Driving licence" value={profile.licenseNumber || "Not added"} />
        <p className="px-4 pb-4 text-xs text-muted-foreground">
          DigiLocker verification is coming. Once it&apos;s live, verified drivers are ranked higher in route matching.
        </p>
      </ChartCard>
    </Page>
  );
}
