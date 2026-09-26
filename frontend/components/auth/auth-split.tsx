import type { ReactNode } from "react";
import Link from "next/link";

import { BRAND_NAME, BrandLogo } from "@/components/brand-logo";

type Step = { title: string; description: string; tag: string; active?: boolean };

/**
 * Two-column auth frame (LetterStack pattern): a sidebar-toned panel with a
 * product preview and pitch on the left, the form card on the right. The
 * panel collapses away below lg.
 */
export function AuthSplit({
  heading,
  subheading,
  previewTitle,
  steps,
  children,
}: {
  heading: string;
  subheading: string;
  previewTitle: string;
  steps: Step[];
  children: ReactNode;
}) {
  return (
    <main className="grid min-h-svh bg-muted/20 lg:grid-cols-[0.92fr_1.08fr]">
      <section className="hidden border-r border-border bg-sidebar p-8 text-sidebar-foreground lg:flex lg:flex-col">
        <Link href="/" className="flex w-fit items-center gap-2">
          <BrandLogo className="size-9" aria-hidden />
          <span className="font-semibold tracking-normal">{BRAND_NAME}</span>
        </Link>

        <div className="mt-auto flex max-w-md flex-col gap-5">
          <div className="grid gap-3 rounded-xl border border-sidebar-border bg-sidebar-accent/40 p-4">
            <div className="text-sm font-medium">{previewTitle}</div>
            {steps.map((step) => (
              <div
                key={step.title}
                className="flex items-center justify-between gap-3 rounded-lg border border-sidebar-border bg-background/60 px-3 py-3"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium">{step.title}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{step.description}</div>
                </div>
                <span
                  className={
                    step.active
                      ? "shrink-0 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground"
                      : "shrink-0 rounded-full border border-sidebar-border px-2 py-0.5 text-xs text-muted-foreground"
                  }
                >
                  {step.tag}
                </span>
              </div>
            ))}
          </div>
          <div>
            <h1 className="text-3xl font-semibold leading-tight tracking-normal">{heading}</h1>
            <p className="mt-3 text-sm leading-6 text-sidebar-foreground/70">{subheading}</p>
          </div>
        </div>
      </section>

      <section className="flex min-h-svh items-center justify-center p-6 md:p-10">
        <div className="flex w-full max-w-md flex-col gap-6">
          <Link href="/" className="flex items-center gap-2 lg:hidden">
            <BrandLogo className="size-9" aria-hidden />
            <span className="font-semibold tracking-normal">{BRAND_NAME}</span>
          </Link>
          {children}
        </div>
      </section>
    </main>
  );
}
