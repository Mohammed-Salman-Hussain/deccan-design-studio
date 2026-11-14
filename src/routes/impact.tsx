import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Area, Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BookOpen, Droplets, Flame, IndianRupee, Truck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/store/app";
import { fmtL, fmtRs, useLocality, useLocalitySummary } from "@/lib/hooks";
import { localityHourly } from "@/lib/sim/engine";
import { LOOPS } from "@/lib/sim/loops";
import { AnimatedNumber } from "@/components/ll/AnimatedNumber";
import { InfoTip, Meter, PageHeader, Panel, Stat } from "@/components/ll/primitives";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
    { n: 6, title: "Clean water and sanitation", bg: "var(--loop-rain)", fg: "#ffffff", stat: `${fmtL(sum.rechargeL + sum.reuseL)} recharged or reused` },
    { n: 7, title: "Affordable and clean energy", bg: "var(--brand-orange)", fg: "var(--primary-foreground)", stat: `${Math.round(sum.solarKWh).toLocaleString("en-IN")} kWh from solar` },
    { n: 9, title: "Industry, innovation and infrastructure", bg: "var(--brand-burgundy)", fg: "#ffffff", stat: `${loc.hubs.length} hubs coordinated by one engine` },
    { n: 11, title: "Sustainable cities and communities", bg: "var(--brand-yellow)", fg: "var(--primary-foreground)", stat: `${Math.round(sum.wasteDivertedKg).toLocaleString("en-IN")} kg wet waste kept out of drains` },
  ];

  return (
    <div className="mx-auto max-w-[1200px]">
      <PageHeader title="Impact" description="Totals so far today for every hub in the locality. Move the clock or change the scenario and every number and chart follows.">
        <Button variant="glass" size="sm" onClick={() => set({ assumptionsOpen: true })}><BookOpen /> Assumptions</Button>
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Loop Score" value={<AnimatedNumber value={sum.score} decimals={1} />} sub="of 100" color="var(--primary-glow)" hint="Average of the five loop scores, weighted by flats, plus a bonus for completed tasks." />
        <Stat label="Water recycled" value={<AnimatedNumber value={sum.rechargeL + sum.reuseL} format={fmtL} />} icon={Droplets} color="var(--loop-rain)" hint="Litres sent to recharge pits plus treated water reused." />
        <Stat label="Tankers avoided" value={<AnimatedNumber value={sum.tankersAvoided} decimals={1} />} icon={Truck} color="var(--loop-save)" hint="Counted in 5,000 L tanker trips." />
        <Stat label="Saved today" value={<AnimatedNumber value={sum.savingsRs} format={fmtRs} />} icon={IndianRupee} color="var(--loop-solar)" hint="Energy and tanker savings. Peak kWh shifted and wet waste to biogas are shown in the charts below." />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[320px_1fr]">
        <Panel title="Loop Score by loop" subtitle="Weighted across all hubs.">
          <ul className="space-y-3">
            {LOOPS.map((l) => (
              <li key={l.id}>
                <div className="mb-1 flex items-center justify-between text-sm"><span className="flex items-center gap-1.5"><l.icon className="size-3.5" style={{ color: l.color }} aria-hidden />{l.short}</span><span className="font-mono text-xs tabular">{Math.round(sum.scores[l.id])}</span></div>
                <Meter value={sum.scores[l.id]} color={l.color} label={`${l.short} score`} />
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Over the day" subtitle="Move the clock in the header to watch the charts fill.">
          <Tabs defaultValue="water">
            <TabsList>
              <TabsTrigger value="water"><Droplets className="mr-1 size-3.5" /> Water</TabsTrigger>
              <TabsTrigger value="energy"><Zap className="mr-1 size-3.5" /> Energy</TabsTrigger>
              <TabsTrigger value="waste"><Flame className="mr-1 size-3.5" /> Waste</TabsTrigger>
            </TabsList>
            <TabsContent value="water" className="mt-3">
              <p className="mb-2 flex items-center gap-1 text-xs text-muted-foreground">Litres recharged and reused each hour, with rain <InfoTip label="About this chart">Bars are litres sent to recharge pits or reused. The line is rainfall in mm per hour.</InfoTip></p>
              <div className="h-64" role="img" aria-label="Hourly litres recharged and reused with rainfall">
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
                    <Line yAxisId="r" type="monotone" dataKey="rain" name="Rain (mm/h)" stroke="var(--primary-glow)" dot={false} strokeWidth={1.5} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
            <TabsContent value="energy" className="mt-3">
              <p className="mb-2 flex items-center gap-1 text-xs text-muted-foreground">Solar output and grid draw, with and without LoopLocal <InfoTip label="About this chart">The gap between the dashed and solid lines is grid energy that LoopLocal avoids, mostly in the 6–10 am and 6–10 pm peaks. {Math.round(sum.kwhShifted)} kWh shifted so far today.</InfoTip></p>
              <div className="h-64" role="img" aria-label="Hourly solar output and grid draw with and without LoopLocal">
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
            </TabsContent>
            <TabsContent value="waste" className="mt-3">
              <p className="mb-2 flex items-center gap-1 text-xs text-muted-foreground">Wet waste generated and sent to biogas, by hub <InfoTip label="About this chart">{Math.round(sum.wasteDivertedKg).toLocaleString("en-IN")} kg has been kept out of drains so far today.</InfoTip></p>
              <div className="h-64" role="img" aria-label="Wet waste generated and diverted to biogas for each hub">
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
            </TabsContent>
          </Tabs>
        </Panel>
      </div>

      <section className="mt-4" aria-label="Sustainable Development Goals">
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {sdgs.map((g) => (
            <li key={g.n} className="glass flex items-center gap-3 rounded-xl p-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg font-display text-lg font-bold" style={{ background: g.bg, color: g.fg }} aria-hidden>{g.n}</span>
              <p className="min-w-0 flex-1 text-sm font-medium leading-tight">SDG {g.n}</p>
              <InfoTip label={`About SDG ${g.n}`}><p className="mb-1 font-medium text-foreground">{g.title}</p>{g.stat}</InfoTip>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
