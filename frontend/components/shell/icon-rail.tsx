"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import { isActive, type NavItem, type ShellConfig } from "./nav-config";

function RailButton({ item, active, home }: { item: NavItem; active: boolean; home?: boolean }) {
  const Icon = item.icon;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href={item.href}
          className={cn(
            "flex size-9 items-center justify-center rounded-lg transition-all duration-150",
            home
              ? active
                ? "bg-sidebar-accent text-primary shadow-sm"
                : "text-primary hover:bg-sidebar-accent/50"
              : active
                ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                : "text-sidebar-foreground/50 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
          )}
        >
          <Icon className="size-4" />
          <span className="sr-only">{item.label}</span>
        </Link>
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={8} className="text-xs">
        {item.label}
      </TooltipContent>
    </Tooltip>
  );
}

export function IconRail({ config }: { config: ShellConfig }) {
  const pathname = usePathname();
  const homeHref = config.home.href;

  return (
    <aside className="hidden w-11 shrink-0 flex-col items-center py-2 sm:flex">
      <div className="mb-3">
        <RailButton item={config.home} active={pathname === homeHref} home />
      </div>

      <nav className="flex flex-1 flex-col items-center gap-1">
        {config.items.map((item) => (
          <RailButton key={item.href} item={item} active={isActive(pathname, item.href, homeHref)} />
        ))}
      </nav>

      <nav className="flex flex-col items-center gap-1 pb-1">
        <Separator className="mb-1 w-5" />
        {config.bottom.map((item) => (
          <RailButton key={item.href} item={item} active={isActive(pathname, item.href, homeHref)} />
        ))}
      </nav>
    </aside>
  );
}

/** Phone-width replacement for the rail: a scrollable strip under the navbar. */
export function MobileNav({ config }: { config: ShellConfig }) {
  const pathname = usePathname();
  const homeHref = config.home.href;
  const items = [config.home, ...config.items, ...config.bottom];

  return (
    <nav className="scrollbar-none flex gap-1 overflow-x-auto px-2 pb-2 sm:hidden">
      {items.map((item) => {
        const Icon = item.icon;
        const active = isActive(pathname, item.href, homeHref);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium",
              active ? "bg-sidebar-accent text-foreground" : "text-muted-foreground",
            )}
          >
            <Icon className="size-3.5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
