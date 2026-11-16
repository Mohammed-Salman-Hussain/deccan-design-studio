import type { Locality, Scenario } from "./types";
import { drainRisk, localityHourly, summarizeLocality } from "./engine";

/** Four levers a planner could pull. Each is a share of complexes (0 to 100), except segregation, a floor for every complex. */
export interface Policy {
  /** Complexes with at least one recharge pit. */
  pits: number;
  /** Treatment plants registered to supply Green Water. */
  greenWater: number;
  /** Complexes with a rooftop solar plant. */
  solar: number;
  /** Lowest share of wet waste segregated at source. */
  segregation: number;
}

/** Where the locality stands today, in the same units as the levers. */
export function todayPolicy(loc: Locality): Policy {
  const n = loc.hubs.length;
  const plants = loc.hubs.filter((h) => h.stpKLD > 0);
  return {
    pits: Math.round((100 * loc.hubs.filter((h) => h.pits > 0).length) / n),
    greenWater: plants.length ? Math.round((100 * plants.filter((h) => h.stpRegistered).length) / plants.length) : 100,
    solar: Math.round((100 * loc.hubs.filter((h) => h.solarKwp > 0).length) / n),
    segregation: Math.min(...loc.hubs.map((h) => h.segregation)),
  };
}

export interface HubChange {
  id: string;
  name: string;
  what: string[];
}

/** A copy of the locality with the levers applied. Complexes with the largest roofs or plants are done first. */
export function applyPolicy(loc: Locality, p: Policy): { loc: Locality; changes: HubChange[] } {
  const hubs = loc.hubs.map((h) => ({ ...h }));
  const note = new Map<string, string[]>();
  const add = (id: string, s: string) => note.set(id, [...(note.get(id) ?? []), s]);
  const n = hubs.length;

  let withPits = hubs.filter((h) => h.pits > 0).length;
  for (const h of hubs.filter((x) => x.pits === 0).sort((a, b) => b.roofM2 - a.roofM2)) {
    if (withPits >= Math.round((p.pits / 100) * n)) break;
    h.pits = Math.max(1, Math.round(h.roofM2 / 1300));
    withPits++;
    add(h.id, `${h.pits} recharge pit${h.pits > 1 ? "s" : ""}`);
  }

  const plants = hubs.filter((h) => h.stpKLD > 0);
  let registered = plants.filter((h) => h.stpRegistered).length;
  for (const h of plants.filter((x) => !x.stpRegistered).sort((a, b) => b.stpKLD - a.stpKLD)) {
    if (registered >= Math.round((p.greenWater / 100) * plants.length)) break;
    h.stpRegistered = true;
    registered++;
    add(h.id, "plant registered for Green Water");
  }

  let withSolar = hubs.filter((h) => h.solarKwp > 0).length;
  for (const h of hubs.filter((x) => x.solarKwp === 0).sort((a, b) => b.roofM2 - a.roofM2)) {
    if (withSolar >= Math.round((p.solar / 100) * n)) break;
    h.solarKwp = Math.max(10, Math.round(h.roofM2 * 0.014));
    withSolar++;
    add(h.id, `${h.solarKwp} kWp rooftop solar`);
  }

  for (const h of hubs) {
    if (h.segregation < p.segregation) {
      add(h.id, `segregation ${h.segregation}% to ${p.segregation}%`);
      h.segregation = p.segregation;
    }
  }

  const changes = hubs.filter((h) => note.has(h.id)).map((h) => ({ id: h.id, name: h.name, what: note.get(h.id)! }));
  return { loc: { ...loc, hubs }, changes };
}

export interface PolicyResult {
  score: number;
  tankers: number;
  /** Drains at 70% clog risk or more at 8 pm. */
  riskyDrains: number;
  /** Highest grid draw across the locality, in kW. */
  peakKW: number;
  /** Rain that ran off onto the street, in kilolitres. */
  streetKL: number;
}

/** Runs the whole day for a locality and reads off the five numbers the sandbox compares. */
export function evaluatePolicy(loc: Locality, s: Scenario): PolicyResult {
  const sum = summarizeLocality(loc, s, 1439, 0);
  const wasteShare = sum.scores.waste / 100;
  return {
    score: sum.score,
    tankers: sum.tankersAvoided,
    riskyDrains: loc.drains.filter((d) => drainRisk(d, s, 20 * 60, false, wasteShare) >= 70).length,
    peakKW: Math.max(...localityHourly(loc, s).map((r) => r.grid)),
    streetKL: sum.streetL / 1000,
  };
}
