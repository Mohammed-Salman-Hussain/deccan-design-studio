import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Area, Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BookOpen, Droplets, Flame, IndianRupee, Truck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/store/app";
import { fmtL, fmtRs, useLocality, useLocalitySummary } from "@/lib/hooks";
import { localityHourly } from "@/lib/sim/engine";
import { LOOPS } from "@/lib/sim/loops";
import { ASSUMPTIONS } from "@/components/shell/AssumptionsSheet";
import { AnimatedNumber } from "@/components/ll/AnimatedNumber";
import { LoopRing } from "@/components/ll/LoopRing";
import { Meter, PageHeader, Panel, Stat } from "@/components/ll/primitives";

export const Route = createFileRoute("/impact")({
  head: () => ({
    meta: [
      { title: "Impact — LoopLocal" },
      { name: "description", content: "Water, energy and waste outcomes for a Hyderabad locality, with the Loop Score broken down by loop and mapped to SDGs 6, 7, 9 and 11." },
      { property: "og:title", content: "Impact — LoopLocal" },
      { property: "og:description", content: "Animated water, energy and waste impact with every assumption shown." },
    ],
  }),
  component: ImpactPage,
});

const tip = { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 };
const axis = { fontSize: 10, fill: "var(--muted-foreground)" };

function ImpactPage() {
  const loc = useLocality();
  const sum = useLocalitySummary();
  const scenario = useApp((s) => s.scenario);
  const set = useApp((s) => s.set);
  const hourly = useMemo(() => localityHourly(loc, scenario), [loc, scenario]);
  const hubBars = useMemo(() => sum.hubs.map((h) => ({ name: h.hub.name.length > 16 ? `${h.hub.name.slice(0, 15)}…` : h.hub.name, diverted: Math.round(h.wasteDivertedKg), generated: Math.round(h.wasteGeneratedKg) })), [sum]);

  const sdgs = [
    { n: 6, title: "Clean water and sanitation", color: "#26bde2", stat: `${fmtL(sum.rechargeL + sum.reuseL)} recharged or reused` },
    { n: 7, title: "Affordable and clean energy", color: "#fcc30b", stat: `${Math.round(sum.solarKWh).toLocaleString("en-IN")} kWh from solar` },
    { n: 9, title: "Industry, innovation and infrastructure", color: "#fd6925", stat: `${loc.hubs.length} hubs coordinated by one engine` },
    { n: 11, title: "Sustainable cities and communities", color: "#fd9d24", stat: `${Math.round(sum.wasteDivertedKg).toLocaleString("en-IN")} kg wet waste kept out of drains` },
  ];

  return (
    <div className="mx-auto max-w-[1500px]">
      <PageHeader eyebrow={`Impact · ${loc.name}`} title="What closing the loops adds up to" description="Totals so far today for every hub in the locality. Move the clock or change the scenario and every number and chart follows.">
        <Button variant="glass" onClick={() => set({ assumptionsOpen: true })}><BookOpen /> Assumptions</Button>
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Stat label="Loop Score" value={<AnimatedNumber value={sum.score} decimals={1} />} sub="of 100" color="var(--primary-glow)" hint="Average of the five loop scores, weighted by flats, plus a bonus for completed tasks (up to 15 points)." />
        <Stat label="Water recycled" value={<AnimatedNumber value={sum.rechargeL + sum.reuseL} format={fmtL} />} sub="recharge + reuse" icon={Droplets} color="var(--loop-reuse)" />
        <Stat label="Tankers avoided" value={<AnimatedNumber value={sum.tankersAvoided} decimals={1} />} sub="5,000 L each" icon={Truck} color="var(--loop-save)" />
        <Stat label="Peak kWh shifted" value={<AnimatedNumber value={sum.kwhShifted} decimals={0} />} sub="out of 6–10 am / 6–10 pm" icon={Zap} color="var(--loop-solar)" />
        <Stat label="Wet waste to biogas" value={<AnimatedNumber value={sum.wasteDivertedKg} decimals={0} suffix=" kg" />} sub="kept out of drains" icon={Flame} color="var(--loop-waste)" />
        <Stat label="Saved today" value={<AnimatedNumber value={sum.savingsRs} format={fmtRs} />} sub="energy + tankers" icon={IndianRupee} color="var(--loop-save)" hint="kWh shifted × (tariff + peak surcharge) + solar kWh × tariff + tankers avoided × ₹1,000." />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[360px_1fr]">
        <Panel title="Loop Score by loop" subtitle="Weighted across all hubs">
          <div className="flex justify-center py-1">
            <LoopRing size={190} stroke={15} scores={sum.scores}>
              <div className="text-center"><p className="font-display text-4xl font-semibold text-primary-glow"><AnimatedNumber value={sum.score} decimals={1} /></p><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Loop Score</p></div>
            </LoopRing>
          </div>
          <ul className="mt-3 space-y-2.5">
            {LOOPS.map((l) => (
              <li key={l.id}>
                <div className="mb-1 flex items-center justify-between text-xs"><span className="flex items-center gap-1.5"><l.icon className="size-3.5" style={{ color: l.color }} aria-hidden />{l.short}</span><span className="font-semibold tabular">{sum.scores[l.id].toFixed(0)}</span></div>
                <Meter value={sum.scores[l.id]} color={l.color} label={`${l.short} score`} />
              </li>
            ))}
          </ul>
        </Panel>

        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title="Water" subtitle="Litres recharged and reused each hour, with rain" icon={Droplets}>
            <div className="h-56" role="img" aria-label="Hourly litres recharged and reused with rainfall">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={hourly} margin={{ top: 6, right: 4, bottom: 0, left: -8 }}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="hour" tick={axis} interval={3} />
                  <YAxis yAxisId="l" tick={axis} tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))} />
                  <YAxis yAxisId="r" orientation="right" tick={axis} unit="mm" />
                  <Tooltip contentStyle={tip} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar yAxisId="l" stackId="w" dataKey="recharge" name="Recharged (L)" fill="var(--loop-rain)" />
                  <Bar yAxisId="l" stackId="w" dataKey="reuse" name="Reused (L)" fill="var(--loop-reuse)" />
                  <Line yAxisId="r" type="monotone" dataKey="rain" name="Rain (mm/h)" stroke="var(--cream)" dot={false} strokeWidth={1.5} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Panel>
          <Panel title="Energy" subtitle="Solar output and grid draw, with and without" icon={Zap}>
            <div className="h-56" role="img" aria-label="Hourly solar output and grid draw with and without LoopLocal">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={hourly} margin={{ top: 6, right: 4, bottom: 0, left: -12 }}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="hour" tick={axis} interval={3} />
                  <YAxis tick={axis} unit=" kW" />
                  <Tooltip contentStyle={tip} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="solar" name="Solar (kW)" stroke="var(--loop-solar)" fill="var(--loop-solar)" fillOpacity={0.25} />
                  <Line type="monotone" dataKey="gridBase" name="Grid without" stroke="var(--muted-foreground)" strokeDasharray="4 3" dot={false} />
                  <Line type="monotone" dataKey="grid" name="Grid with" stroke="var(--primary-glow)" dot={false} strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Panel>
          <Panel title="Waste" subtitle="Wet waste generated vs diverted to biogas, by hub" icon={Flame} className="lg:col-span-2">
            <div className="h-56" role="img" aria-label="Wet waste generated and diverted to biogas for each hub">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={hubBars} margin={{ top: 6, right: 4, bottom: 0, left: -12 }}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={axis} interval={0} />
                  <YAxis tick={axis} unit=" kg" />
                  <Tooltip contentStyle={tip} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="generated" name="Generated so far (kg)" fill="var(--muted-foreground)" fillOpacity={0.35} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="diverted" name="To biogas (kg)" fill="var(--loop-waste)" radius={[4, 4, 0, 0]} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
      </div>

      <section className="mt-4" aria-label="Sustainable Development Goals">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {sdgs.map((g) => (
            <div key={g.n} className="glass flex items-center gap-3 rounded-xl p-3">
              <span className="grid size-12 shrink-0 place-items-center rounded-lg font-display text-xl font-bold text-black/80" style={{ background: g.color }} aria-hidden>{g.n}</span>
              <div className="min-w-0"><p className="text-xs font-semibold">SDG {g.n} · {g.title}</p><p className="mt-0.5 text-xs text-muted-foreground">{g.stat}</p></div>
            </div>
          ))}
        </div>
      </section>

      <Panel title="Assumptions behind every number" subtitle="Simple, transparent rules. Change a hub's inputs and the results follow." icon={BookOpen} className="mt-4" action={<Button size="sm" variant="soft" onClick={() => set({ assumptionsOpen: true })}>Open full drawer</Button>}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {ASSUMPTIONS.map((g) => (
            <div key={g.group}>
              <h4 className="mb-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-primary-glow">{g.group}</h4>
              <dl className="space-y-2">
                {g.items.map((i) => (<div key={i.k} className="text-xs"><dt className="font-medium">{i.k}</dt><dd className="font-mono text-[11px] text-muted-foreground">{i.v}</dd></div>))}
              </dl>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
