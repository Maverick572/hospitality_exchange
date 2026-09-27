"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BoxesIcon,
  ChevronRightIcon,
  MessageSquareIcon,
  MoonIcon,
  SunIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";

import { NotificationsMenu } from "@/components/shell/notifications-menu";
import { Button } from "@/components/ui/button";
import { usePerspective } from "@/lib/perspective";
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
  const meta = pageMeta(config, pathname);
  const { theme, setTheme } = useTheme();
  const { perspective, setPerspective } = usePerspective();

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

          {/* Perspective Toggle (Seeker / Provider) */}
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
          {/* Quick Chat & Messages Link */}
          {config.kind === "business" && (
            <Button
              variant="ghost"
              size="icon-xs"
              asChild
              className="text-muted-foreground hover:text-foreground relative"
              title="Chat & Messages"
            >
              <Link href="/dashboard/conversations">
                <MessageSquareIcon className="size-4" />
                <span className="sr-only">Chat & Messages</span>
              </Link>
            </Button>
          )}

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

