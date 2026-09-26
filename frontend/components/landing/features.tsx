import { CameraIcon, CheckIcon, LockIcon, SparklesIcon, VideoIcon } from "lucide-react";

import { BrandLogo } from "@/components/brand-logo";

import { MagicCard, Reveal, SectionHeading, Wrapper } from "./primitives";

function CardText({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col">
      <h3 className="heading-gradient font-heading text-xl font-medium">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground md:text-base">{children}</p>
    </div>
  );
}

export function Features() {
  return (
    <section id="features" className="scroll-mt-24 py-12 md:py-16 lg:py-24">
      <Wrapper>
        <SectionHeading
          badge="Features"
          title={
            <>
              Built for the messy <br className="hidden sm:block" /> middle of an event
            </>
          }
          description="Short notice, partial stock, tight budgets, fragile equipment. Each part of the platform handles one of these."
        />

        <div className="mt-16 flex flex-col gap-5">
          <Reveal className="grid gap-5 lg:grid-cols-[1fr_0.65fr]">
            <MagicCard>
              <div className="flex h-full flex-col gap-6 p-4 md:p-6">
                <ParseVisual />
                <CardText title="Ask like you'd ask a colleague">
                  Write the requirement in plain English. Items, quantities, units, location, deadline and budget come out
                  as structured constraints you can check before searching.
                </CardText>
              </div>
            </MagicCard>
            <MagicCard>
              <div className="flex h-full flex-col gap-6 p-4 md:p-6">
                <BundleVisual />
                <CardText title="Split across providers">
                  When nobody has the full quantity, the optimizer combines stock from nearby providers into one plan.
                </CardText>
              </div>
            </MagicCard>
          </Reveal>

          <Reveal className="grid gap-5 lg:grid-cols-3">
            <MagicCard>
              <div className="flex h-full flex-col gap-6 p-4 md:p-6">
                <RouteVisual />
                <CardText title="Delivery on existing routes">
                  Drivers post where they&apos;re already going. Pickups are matched to routes with room and a fitting time
                  window.
                </CardText>
              </div>
            </MagicCard>

            <div className="grid gap-5">
              <MagicCard className="h-32">
                <div className="relative flex h-full items-center justify-center overflow-hidden p-4">
                  <p className="absolute inset-0 p-4 text-justify text-sm leading-6 text-muted-foreground [mask-image:radial-gradient(50%_50%_at_50%_50%,#000_0%,transparent_90%)]">
                    price · distance · quantity · availability · deadline · budget · vehicle capacity · route overlap ·
                    price · distance · quantity · availability · deadline · budget · vehicle capacity · route overlap ·
                    price · distance · quantity · availability · deadline · budget · vehicle capacity · route overlap
                  </p>
                  <span className="relative rounded-full border border-primary/40 bg-background px-3 py-1 text-xs font-medium text-primary">
                    8 constraints, one solve
                  </span>
                </div>
              </MagicCard>
              <MagicCard>
                <div className="relative flex h-48 items-center justify-center">
                  {[224, 168, 112].map((size) => (
                    <span
                      key={size}
                      aria-hidden
                      className="absolute rounded-full border border-white/10"
                      style={{ width: size, height: size }}
                    />
                  ))}
                  <div aria-hidden className="absolute size-28 rounded-full bg-primary/20 blur-3xl" />
                  <BrandLogo className="relative size-16 opacity-90" aria-hidden />
                </div>
              </MagicCard>
            </div>

            <MagicCard>
              <div className="flex h-full flex-col gap-6 p-4 md:p-6">
                <CardText title="Escrow on every booking">
                  The seeker pays up front, and the money stays locked until the delivery is confirmed. Then providers and the
                  driver are paid out.
                </CardText>
                <EscrowVisual />
              </div>
            </MagicCard>
          </Reveal>

          <Reveal className="grid gap-5 lg:grid-cols-[0.4fr_1fr]">
            <MagicCard>
              <div className="flex h-full flex-col gap-6 p-4 md:p-6">
                <EvidenceVisual />
                <CardText title="Condition evidence">
                  Timestamped photos for static items, video for powered equipment, both for venues and vehicles.
                </CardText>
              </div>
            </MagicCard>
            <MagicCard>
              <div className="flex h-full flex-col gap-6 p-4 md:p-6">
                <ScoreVisual />
                <CardText title="Ranked, not just filtered">
                  Every match gets a score you can read: how close, how cheap, how complete, how on time. Pick the best
                  fit, not just the first one that came up.
                </CardText>
              </div>
            </MagicCard>
          </Reveal>
        </div>
      </Wrapper>
    </section>
  );
}

