"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

import { IconRail, MobileNav } from "./icon-rail";
import { pageMeta, type ShellConfig } from "./nav-config";
import { TopNavbar } from "./top-navbar";

type AppShellProps = {
  config: ShellConfig;
  navbar: Omit<React.ComponentProps<typeof TopNavbar>, "kind">;
  children: ReactNode;
};

/**
 * LetterStack's protected shell: a full-width top navbar, an icon rail, and
 * one bordered, rounded container holding a slim header and the page.
 */
export function AppShell({ config, navbar, children }: AppShellProps) {
  const pathname = usePathname();
  const meta = pageMeta(config, pathname);
  const isHome = pathname === config.home.href;
  const Icon = meta.icon;

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <TopNavbar kind={config.kind} {...navbar} />
      <MobileNav config={config} />

      <div className="flex flex-1 gap-2 overflow-hidden px-2 pb-2">
        <IconRail config={config} />

        <div className="flex flex-1 overflow-hidden rounded-xl border border-border bg-muted/30 shadow-sm">
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-muted/20">
            {/* The dashboard home is content-only, like LetterStack's. */}
            {!isHome && (
              <div className="flex h-10 shrink-0 items-center gap-1.5 border-b border-border bg-muted/50 px-3">
                <Icon className="size-3.5 text-muted-foreground" aria-hidden />
                <span className="text-xs font-medium text-foreground">{meta.title}</span>
              </div>
            )}
            <main className={cn("scrollbar-none flex flex-1 flex-col overflow-auto p-4 md:p-6")}>
              {children}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
