import { useMemo } from "react";
import { CheckCircle2, CloudRain, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { InfoTip, Panel } from "@/components/ll/primitives";
import { useApp } from "@/store/app";
import { useClearedDrains, useLocality } from "@/lib/hooks";
import { generateActions } from "@/lib/sim/actions";
import { GRADE_COLOR, hubReadiness, localityReadiness } from "@/lib/readiness";

/** A–F monsoon readiness for every complex, and one button that sends every pre-storm task to the field crews. */
export function MonsoonCard() {
  const loc = useLocality();
  const cleared = useClearedDrains();
  const tasks = useApp((s) => s.tasks);
  const dispatchMany = useApp((s) => s.dispatchMany);

  const rows = useMemo(() => loc.hubs.map((h) => hubReadiness(h, loc, cleared)).sort((a, b) => a.score - b.score), [loc, cleared]);
  const overall = useMemo(() => localityReadiness(rows), [rows]);
  const drive = useMemo(() => generateActions(loc, "storm"), [loc]);
  const waiting = drive.filter((a) => !tasks[a.id] || tasks[a.id].status === "pending");

  const run = () => {
    dispatchMany(waiting, "Officer");
    toast.success("Pre-monsoon drive started", { description: `${waiting.length} tasks sent to sanitation, pump and plumber crews. Grades rise as drains are cleared.` });
  };

  return (
    <Panel
      title="Monsoon readiness"
      icon={CloudRain}
      subtitle="How ready each complex is for a heavy-rain evening with a power cut. Tank reserve 35%, rain put in the ground 30%, nearby drains 25%, waste segregation 10%."
      action={
        waiting.length > 0 ? (
          <Button size="sm" variant="hero" onClick={run}><Send /> Start the pre-monsoon drive ({waiting.length})</Button>
        ) : (
          <span className="flex items-center gap-1.5 text-xs text-success"><CheckCircle2 className="size-4" aria-hidden /> All {drive.length} drive tasks sent</span>
        )
      }
    >
      <div className="grid gap-4 lg:grid-cols-[170px_1fr]">
        <div className="flex flex-col items-center justify-center rounded-xl border p-4 text-center">
          <p className="text-xs text-muted-foreground">{loc.name}</p>
          <p className="font-display text-6xl font-semibold leading-none" style={{ color: GRADE_COLOR[overall.grade] }} aria-label={`Overall grade ${overall.grade}`}>{overall.grade}</p>
          <p className="mt-1 font-mono text-xs tabular text-muted-foreground">{overall.score} / 100</p>
        </div>
        <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((r) => (
            <li key={r.hub.id} className="flex items-center gap-3 rounded-lg border p-2.5">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg font-display text-xl font-semibold" style={{ background: `color-mix(in oklab, ${GRADE_COLOR[r.grade]} 16%, transparent)`, color: GRADE_COLOR[r.grade] }}>{r.grade}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{r.hub.name}</p>
                <p className="truncate text-xs text-muted-foreground">{r.next}</p>
              </div>
              <InfoTip label={`How ${r.hub.name} was graded`}>
                <p className="mb-1 font-medium text-foreground">{r.hub.name}: {r.score} / 100</p>
                <ul className="space-y-1">
                  {r.parts.map((p) => <li key={p.key}><span className="font-mono tabular text-foreground">{p.pct}</span> · {p.label}. {p.note}</li>)}
                </ul>
              </InfoTip>
            </li>
          ))}
        </ul>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">Lowest grade first. A: 85 and above, B: 70, C: 55, D: 40, F: below. Complete a drain task in Command and watch its neighbours' grades rise.</p>
    </Panel>
  );
}
