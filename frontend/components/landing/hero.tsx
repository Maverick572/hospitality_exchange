import Link from "next/link";
import {
  ArrowRightIcon,
  CheckIcon,
  ClockIcon,
  IndianRupeeIcon,
  LockIcon,
  MapPinIcon,
  SparklesIcon,
  TruckIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import { Reveal, Spotlight, Wrapper } from "./primitives";

export function Hero() {
  return (
    <Wrapper className="relative">
      <Spotlight className="-top-40 left-0 md:-top-20 md:left-60" fill="rgba(255,255,255,0.5)" />
      <div className="relative z-10 mx-auto my-24 flex w-full max-w-5xl flex-col items-center text-center">
        <Reveal>
          <a
            href="#how-it-works"
            className="mx-auto flex w-max select-none items-center gap-2.5 rounded-full border border-foreground/10 py-1 pr-1 pl-2 backdrop-blur-lg transition-colors hover:border-foreground/20"
          >
            <span className="relative flex size-3.5 items-center justify-center rounded-full bg-primary/40">
              <span className="size-2.5 animate-ping rounded-full bg-primary/60 motion-reduce:animate-none" />
              <span className="absolute size-1.5 rounded-full bg-primary" />
            </span>
            <span className="animate-background-shine inline-flex items-center gap-2 bg-linear-to-r from-[#b2a8fd] via-[#8678f9] to-[#c7d2fe] bg-size-[200%_auto] bg-clip-text text-sm text-transparent">
              B2B exchange for hospitality
              <span className="flex items-center rounded-full bg-linear-to-b from-foreground/20 to-foreground/10 px-1.5 py-0.5 text-xs text-foreground/80">
                See how
                <ArrowRightIcon className="ml-1 size-3.5 text-foreground/50" />
              </span>
            </span>
          </a>
        </Reveal>

        <h1 className="blur-in mt-6 bg-linear-to-br from-foreground to-foreground/60 bg-clip-text py-2 font-heading text-4xl font-medium tracking-[-0.02em] text-balance text-transparent sm:text-5xl lg:text-6xl lg:leading-snug xl:text-7xl">
          Rent what sits idle.
          <br className="hidden md:block" /> Source what you need.
        </h1>

        <Reveal delay={0.1}>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground lg:text-lg">
            Hotels, caterers and venues share chairs, kitchen gear, AV and space with each other, delivered by drivers
            already on the route. <span className="hidden sm:inline">Every booking is held in escrow until it arrives in good shape.</span>
          </p>
        </Reveal>

        <Reveal delay={0.2}>
          <div className="mt-8 flex items-center justify-center gap-3 md:gap-6">
            <Button asChild size="lg" className="h-10 px-6 shadow-[0_16px_32px_-8px] shadow-primary/50">
              <Link href="/signup">
                Get started free
                <ArrowRightIcon data-icon="inline-end" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-10 px-6">
              <Link href="/driver/signup">I&apos;m a driver</Link>
            </Button>
          </div>
        </Reveal>

        <Reveal delay={0.3} className="w-full">
          <div className="relative mx-auto mt-14 max-w-5xl rounded-xl border border-white/10 bg-white/[0.03] p-2 backdrop-blur-lg md:p-3 lg:rounded-[28px]">
            <div aria-hidden className="landing-glow absolute inset-0 top-1/4 left-1/2 -z-10 h-1/4 w-3/4 -translate-x-1/2 -translate-y-1/2 blur-[10rem]" />
            <HeroPreview />
          </div>
        </Reveal>
      </div>
    </Wrapper>
  );
}

const BUNDLE = [
  { who: "Banquet hall · Vashi", what: "180 chairs", km: "2.1 km", price: "₹8,100" },
  { who: "Hotel · CBD Belapur", what: "120 chairs", km: "4.8 km", price: "₹6,000" },
  { who: "Caterer · Kharghar", what: "20 round tables", km: "6.3 km", price: "₹5,000" },
];

/**
 * Illustrative product frame: one requirement, parsed into constraints, and
 * the fulfillment bundle it resolves to. Mirrors the example in PS.txt.
 */
function HeroPreview() {
  return (
    <div className="grid gap-2 rounded-lg border border-white/10 bg-background p-2 text-left md:grid-cols-[0.9fr_1.1fr] md:gap-3 md:p-3 lg:rounded-[20px]">
      <div className="flex flex-col gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">New requirement</span>
          <span className="rounded-full border border-white/10 px-2 py-0.5 text-[11px] text-muted-foreground">Example</span>
        </div>
        <p className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm leading-6">
          Need 300 chairs and 20 round tables in Navi Mumbai tomorrow, delivered before 3 PM. Budget ₹25,000.
        </p>
        <div className="flex items-center gap-1.5 text-xs text-primary">
          <SparklesIcon className="size-3.5" />
          Understood as
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Chip>Banquet Seating · 300 units</Chip>
          <Chip>Tables · 20 units</Chip>
          <Chip icon={<MapPinIcon />}>Navi Mumbai</Chip>
          <Chip icon={<ClockIcon />}>Before 3:00 PM</Chip>
          <Chip icon={<IndianRupeeIcon />}>≤ 25,000</Chip>
        </div>
        <div className="mt-auto hidden rounded-lg border border-dashed border-white/10 p-3 text-xs leading-5 text-muted-foreground md:block">
          No single provider has 300 chairs free tomorrow, so the order is split across three.
        </div>
      </div>

      <div className="flex flex-col gap-2 rounded-lg border border-white/5 bg-white/[0.02] p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Fulfillment bundle</span>
          <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] text-emerald-300">
            <CheckIcon className="size-3" /> Within budget
          </span>
        </div>
        {BUNDLE.map((row, i) => (
          <div key={row.who} className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/20 text-xs font-medium text-primary">
              {String.fromCharCode(65 + i)}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{row.what}</div>
              <div className="truncate text-xs text-muted-foreground">
                {row.who} · {row.km}
              </div>
            </div>
            <span className="text-sm tabular-nums">{row.price}</span>
          </div>
        ))}
        <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2.5">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <TruckIcon className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">Route match · Tempo (407)</div>
            <div className="truncate text-xs text-muted-foreground">Vashi → Belapur → Kharghar → venue · 1:40 PM</div>
          </div>
          <span className="text-sm tabular-nums">₹2,600</span>
        </div>
        <div className="mt-1 flex items-center justify-between border-t border-white/10 pt-3">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <LockIcon className="size-3.5" /> Held in escrow until delivery
          </span>
          <span className="font-heading text-lg font-medium tabular-nums">₹21,700</span>
        </div>
      </div>
    </div>
  );
}

function Chip({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-primary/25 bg-primary/10 px-2 py-1 text-xs text-foreground/90 [&_svg]:size-3 [&_svg]:text-primary">
      {icon}
      {children}
    </span>
  );
}