function ParseVisual() {
  return (
    <div className="relative flex min-h-44 flex-col justify-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-4">
      <div aria-hidden className="absolute top-1/2 left-1/2 -z-10 size-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/15 blur-3xl" />
      <p className="text-sm text-foreground/80">
        &ldquo;need <mark className="rounded bg-primary/25 px-1 text-foreground">2 quintal</mark> basmati and{" "}
        <mark className="rounded bg-primary/25 px-1 text-foreground">40 L</mark> cooking oil in{" "}
        <mark className="rounded bg-primary/25 px-1 text-foreground">Kharghar</mark> by{" "}
        <mark className="rounded bg-primary/25 px-1 text-foreground">Friday</mark>&rdquo;
      </p>
      <div className="flex items-center gap-1.5 text-xs text-primary">
        <SparklesIcon className="size-3.5" /> Normalized to SI units
      </div>
      <div className="grid gap-1.5 font-mono text-xs sm:grid-cols-2">
        {[
          ["raw_ingredients", "200 kg"],
          ["raw_ingredients", "40 liters"],
          ["location", "Kharghar"],
          ["needed_by", "Fri 23:59"],
        ].map(([key, value], i) => (
          <div key={i} className="flex justify-between gap-2 rounded-md border border-white/10 bg-background/60 px-2.5 py-1.5">
            <span className="text-muted-foreground">{key}</span>
            <span>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BundleVisual() {
  const parts = [
    { label: "A", value: 180, className: "bg-primary" },
    { label: "B", value: 120, className: "bg-primary/60" },
  ];
  return (
    <div className="flex min-h-40 flex-col justify-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-4">
      <div className="flex items-baseline justify-between text-xs text-muted-foreground">
        <span>Banquet chairs</span>
        <span className="text-foreground">300 / 300</span>
      </div>
      <div className="flex h-3 overflow-hidden rounded-full bg-white/5">
        {parts.map((part) => (
          <div key={part.label} className={part.className} style={{ width: `${(part.value / 300) * 100}%` }} />
        ))}
      </div>
      <div className="flex gap-4 text-xs text-muted-foreground">
        {parts.map((part) => (
          <span key={part.label} className="flex items-center gap-1.5">
            <span className={`size-2 rounded-full ${part.className}`} /> Provider {part.label} · {part.value}
          </span>
        ))}
      </div>
    </div>
  );
}

function RouteVisual() {
  return (
    <div className="relative h-40 rounded-xl border border-white/5 bg-white/[0.02] bg-[radial-gradient(circle,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-size-[16px_16px]">
      <svg viewBox="0 0 300 160" className="size-full" aria-hidden>
        <path d="M20 130 C 80 120, 90 40, 150 60 S 240 110, 280 30" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="6" strokeLinecap="round" />
        <path
          d="M20 130 C 80 120, 90 40, 150 60 S 240 110, 280 30"
          fill="none"
          stroke="var(--primary)"
          strokeWidth="2"
          strokeDasharray="6 6"
          className="animate-dash"
        />
        {[
          [20, 130],
          [150, 60],
          [280, 30],
        ].map(([cx, cy], i) => (
          <g key={i}>
            <circle cx={cx} cy={cy} r="9" fill="var(--primary)" fillOpacity="0.2" />
            <circle cx={cx} cy={cy} r="4" fill={i === 1 ? "white" : "var(--primary)"} />
          </g>
        ))}
        <text x="150" y="42" textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.7)">
          pickup on the way
        </text>
      </svg>
    </div>
  );
}

function EscrowVisual() {
  const steps = [
    { label: "Payment deposited", done: true },
    { label: "Picked up · photos logged", done: true },
    { label: "Delivered · condition confirmed", done: true },
    { label: "Escrow released", done: false },
  ];
  return (
    <ol className="mt-auto flex flex-col gap-2">
      {steps.map((step) => (
        <li key={step.label} className="flex items-center gap-2.5 text-sm">
          <span
            className={
              step.done
                ? "flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground"
                : "flex size-5 items-center justify-center rounded-full border border-primary/50 text-primary"
            }
          >
            {step.done ? <CheckIcon className="size-3" /> : <LockIcon className="size-2.5" />}
          </span>
          <span className={step.done ? "text-muted-foreground" : "text-foreground"}>{step.label}</span>
        </li>
      ))}
    </ol>
  );
}

function EvidenceVisual() {
  return (
    <div className="grid h-40 grid-cols-2 gap-2">
      {[
        { icon: CameraIcon, label: "Pickup", time: "11:42" },
        { icon: VideoIcon, label: "Drop-off", time: "13:38" },
      ].map((item) => (
        <div
          key={item.label}
          className="flex flex-col justify-between rounded-lg border border-white/10 bg-linear-to-br from-white/[0.06] to-white/[0.01] p-3"
        >
          <item.icon className="size-5 text-primary" strokeWidth={1.6} />
          <div>
            <div className="text-xs font-medium">{item.label}</div>
            <div className="font-mono text-[11px] text-muted-foreground">{item.time} · geotagged</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ScoreVisual() {
  const rows = [
    { label: "Price vs budget", value: 92 },
    { label: "Distance", value: 84 },
    { label: "Quantity covered", value: 100 },
    { label: "Delivery window", value: 76 },
  ];
  return (
    <div className="grid gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-4 sm:grid-cols-2">
      {rows.map((row) => (
        <div key={row.label} className="flex flex-col gap-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">{row.label}</span>
            <span className="tabular-nums">{row.value}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
            <div className="h-full rounded-full bg-linear-to-r from-primary/60 to-primary" style={{ width: `${row.value}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
