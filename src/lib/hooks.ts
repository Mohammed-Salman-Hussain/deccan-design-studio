import { useMemo } from "react";
import { useApp } from "@/store/app";
import { LOCALITY_BY_ID } from "@/lib/sim/data";
import { summarizeHub, summarizeLocality } from "@/lib/sim/engine";
import { generateActions } from "@/lib/sim/actions";
import { translate, type TKey } from "@/lib/i18n";
import type { TaskStatus } from "@/lib/sim/types";

export const useLocality = () => LOCALITY_BY_ID[useApp((s) => s.localityId)] ?? LOCALITY_BY_ID.kukatpally;

export function useHub() {
  const loc = useLocality();
  const hubId = useApp((s) => s.hubId);
  return loc.hubs.find((h) => h.id === hubId) ?? loc.hubs[0];
}

export function useT() {
  const lang = useApp((s) => s.lang);
  return (k: TKey) => translate(k, lang);
}

/** Clock quantised to the 10-minute simulation step, so heavy memos only recompute when data changes. */
export const useStepClock = () => useApp((s) => Math.floor(s.clock / 10) * 10);

export function useBonus() {
  const tasks = useApp((s) => s.tasks);
  const locId = useApp((s) => s.localityId);
  return useMemo(() => {
    let b = 0;
    for (const t of Object.values(tasks)) {
      if ((t.status === "done" || t.status === "verified") && (t.id.startsWith(`${locId}:`) || t.id.startsWith("citizen:"))) b += t.impact.score;
    }
    return Math.min(15, b);
  }, [tasks, locId]);
}

export function useLocalitySummary() {
  const loc = useLocality();
  const scenario = useApp((s) => s.scenario);
  const t = useStepClock();
  const bonus = useBonus();
  return useMemo(() => summarizeLocality(loc, scenario, t, bonus), [loc, scenario, t, bonus]);
}

export function useHubSummary() {
  const hub = useHub();
  const scenario = useApp((s) => s.scenario);
  const t = useStepClock();
  return useMemo(() => summarizeHub(hub, scenario, t), [hub, scenario, t]);
}

export function useActionQueue() {
  const loc = useLocality();
  const scenario = useApp((s) => s.scenario);
  const tasks = useApp((s) => s.tasks);
  const citizen = useApp((s) => s.citizenActions);
  const generated = useMemo(() => generateActions(loc, scenario), [loc, scenario]);
  return useMemo(() => {
    const list = [...citizen, ...generated];
    return list.map((a) => ({ ...a, status: (tasks[a.id]?.status ?? "pending") as TaskStatus, record: tasks[a.id] }));
  }, [generated, citizen, tasks]);
}

export function useClearedDrains() {
  const tasks = useApp((s) => s.tasks);
  return useMemo(() => {
    const set = new Set<string>();
    for (const t of Object.values(tasks)) {
      const m = t.id.match(/drain-(D-\d+)$/) ?? t.id.match(/desilt$/);
      if (m && (t.status === "done" || t.status === "verified")) {
        const d = t.title.match(/D-\d+/);
        if (d) set.add(d[0]);
      }
    }
    return set;
  }, [tasks]);
}

export const fmtL = (l: number) => (l >= 1e6 ? `${(l / 1e6).toFixed(2)} ML` : l >= 1000 ? `${(l / 1000).toFixed(1)} kL` : `${Math.round(l)} L`);
export const fmtRs = (r: number) => `₹${r >= 1e5 ? (r / 1e5).toFixed(2) + " L" : Math.round(r).toLocaleString("en-IN")}`;
