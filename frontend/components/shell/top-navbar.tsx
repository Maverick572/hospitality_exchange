"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  LogOutIcon,
  MoonIcon,
  PlusIcon,
  StarIcon,
  SunIcon,
  UserRoundIcon,
} from "lucide-react";

import { BRAND_NAME, BrandLogo } from "@/components/brand-logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth";
import { initials } from "@/lib/format";

import { NotificationsMenu } from "./notifications-menu";

type TopNavbarProps = {
  kind: "business" | "driver";
  /** Business name, or the driver's vehicle. */
  workspaceName: string;
  workspaceMeta: string;
  userName: string;
  userEmail: string;
  rating: number;
  totalRatings: number;
};

export function TopNavbar({
  kind,
  workspaceName,
  workspaceMeta,
  userName,
  userEmail,
  rating,
  totalRatings,
}: TopNavbarProps) {
  const router = useRouter();
  const { signOut } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const driver = kind === "driver";
  const profileHref = driver ? "/driver/profile" : "/dashboard/profile";

  async function handleSignOut() {
    await signOut();
    router.push(driver ? "/driver/login" : "/login");
  }

  return (
    <header className="relative flex h-12 shrink-0 items-center gap-3 bg-background px-3">
      {/* ── Left: workspace ── */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-2 px-2 text-sm font-medium hover:bg-muted/60 focus-visible:ring-0"
          >
            <BrandLogo className="size-6" aria-hidden />
            <span className="hidden max-w-[160px] truncate sm:inline">{workspaceName}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-72 p-1.5">
          <div className="mb-1 rounded-lg border border-border/60 bg-muted/30 p-2.5">
            <div className="flex items-center gap-2.5">
              <Avatar className="size-9 rounded-lg">
                <AvatarFallback className="rounded-lg bg-primary text-xs font-bold text-primary-foreground">
                  {initials(workspaceName, "R")}
                </AvatarFallback>
              </Avatar>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{workspaceName}</span>
                <span className="block truncate text-xs text-muted-foreground">{workspaceMeta}</span>
              </span>
            </div>
            <div className="mt-2.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              <StarIcon className="size-3.5 fill-amber-400 text-amber-400" />
              {totalRatings > 0 ? (
                <span>
                  {rating.toFixed(1)} from {totalRatings} {totalRatings === 1 ? "rating" : "ratings"}
                </span>
              ) : (
                <span>No ratings yet</span>
              )}
            </div>
          </div>
          <p className="px-2 pb-1 pt-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            {BRAND_NAME}
          </p>
          <DropdownMenuItem asChild>
            <Link href={profileHref}>
              <UserRoundIcon />
              Profile settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => void handleSignOut()}>
            <LogOutIcon />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* ── Center spacer ── */}
      <div className="flex flex-1" />

      {/* ── Right: actions ── */}
      <div className="flex shrink-0 items-center gap-1">
        {driver && (
          <Button
            variant="outline"
            size="sm"
            className="hidden h-7 gap-1.5 rounded-lg border-border/60 px-2.5 text-xs font-medium sm:flex"
            asChild
          >
            <Link href="/driver/routes?new=1">
              <PlusIcon className="size-3" />
              Publish route
            </Link>
          </Button>
        )}

        <NotificationsMenu kind={kind} />

        <Button
          variant="ghost"
          size="icon"
          className="size-8 rounded-lg text-muted-foreground hover:text-foreground"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          aria-label="Toggle theme"
        >
          <SunIcon className="hidden size-4 dark:block" />
          <MoonIcon className="size-4 dark:hidden" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="relative ml-1 flex size-7 cursor-pointer items-center justify-center rounded-full outline-none ring-2 ring-transparent transition-shadow hover:ring-border focus-visible:ring-ring"
              aria-label="Account menu"
            >
              <Avatar className="size-7">
                <AvatarFallback className="bg-primary text-[11px] font-bold text-primary-foreground">
                  {initials(userName)}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 p-1.5">
            <div className="mb-1.5 overflow-hidden rounded-lg border border-border/60 bg-muted/30">
              <div className="h-10 bg-gradient-to-br from-primary/20 via-muted to-muted-foreground/15" />
              <div className="-mt-5 flex flex-col items-center gap-1 px-3 pb-3">
                <Avatar className="size-10 ring-4 ring-popover">
                  <AvatarFallback className="bg-primary text-sm font-bold text-primary-foreground">
                    {initials(userName)}
                  </AvatarFallback>
                </Avatar>
                <p className="mt-1 text-sm font-semibold leading-none">{userName}</p>
                <p className="text-xs text-muted-foreground">{userEmail}</p>
                <span className="mt-1.5 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                  {driver ? "Driver" : "Business"}
                </span>
              </div>
            </div>
            <DropdownMenuItem asChild>
              <Link href={profileHref}>
                <UserRoundIcon />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => void handleSignOut()}>
              <LogOutIcon />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

