"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BoxesIcon,
  ChevronRightIcon,
  MoonIcon,
  SunIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";

import { NotificationsMenu } from "@/components/shell/notifications-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePerspective } from "@/lib/perspective";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { API_BASE_URL } from "@/lib/api/client";
import { mockStore } from "@/lib/mock-store";
import { cn } from "@/lib/utils";

import { pageMeta, type ShellConfig } from "./nav-config";

type AppTopbarProps = {
  config: ShellConfig;
  user: {
    name: string;
    businessName: string;
  };
};

export function AppTopbar({ config, user: _user }: AppTopbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const meta = pageMeta(config, pathname);
  const { theme, setTheme } = useTheme();
  const { perspective, setPerspective } = usePerspective();

  const [isLive, setIsLive] = useState(!mockStore.forceDemo);
  const [forceDemo, setForceDemo] = useState(mockStore.forceDemo);

  useEffect(() => {
    const handleStatus = (e: Event) => {
      const ce = e as CustomEvent<{ live?: boolean }>;
      if (ce.detail && typeof ce.detail.live === "boolean") {
        setIsLive(ce.detail.live && !mockStore.forceDemo);
      }
    };
    const handleDemoChange = () => {
      setForceDemo(mockStore.forceDemo);
      setIsLive(!mockStore.forceDemo);
    };

    window.addEventListener("hrex_backend_status", handleStatus);
    window.addEventListener("hrex_demo_mode_changed", handleDemoChange);
    return () => {
      window.removeEventListener("hrex_backend_status", handleStatus);
      window.removeEventListener("hrex_demo_mode_changed", handleDemoChange);
    };
  }, []);

  return (
    <>
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/60">
        {/* ── Breadcrumb Navigation & Perspective Toggle ── */}
        <div className="flex items-center gap-3 sm:gap-4 text-xs font-medium">
          <div className="flex items-center gap-2">
            <Link
              href={config.home.href}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {config.kind === "driver" ? "Driver Fleet" : "Workspace"}
            </Link>
            <ChevronRightIcon className="size-3 text-muted-foreground/60" />
            <span className="font-semibold text-foreground">{meta.title}</span>
          </div>

          {/* Perspective Toggle (HACK-CELESTIAL layout) */}
          {config.kind === "business" && (
            <div className="hidden sm:flex items-center rounded-xl bg-muted/60 p-0.5 border border-border shadow-2xs">
              <button
                type="button"
                onClick={() => {
                  setPerspective("seeker");
                  toast.success("Seeker View Active: Sourcing equipment, capacity & smart matches");
                }}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer",
                  perspective === "seeker"
                    ? "bg-background text-primary shadow-xs font-bold border border-border/80"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span>Seeker View</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setPerspective("provider");
                  toast.success("Provider View Active: Managing resources & monetizing inventory");
                }}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer",
                  perspective === "provider"
                    ? "bg-background text-primary shadow-xs font-bold border border-border/80"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <BoxesIcon className={cn("size-3.5", perspective === "provider" ? "text-primary" : "text-muted-foreground")} />
                <span>Provider View</span>
              </button>
            </div>
          )}
        </div>

        {/* ── Right Actions ── */}
        <div className="flex items-center gap-2.5">
          {/* Connection Pill */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all hover:opacity-90 focus-visible:outline-none",
                  isLive
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
                )}
              >
                <span
                  className={cn(
                    "size-1.5 rounded-full animate-pulse",
                    isLive ? "bg-emerald-500" : "bg-amber-500",
                  )}
                />
                <span>{isLive ? "Live Backend" : "Demo Mode"}</span>
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-3.5 text-xs">
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">API Connection</span>
                  <Badge variant={isLive ? "default" : "secondary"}>
                    {isLive ? "Live API" : "Offline / Demo"}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {isLive
                    ? `Connected to live FastAPI backend at ${API_BASE_URL}.`
                    : "Using high-fidelity Mumbai hospitality demo dataset. All actions, searches, and bookings work seamlessly offline."}
                </p>
                <div className="flex items-center justify-between border-t pt-2.5">
                  <span className="text-xs font-medium text-foreground">Always Use Demo Data</span>
                  <Switch
                    checked={forceDemo}
                    onCheckedChange={(checked) => {
                      mockStore.setForceDemo(checked);
                      setForceDemo(checked);
                      setIsLive(!checked);
                    }}
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Notifications Dropdown */}
          <NotificationsMenu kind={config.kind} />

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="text-muted-foreground hover:text-foreground"
            title="Toggle theme"
          >
            <SunIcon className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <MoonIcon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>
      </header>
    </>
  );
}
