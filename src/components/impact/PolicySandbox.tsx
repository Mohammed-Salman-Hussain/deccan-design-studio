import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Minus, RotateCcw, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Panel } from "@/components/ll/primitives";
import { useLocality } from "@/lib/hooks";
import { SCENARIOS } from "@/lib/sim/engine";
import { applyPolicy, evaluatePolicy, todayPolicy, type Policy, type PolicyResult } from "@/lib/sim/policy";
import type { Scenario } from "@/lib/sim/types";
import { cn } from "@/lib/utils";

const LEVERS: { key: keyof Policy; label: string; hint: string; suffix: string }[] = [
  { key: "pits", label: "Complexes with a recharge pit", hint: "Complexes without one get pits sized to their roof, largest roofs first.", suffix: "%" },
  { key: "greenWater", label: "Plants registered for Green Water", hint: "Treated sewage can be supplied by tanker once the plant is registered. Largest plants first.", suffix: "%" },
  { key: "solar", label: "Complexes with rooftop solar", hint: "New plants are sized at about 14 kWp per 1,000 m² of roof.", suffix: "%" },
  { key: "segregation", label: "Lowest wet-waste segregation", hint: "Raises every complex that is below this level up to it.", suffix: "%" },
];

const ORDINANCE: Policy = { pits: 100, greenWater: 100, solar: 100, segregation: 85 };

interface Metric {
  key: keyof PolicyResult;
  label: string;
  unit: string;
  digits: number;
  /** Which direction is an improvement. */
  better: "up" | "down";
}
const METRICS: Metric[] = [
  { key: "score", label: "Loop Score", unit: "", digits: 1, better: "up" },
  { key: "tankers", label: "Tankers avoided", unit: "", digits: 0, better: "up" },
  { key: "riskyDrains", label: "Drains at 70%+ risk at 8 pm", unit: "", digits: 0, better: "down" },
  { key: "streetKL", label: "Runoff reaching the street", unit: " kL", digits: 0, better: "down" },
  { key: "peakKW", label: "Peak grid draw", unit: " kW", digits: 0, better: "down" },
];

