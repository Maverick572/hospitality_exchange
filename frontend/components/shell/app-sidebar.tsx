"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BadgeCheckIcon,
  BoxesIcon,
  CalendarCheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsUpDownIcon,
  ClipboardListIcon,
  HandshakeIcon,
  HotelIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  MessageSquareIcon,
  PackageIcon,
  SearchIcon,
  SparklesIcon,
  StoreIcon,
  TruckIcon,
} from "lucide-react";
import { toast } from "sonner";

import { BrandLogo } from "@/components/brand-logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePerspective } from "@/lib/perspective";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import { isActive, type NavGroup, type NavItem, type ShellConfig } from "./nav-config";

type AppSidebarProps = {
  config: ShellConfig;
  user: {
    name: string;
    businessName: string;
    roleLabel: string;
    location?: string;
  };
  onSignOut: () => void;
};

export function AppSidebar({ config, user, onSignOut }: AppSidebarProps) {
  const pathname = usePathname();
  const homeHref = config.home.href;
  const isDriver = config.kind === "driver";

  const [collapsed, setCollapsed] = useState(false);
  const { perspective, setPerspective, togglePerspective } = usePerspective();

  // Read saved collapse state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("hrex_sidebar_collapsed");
    if (saved === "true") setCollapsed(true);
  }, []);

  const toggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("hrex_sidebar_collapsed", next ? "true" : "false");
      return next;
    });
  };

  return (
    <aside
      className={cn(
        "relative flex h-full flex-col border-r border-border bg-sidebar transition-all duration-200 ease-in-out select-none",
        collapsed ? "w-16" : "w-64",
      )}
    >
      {/* ── Brand Header ── */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-sidebar-border px-3.5">
        <Link href={config.home.href} className="flex items-center gap-2.5 overflow-hidden">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <BrandLogo className="size-4.5" />
          </div>
          {!collapsed && (
            <div className="flex flex-col overflow-hidden">
              <span className="truncate text-sm font-semibold tracking-tight text-foreground">
                Hospitality<span className="text-primary font-bold">X</span>
              </span>
              <span className="truncate text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
                {isDriver ? "Logistics Fleet" : "B2B Marketplace"}
              </span>
            </div>
          )}
        </Link>

        {!collapsed && (
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={toggleCollapse}
            className="text-muted-foreground hover:text-foreground"
            title="Collapse sidebar"
          >
            <ChevronLeftIcon className="size-3.5" />
          </Button>
        )}
      </div>

      {/* ── Workspace / Business Card ── */}
      {!collapsed ? (
        <div className="p-3 pb-2">
          <div className="flex items-center gap-2.5 rounded-xl border border-sidebar-border bg-sidebar-accent/50 p-2.5 text-sidebar-accent-foreground shadow-2xs">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border/80 bg-background text-primary shadow-2xs">
              {isDriver ? <TruckIcon className="size-4" /> : <HotelIcon className="size-4" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <p className="truncate text-xs font-semibold text-foreground">{user.businessName}</p>
                <BadgeCheckIcon className="size-3.5 shrink-0 text-emerald-500" />
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <p className="truncate text-[11px] text-muted-foreground">{user.location ?? user.roleLabel}</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex justify-center py-2.5">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={toggleCollapse}
            className="text-muted-foreground hover:text-foreground"
            title="Expand sidebar"
          >
            <ChevronRightIcon className="size-3.5" />
          </Button>
        </div>
      )}

      {/* ── Seeker vs Provider Perspective Switcher ── */}
      {!isDriver && !collapsed && (
        <div className="px-3 pb-2">
          <div className="p-1 rounded-xl bg-muted/60 flex items-center gap-1 border border-border shadow-2xs">
            <button
              type="button"
              onClick={() => {
                setPerspective("seeker");
                toast.success("Seeker View Active: Sourcing equipment, capacity & smart matches");
              }}
              className={cn(
                "flex-1 py-1.5 rounded-lg text-[11px] font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                perspective === "seeker"
                  ? "bg-background text-primary shadow-xs font-bold border border-border/80"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40",
              )}
            >
              <SearchIcon className={cn("size-3", perspective === "seeker" ? "text-primary" : "text-muted-foreground")} />
              <span>Seeker</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setPerspective("provider");
                toast.success("Provider View Active: Managing resources & monetizing inventory");
              }}
              className={cn(
                "flex-1 py-1.5 rounded-lg text-[11px] font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                perspective === "provider"
                  ? "bg-background text-primary shadow-xs font-bold border border-border/80"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40",
              )}
            >
              <PackageIcon className={cn("size-3", perspective === "provider" ? "text-primary" : "text-muted-foreground")} />
              <span>Provider</span>
            </button>
          </div>
        </div>
      )}

      {!isDriver && collapsed && (
        <div className="flex justify-center pb-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => {
                  togglePerspective();
                  toast.success(perspective === "seeker" ? "Switched to Provider View" : "Switched to Seeker View");
                }}
                className="flex size-8 items-center justify-center rounded-lg border border-border bg-muted/60 text-primary shadow-2xs hover:bg-muted cursor-pointer"
              >
                {perspective === "seeker" ? <SearchIcon className="size-3.5" /> : <PackageIcon className="size-3.5" />}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs font-medium">
              {perspective === "seeker" ? "Seeker Active (Click to switch)" : "Provider Active (Click to switch)"}
            </TooltipContent>
          </Tooltip>
        </div>
      )}

      {/* ── Nav Groups (Strictly scoped by Perspective) ── */}
      <div className="flex-1 overflow-y-auto px-2 py-1 scrollbar-none">
        <nav className="flex flex-col gap-4">
          {(isDriver
            ? config.groups
            : perspective === "seeker"
              ? [
                  {
                    label: "MAIN",
                    items: [
                      { href: "/dashboard", icon: LayoutDashboardIcon, label: "Dashboard" },
                    ],
                  },
                  {
                    label: "SEEKER SOURCING",
                    items: [
                      { href: "/dashboard/marketplace", icon: StoreIcon, label: "Marketplace" },
                      { href: "/dashboard/requirements", icon: ClipboardListIcon, label: "My Requirements" },
                      { href: "/dashboard/smart-matches", icon: SparklesIcon, label: "Smart Matches", isAi: true, badge: "AI" },
                    ],
                  },
                  {
                    label: "SHARED LOGISTICS",
                    items: [
                      { href: "/dashboard/logistics", icon: TruckIcon, label: "Logistics Match" },
                    ],
                  },
                  {
                    label: "TRANSACTIONS",
                    items: [
                      { href: "/dashboard/requests", icon: HandshakeIcon, label: "Requests & Negotiation" },
                      { href: "/dashboard/bookings", icon: CalendarCheckIcon, label: "Bookings & Escrow" },
                    ],
                  },
                ]
              : [
                  {
                    label: "MAIN",
                    items: [
                      { href: "/dashboard", icon: LayoutDashboardIcon, label: "Dashboard" },
                    ],
                  },
                  {
                    label: "PROVIDER INVENTORY",
                    items: [
                      { href: "/dashboard/resources", icon: BoxesIcon, label: "My Resources" },
                      { href: "/dashboard/marketplace", icon: StoreIcon, label: "Marketplace Feed" },
                    ],
                  },
                  {
                    label: "SHARED LOGISTICS",
                    items: [
                      { href: "/dashboard/logistics", icon: TruckIcon, label: "Logistics Match" },
                    ],
                  },
                  {
                    label: "TRANSACTIONS",
                    items: [
                      { href: "/dashboard/requests", icon: HandshakeIcon, label: "Incoming Requests" },
                      { href: "/dashboard/bookings", icon: CalendarCheckIcon, label: "Bookings & Payouts" },
                    ],
                  },
                ]
          ).map((group) => (
            <div key={group.label} className="flex flex-col gap-1">
              {!collapsed && (
                <div className="flex items-center justify-between px-2.5 py-1 text-[10px] font-semibold text-muted-foreground/70 tracking-wider">
                  <span>{group.label}</span>
                  {group.label === "SEEKER SOURCING" && perspective === "seeker" && (
                    <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[9px] font-bold text-primary tracking-normal">
                      ACTIVE
                    </span>
                  )}
                  {group.label === "PROVIDER INVENTORY" && perspective === "provider" && (
                    <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[9px] font-bold text-primary tracking-normal">
                      ACTIVE
                    </span>
                  )}
                </div>
              )}
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(pathname, item.href, homeHref);

                if (collapsed) {
                  return (
                    <Tooltip key={item.href}>
                      <TooltipTrigger asChild>
                        <Link
                          href={item.href}
                          className={cn(
                            "flex size-10 items-center justify-center rounded-lg transition-colors",
                            active
                              ? "bg-primary text-primary-foreground shadow-2xs"
                              : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
                          )}
                        >
                          <Icon className="size-4" />
                          <span className="sr-only">{item.label}</span>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="right" sideOffset={10} className="text-xs font-medium">
                        {item.label}
                      </TooltipContent>
                    </Tooltip>
                  );
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "group flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition-all duration-150",
                      active
                        ? "bg-primary text-primary-foreground shadow-2xs font-semibold"
                        : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={cn(
                          "size-4 shrink-0 transition-transform group-hover:scale-110",
                          active ? "text-primary-foreground" : item.isAi ? "text-primary" : "text-muted-foreground",
                        )}
                      />
                      <span>{item.label}</span>
                    </div>

                    {item.badge && (
                      <Badge
                        variant={active ? "outline" : "secondary"}
                        className={cn(
                          "px-1.5 py-0 text-[10px] font-semibold uppercase tracking-wider",
                          active ? "border-primary-foreground/30 text-primary-foreground" : "bg-primary/10 text-primary",
                        )}
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      {/* ── Footer User Card ── */}
      <div className="border-t border-sidebar-border p-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg p-2 text-left text-xs transition-colors hover:bg-sidebar-accent focus-visible:outline-none",
                collapsed ? "justify-center" : "",
              )}
            >
              <div className="flex size-7.5 shrink-0 items-center justify-center rounded-full bg-primary/15 font-semibold text-primary text-xs">
                {user.name.charAt(0)}
              </div>
              {!collapsed && (
                <>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-foreground">{user.name}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{user.roleLabel}</p>
                  </div>
                  <ChevronsUpDownIcon className="size-3.5 text-muted-foreground" />
                </>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-56 text-xs">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="font-semibold">{user.name}</p>
                <p className="text-[11px] text-muted-foreground">{user.businessName}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href={isDriver ? "/driver/profile" : "/dashboard/profile"}>Account Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={onSignOut}>
              <LogOutIcon className="size-3.5" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}

