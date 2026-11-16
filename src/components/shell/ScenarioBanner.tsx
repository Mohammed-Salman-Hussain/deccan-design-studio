import { AnimatePresence, motion } from "framer-motion";
import { useMemo } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { CloudLightning, Thermometer, Zap, X, ArrowRight, Droplets, PowerOff } from "lucide-react";
import { useApp } from "@/store/app";
import { useLocality } from "@/lib/hooks";
import { generateActions } from "@/lib/sim/actions";
import { SCENARIO_BY_ID, formatHour, weatherAt } from "@/lib/sim/engine";
import type { Scenario } from "@/lib/sim/types";
import { cn } from "@/lib/utils";

const LOOK: Record<Exclude<Scenario, "normal">, { icon: typeof Zap; tone: string; title: string }> = {
  storm: { icon: CloudLightning, tone: "var(--loop-rain)", title: "Storm day" },
  heatwave: { icon: Thermometer, tone: "var(--destructive)", title: "Heatwave" },
  peak: { icon: Zap, tone: "var(--loop-solar)", title: "Peak evening" },
};

/**
 * Shows what the selected conditions change, everywhere in the app.
 * Hidden on a normal day so the screen stays calm.
 */
export function ScenarioBanner() {
  const scenario = useApp((s) => s.scenario);
  const clock = useApp((s) => s.clock);
  const setScenario = useApp((s) => s.setScenario);
  const set = useApp((s) => s.set);
  const loc = useLocality();
  const path = useRouterState({ select: (r) => r.location.pathname });
  const extra = useMemo(() => {
    if (scenario === "normal") return 0;
    const base = new Set(generateActions(loc, "normal").map((a) => a.id));
    return generateActions(loc, scenario).filter((a) => !base.has(a.id)).length;
  }, [loc, scenario]);

  const meta = SCENARIO_BY_ID[scenario];
  const w = weatherAt(scenario, clock / 60);
  const next = meta.outages.find(([, b]) => clock / 60 < b);

  return (
    <AnimatePresence initial={false}>
      {scenario !== "normal" && path !== "/storm" && (
        <motion.div
          key={scenario}
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden border-b"
          role="status"
        >
          <div className="relative overflow-hidden px-3 py-2 md:px-5" style={{ background: `linear-gradient(90deg, color-mix(in oklab, ${LOOK[scenario].tone} 22%, transparent), transparent 75%)` }}>
            {scenario === "storm" && <RainStreaks />}
            {scenario === "heatwave" && <div className="pointer-events-none absolute inset-0 animate-aurora opacity-60" style={{ background: "radial-gradient(40% 120% at 20% 50%, color-mix(in oklab, var(--destructive) 25%, transparent), transparent)" }} />}
            <div className="relative flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
              <span className="flex items-center gap-2 font-semibold">
                {(() => { const I = LOOK[scenario].icon; return <I className="size-4" style={{ color: LOOK[scenario].tone }} aria-hidden />; })()}
                {LOOK[scenario].title}
              </span>
              <span className="text-muted-foreground">{meta.blurb}</span>
              <span className="flex flex-wrap items-center gap-1.5">
                {w.rainMm > 0.5 && <Chip icon={Droplets}>{w.rainMm.toFixed(0)} mm/h rain now</Chip>}
                {scenario === "heatwave" && <Chip icon={Thermometer}>{w.temp.toFixed(0)} °C now</Chip>}
                {w.outage ? <Chip icon={PowerOff} danger>Power cut in progress</Chip> : next ? <Chip icon={PowerOff}>Cut at {formatHour(next[0])}</Chip> : null}
              </span>
              <span className="ml-auto flex items-center gap-2">
                {extra > 0 && (
                  <Link to="/command" onClick={() => set({ role: "officer" })} className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-primary-glow hover:bg-accent">
                    {extra} new action{extra > 1 ? "s" : ""} in Command <ArrowRight className="size-3.5" />
                  </Link>
                )}
                <button onClick={() => setScenario("normal")} className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground">
                  <X className="size-3.5" /> Back to normal
                </button>
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Chip({ icon: Icon, children, danger }: { icon: typeof Zap; children: React.ReactNode; danger?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium", danger ? "border-destructive/50 bg-destructive/15 text-destructive" : "bg-card/60")}>
      <Icon className="size-3" aria-hidden />
      {children}
    </span>
  );
}

function RainStreaks() {
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-40" preserveAspectRatio="none" aria-hidden>
      <g stroke="var(--loop-rain)" strokeWidth="1" className="animate-rain">
        {Array.from({ length: 60 }, (_, i) => (
          <line key={i} x1={`${(i * 1.7) % 100}%`} y1={-20 + ((i * 13) % 30)} x2={`${(i * 1.7) % 100 - 0.4}%`} y2={-6 + ((i * 13) % 30)} />
        ))}
      </g>
    </svg>
  );
}