/** Pull four levers and see the whole locality's day change. Same simulation as everywhere else in the app. */
export function PolicySandbox() {
  const loc = useLocality();
  const today = useMemo(() => todayPolicy(loc), [loc]);
  const [policy, setPolicy] = useState<Policy>(today);
  const [scenario, setScenario] = useState<Scenario>("storm");

  const before = useMemo(() => evaluatePolicy(loc, scenario), [loc, scenario]);
  const applied = useMemo(() => applyPolicy(loc, policy), [loc, policy]);
  const after = useMemo(() => evaluatePolicy(applied.loc, scenario), [applied, scenario]);
  const changed = applied.changes.length > 0;
  const set = (k: keyof Policy, v: number) => setPolicy((p) => ({ ...p, [k]: v }));

  const gain = after.tankers - before.tankers;
  const runoffCut = before.streetKL - after.streetKL;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.15fr]">
      <Panel
        title="Policy levers"
        subtitle="Move a slider to the right to ask what would happen if more complexes did it. Each slider starts at where Kukatpally stands today."
        action={
          <div className="flex items-center gap-1.5">
            <Button size="sm" variant="soft" onClick={() => setPolicy(ORDINANCE)}><Wand2 /> Try an ordinance</Button>
            <Button size="sm" variant="ghost" onClick={() => setPolicy(today)} disabled={!changed}><RotateCcw /> Reset</Button>
          </div>
        }
      >
        <div className="space-y-5">
          {LEVERS.map((l) => (
            <div key={l.key}>
              <div className="flex items-baseline justify-between gap-2">
                <label htmlFor={`lever-${l.key}`} className="text-sm font-medium">{l.label}</label>
                <span className="font-mono text-sm tabular">
                  {policy[l.key]}{l.suffix}
                  {policy[l.key] > today[l.key] && <span className="ml-1.5 text-xs text-success">+{policy[l.key] - today[l.key]}</span>}
                </span>
              </div>
              <Slider
                id={`lever-${l.key}`}
                aria-label={l.label}
                className="mt-2"
                min={today[l.key]}
                max={100}
                step={1}
                value={[policy[l.key]]}
                onValueChange={([v]) => set(l.key, v)}
                disabled={today[l.key] >= 100}
              />
              <p className="mt-1.5 text-xs text-muted-foreground">Today {today[l.key]}{l.suffix}. {l.hint}</p>
            </div>
          ))}
        </div>
      </Panel>

      <Panel
        title="What changes"
        subtitle="The full day for every hub, today's setup against the one you chose."
        action={
          <Select value={scenario} onValueChange={(v) => setScenario(v as Scenario)}>
            <SelectTrigger aria-label="Test on" className="h-8 w-[150px] text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {SCENARIOS.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        }
      >
        <ul className="divide-y">
          {METRICS.map((m) => {
            const a = before[m.key];
            const b = after[m.key];
            const d = +(b - a).toFixed(m.digits);
            const good = d === 0 ? null : (d > 0) === (m.better === "up");
            const fmt = (v: number) => `${v.toLocaleString("en-IN", { maximumFractionDigits: m.digits, minimumFractionDigits: m.digits })}${m.unit}`;
            return (
              <li key={m.key} className="flex items-center gap-3 py-2.5">
                <span className="min-w-0 flex-1 text-sm">{m.label}</span>
                <span className="font-mono text-xs tabular text-muted-foreground">{fmt(a)}</span>
                <span aria-hidden className="text-muted-foreground">→</span>
                <span className="w-20 text-right font-display text-lg font-semibold tabular">{fmt(b)}</span>
                <span
                  className={cn("flex w-16 items-center justify-end gap-0.5 font-mono text-xs tabular", good === null ? "text-muted-foreground" : good ? "text-success" : "text-destructive")}
                  aria-label={good === null ? "No change" : `${good ? "Better" : "Worse"} by ${Math.abs(d)}`}
                >
                  {good === null ? <Minus className="size-3" /> : d > 0 ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
                  {good === null ? "none" : Math.abs(d).toLocaleString("en-IN", { maximumFractionDigits: m.digits })}
                </span>
              </li>
            );
          })}
        </ul>

        <p className="mt-3 rounded-lg bg-accent/60 p-3 text-sm leading-relaxed" role="status">
          {changed
            ? `${applied.changes.length} of ${loc.hubs.length} complexes change. ${gain >= 1 ? `That avoids about ${Math.round(gain)} more tanker trips a day` : "Tanker trips barely move"}${runoffCut >= 1 ? ` and keeps ${Math.round(runoffCut).toLocaleString("en-IN")} kL of rain off the street` : ""}${scenario === "normal" ? "" : ` on a ${SCENARIOS.find((s) => s.id === scenario)?.label.toLowerCase()}`}. ${Math.abs(after.peakKW - before.peakKW) < 3 ? "The evening grid peak hardly moves, because rooftop solar produces little after 6 pm." : ""}`
            : "Nothing changes yet. Drag a slider to the right, or try an ordinance that sets all four to a high level."}
        </p>

        {changed && (
          <Accordion type="single" collapsible className="mt-2">
            <AccordionItem value="hubs" className="border-b-0">
              <AccordionTrigger className="py-2 text-sm hover:no-underline">Which complexes change</AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-1.5 text-xs">
                  {applied.changes.map((c) => (
                    <li key={c.id}>
                      <span className="font-medium">{c.name}</span>
                      <span className="text-muted-foreground"> · {c.what.join(", ")}</span>
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
        <p className="mt-2 text-[11px] text-muted-foreground">Illustrative. Costs and approval timelines are not modelled.</p>
      </Panel>
    </div>
  );
}
