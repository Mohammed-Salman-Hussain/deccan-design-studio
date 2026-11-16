import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useState } from "react";
import { Sun, CloudRain, Zap, Gauge, Building2, Network } from "lucide-react";
import { LoopsGraph } from "@/components/loops/LoopsGraph";
import { Button } from "@/components/ui/button";
import { useApp } from "@/store/app";
import { fmtL, useHub, useHubSummary, useStepClock } from "@/lib/hooks";
import { formatClock, simulateHubDay, STEPS, STEP_MIN, weatherAt } from "@/lib/sim/engine";
import type { HubPoint } from "@/lib/sim/engine";
import type { Scenario } from "@/lib/sim/types";
import { PageHeader, Panel, Stat } from "@/components/ll/primitives";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/loophub")({
  head: () => ({
    meta: [
      { title: "LoopHub — LoopLocal" },
      { name: "description", content: "A cross-section of one apartment complex: solar roof, kitchens, biogas, pumps, tanks, STP and recharge pit, animated through a day in its life." },
      { property: "og:title", content: "LoopHub — LoopLocal" },
      { property: "og:description", content: "Watch one Loop Hub run a day, with and without LoopLocal." },
    ],
  }),
  component: HubTwinPage,
});

interface Phase {
  id: string;
  label: string;
  clock: number;
  scenario: Scenario;
  text: string;
}

const PHASES: Phase[] = [
  { id: "morning", label: "Morning waste", clock: 480, scenario: "storm", text: "Kitchens produce wet waste. The Core routes it to the biogas unit and keeps it out of the drains." },
  { id: "midday", label: "Midday solar pumping", clock: 750, scenario: "storm", text: "Strong sun: pumps and STP blowers run on the roof, and the overhead tank fills for free." },
  { id: "afternoon", label: "Pre-storm top-up", clock: 960, scenario: "storm", text: "The forecast shows a storm and the discom has announced a cut for this section. Tanks top up early." },
  { id: "night", label: "Storm night", clock: 1260, scenario: "storm", text: "Runoff goes into the recharge pit instead of the street. The tank carries the building through the outage." },
  { id: "next", label: "Next-day booking", clock: 600, scenario: "normal", text: "Surplus treated water is booked by a nearby construction site through a Green Water Tanker, and the Loop Score updates." },
];

const cum = (pts: HubPoint[], idx: number, f: (p: HubPoint) => number) => {
  let a = 0;
  for (let i = 0; i <= idx; i++) a += f(pts[i]);
  return a;
};

