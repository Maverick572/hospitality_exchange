"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

/** Content column shared by every landing section. */
export function Wrapper({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-6xl px-4 md:px-12", className)}>{children}</div>;
}

/**
 * Fades and lifts its children in the first time they scroll into view.
 * Motion lives in globals.css (.reveal) so reduced-motion users get static content.
 */
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [shown, setShown] = React.useState(false);

  React.useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      data-shown={shown ? "" : undefined}
      className={cn("reveal", className)}
      style={{ "--reveal-delay": `${delay}s` } as React.CSSProperties}
    >
      {children}
    </div>
  );
}

/** Small pill label that sits above each section heading. */
export function SectionBadge({ title }: { title: string }) {
  return (
    <div className="select-none rounded-full bg-primary/15 px-4 py-1">
      <div className="animate-background-shine bg-[linear-gradient(110deg,#8b7cf6,45%,#d6cfff,55%,#8b7cf6)] bg-size-[250%_100%] bg-clip-text text-sm font-medium text-transparent">
        {title}
      </div>
    </div>
  );
}

export function SectionHeading({
  badge,
  title,
  description,
  className,
}: {
  badge: string;
  title: React.ReactNode;
  description: React.ReactNode;
  className?: string;
}) {
  return (
    <Reveal>
      <div className={cn("mx-auto flex max-w-2xl flex-col items-center text-center", className)}>
        <SectionBadge title={badge} />
        <h2 className="mt-6 font-heading text-3xl font-medium leading-snug md:text-4xl lg:text-5xl">
          {title}
        </h2>
        <p className="mt-6 text-base text-muted-foreground md:text-lg">{description}</p>
      </div>
    </Reveal>
  );
}

/** Infinite horizontal rail; children are repeated so the loop has no gap. */
export function Marquee({
  children,
  className,
  reverse = false,
  pauseOnHover = false,
  repeat = 4,
}: {
  children: React.ReactNode;
  className?: string;
  reverse?: boolean;
  pauseOnHover?: boolean;
  repeat?: number;
}) {
  return (
    <div className={cn("group flex overflow-hidden p-2 [--duration:40s] [--gap:1rem] [gap:var(--gap)]", className)}>
      {Array.from({ length: repeat }, (_, i) => (
        <div
          key={i}
          aria-hidden={i > 0 || undefined}
          className={cn(
            "animate-marquee flex shrink-0 flex-row justify-around [gap:var(--gap)]",
            pauseOnHover && "group-hover:[animation-play-state:paused]",
            reverse && "[animation-direction:reverse]",
          )}
        >
          {children}
        </div>
      ))}
    </div>
  );
}

/** Soft diagonal light beam behind the hero heading. */
export function Spotlight({ className, fill = "white" }: { className?: string; fill?: string }) {
  const id = React.useId().replace(/:/g, "");
  return (
    <svg
      aria-hidden
      className={cn(
        "animate-spotlight pointer-events-none absolute z-[1] h-[169%] w-[138%] opacity-0 lg:w-[84%]",
        className,
      )}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 3787 2842"
      fill="none"
    >
      <g filter={`url(#${id})`}>
        <ellipse
          cx="1924.71"
          cy="273.501"
          rx="1924.71"
          ry="273.501"
          transform="matrix(-0.822377 -0.568943 -0.568943 0.822377 3631.88 2291.09)"
          fill={fill}
          fillOpacity="0.21"
        />
      </g>
      <defs>
        <filter
          id={id}
          x="0.860352"
          y="0.838989"
          width="3785.16"
          height="2840.26"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feGaussianBlur stdDeviation="151" />
        </filter>
      </defs>
    </svg>
  );
}

/** Perspective grid scrolling toward the viewer (used in the closing CTA). */
export function RetroGrid({ className, angle = 65 }: { className?: string; angle?: number }) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute size-full overflow-hidden opacity-50 perspective-[200px]", className)}
    >
      <div className="absolute inset-0" style={{ transform: `rotateX(${angle}deg)` }}>
        <div className="animate-retro-grid ml-[-50%] h-[300vh] w-[600vw] origin-[100%_0_0] bg-size-[60px_60px] bg-repeat [background-image:linear-gradient(to_right,rgba(255,255,255,0.25)_1px,transparent_0),linear-gradient(to_bottom,rgba(255,255,255,0.25)_1px,transparent_0)]" />
      </div>
      <div className="absolute inset-0 bg-linear-to-t from-background to-transparent to-90%" />
    </div>
  );
}

