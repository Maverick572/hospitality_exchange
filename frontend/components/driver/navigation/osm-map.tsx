"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

export const OsmMap = dynamic(
  () => import("./osm-map-view").then((mod) => mod.OsmMapView),
  {
    ssr: false,
    loading: () => (
      <div className="relative flex size-full min-h-[380px] items-center justify-center rounded-2xl border border-border bg-muted/30">
        <Skeleton className="size-full rounded-2xl" />
        <div className="absolute flex flex-col items-center gap-2 text-muted-foreground">
          <div className="size-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-xs font-medium">Loading OpenStreetMap GPS View...</p>
        </div>
      </div>
    ),
  }
);