function HubTwinPage() {
  const hub = useHub();
  const sum = useHubSummary();
  const scenario = useApp((s) => s.scenario);
  const clockRaw = useApp((s) => s.clock);
  const clock = useStepClock();
  const set = useApp((s) => s.set);
  const setScenario = useApp((s) => s.setScenario);
  const [withLoop, setWithLoop] = useState(true);
  const [view, setView] = useState<"hub" | "loops">("hub");

  const idx = Math.min(STEPS, Math.floor(clock / STEP_MIN));
  const loopPts = useMemo(() => simulateHubDay(hub, scenario, true), [hub, scenario]);
  const basePts = useMemo(() => simulateHubDay(hub, scenario, false), [hub, scenario]);
  const pts = withLoop ? loopPts : basePts;
  const p = pts[idx];
  const w = weatherAt(scenario, clock / 60);
  const night = clock < 330 || clock > 1110;

  const activePhase = PHASES.reduce((best, ph) => (Math.abs(ph.clock - clock) < Math.abs(best.clock - clock) ? ph : best), PHASES[0]);

  const goPhase = (ph: Phase) => {
    if (scenario !== ph.scenario) setScenario(ph.scenario);
    set({ clock: ph.clock, playing: false });
  };

  const compare = useMemo(() => {
    const reuseLoop = cum(loopPts, idx, (x) => x.reuseL + x.pitTopupL + x.surplusL);
    const reuseBase = cum(basePts, idx, (x) => x.reuseL);
    const treated = cum(loopPts, idx, (x) => x.treatedL);
    return { reuseLoop, reuseBase, treated };
  }, [loopPts, basePts, idx]);

  const fillH = 46 * (p.tankPct / 100);
  const panelGlow = hub.solarKwp > 0 ? Math.min(1, p.solarKW / hub.solarKwp) : 0;
  const windowsLit = !p.outage;
  const rainOn = p.rainMm > 1;

  const rows: { label: string; with: string; without: string; better: boolean }[] = [
    { label: "Runoff reaching the street", with: fmtL(sum.streetL), without: fmtL(sum.streetBaseL), better: sum.streetL <= sum.streetBaseL },
    { label: "Water shortage", with: fmtL(sum.shortageL), without: fmtL(sum.shortageBaseL), better: sum.shortageL <= sum.shortageBaseL },
    { label: "Outage hours with water on tap", with: `${sum.outageCoveredHours.toFixed(1)} of ${sum.outageHours.toFixed(1)} h`, without: `${sum.outageCoveredBaseHours.toFixed(1)} of ${sum.outageHours.toFixed(1)} h`, better: sum.outageCoveredHours >= sum.outageCoveredBaseHours },
    { label: "Peak-hour grid energy", with: `${sum.peakKWhLoop.toFixed(0)} kWh`, without: `${sum.peakKWhBase.toFixed(0)} kWh`, better: sum.peakKWhLoop <= sum.peakKWhBase },
    { label: "Treated water put to use", with: fmtL(compare.reuseLoop), without: fmtL(compare.reuseBase), better: compare.reuseLoop >= compare.reuseBase },
  ];

  return (
    <div className="mx-auto max-w-[1500px]">
      <PageHeader
        title="LoopHub"
        description={view === "hub" ? `A day in the life of ${hub.name} (${hub.flats} flats). Drag the timeline or jump to a moment. Flows, tank level and the outage state update with the hub's own numbers.` : "How waste, sun, rain, used water and saved water feed each other across the locality. Switch back to Hub for one building's day."}
      >
        <div className="inline-flex rounded-lg border p-0.5" role="group" aria-label="Choose a view">
          <Button size="sm" variant={view === "hub" ? "soft" : "ghost"} aria-pressed={view === "hub"} onClick={() => setView("hub")}><Building2 /> Hub</Button>
          <Button size="sm" variant={view === "loops" ? "soft" : "ghost"} aria-pressed={view === "loops"} onClick={() => setView("loops")}><Network /> Loops</Button>
        </div>
        {view === "hub" && (
          <div className="inline-flex rounded-lg border p-0.5" role="group" aria-label="Compare with and without LoopLocal">
            <Button size="sm" variant={withLoop ? "soft" : "ghost"} aria-pressed={withLoop} onClick={() => setWithLoop(true)}>With LoopLocal</Button>
            <Button size="sm" variant={!withLoop ? "soft" : "ghost"} aria-pressed={!withLoop} onClick={() => setWithLoop(false)}>Without</Button>
          </div>
        )}
      </PageHeader>

      {view === "loops" ? (
        <LoopsGraph />
      ) : (
      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <Panel bodyClass="p-2">
          <div className="relative overflow-hidden rounded-xl">
            <svg viewBox="0 0 960 545" className="h-auto w-full" role="img" aria-label={`Cross-section of ${hub.name} at ${formatClock(clock)}. Tank ${Math.round(p.tankPct)} percent. ${p.outage ? "Grid outage in progress." : "Grid supply on."}`}>
              <defs>
                <linearGradient id="twin-sky" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={night ? "var(--scene-sky-night)" : w.cloud > 0.6 ? "var(--scene-sky-cloud)" : "var(--scene-sky-day)"} />
                  <stop offset="100%" stopColor="var(--background)" />
                </linearGradient>
                <linearGradient id="twin-water" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--loop-reuse)" />
                  <stop offset="100%" stopColor="var(--loop-rain)" />
                </linearGradient>
              </defs>
              <rect width="960" height="440" fill="url(#twin-sky)" />
              {!night && <circle cx="110" cy="70" r={26} fill="var(--loop-solar)" opacity={Math.max(0.15, 1 - w.cloud)} />}
              {night && <circle cx="110" cy="70" r={16} fill="var(--cream)" opacity={0.7} />}
              {w.cloud > 0.4 && (
                <g fill="var(--scene-cloud)" opacity={Math.min(0.95, w.cloud)}>
                  <ellipse cx="180" cy="60" rx="52" ry="16" /><ellipse cx="220" cy="48" rx="40" ry="14" /><ellipse cx="740" cy="52" rx="60" ry="17" /><ellipse cx="790" cy="42" rx="40" ry="13" />
                </g>
              )}
              {rainOn && (
                <g stroke="var(--loop-rain)" strokeWidth="1.5" opacity="0.7" className="animate-rain">
                  {Array.from({ length: 34 }, (_, i) => (
                    <line key={i} x1={300 + i * 12} y1={-10 + ((i * 37) % 60)} x2={296 + i * 12} y2={10 + ((i * 37) % 60)} />
                  ))}
                </g>
              )}
              {/* ground */}
              <rect y="440" width="960" height="105" fill="var(--scene-ground)" />
              <rect y="438" width="960" height="4" fill="var(--loop-waste)" opacity="0.35" />

              {/* building */}
              <rect x="340" y="130" width="280" height="310" rx="4" fill="var(--surface-2)" stroke="var(--border)" />
              <rect x="330" y="122" width="300" height="9" rx="2" fill="var(--muted)" />
              {Array.from({ length: 5 }, (_, f) =>
                Array.from({ length: 4 }, (_, c) => (
                  <rect key={`${f}-${c}`} x={362 + c * 62} y={142 + f * 58} width={38} height={34} rx={3} fill={windowsLit ? (((f * 3 + c * 5) % 7) > 1 ? "var(--scene-window-lit)" : "var(--scene-window)") : "var(--scene-window-off)"} opacity={windowsLit ? 0.9 : 0.7} />
                )),
              )}
              {/* kitchens band */}
              <rect x="340" y="258" width="150" height="54" fill="var(--loop-waste)" opacity="0.14" />
              <text x="350" y="302" fontSize="10" fill="var(--loop-waste)" fontWeight="600">Kitchens</text>

              {/* solar panels */}
              {Array.from({ length: 5 }, (_, i) => (
                <rect key={i} x={370 + i * 38} y={105} width={34} height={14} rx={2} transform={`skewX(-18) translate(${(105 * Math.tan((18 * Math.PI) / 180))} 0)`} fill="var(--loop-solar)" opacity={0.25 + 0.75 * panelGlow} stroke="var(--loop-solar)" />
              ))}
              {hub.solarKwp === 0 && <text x="372" y="98" fontSize="9" fill="var(--muted-foreground)">No solar roof yet</text>}

              {/* overhead tank */}
              <rect x="560" y="70" width="50" height="52" rx="6" fill="var(--surface)" stroke="var(--loop-reuse)" strokeWidth="1.5" />
              <rect x="562" y={120 - fillH} width="46" height={fillH} rx="4" fill="url(#twin-water)" style={{ transition: "all .6s" }} />
              <text x="585" y="62" fontSize="10" textAnchor="middle" fill="var(--loop-reuse)" fontWeight="600">{Math.round(p.tankPct)}%</text>

              {/* pump room, sump, pit, biogas, garden, stp */}
              <rect x="230" y="380" width="110" height="60" rx="4" fill="var(--surface-2)" stroke={p.pumpOn ? "var(--loop-solar)" : "var(--border)"} />
              <text x="285" y="406" fontSize="10" textAnchor="middle" fill="var(--foreground)" fontWeight="600">Pump room</text>
              <text x="285" y="422" fontSize="9" textAnchor="middle" fill={p.pumpOn ? "var(--loop-solar)" : "var(--muted-foreground)"}>{p.pumpOn ? `ON · ${p.pumpSource}` : "standby"}</text>
              <rect x="200" y="465" width="130" height="60" rx="6" fill="var(--loop-rain)" opacity="0.25" stroke="var(--loop-rain)" />
              <text x="265" y="500" fontSize="10" textAnchor="middle" fill="var(--foreground)">Sump · {hub.sumpKL} kL</text>
              <rect x="40" y="458" width="110" height="70" rx="6" fill="var(--loop-rain)" opacity={0.2 + 0.4 * Math.min(1, p.rechargeL / 600)} stroke="var(--loop-rain)" strokeDasharray="4 3" />
              <text x="95" y="498" fontSize="10" textAnchor="middle" fill="var(--foreground)">{hub.pits > 0 ? `${hub.pits} recharge pit${hub.pits > 1 ? "s" : ""}` : "No pit yet"}</text>
              <path d="M660 440 V415 A40 40 0 0 1 740 415 V440 Z" fill="var(--loop-waste)" opacity="0.3" stroke="var(--loop-waste)" />
              <text x="700" y="425" fontSize="10" textAnchor="middle" fill="var(--foreground)" fontWeight="600">{hub.biogasKgDay > 0 ? "Biogas" : "No biogas"}</text>
              <g>
                <ellipse cx="800" cy="425" rx="14" ry="12" fill="var(--loop-waste)" opacity="0.7" /><ellipse cx="826" cy="428" rx="12" ry="10" fill="var(--loop-waste)" opacity="0.55" /><ellipse cx="848" cy="426" rx="10" ry="9" fill="var(--loop-waste)" opacity="0.7" />
                <text x="825" y="400" fontSize="9" textAnchor="middle" fill="var(--muted-foreground)">Garden</text>
              </g>
              <rect x="660" y="462" width="190" height="66" rx="8" fill="var(--loop-reuse)" opacity="0.18" stroke="var(--loop-reuse)" />
              <text x="755" y="490" fontSize="10" textAnchor="middle" fill="var(--foreground)" fontWeight="600">{hub.stpKLD > 0 ? `STP · ${hub.stpKLD} KLD` : "No STP"}</text>
              <text x="755" y="506" fontSize="9" textAnchor="middle" fill="var(--muted-foreground)">{hub.stpKLD > 0 ? (hub.stpRegistered ? "Registered for Green Water" : "Not yet registered") : "—"}</text>
              <g transform="translate(870 408)">
                <rect width="46" height="22" rx="3" fill="var(--loop-reuse)" opacity="0.8" /><rect x="46" y="6" width="16" height="16" rx="2" fill="var(--loop-reuse)" opacity="0.6" />
                <circle cx="12" cy="25" r="5" fill="var(--surface)" stroke="var(--foreground)" /><circle cx="52" cy="25" r="5" fill="var(--surface)" stroke="var(--foreground)" />
                <text x="30" y="-6" fontSize="9" textAnchor="middle" fill="var(--muted-foreground)">Green Water Tanker</text>
              </g>

              {/* flows */}
              {p.wasteDivertedKg > 0.05 && hub.biogasKgDay > 0 && <path d="M620 285 H650 V405 H662" fill="none" stroke="var(--loop-waste)" strokeWidth="2.5" strokeDasharray="5 8" className="animate-flow" />}
              {p.solarKW > 0.3 && <path d="M370 112 H300 V395" fill="none" stroke="var(--loop-solar)" strokeWidth="2.5" strokeDasharray="5 8" className="animate-flow" />}
              {p.biogasKW > 0 && <path d="M662 420 H640 V420 H340" fill="none" stroke="var(--loop-waste)" strokeWidth="2" strokeDasharray="4 8" className="animate-flow" />}
              <path d="M265 465 V442" fill="none" stroke="var(--loop-rain)" strokeWidth="2.5" strokeDasharray="4 6" className={p.pumpOn ? "animate-flow" : ""} opacity={p.pumpOn ? 1 : 0.35} />
              <path d="M340 410 H350 V96 H560" fill="none" stroke="var(--loop-reuse)" strokeWidth="3" strokeDasharray="5 8" className={p.pumpOn ? "animate-flow" : ""} opacity={p.pumpOn ? 1 : 0.3} />
              {p.runoffL > 1 && <path d="M335 125 H190 V445 H95 V460" fill="none" stroke="var(--loop-rain)" strokeWidth="2.5" strokeDasharray="5 8" className="animate-flow" opacity={hub.pits > 0 || !withLoop ? 1 : 0.6} />}
              {p.streetL > 1 && <path d="M335 125 H190 V440 H20" fill="none" stroke="var(--destructive)" strokeWidth="2" strokeDasharray="3 7" className="animate-flow" />}
              {p.treatedL > 0 && <path d="M800 462 V440" fill="none" stroke="var(--loop-reuse)" strokeWidth="2.5" strokeDasharray="4 6" className="animate-flow" />}
              {p.pitTopupL > 0 && <path d="M660 522 V534 H95 V528" fill="none" stroke="var(--loop-reuse)" strokeWidth="2" strokeDasharray="4 6" className="animate-flow" />}
              {p.surplusL > 0 && <path d="M850 495 H900 V438" fill="none" stroke="var(--loop-reuse)" strokeWidth="2.5" strokeDasharray="4 6" className="animate-flow" />}
              {p.dischargedL > 0 && <path d="M850 515 H950" fill="none" stroke="var(--destructive)" strokeWidth="2" strokeDasharray="3 7" className="animate-flow" />}

              <g transform="translate(24 16)">
                <rect width="198" height="22" rx="11" fill="var(--surface)" stroke="var(--border)" />
                <text x="12" y="15" fontSize="11" fill="var(--foreground)" className="tabular">{formatClock(clock)} · {w.temp.toFixed(0)}°C · {rainOn ? `${p.rainMm.toFixed(0)} mm/h` : "dry"}</text>
              </g>
              {p.outage && (
                <g transform="translate(700 16)">
                  <rect width="236" height="24" rx="12" fill="var(--destructive)" opacity="0.18" stroke="var(--destructive)" />
                  <text x="118" y="16" fontSize="11" textAnchor="middle" fill="var(--destructive)" fontWeight="600">Grid outage · {p.tankPct > 0.5 ? "tank carries the hub" : "tank empty"}</text>
                </g>
              )}
            </svg>
          </div>

          <div className="space-y-3 px-2 pb-2 pt-3">
            <div>
              <label htmlFor="twin-scrub" className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                <span>Timeline</span><span className="tabular text-foreground">{formatClock(clockRaw)}</span>
              </label>
              <input id="twin-scrub" type="range" min={0} max={1430} step={10} value={clock} onChange={(e) => set({ clock: Number(e.target.value), playing: false })} className="w-full accent-[var(--primary)]" />
            </div>
            <div className="grid gap-1.5 sm:grid-cols-5">
              {PHASES.map((ph, i) => (
                <button key={ph.id} onClick={() => goPhase(ph)} aria-pressed={activePhase.id === ph.id} className={cn("rounded-lg border px-2.5 py-2 text-left text-xs transition", activePhase.id === ph.id ? "border-primary bg-primary/15" : "hover:bg-accent/50")}>
                  <span className="font-mono text-[10px] text-primary-glow">0{i + 1}</span>
                  <span className="block font-medium">{ph.label}</span>
                </button>
              ))}
            </div>
            <p className="rounded-lg bg-brand-yellow/50 p-3 text-sm"><span className="font-medium text-primary-glow">{activePhase.label}.</span> {activePhase.text}</p>
          </div>
        </Panel>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Tank" value={`${Math.round(p.tankPct)}%`} sub={`${hub.ohtKL} kL overhead`} icon={Gauge} color="var(--loop-reuse)" />
            <Stat label="Solar" value={`${p.solarKW.toFixed(1)} kW`} sub={`${hub.solarKwp} kWp roof`} icon={Sun} color="var(--loop-solar)" />
            <Stat label="Pump" value={p.pumpOn ? "ON" : "Off"} sub={p.pumpOn ? `${p.pumpKW.toFixed(1)} kW on ${p.pumpSource}` : "waiting for sun"} icon={Zap} color="var(--loop-save)" />
            <Stat label="Recharged" value={fmtL(sum.rechargeL)} sub="so far today" icon={CloudRain} color="var(--loop-rain)" />
          </div>

          <Panel title="With LoopLocal vs without" subtitle="Same hub, same day, same weather. Both columns come from the same hourly model; the formulas are in the Assumptions drawer." icon={Building2}>
            <div className="overflow-hidden rounded-lg border text-xs">
              <div className="grid grid-cols-[1.4fr_1fr_1fr] bg-muted/40 px-3 py-1.5 font-medium text-muted-foreground"><span>So far today</span><span className="text-right">With</span><span className="text-right">Without</span></div>
              {rows.map((r) => (
                <div key={r.label} className="grid grid-cols-[1.4fr_1fr_1fr] items-center gap-2 border-t px-3 py-2">
                  <span>{r.label}</span>
                  <span className={cn("text-right font-semibold tabular", r.better ? "text-success" : "text-warning")}>{r.with}</span>
                  <span className="text-right tabular text-muted-foreground">{r.without}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
      )}
    </div>
  );
}
