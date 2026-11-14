import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, CloudLightning, Building2, Workflow } from "lucide-react";
import { HeroRing3D } from "@/components/ll/ClientCanvas";
import { Button } from "@/components/ui/button";
import { InfoTip } from "@/components/ll/primitives";
import { LOOPS } from "@/lib/sim/loops";
import { useApp } from "@/store/app";
import { AnimatedNumber } from "@/components/ll/AnimatedNumber";
import { useLocality, useLocalitySummary, fmtL } from "@/lib/hooks";

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

const TRY = [
  { to: "/storm", icon: CloudLightning, title: "Run a storm day", body: "Watch the actions go out." },
  { to: "/loops", icon: Workflow, title: "See the five loops", body: "How each output feeds the next." },
  { to: "/hub-twin", icon: Building2, title: "Look inside a hub", body: "One building through a day." },
] as const;

function Landing() {
  const reduce = useApp((s) => s.reduceMotion);
  const setScenario = useApp((s) => s.setScenario);
  const setRole = useApp((s) => s.setRole);
  const sum = useLocalitySummary();
  const loc = useLocality();

  return (
    <div className="mx-auto max-w-6xl space-y-10 pb-6">
      <section className="grid items-center gap-6 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <p className="mb-3 text-sm text-muted-foreground">{loc.name}, Hyderabad</p>
          <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-gradient text-4xl font-semibold leading-[1.08] sm:text-5xl">
            A neighbourhood where nothing is wasted.
          </motion.h1>
          <p className="mt-4 flex max-w-md items-start gap-1 text-base text-muted-foreground">
            <span>LoopLocal helps a colony run its water, power, waste and drains as one system.</span>
            <InfoTip label="Why this matters" side="bottom">
              <p className="mb-2 font-medium text-foreground">Why this matters</p>
              <ul className="list-disc space-y-1 pl-4">{WHY.map((w) => <li key={w}>{w}</li>)}</ul>
              <p className="mt-2">Sources and checking status are on the <Link to="/evidence" className="text-primary-glow underline underline-offset-2">Evidence</Link> page.</p>
            </InfoTip>
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild variant="hero" size="lg">
              <Link to="/command">Open Command <ArrowRight /></Link>
            </Button>
            <Button asChild variant="glass" size="lg" onClick={() => { setScenario("storm"); setRole("officer"); }}>
              <Link to="/storm"><CloudLightning /> Run a storm day</Link>
            </Button>
          </div>
          <dl className="mt-8 grid max-w-md grid-cols-3 gap-3">
            {[
              { k: "Loop Score", v: <AnimatedNumber value={sum.score} decimals={1} /> },
              { k: "Tankers avoided", v: <AnimatedNumber value={sum.tankersAvoided} decimals={1} /> },
              { k: "Water reused", v: <span className="tabular">{fmtL(sum.reuseL + sum.rechargeL)}</span> },
            ].map((s) => (
              <div key={s.k} className="glass rounded-xl px-3 py-2.5">
                <dt className="text-[11px] text-muted-foreground">{s.k}</dt>
                <dd className="font-display text-xl font-semibold">{s.v}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="relative aspect-square w-full max-w-[420px] justify-self-center">
          <HeroRing3D reduce={reduce} />
        </div>
      </section>

      <section aria-labelledby="loops-h">
        <h2 id="loops-h" className="mb-3 text-lg font-semibold">Five loops</h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {LOOPS.map((l) => (
            <li key={l.id} className="glass flex items-center gap-3 rounded-xl p-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg" style={{ background: `color-mix(in oklab, ${l.color} 14%, transparent)`, color: l.color }}>
                <l.icon className="size-4" aria-hidden />
              </span>
              <span className="min-w-0 flex-1 text-sm font-medium leading-tight">{l.name}</span>
              <InfoTip label={`About ${l.name}`}>
                <p className="mb-1 font-medium text-foreground">{l.from} → {l.to}</p>
                {l.why}
              </InfoTip>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="try-h">
        <h2 id="try-h" className="mb-3 text-lg font-semibold">Start here</h2>
        <ul className="grid gap-3 sm:grid-cols-3">
          {TRY.map((t) => (
            <li key={t.to}>
              <Link to={t.to} className="glass group flex items-center gap-3 rounded-xl p-4 transition-colors hover:bg-accent">
                <t.icon className="size-5 text-primary-glow" aria-hidden />
                <span className="flex-1">
                  <span className="block text-sm font-semibold">{t.title}</span>
                  <span className="block text-xs text-muted-foreground">{t.body}</span>
                </span>
                <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
