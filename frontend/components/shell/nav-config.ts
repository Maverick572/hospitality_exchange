import type { LucideIcon } from "lucide-react";
import {
  BellIcon,
  BoxesIcon,
  CalendarCheckIcon,
  ClipboardListIcon,
  HandshakeIcon,
  LayoutDashboardIcon,
  RouteIcon,
  SearchIcon,
  TruckIcon,
  UserRoundIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  icon: LucideIcon;
  label: string;
};

export type ShellConfig = {
  kind: "business" | "driver";
  home: NavItem;
  items: NavItem[];
  bottom: NavItem[];
  /** Header titles for paths that aren't a nav item (detail pages etc). */
  extraTitles: Record<string, { title: string; icon: LucideIcon }>;
};

export const BUSINESS_SHELL: ShellConfig = {
  kind: "business",
  home: { href: "/dashboard", icon: LayoutDashboardIcon, label: "Dashboard" },
  items: [
    { href: "/dashboard/search", icon: SearchIcon, label: "Find resources" },
    { href: "/dashboard/resources", icon: BoxesIcon, label: "My resources" },
    { href: "/dashboard/requirements", icon: ClipboardListIcon, label: "Requirements" },
    { href: "/dashboard/requests", icon: HandshakeIcon, label: "Requests" },
    { href: "/dashboard/bookings", icon: CalendarCheckIcon, label: "Bookings" },
  ],
  bottom: [
    { href: "/dashboard/notifications", icon: BellIcon, label: "Notifications" },
    { href: "/dashboard/profile", icon: UserRoundIcon, label: "Profile" },
  ],
  extraTitles: {
    "/dashboard/providers": { title: "Provider", icon: UserRoundIcon },
  },
};

export const DRIVER_SHELL: ShellConfig = {
  kind: "driver",
  home: { href: "/driver", icon: LayoutDashboardIcon, label: "Dashboard" },
  items: [
    { href: "/driver/routes", icon: RouteIcon, label: "My routes" },
    { href: "/driver/deliveries", icon: TruckIcon, label: "Deliveries" },
  ],
  bottom: [
    { href: "/driver/notifications", icon: BellIcon, label: "Notifications" },
    { href: "/driver/profile", icon: UserRoundIcon, label: "Profile" },
  ],
  extraTitles: {},
};

export function isActive(pathname: string, href: string, home: string) {
  if (href === home) return pathname === home;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function pageMeta(config: ShellConfig, pathname: string) {
  const all = [config.home, ...config.items, ...config.bottom];
  const match = all
    .filter((item) => isActive(pathname, item.href, config.home.href))
    .sort((a, b) => b.href.length - a.href.length)[0];
  if (match) return { title: match.label, icon: match.icon };
  const extra = Object.entries(config.extraTitles).find(([prefix]) => pathname.startsWith(prefix));
  if (extra) return extra[1];
  return { title: config.home.label, icon: config.home.icon };
}
