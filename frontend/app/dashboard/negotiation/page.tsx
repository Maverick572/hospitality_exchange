"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

/**
 * /dashboard/negotiation is now a redirect shim.
 *
 * The real negotiation chat lives at /dashboard/conversations.
 * This page forwards any query params (requestId, resource, qty, amount,
 * provider, seeker, category, etc.) so that existing links from
 * requests/page.tsx and notifications-menu.tsx continue to work.
 */
function NegotiationRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Map negotiation query params → conversations query params
    const params = new URLSearchParams();

    const provider = searchParams.get("provider");
    const providerName = searchParams.get("providerName");
    const seeker = searchParams.get("seeker");
    const seekerName = searchParams.get("seekerName");
    const resource = searchParams.get("resource");
    const amount = searchParams.get("amount");
    const category = searchParams.get("category");
    const requestId = searchParams.get("requestId");
    const qty = searchParams.get("qty");

    // partnerName: prefer providerName/provider (the other party for the seeker)
    if (providerName) params.set("partnerName", providerName);
    else if (provider) params.set("partnerName", provider);
    else if (seekerName) params.set("partnerName", seekerName);
    else if (seeker) params.set("partnerName", seeker);

    if (provider) params.set("partnerId", provider);
    if (resource) params.set("resource", resource);
    if (amount) params.set("amount", amount);
    if (category) params.set("category", category);
    if (requestId) params.set("id", requestId);
    if (qty) params.set("qty", qty);

    const qs = params.toString();
    router.replace(`/dashboard/conversations${qs ? `?${qs}` : ""}`);
  }, [router, searchParams]);

  return (
    <div className="flex h-96 items-center justify-center text-sm text-muted-foreground">
      Redirecting to secure conversations…
    </div>
  );
}

export default function NegotiationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-96 items-center justify-center text-sm text-muted-foreground">
          Redirecting…
        </div>
      }
    >
      <NegotiationRedirect />
    </Suspense>
  );
}
