"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { MenuIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

import { AppSidebar } from "./app-sidebar";
import { AppTopbar } from "./app-topbar";
import { type ShellConfig } from "./nav-config";

type AppShellProps = {
  config: ShellConfig;
  navbar: {
    workspaceName: string;
    workspaceMeta: string;
    userName: string;
    userEmail: string;
    rating: number;
    totalRatings: number;
  };
  children: ReactNode;
};

export function AppShell({ config, navbar, children }: AppShellProps) {
  const { signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const userData = {
    name: navbar.userName,
    businessName: navbar.workspaceName,
    roleLabel: navbar.workspaceMeta,
    location: navbar.workspaceMeta,
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      {/* ── Desktop Sidebar ── */}
      <div className="hidden md:flex shrink-0 h-full">
        <AppSidebar
          config={config}
          user={userData}
          onSignOut={() => void signOut()}
        />
      </div>

      {/* ── Mobile Drawer Overlay ── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative flex w-72 flex-col bg-sidebar shadow-xl z-10">
            <div className="absolute right-2 top-2 z-20">
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setMobileMenuOpen(false)}
              >
                <XIcon className="size-4" />
              </Button>
            </div>
            <AppSidebar
              config={config}
              user={userData}
              onSignOut={() => void signOut()}
            />
          </div>
        </div>
      )}

      {/* ── Right Content Area ── */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Mobile Header Bar */}
        <div className="flex h-14 items-center justify-between border-b px-3 md:hidden">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setMobileMenuOpen(true)}
            >
              <MenuIcon className="size-5" />
            </Button>
            <span className="text-sm font-semibold tracking-tight">HospitalityX</span>
          </div>
          <div className="text-xs text-muted-foreground truncate max-w-[160px]">
            {navbar.workspaceName}
          </div>
        </div>

        {/* Desktop Topbar */}
        <AppTopbar config={config} user={{ name: navbar.userName, businessName: navbar.workspaceName }} />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 scrollbar-thin">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
