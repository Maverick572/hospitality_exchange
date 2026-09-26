import Link from "next/link";
import { CheckIcon } from "lucide-react";

import { BRAND_NAME, BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { EXAMPLE_REQUESTS, PERKS, ROLES, type ExampleRequest, type Role } from "./content";
import { Marquee, Particles, Reveal, RetroGrid, SectionHeading, Wrapper } from "./primitives";

export function Perks() {
  return (
    <section className="py-12 md:py-16 lg:py-24">
      <Wrapper>
        <SectionHeading
          badge="Why use it"
          title="Every side comes out ahead"
          description="Idle inventory earns, short-notice demand gets filled, and empty truck space pays for itself."
        />
        <Reveal className="mt-16 grid md:grid-cols-2 lg:grid-cols-3">
          {PERKS.map((perk, index) => (
            <div
              key={perk.title}
              className={cn(
                "group/perk relative flex flex-col border-white/10 py-10 lg:border-r",
                (index === 0 || index === 3) && "lg:border-l",
                index < 3 && "lg:border-b",
              )}
            >
              <div
                className={cn(
                  "pointer-events-none absolute inset-0 from-primary/15 to-transparent opacity-0 transition duration-200 group-hover/perk:opacity-100",
                  index < 3 ? "bg-linear-to-t" : "bg-linear-to-b",
                )}
              />
              <div className="flex flex-col transition-transform duration-300 group-hover/perk:-translate-y-1">
                <div className="relative z-10 mb-4 px-10">
                  <perk.icon
                    strokeWidth={1.3}
                    className="size-10 origin-left text-muted-foreground transition-all duration-300 group-hover/perk:scale-75 group-hover/perk:text-foreground"
                  />
                </div>
                <div className="relative z-10 mb-2 px-10 font-heading text-lg font-medium">
                  <div className="absolute inset-y-0 left-0 h-6 w-1 rounded-r-full bg-white/15 transition-all duration-500 group-hover/perk:h-8 group-hover/perk:bg-primary" />
                  <h3 className="heading-gradient">{perk.title}</h3>
                </div>
                <p className="relative z-10 max-w-xs px-10 text-sm text-muted-foreground">{perk.description}</p>
              </div>
            </div>
          ))}
        </Reveal>
      </Wrapper>
    </section>
  );
}

export function Roles() {
  return (
    <section id="roles" className="relative scroll-mt-24 py-12 md:py-16 lg:py-24">
      <Wrapper>
        <SectionHeading
          badge="Who it's for"
          title="Three ways in"
          description="One business account covers both renting out and renting in. Drivers get their own app."
          className="max-w-xl"
        />
      </Wrapper>
      <div className="relative mt-14">
        <div aria-hidden className="absolute top-1/2 right-2/3 -z-10 hidden size-96 translate-x-1/4 -translate-y-1/2 bg-primary/15 blur-[10rem] lg:block" />
        <div aria-hidden className="absolute top-1/2 left-2/3 -z-10 hidden size-96 -translate-x-1/4 -translate-y-1/2 bg-violet-500/15 blur-[10rem] lg:block" />
        <Wrapper>
          <Reveal className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {ROLES.map((role) => (
              <RoleCard key={role.id} {...role} />
            ))}
          </Reveal>
        </Wrapper>
      </div>
    </section>
  );
}

function RoleCard({ title, tagline, points, cta, href, featured }: Role) {
  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl border bg-[linear-gradient(345deg,rgba(255,255,255,0.01)_0%,rgba(255,255,255,0.03)_100%)] p-3",
        featured ? "border-primary/70" : "border-white/10",
      )}
    >
      {featured && (
        <div className="absolute -top-3 left-1/2 flex h-7 -translate-x-1/2 select-none items-center whitespace-nowrap rounded-full bg-linear-to-r from-primary to-violet-500 px-3 text-sm font-medium">
          Most common
        </div>
      )}
      <div className="p-3">
        <h3 className="font-heading text-2xl font-medium">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{tagline}</p>
      </div>
      <hr className="border-white/10" />
      <ul className="flex flex-1 flex-col gap-3 p-3 pt-4">
        {points.map((point) => (
          <li key={point} className="flex items-start gap-2">
            <CheckIcon aria-hidden className="mt-0.5 size-5 shrink-0 text-primary" />
            <span className="text-sm text-muted-foreground md:text-base">{point}</span>
          </li>
        ))}
      </ul>
      <div className="p-3">
        <Button
          asChild
          size="lg"
          variant={featured ? "default" : "secondary"}
          className={cn("h-10 w-full", !featured && "bg-white/10 text-foreground hover:bg-white/15")}
        >
          <Link href={href}>{cta}</Link>
        </Button>
      </div>
    </div>
  );
}

const firstRow = EXAMPLE_REQUESTS.slice(0, EXAMPLE_REQUESTS.length / 2);
const secondRow = EXAMPLE_REQUESTS.slice(EXAMPLE_REQUESTS.length / 2);

