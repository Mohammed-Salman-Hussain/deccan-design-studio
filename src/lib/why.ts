import type { Drain, Hub, LoopId, Scenario } from "@/lib/sim/types";
import { rainToDate, type HubSummary } from "@/lib/sim/engine";
import { LOOP_BY_ID } from "@/lib/sim/loops";

/** Plain-language reasons behind a drain's clog risk, mirroring what the risk formula uses. */
export function whyDrain(d: Drain, s: Scenario, tMin: number, cleared: boolean, wasteShare: number): string[] {
  const out: string[] = [];
  if (d.widthM < d.designWidthM * 0.7) out.push(`Narrowed to ${d.widthM} m from a design width of ${d.designWidthM} m.`);
  else out.push(`Close to its design width (${d.widthM} m of ${d.designWidthM} m).`);
  if (s === "storm") out.push("A storm is forecast, which raises the risk through the day.");
  const mm = rainToDate(s, tMin / 60);
  if (mm >= 1) out.push(`${mm.toFixed(0)} mm of rain so far today.`);
  if (wasteShare < 0.6) out.push("Wet waste is reaching drains because segregation is low.");
  if (cleared) out.push("Cleared today, which cuts the risk by about two thirds.");
  return out;
}

const REASON: Record<LoopId, (h: Hub) => string> = {
  waste: (h) => (h.biogasKgDay === 0 ? "no biogas unit" : `${h.segregation}% of waste segregated`),
  solar: (h) => (h.solarKwp === 0 ? "no solar roof" : "pumps often run on grid power"),
  rain: (h) => (h.pits === 0 ? "no recharge pit" : `${h.pits} recharge pit${h.pits > 1 ? "s" : ""}`),
  reuse: (h) => (h.stpKLD === 0 ? "no treatment plant" : !h.stpRegistered ? "plant not registered for Green Water" : "treated water mostly discharged"),
  save: () => "little peak power or tanker use avoided so far",
};

/** The loop holding a hub's score down, with a short cause. */
export function weakestLoop(hs: HubSummary, scores: Record<LoopId, number> = hs.scores) {
  const keys = Object.keys(scores) as LoopId[];
  const loop = keys.reduce((a, k) => (scores[k] < scores[a] ? k : a), keys[0]);
  return { loop, short: LOOP_BY_ID[loop].short, score: Math.round(scores[loop]), reason: REASON[loop](hs.hub) };
}
