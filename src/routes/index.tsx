import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, CloudLightning, MapPinned, Radio, LineChart, Brain, Send, Gauge, Sun, Flame, Droplet, Waves, Factory, Share2, PlayCircle, Zap, Truck, Droplets } from "lucide-react";
import { HeroRing3D } from "@/components/ll/ClientCanvas";
import { Button } from "@/components/ui/button";
import { LOOPS } from "@/lib/sim/loops";
import { useApp } from "@/store/app";
import { AnimatedNumber } from "@/components/ll/AnimatedNumber";
import { useLocality, useLocalitySummary, fmtL } from "@/lib/hooks";
import { LoopRing } from "@/components/ll/LoopRing";

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

const fade = { initial: { opacity: 0, y: 18 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: "-60px" }, transition: { duration: 0.6, ease: [0.2, 0.7, 0.2, 1] as const } };

const WEEK = [
  { icon: Zap, k: "5–6 hrs", t: "Power cut across 20+ colonies after one rain and wind spell", c: "var(--loop-solar)" },
  { icon: Droplet, k: "Pumps trip", t: "No power, no pumping — supply stops across KPHB and Kukatpally", c: "var(--loop-reuse)" },
  { icon: Waves, k: "7 m → 2 m", t: "The IDL nala narrowed by encroachment; clogged nalas flood streets", c: "var(--loop-rain)" },
  { icon: Truck, k: "+185%", t: "Months later, tanker bookings in Kukatpally jump year on year", c: "var(--loop-save)" },
  { icon: CloudLightning, k: "0.95%", t: "Only this much of Hyderabad's rain soaks into the ground", c: "var(--loop-waste)" },
];

const CORE = [
  { icon: MapPinned, t: "Map", d: "Drains, lakes, pumps, tanks, rooftops, waste routes, STPs" },
  { icon: Radio, t: "Signals", d: "Forecasts, complaints, outage notices, tanker bookings, satellite" },
  { icon: LineChart, t: "Forecasts", d: "Rain impact, solar output, waste volume, evening load" },
  { icon: Brain, t: "Decide", d: "Ranks the best actions across all loops at once" },
  { icon: Send, t: "Dispatch", d: "Right person, place, reason and deadline" },
  { icon: Gauge, t: "Loop Score", d: "One number for how much the locality recycles and saves" },
];

const HUB = [
  { icon: Sun, t: "Solar roof", d: "Pumps, lifts and corridor lights", c: "var(--loop-solar)" },
  { icon: Flame, t: "Biogas unit", d: "Wet waste in, gas and backup power out", c: "var(--loop-waste)" },
  { icon: Droplet, t: "Pumps & tanks", d: "A tank is a battery you fill when power is free", c: "var(--loop-reuse)" },
  { icon: Waves, t: "Recharge pit", d: "Storm runoff goes into the ground, not the street", c: "var(--loop-rain)" },
  { icon: Factory, t: "Sewage plant", d: "Treated water becomes a resource", c: "var(--loop-save)" },
  { icon: Share2, t: "Share surplus", d: "Extra biogas or treated water serves a neighbour", c: "var(--primary-glow)" },
];

