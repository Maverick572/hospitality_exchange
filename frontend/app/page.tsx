import localFont from "next/font/local";

import { CallToAction, Examples, Footer, Perks, Roles } from "@/components/landing/closing";
import { Features } from "@/components/landing/features";
import { Hero } from "@/components/landing/hero";
import { Categories, HowItWorks } from "@/components/landing/how-it-works";
import { Navbar } from "@/components/landing/navbar";

const satoshi = localFont({
  src: "../components/landing/fonts/Satoshi-Variable.woff2",
  variable: "--font-satoshi",
  weight: "300 900",
  display: "swap",
});

export default function Home() {
  return (
    <div className={`landing ${satoshi.variable} relative flex min-h-svh flex-col overflow-x-clip`}>
      {/* Fine grid that fades out below the hero. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[900px] bg-[linear-gradient(to_right,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-size-[3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]"
      />
      <Navbar />
      <main className="relative z-10 w-full py-20">
        <Hero />
        <Categories />
        <HowItWorks />
        <Features />
        <Perks />
        <Roles />
        <Examples />
        <CallToAction />
      </main>
      <Footer />
    </div>
  );
}
