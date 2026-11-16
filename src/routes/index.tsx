import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, CloudLightning } from "lucide-react";
import { HeroRing3D } from "@/components/ll/ClientCanvas";
import { Button } from "@/components/ui/button";
import { InfoTip } from "@/components/ll/primitives";
import { LOOPS } from "@/lib/sim/loops";
import { useApp } from "@/store/app";
import { useLocality } from "@/lib/hooks";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LoopLocal — a neighbourhood where nothing is wasted" },
      { name: "description", content: "LoopLocal makes Kukatpally's water, power, waste and drains help each other — one engine, five loops, dispatched actions." },
      { property: "og:title", content: "LoopLocal — a neighbourhood where nothing is wasted" },
      { property: "og:description", content: "The brain that closes a neighbourhood's water, power, waste and drain loops. Built for Hyderabad colonies." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const WHY = [
  "A single rain and wind spell cut power for 5–6 hours across 20+ colonies.",
  "With no power there is no pumping, so water supply stops.",
  "The IDL nala has narrowed from about 7 m to 2 m; clogged nalas flood streets.",
  "Tanker bookings in Kukatpally later jumped about 185% year on year.",
  "Only about 0.95% of Hyderabad's rain soaks into the ground.",
];

function Landing() {
  const reduce = useApp((s) => s.reduceMotion);
  const setScenario = useApp((s) => s.setScenario);
  const setRole = useApp((s) => s.setRole);
  const loc = useLocality();

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-9rem)] max-w-6xl flex-col justify-center gap-12 pb-6">
      <section className="grid items-center gap-8 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <p className="mb-4 text-sm font-medium text-muted-foreground">{loc.name}, Hyderabad</p>
          <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-gradient text-4xl font-semibold leading-[1.08] sm:text-5xl lg:text-6xl">
            A neighbourhood where nothing is wasted.
          </motion.h1>
          <p className="mt-5 flex max-w-md items-start gap-1.5 text-lg text-muted-foreground">
            <span>One system for a colony's water, power, waste and drains.</span>
            <InfoTip label="Why this matters" side="bottom">
              <p className="mb-2 font-medium text-foreground">Why this matters</p>
              <ul className="list-disc space-y-1 pl-4">{WHY.map((w) => <li key={w}>{w}</li>)}</ul>
            </InfoTip>
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild variant="hero" size="lg">
              <Link to="/command">Open Command <ArrowRight /></Link>
            </Button>
            <Button asChild variant="glass" size="lg" onClick={() => { setScenario("storm"); setRole("officer"); }}>
              <Link to="/storm"><CloudLightning /> Run a storm day</Link>
            </Button>
          </div>
        </div>
        <div className="relative aspect-square w-full max-w-[460px] justify-self-center">
          <HeroRing3D reduce={reduce} />
        </div>
      </section>

      <section aria-label="The five loops">
        <ul className="flex flex-wrap justify-center gap-2.5">
          {LOOPS.map((l) => (
            <li key={l.id} className="flex items-center gap-2 rounded-full border bg-card py-1.5 pl-2 pr-1.5">
              <span className="grid size-6 shrink-0 place-items-center rounded-full" style={{ background: `color-mix(in oklab, ${l.color} 16%, transparent)`, color: l.color }}>
                <l.icon className="size-3.5" aria-hidden />
              </span>
              <span className="text-sm font-medium">{l.short}</span>
              <InfoTip label={`About ${l.name}`}>
                <p className="mb-1 font-medium text-foreground">{l.name}</p>
                <p className="mb-1 text-foreground">{l.from} → {l.to}</p>
                {l.why}
              </InfoTip>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