function Landing() {
  const reduce = useApp((s) => s.reduceMotion);
  const setScenario = useApp((s) => s.setScenario);
  const setRole = useApp((s) => s.setRole);
  const sum = useLocalitySummary();
  const loc = useLocality();

  return (
    <div className="mx-auto max-w-7xl space-y-24 pb-10">
      {/* HERO */}
      <section className="relative grid items-center gap-8 lg:grid-cols-[1.05fr_1fr]">
        <div className="relative z-10">
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-5 inline-flex items-center gap-2 rounded-full border bg-muted/40 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-primary-glow">
            <span className="relative flex size-2"><span className="absolute inset-0 animate-ping rounded-full bg-success opacity-60" /><span className="relative size-2 rounded-full bg-success" /></span>
            Live · {loc.name}, Hyderabad
          </motion.p>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="text-gradient text-4xl font-semibold leading-[1.05] sm:text-5xl xl:text-[4.2rem]">
            A neighbourhood where nothing is wasted.
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }} className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
            LoopLocal is the brain that makes a colony's water, power, waste and drains help each other. Waste becomes power, power moves water, saved water saves power, and used water gets reused.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }} className="mt-8 flex flex-wrap gap-3">
            <Button asChild variant="hero" size="xl">
              <Link to="/command">Open Command <ArrowRight /></Link>
            </Button>
            <Button asChild variant="glass" size="xl" onClick={() => { setScenario("storm"); setRole("officer"); }}>
              <Link to="/storm"><CloudLightning /> Run a storm day</Link>
            </Button>
          </motion.div>
          <motion.dl initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mt-10 grid max-w-lg grid-cols-3 gap-3">
            {[
              { k: "Loop Score", v: <AnimatedNumber value={sum.score} decimals={1} /> },
              { k: "Tankers avoided today", v: <AnimatedNumber value={sum.tankersAvoided} decimals={1} /> },
              { k: "Reused & recharged", v: <span className="tabular">{fmtL(sum.reuseL + sum.rechargeL)}</span> },
            ].map((s) => (
              <div key={s.k} className="glass rounded-xl px-3 py-2.5">
                <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.k}</dt>
                <dd className="font-display text-xl font-semibold">{s.v}</dd>
              </div>
            ))}
          </motion.dl>
        </div>
        <div className="relative aspect-square w-full max-w-[640px] justify-self-center">
          <div className="absolute inset-[12%] rounded-full bg-primary/10 blur-3xl" />
          <HeroRing3D reduce={reduce} />
        </div>
      </section>

      {/* ONE BAD WEEK */}
      <section>
        <motion.div {...fade} className="mb-8 max-w-2xl">
          <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.2em] text-primary-glow">The problem</p>
          <h2 className="text-3xl font-semibold md:text-4xl">One colony, one bad week.</h2>
          <p className="mt-3 text-muted-foreground">Take Kukatpally in a heavy rain. Each department fixes one link of the chain — and nobody manages the whole loop.</p>
        </motion.div>
        <div className="relative grid gap-4 md:grid-cols-5">
          <div className="absolute left-0 right-0 top-9 hidden h-px bg-gradient-to-r from-transparent via-border to-transparent md:block" />
          {WEEK.map((w, i) => (
            <motion.article key={w.k} {...fade} transition={{ ...fade.transition, delay: i * 0.08 }} className="glass glow-border relative rounded-2xl p-5">
              <div className="mb-4 grid size-10 place-items-center rounded-xl" style={{ background: `color-mix(in oklab, ${w.c} 18%, transparent)`, color: w.c }}>
                <w.icon className="size-5" aria-hidden />
              </div>
              <p className="font-display text-2xl font-semibold" style={{ color: w.c }}>{w.k}</p>
              <p className="mt-2 text-sm text-muted-foreground">{w.t}</p>
            </motion.article>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">Sources and verification status are listed on the <Link to="/evidence" className="text-primary-glow underline-offset-4 hover:underline">Evidence</Link> page.</p>
      </section>

      {/* FIVE LOOPS */}
      <section className="grid items-center gap-10 lg:grid-cols-[360px_1fr]">
        <motion.div {...fade} className="flex flex-col items-center text-center lg:items-start lg:text-left">
          <LoopRing size={220} stroke={16} scores={sum.scores}>
            <div className="text-center">
              <p className="font-display text-4xl font-semibold"><AnimatedNumber value={sum.score} /></p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Loop Score</p>
            </div>
          </LoopRing>
          <h2 className="mt-8 text-3xl font-semibold">Close the loops.</h2>
          <p className="mt-3 text-muted-foreground">Think of a kitchen garden: scraps become compost, compost grows food, and rain fills the can. LoopLocal does the same for a locality.</p>
        </motion.div>
        <div className="grid gap-4 sm:grid-cols-2">
          {LOOPS.map((l, i) => (
            <motion.div key={l.id} {...fade} transition={{ ...fade.transition, delay: i * 0.06 }} className={`glass glow-border group relative overflow-hidden rounded-2xl p-5 ${i === 4 ? "sm:col-span-2" : ""}`}>
              <div className="absolute -right-10 -top-10 size-32 rounded-full opacity-25 blur-2xl transition-opacity group-hover:opacity-50" style={{ background: l.color }} />
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl" style={{ background: `color-mix(in oklab, ${l.color} 18%, transparent)`, color: l.color }}>
                  <l.icon className="size-5" aria-hidden />
                </span>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Loop {i + 1}</p>
                  <h3 className="font-semibold">{l.name}</h3>
                </div>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{l.why}</p>
              <div className="mt-4 flex items-center gap-2 text-xs">
                <span className="rounded-md bg-muted px-2 py-1">{l.from}</span>
                <ArrowRight className="size-3.5" style={{ color: l.color }} />
                <span className="rounded-md bg-muted px-2 py-1">{l.to}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* THE CORE */}
      <section>
        <motion.div {...fade} className="mb-8 max-w-2xl">
          <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.2em] text-primary-glow">The Core</p>
          <h2 className="text-3xl font-semibold md:text-4xl">One engine for the whole locality.</h2>
        </motion.div>
        <div className="relative grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <svg className="pointer-events-none absolute left-0 top-10 hidden h-4 w-full lg:block" preserveAspectRatio="none" viewBox="0 0 100 4" aria-hidden>
            <line x1="4" y1="2" x2="96" y2="2" stroke="var(--primary-glow)" strokeWidth="0.4" strokeDasharray="1.5 1.5" className="animate-flow-slow" vectorEffect="non-scaling-stroke" />
          </svg>
          {CORE.map((c, i) => (
            <motion.div key={c.t} {...fade} transition={{ ...fade.transition, delay: i * 0.07 }} className="glass relative rounded-2xl p-4">
              <div className="mb-3 grid size-10 place-items-center rounded-full border bg-background/60 text-primary-glow">
                <c.icon className="size-4" aria-hidden />
              </div>
              <p className="font-mono text-[10px] text-muted-foreground">0{i + 1}</p>
              <h3 className="font-semibold">{c.t}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{c.d}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* THE HUB */}
      <section className="glass glow-border overflow-hidden rounded-3xl">
        <div className="grid gap-8 p-6 md:p-10 lg:grid-cols-[1fr_1.2fr]">
          <motion.div {...fade}>
            <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.2em] text-primary-glow">The Loop Hub</p>
            <h2 className="text-3xl font-semibold md:text-4xl">Where decisions happen.</h2>
            <p className="mt-3 text-muted-foreground">A Loop Hub is one apartment complex or colony block set up to handle part of its own power, water and waste — with the Core as its brain. It starts with one or two parts and adds more. The municipal view is all hubs added together.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild variant="soft"><Link to="/hub-twin">Explore the Hub Twin <ArrowRight /></Link></Button>
              <Button asChild variant="ghost"><Link to="/hardware">See it in 3D</Link></Button>
            </div>
          </motion.div>
          <div className="grid gap-3 sm:grid-cols-2">
            {HUB.map((h, i) => (
              <motion.div key={h.t} {...fade} transition={{ ...fade.transition, delay: i * 0.05 }} className="flex gap-3 rounded-2xl border bg-background/30 p-4">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg" style={{ background: `color-mix(in oklab, ${h.c} 16%, transparent)`, color: h.c }}><h.icon className="size-4" aria-hidden /></span>
                <div>
                  <p className="text-sm font-semibold">{h.t}</p>
                  <p className="text-xs text-muted-foreground">{h.d}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* DEMO PATH */}
      <section>
        <motion.div {...fade} className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.2em] text-primary-glow">Two-minute walkthrough</p>
            <h2 className="text-3xl font-semibold md:text-4xl">See one storm, end to end.</h2>
          </div>
          <Button asChild variant="hero" size="lg"><Link to="/storm"><PlayCircle /> Start the storm day</Link></Button>
        </motion.div>
        <ol className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
          {[
            { t: "Command · Officer", d: "Switch to Storm day", to: "/command" },
            { t: "Run Storm Day", d: "Watch actions dispatch", to: "/storm" },
            { t: "Field Worker", d: "Complete a task with proof", to: "/command" },
            { t: "Resident", d: "Tank carries the outage", to: "/command" },
            { t: "Impact", d: "Loop Score moves", to: "/impact" },
            { t: "Hardware", d: "How sensors plug in", to: "/hardware" },
          ].map((s, i) => (
            <motion.li key={s.t} {...fade} transition={{ ...fade.transition, delay: i * 0.05 }}>
              <Link to={s.to} className="glass group flex h-full flex-col rounded-2xl p-4 transition hover:-translate-y-0.5 hover:shadow-glow">
                <span className="font-mono text-xs text-primary-glow">0{i + 1}</span>
                <span className="mt-2 text-sm font-semibold">{s.t}</span>
                <span className="text-xs text-muted-foreground">{s.d}</span>
                <ArrowRight className="mt-auto size-4 self-end pt-1 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary-glow" />
              </Link>
            </motion.li>
          ))}
        </ol>
        <div className="mt-10 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Droplets className="size-3.5" /> SDG 6 · 7 · 9 · 11 — clean water, clean energy, resilient infrastructure, sustainable cities
        </div>
      </section>
    </div>
  );
}
