import { CATEGORIES, STEPS } from "./content";
import { Marquee, Particles, Reveal, SectionHeading, Wrapper } from "./primitives";

/** Rail of resource categories, in place of the template's logo wall. */
export function Categories() {
  return (
    <Wrapper className="py-12 lg:py-20">
      <Reveal>
        <div className="flex flex-col items-center text-center">
          <h2 className="heading-gradient text-lg md:text-xl">31 categories of hospitality resources, one exchange</h2>
          <div className="relative mt-10 w-full overflow-hidden">
            <Marquee pauseOnHover className="[--duration:60s]">
              {CATEGORIES.map((name) => (
                <span
                  key={name}
                  className="whitespace-nowrap rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-muted-foreground"
                >
                  {name}
                </span>
              ))}
            </Marquee>
            <div className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-linear-to-r from-background" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-linear-to-l from-background" />
          </div>
        </div>
      </Reveal>
    </Wrapper>
  );
}

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-24 py-12 md:py-16">
      <Wrapper>
        <SectionHeading
          badge="How it works"
          title="From one sentence to a delivered order"
          description="Stock, transport and payment are usually three separate phone calls. Here they're one booking."
        />
        <div className="relative mt-14">
          <Particles className="absolute inset-0" quantity={120} ease={80} color="#e4e4e7" />
          <ol className="relative grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Dashed connector running behind the step icons on wide screens. */}
            <svg aria-hidden className="absolute top-9 left-[12.5%] hidden h-px w-3/4 overflow-visible lg:block">
              <line
                x1="0"
                y1="0"
                x2="100%"
                y2="0"
                stroke="currentColor"
                strokeDasharray="6 6"
                className="animate-dash text-primary/50"
              />
            </svg>
            {STEPS.map((step, index) => (
              <li key={step.title}>
                <Reveal delay={index * 0.08} className="h-full">
                  <div className="flex h-full flex-col items-center rounded-2xl border border-white/10 bg-background/60 p-6 text-center backdrop-blur-sm">
                    <span className="relative flex size-12 items-center justify-center rounded-xl border border-primary/30 bg-primary/15 text-primary">
                      <step.icon className="size-5" strokeWidth={1.6} />
                      <span className="absolute -top-2 -right-2 flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-medium text-primary-foreground">
                        {index + 1}
                      </span>
                    </span>
                    <h3 className="mt-5 font-heading text-lg font-medium">{step.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.description}</p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </Wrapper>
    </section>
  );
}
