"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRightIcon, MenuIcon, XIcon } from "lucide-react";

import { BRAND_NAME, BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

import { NAV_LINKS } from "./content";

export function Navbar() {
  const { status } = useAuth();
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      {/* Frosted fade behind the floating bar so content scrolls under it cleanly. */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-40 h-22 bg-background/80 backdrop-blur-sm [mask:linear-gradient(to_bottom,#000_20%,transparent_calc(100%-20%))]" />

      <header
        className={cn(
          "fixed inset-x-0 top-4 z-50 mx-auto max-w-6xl px-2 transition-[height] duration-300 md:px-12",
          open ? "h-[calc(100%-24px)]" : "h-12",
        )}
      >
        <div
          className={cn(
            "relative flex size-full flex-col rounded-xl border border-white/10 px-2 backdrop-blur-lg lg:rounded-2xl",
            open ? "bg-background/95" : "bg-background/40",
          )}
        >
          <div className="flex h-12 shrink-0 items-center justify-between">
            <div className="flex items-center">
              <Link href="/" className="flex items-center gap-2 pl-1" onClick={() => setOpen(false)}>
                <BrandLogo className="size-7" aria-hidden />
                <span className="font-heading text-sm font-semibold">{BRAND_NAME}</span>
              </Link>
              <nav className="ml-6 hidden items-center lg:flex">
                {NAV_LINKS.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>
            </div>

            <div className="flex items-center gap-2">
              {status === "signedIn" ? (
                <Button asChild size="sm" className="bg-foreground text-background hover:bg-foreground/80">
                  <Link href="/dashboard">Open dashboard</Link>
                </Button>
              ) : (
                <>
                  <Button asChild size="sm" variant="ghost" className="hover:bg-white/10">
                    <Link href="/login">Log in</Link>
                  </Button>
                  <Button asChild size="sm" className="hidden bg-foreground text-background hover:bg-foreground/80 sm:inline-flex">
                    <Link href="/signup">
                      Get started
                      <ArrowRightIcon data-icon="inline-end" className="hidden lg:block" />
                    </Link>
                  </Button>
                </>
              )}
              <Button
                size="icon"
                variant="ghost"
                className="hover:bg-white/10 lg:hidden"
                aria-label={open ? "Close menu" : "Open menu"}
                aria-expanded={open}
                onClick={() => setOpen((value) => !value)}
              >
                {open ? <XIcon /> : <MenuIcon />}
              </Button>
            </div>
          </div>

          {open && (
            <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-2 pt-4 lg:hidden">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-4 py-3 text-lg transition-colors hover:bg-white/5"
                >
                  {link.label}
                </a>
              ))}
              <div className="mt-auto grid gap-2 border-t border-border pt-4">
                <Button asChild size="lg" className="h-11">
                  <Link href="/signup">Create a business account</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-11">
                  <Link href="/driver/signup">Sign up as a driver</Link>
                </Button>
              </div>
            </nav>
          )}
        </div>
      </header>
    </>
  );
}
