import type { LucideIcon } from "lucide-react";
import {
  BellIcon,
  BoxesIcon,
  CalendarCheckIcon,
  ClipboardListIcon,
  HandshakeIcon,
  LayoutDashboardIcon,
  MessageSquareIcon,
  RouteIcon,
  SearchIcon,
  SparklesIcon,
  StoreIcon,
  TruckIcon,
  UserRoundIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  icon: LucideIcon;
  label: string;
  badge?: string;
  isAi?: boolean;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export type ShellConfig = {
  kind: "business" | "driver";
  home: NavItem;
  groups: NavGroup[];
  items: NavItem[];
  bottom: NavItem[];
  extraTitles: Record<string, { title: string; icon: LucideIcon }>;
};

export const BUSINESS_SHELL: ShellConfig = {
  kind: "business",
  home: { href: "/dashboard", icon: LayoutDashboardIcon, label: "Overview" },
  groups: [
    {
      label: "SEEKER SOURCING",
      items: [
        { href: "/dashboard/marketplace", icon: StoreIcon, label: "Marketplace" },
        { href: "/dashboard/smart-matches", icon: SparklesIcon, label: "Smart Matches", isAi: true, badge: "AI" },
        { href: "/dashboard/requirements", icon: ClipboardListIcon, label: "Requirements" },
      ],
    },
    {
      label: "PROVIDER INVENTORY",
      items: [
        { href: "/dashboard/resources", icon: BoxesIcon, label: "My Resources" },
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
        { href: "/dashboard/negotiation", icon: MessageSquareIcon, label: "Negotiation Chat", badge: "LIVE" },
        { href: "/dashboard/requests", icon: HandshakeIcon, label: "Offers & Negotiation" },
        { href: "/dashboard/bookings", icon: CalendarCheckIcon, label: "Bookings & Escrow" },
      ],
    },
  ],
  items: [
    { href: "/dashboard/marketplace", icon: StoreIcon, label: "Marketplace" },
    { href: "/dashboard/smart-matches", icon: SparklesIcon, label: "Smart Matches", isAi: true, badge: "AI" },
    { href: "/dashboard/requirements", icon: ClipboardListIcon, label: "Requirements" },
    { href: "/dashboard/resources", icon: BoxesIcon, label: "My Resources" },
    { href: "/dashboard/logistics", icon: TruckIcon, label: "Logistics Match" },
    { href: "/dashboard/negotiation", icon: MessageSquareIcon, label: "Negotiation Chat" },
    { href: "/dashboard/requests", icon: HandshakeIcon, label: "Offers & Negotiation" },
    { href: "/dashboard/bookings", icon: CalendarCheckIcon, label: "Bookings & Escrow" },
  ],
  bottom: [
    { href: "/dashboard/notifications", icon: BellIcon, label: "Notifications" },
    { href: "/dashboard/profile", icon: UserRoundIcon, label: "Settings & Profile" },
  ],
  extraTitles: {
    "/dashboard/logistics": { title: "Logistics-Aware Matching", icon: TruckIcon },
    "/dashboard/marketplace": { title: "Resource Marketplace", icon: StoreIcon },
    "/dashboard/smart-matches": { title: "Smart Matches", icon: SparklesIcon },
    "/dashboard/search": { title: "Natural Language Search", icon: SearchIcon },
    "/dashboard/providers": { title: "Provider Profile", icon: UserRoundIcon },
    "/dashboard/negotiation": { title: "Offer Negotiation & Handover", icon: HandshakeIcon },
    "/dashboard/bookings/": { title: "Booking Details & Escrow", icon: CalendarCheckIcon },
  },
};

export const DRIVER_SHELL: ShellConfig = {
  kind: "driver",
  home: { href: "/driver", icon: LayoutDashboardIcon, label: "Driver Dashboard" },
  groups: [
    {
      label: "SHARED LOGISTICS",
      items: [
        { href: "/driver", icon: LayoutDashboardIcon, label: "Fleet Overview" },
        { href: "/driver/routes", icon: RouteIcon, label: "Published Routes" },
        { href: "/driver/deliveries", icon: TruckIcon, label: "Matched Deliveries" },
      ],
    },
    {
      label: "ACCOUNT & VEHICLE",
      items: [
        { href: "/driver/profile", icon: UserRoundIcon, label: "Vehicle & Verification" },
        { href: "/driver/notifications", icon: BellIcon, label: "Dispatch Alerts" },
      ],
    },
    {
      label: "MARKETPLACE",
      items: [
        { href: "/dashboard", icon: BoxesIcon, label: "Back to Marketplace" },
      ],
    },
  ],
  items: [
    { href: "/driver/routes", icon: RouteIcon, label: "Published Routes" },
    { href: "/driver/deliveries", icon: TruckIcon, label: "Matched Deliveries" },
  ],
  bottom: [
    { href: "/driver/notifications", icon: BellIcon, label: "Notifications" },
    { href: "/driver/profile", icon: UserRoundIcon, label: "Vehicle & Verification" },
  ],
  extraTitles: {},
};

export function isActive(pathname: string, href: string, home: string) {
  if (href === home) return pathname === home;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function pageMeta(config: ShellConfig, pathname: string) {
  const all = [
    config.home,
    ...config.items,
    ...config.bottom,
    ...config.groups.flatMap((g) => g.items),
  ];
  const match = all
    .filter((item) => isActive(pathname, item.href, config.home.href))
    .sort((a, b) => b.href.length - a.href.length)[0];
  if (match) return { title: match.label, icon: match.icon };
  const extra = Object.entries(config.extraTitles).find(([prefix]) => pathname.startsWith(prefix));
  if (extra) return extra[1];
  return { title: config.home.label, icon: config.home.icon };
}
