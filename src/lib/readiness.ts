import { drainRisk, simulateHubDay, summarizeHub } from "@/lib/sim/engine";
import type { Hub, Locality } from "@/lib/sim/types";

export type Grade = "A" | "B" | "C" | "D" | "F";

export interface ReadinessPart {
  key: "outage" | "rain" | "drains" | "waste";
  label: string;
  /** 0 to 100, higher is better. */
  pct: number;
  weight: number;
  note: string;
}

export interface Readiness {
  hub: Hub;
  score: number;
  grade: Grade;
  parts: ReadinessPart[];
  next: string;
}

export const GRADE_COLOR: Record<Grade, string> = {
  A: "var(--success)",
  B: "var(--loop-reuse)",
  C: "var(--warning)",
  D: "var(--loop-solar)",
  F: "var(--destructive)",
};

export const gradeOf = (score: number): Grade => (score >= 85 ? "A" : score >= 70 ? "B" : score >= 55 ? "C" : score >= 40 ? "D" : "F");

const dist2 = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => (a.lat - b.lat) ** 2 + (a.lng - b.lng) ** 2;

/**
 * How ready one complex is for a heavy-rain evening with a power cut.
 * Tank reserve through the cut 35%, rain put in the ground 30%, the two nearest drains 25%, waste segregation 10%.
 * `cleared` holds drains a crew has already cleared, so finished work lifts the grade.
 */
export function hubReadiness(hub: Hub, loc: Locality, cleared: Set<string>): Readiness {
  const hs = summarizeHub(hub, "storm", 1439);
  // Lowest tank level while the grid is off. Every hub gets water through the cut; the reserve is what differs.
  const reserve = Math.min(100, ...simulateHubDay(hub, "storm", true).filter((p) => p.outage).map((p) => p.tankPct));
  const capture = hs.runoffL > 0 ? hs.rechargeL / hs.runoffL : 1;
  const near = [...loc.drains].sort((a, b) => dist2(a, hub) - dist2(b, hub)).slice(0, 2);
  const wasteShare = hub.segregation / 100;
  const risks = near.map((d) => ({ d, r: drainRisk(d, "storm", 20 * 60, cleared.has(d.id), wasteShare) }));
  const avgRisk = risks.reduce((a, x) => a + x.r, 0) / Math.max(1, risks.length);

  const parts: ReadinessPart[] = [
    { key: "outage", label: "Tank reserve in the power cut", pct: Math.round(reserve), weight: 0.35, note: `The tank never drops below ${Math.round(reserve)}% while the grid is off.` },
    { key: "rain", label: "Rain put in the ground", pct: Math.round(100 * capture), weight: 0.3, note: hub.pits > 0 ? `${hub.pits} recharge pit${hub.pits > 1 ? "s" : ""} take ${Math.round(100 * capture)}% of roof runoff.` : "No recharge pit, so roof runoff goes to the street." },
    { key: "drains", label: "Drains nearby", pct: Math.round(100 - avgRisk), weight: 0.25, note: `${near.map((d) => d.id).join(" and ")} at ${Math.round(avgRisk)}% average clog risk.` },
    { key: "waste", label: "Waste kept out of drains", pct: hub.segregation, weight: 0.1, note: `${hub.segregation}% of wet waste is segregated at source.` },
  ];
  const score = Math.round(parts.reduce((a, p) => a + p.pct * p.weight, 0));
  const weakest = parts.reduce((a, p) => ((100 - p.pct) * p.weight > (100 - a.pct) * a.weight ? p : a));
  const worstDrain = risks.sort((a, b) => b.r - a.r)[0];
  const next = {
    outage: hub.solarKwp === 0 ? "Add rooftop solar so the pumps can fill the tank before the cut." : "Fill the overhead tank to 95% before the cut begins.",
    rain: hub.pits === 0 ? "Build a recharge pit." : "Open the pit valves before the rain starts.",
    drains: worstDrain ? `Clear Drain ${worstDrain.d.id} (${worstDrain.d.name}) before 6 pm.` : "Clear the nearest drains.",
    waste: "Raise wet-waste segregation, since waste in drains is what clogs them.",
  }[weakest.key];

  return { hub, score, grade: gradeOf(score), parts, next };
}

/** Flat-weighted locality grade. */
export function localityReadiness(rows: Readiness[]) {
  const flats = rows.reduce((a, r) => a + r.hub.flats, 0);
  const score = Math.round(rows.reduce((a, r) => a + r.score * r.hub.flats, 0) / Math.max(1, flats));
  return { score, grade: gradeOf(score) };
}