/** Card with a pointer-tracking border light (styles: .spot-card in globals.css). */
export function MagicCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--pos-x", `${event.clientX - rect.left}px`);
    event.currentTarget.style.setProperty("--pos-y", `${event.clientY - rect.top}px`);
  };

  return (
    <div onPointerMove={onPointerMove} className={cn("spot-card overflow-hidden rounded-xl lg:rounded-2xl", className)}>
      <div className="spot-card-content flex flex-col">{children}</div>
    </div>
  );
}

type Particle = {
  x: number;
  y: number;
  tx: number;
  ty: number;
  size: number;
  alpha: number;
  targetAlpha: number;
  dx: number;
  dy: number;
  magnetism: number;
};

/**
 * Drifting dust that leans toward the pointer. Only animates while on screen
 * and not at all under prefers-reduced-motion.
 */
export function Particles({
  className,
  quantity = 60,
  staticity = 50,
  ease = 50,
  color = "#ffffff",
}: {
  className?: string;
  quantity?: number;
  staticity?: number;
  ease?: number;
  color?: string;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!container || !canvas || !ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hex = color.replace("#", "");
    const int = parseInt(hex.length === 3 ? hex.replace(/./g, "$&$&") : hex, 16);
    const rgb = `${(int >> 16) & 255}, ${(int >> 8) & 255}, ${int & 255}`;
    const dpr = window.devicePixelRatio || 1;
    const mouse = { x: 0, y: 0 };
    let particles: Particle[] = [];
    let w = 0;
    let h = 0;
    let frame = 0;
    let visible = false;

    const spawn = (): Particle => ({
      x: Math.random() * w,
      y: Math.random() * h,
      tx: 0,
      ty: 0,
      size: Math.floor(Math.random() * 2) + 0.4,
      alpha: reduceMotion ? 0.4 : 0,
      targetAlpha: Math.random() * 0.6 + 0.1,
      dx: (Math.random() - 0.5) * 0.1,
      dy: (Math.random() - 0.5) * 0.1,
      magnetism: 0.1 + Math.random() * 4,
    });

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x + p.tx, p.y + p.ty, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb}, ${p.alpha})`;
        ctx.fill();
      }
    };

    const resize = () => {
      w = container.offsetWidth;
      h = container.offsetHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      particles = Array.from({ length: quantity }, spawn);
      draw();
    };

    const tick = () => {
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const edge = Math.min(p.x + p.tx, w - p.x - p.tx, p.y + p.ty, h - p.y - p.ty) - p.size;
        const fade = Math.max(0, edge / 20);
        p.alpha = fade > 1 ? Math.min(p.targetAlpha, p.alpha + 0.02) : p.targetAlpha * fade;
        p.x += p.dx;
        p.y += p.dy;
        p.tx += (mouse.x / (staticity / p.magnetism) - p.tx) / ease;
        p.ty += (mouse.y / (staticity / p.magnetism) - p.ty) / ease;
        if (p.x < -p.size || p.x > w + p.size || p.y < -p.size || p.y > h + p.size) {
          particles[i] = spawn();
        }
      }
      draw();
      frame = visible ? requestAnimationFrame(tick) : 0;
    };

    const onPointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left - w / 2;
      const y = event.clientY - rect.top - h / 2;
      if (Math.abs(x) < w / 2 && Math.abs(y) < h / 2) {
        mouse.x = x;
        mouse.y = y;
      }
    };

    resize();
    if (reduceMotion) return;

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !frame) frame = requestAnimationFrame(tick);
    });
    observer.observe(container);
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    window.addEventListener("pointermove", onPointerMove, { passive: true });

    return () => {
      observer.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      cancelAnimationFrame(frame);
    };
  }, [color, ease, quantity, staticity]);

  return (
    <div ref={containerRef} className={cn("pointer-events-none", className)} aria-hidden>
      <canvas ref={canvasRef} className="size-full" />
    </div>
  );
}
