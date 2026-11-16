import { createFileRoute, Link } from "@tanstack/react-router";

import { ArrowRight, CloudRain, Clock, Droplets, Gauge, ListChecks, Send, Zap } from "lucide-react";
import { toast } from "sonner";
import { HeroRing3D } from "@/components/ll/ClientCanvas";
import { Button } from "@/components/ui/button";
import { InfoTip, Meter, PageHeader, Panel } from "@/components/ll/primitives";
import { AnimatedNumber } from "@/components/ll/AnimatedNumber";
import { formatClock, weatherAt } from "@/lib/sim/engine";
import { LOOPS, LOOP_BY_ID } from "@/lib/sim/loops";
import { useApp } from "@/store/app";
import { useActionQueue, useLocality, useLocalitySummary } from "@/lib/hooks";

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
  const scenario = useApp((s) => s.scenario);
  const clock = useApp((s) => s.clock);
  const set = useApp((s) => s.set);
  const dispatch = useApp((s) => s.dispatch);
  const setScenario = useApp((s) => s.setScenario);
  const setRole = useApp((s) => s.setRole);
  const loc = useLocality();
  const sum = useLocalitySummary();
  const queue = useActionQueue();
  const w = weatherAt(scenario, clock / 60);
  const pending = queue.filter((q) => q.status === "pending").sort((a, b) => b.priority - a.priority);
  const next = pending.slice(0, 4);
  const hubs = [...sum.hubs].sort((a, b) => a.score - b.score);

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        title="Overview"
        description={
          <>
            LoopLocal runs a colony's water, power, waste and drains as one system.
            <span className="mt-2 block font-medium text-foreground">Why this matters</span>
            <ul className="mt-1 list-disc space-y-1 pl-4">{WHY.map((x) => <li key={x}>{x}</li>)}</ul>
          </>
        }
      >
        <div className="flex flex-wrap gap-2">
          <Readout icon={Clock} label="Time" value={formatClock(clock)} />
          <Readout icon={CloudRain} label="Weather" value={w.rainMm > 0.5 ? `Rain ${w.rainMm.toFixed(0)} mm/h` : `${w.temp.toFixed(0)} °C`} />
          <Readout icon={Zap} label="Grid" value={w.outage ? "Power cut" : "On"} danger={w.outage} />
        </div>
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-[320px_1fr_1fr]">
        <Panel title="Loop Score" icon={Gauge} subtitle="Flat-weighted mean of every hub's loop scores, plus a bonus for completed field tasks.">
          <div className="relative mx-auto aspect-square w-full max-w-[260px]">
            <HeroRing3D reduce={reduce} />
          </div>
          <p className="-mt-2 text-center font-display text-4xl font-semibold tabular text-primary-glow"><AnimatedNumber value={sum.score} decimals={1} /></p>
          <p className="mb-2 mt-1 text-center text-xs text-muted-foreground">{loc.name} · {loc.hubs.length} hubs</p>
        </Panel>

        <Panel
          title="Next actions"
          icon={ListChecks}
          action={<Button asChild size="sm" variant="ghost"><Link to="/command" onClick={() => setRole("officer")}>Open Command <ArrowRight /></Link></Button>}
          subtitle="Ranked by the decision engine across all five loops. Dispatch sends a task to the field crew's queue."
        >
          {next.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Nothing waiting. Every action has been sent.</p>
          ) : (
            <ul className="divide-y">
              {next.map((a) => (
                <li key={a.id} className="flex items-center gap-3 py-2.5">
                  <span className="w-1 self-stretch rounded-full" style={{ background: LOOP_BY_ID[a.loop].color }} aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{a.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{a.assignee} · by {a.deadline}</p>
                  </div>
                  <Button size="sm" variant="soft" onClick={() => { dispatch(a); toast.success("Dispatched", { description: `${a.title} → ${a.assignee}` }); }}><Send /> Dispatch</Button>
                </li>
              ))}
            </ul>
          )}
          {pending.length > next.length && <p className="mt-2 text-xs text-muted-foreground">{pending.length - next.length} more in Command.</p>}
        </Panel>

        <Panel title="Hubs" icon={Droplets} subtitle="Lowest Loop Score first. Tank level is the overhead tank right now. Open a hub to see its day in LoopHub.">
          <ul className="divide-y">
            {hubs.slice(0, 6).map((h) => (
              <li key={h.hub.id}>
                <Link to="/loophub" onClick={() => set({ hubId: h.hub.id })} className="flex items-center gap-3 py-2.5 hover:text-primary-glow">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{h.hub.name}</span>
                    <Meter value={h.now.tankPct} className="mt-1.5 h-1.5" color="var(--loop-rain)" label={`${h.hub.name} tank level`} />
                  </span>
                  <span className="w-10 text-right font-display text-lg font-semibold tabular">{Math.round(h.score)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <section aria-label="The five loops" className="mt-4">
        <ul className="flex flex-wrap items-center gap-2.5">
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
          <li className="ml-auto">
            <Button asChild size="sm" variant="glass">
              <Link to="/storm" onClick={() => { setScenario("storm"); setRole("officer"); }}>Run a storm day <ArrowRight /></Link>
            </Button>
          </li>
        </ul>
      </section>
    </div>
  );
}

function Readout({ icon: Icon, label, value, danger }: { icon: typeof Clock; label: string; value: string; danger?: boolean }) {
  return (
    <div className="flex min-w-[110px] items-center gap-2.5 rounded-lg border bg-card px-3 py-1.5">
      <Icon className="size-4 shrink-0" style={{ color: danger ? "var(--destructive)" : "var(--muted-foreground)" }} aria-hidden />
      <div className="leading-tight">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className={`font-mono text-sm font-medium tabular ${danger ? "text-destructive" : ""}`}>{value}</p>
      </div>
    </div>
  );
}