export function Examples() {
  return (
    <section id="examples" className="scroll-mt-24 py-12 md:py-16 lg:py-24">
      <Wrapper>
        <SectionHeading
          badge="Examples"
          title="Just say what you need"
          description="The kind of requests the platform is built to turn into a booking. Hover to pause."
          className="max-w-xl"
        />
        <Reveal className="relative mt-16 overflow-hidden">
          <Marquee pauseOnHover className="[--duration:45s]">
            {firstRow.map((request) => (
              <RequestCard key={request.text} {...request} />
            ))}
          </Marquee>
          <Marquee pauseOnHover reverse className="[--duration:45s]">
            {secondRow.map((request) => (
              <RequestCard key={request.text} {...request} />
            ))}
          </Marquee>
          <div className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-linear-to-r from-background" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-linear-to-l from-background" />
        </Reveal>
      </Wrapper>
    </section>
  );
}

function RequestCard({ text, tags }: ExampleRequest) {
  return (
    <figure className="flex w-72 flex-col gap-3 rounded-xl border border-white/5 bg-white/[0.04] p-4 transition-colors duration-300 hover:bg-white/[0.08]">
      <blockquote className="text-sm leading-6">&ldquo;{text}&rdquo;</blockquote>
      <figcaption className="mt-auto flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <span key={tag} className="rounded-md bg-primary/15 px-2 py-0.5 text-xs text-primary">
            {tag}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}

export function CallToAction() {
  return (
    <section className="py-12 md:py-16 lg:py-24">
      <Wrapper>
        <Reveal>
          <div className="relative mx-auto flex h-[500px] w-full flex-col items-center justify-center overflow-hidden rounded-3xl border border-white/10 px-4 text-center">
            <div aria-hidden className="absolute bottom-0 left-1/2 h-12 w-full -translate-x-1/2 bg-violet-500 blur-[10rem]" />
            <div className="z-20 flex flex-col items-center">
              <h2 className="heading-gradient font-heading text-4xl font-semibold leading-tight md:text-6xl">
                Put idle inventory <br className="hidden md:block" /> to work
              </h2>
              <p className="mx-auto mt-6 max-w-xl text-base text-muted-foreground md:text-lg">
                List what you have, post what you need, or fill the empty space in your truck. Setting up takes a few
                minutes.
              </p>
              <div className="mt-8 flex w-full flex-col items-center justify-center gap-4 md:flex-row">
                <Button asChild size="lg" className="h-10 w-full px-6 md:w-max">
                  <Link href="/signup">Create a business account</Link>
                </Button>
                <Button asChild size="lg" variant="secondary" className="h-10 w-full bg-primary/15 px-6 text-primary hover:bg-primary/25 md:w-max">
                  <Link href="/driver/signup">Sign up as a driver</Link>
                </Button>
              </div>
            </div>
            <RetroGrid />
            <Particles className="absolute inset-0" quantity={80} ease={80} color="#d4d4d8" />
          </div>
        </Reveal>
      </Wrapper>
    </section>
  );
}

const FOOTER_LINKS = [
  {
    title: "Platform",
    links: [
      { name: "How it works", href: "#how-it-works" },
      { name: "Features", href: "#features" },
      { name: "Who it's for", href: "#roles" },
      { name: "Examples", href: "#examples" },
    ],
  },
  {
    title: "Businesses",
    links: [
      { name: "Log in", href: "/login" },
      { name: "Create account", href: "/signup" },
    ],
  },
  {
    title: "Drivers",
    links: [
      { name: "Log in", href: "/driver/login" },
      { name: "Sign up", href: "/driver/signup" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative w-full py-10">
      <Wrapper className="relative flex flex-col justify-between overflow-hidden pb-32 md:flex-row">
        <Particles className="absolute inset-0 -z-10" quantity={40} ease={10} color="#d4d4d8" />
        <div className="flex max-w-60 flex-col items-start">
          <Link href="/" className="flex items-center gap-2">
            <BrandLogo className="size-7" aria-hidden />
            <span className="font-heading text-lg font-medium">{BRAND_NAME}</span>
          </Link>
          <p className="mt-4 text-sm text-muted-foreground">
            A shared resource network for hospitality businesses and the drivers who move their stock.
          </p>
          <Button asChild className="mt-8">
            <Link href="/signup">Get started</Link>
          </Button>
        </div>
        <div className="mt-10 grid w-full max-w-lg grid-cols-2 gap-8 md:mt-0 lg:grid-cols-3">
          {FOOTER_LINKS.map((section) => (
            <div key={section.title} className="flex flex-col gap-4">
              <h4 className="text-sm font-medium">{section.title}</h4>
              <ul className="space-y-4">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Wrapper>
      <Wrapper className="flex items-center justify-between border-t border-white/10 pt-8">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} {BRAND_NAME}
        </p>
        <p className="text-sm text-muted-foreground">Payments held in escrow</p>
      </Wrapper>
    </footer>
  );
}
