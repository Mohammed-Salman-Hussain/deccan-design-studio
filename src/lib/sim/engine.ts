/**
 * LoopLocal simulation engine — pure TypeScript, no React.
 * Every formula is intentionally simple and mirrored in the Assumptions drawer.
 */
import type { Drain, Feeder, Hub, Locality, LoopId, Scenario } from "./types";

export const STEP_MIN = 10;
export const STEPS = (24 * 60) / STEP_MIN; // 144
export const TANKER_L = 5000;
export const TARIFF_RS = 8;
export const PEAK_SURCHARGE_RS = 1.5;
export const SOLAR_REBATE_RS = 0.5;
export const TANKER_RS = 1000;
export const PERSONS_PER_FLAT = 4.2;
export const LPCD = 135;
export const PIT_LPH = 9000;

export interface ScenarioMeta {
  id: Scenario;
  label: string;
  blurb: string;
  outages: [number, number][];
}

export const SCENARIOS: ScenarioMeta[] = [
  { id: "normal", label: "Normal day", blurb: "Clear skies, regular demand, no planned cuts.", outages: [] },
  { id: "storm", label: "Storm day", blurb: "Rain and wind from 6 pm; discom cut 7 pm – midnight.", outages: [[19, 24]] },
  { id: "heatwave", label: "Heatwave", blurb: "42 °C, high water demand, load-shedding 3 – 4:30 pm.", outages: [[15, 16.5]] },
  { id: "peak", label: "Peak evening", blurb: "Evening load 1.5×, short feeder trip at 8:30 pm.", outages: [[20.5, 21.5]] },
];
export const SCENARIO_BY_ID = Object.fromEntries(SCENARIOS.map((s) => [s.id, s])) as Record<Scenario, ScenarioMeta>;

const DEMAND_PROFILE = [0.25, 0.2, 0.18, 0.18, 0.3, 0.9, 1.7, 2.0, 1.7, 1.2, 1.0, 0.9, 0.9, 0.8, 0.7, 0.7, 0.9, 1.3, 1.6, 1.7, 1.4, 1.0, 0.6, 0.4];
const DEMAND_SUM = DEMAND_PROFILE.reduce((a, b) => a + b, 0);
const COMMON_PROFILE = [0.7, 0.6, 0.6, 0.6, 0.65, 0.9, 1.1, 1.2, 1.05, 0.8, 0.7, 0.7, 0.7, 0.7, 0.7, 0.75, 0.85, 1.05, 1.4, 1.55, 1.5, 1.3, 1.0, 0.8];

export const isPeakHour = (h: number) => (h >= 6 && h < 10) || (h >= 18 && h < 22);
export const isSolarRebateHour = (h: number) => h >= 10 && h < 18;

export interface Weather {
  cloud: number;
  rainMm: number;
  temp: number;
  wind: number;
  outage: boolean;
  loadMult: number;
  demandMult: number;
  wasteMult: number;
}

const bell = (h: number, peak: number, width: number) => Math.exp(-((h - peak) ** 2) / (2 * width * width));

export function weatherAt(s: Scenario, h: number): Weather {
  const outage = SCENARIO_BY_ID[s].outages.some(([a, b]) => h >= a && h < b);
  const diurnal = Math.sin((Math.PI * (h - 9)) / 12);
  switch (s) {
    case "storm": {
      const cloud = h < 11 ? 0.3 : h < 15 ? 0.3 + ((h - 11) / 4) * 0.45 : 0.95;
      const rainMm = h >= 17.5 && h <= 23.8 ? 38 * bell(h, 20.2, 1.4) : 0;
      return { cloud, rainMm, temp: 27 + 4 * diurnal - (h > 17 ? 3 : 0), wind: h > 17 ? 48 : 14, outage, loadMult: 1, demandMult: 1, wasteMult: 1.1 };
    }
    case "heatwave":
      return { cloud: 0.05, rainMm: 0, temp: 33 + 9 * diurnal, wind: 9, outage, loadMult: 1.12 + 0.25 * Math.max(0, diurnal), demandMult: 1.22, wasteMult: 1 };
    case "peak":
      return { cloud: 0.3, rainMm: 0, temp: 29 + 6 * diurnal, wind: 11, outage, loadMult: h >= 18 && h < 22 ? 1.5 : 1.05, demandMult: 1.05, wasteMult: 1 };
    default:
      return { cloud: 0.18, rainMm: 0, temp: 26 + 8 * diurnal, wind: 10, outage, loadMult: 1, demandMult: 1, wasteMult: 1 };
  }
}

/** Hours until the next outage starts (Infinity if none ahead today). */
function hoursToOutage(s: Scenario, h: number) {
  let best = Infinity;
  for (const [a] of SCENARIO_BY_ID[s].outages) if (a > h) best = Math.min(best, a - h);
  return best;
}

export const pumpKW = (hub: Hub) => Math.min(11, Math.max(3, +(hub.flats / 28).toFixed(1)));
export const wetWasteKgDay = (hub: Hub, mult = 1) => hub.flats * PERSONS_PER_FLAT * 0.3 * 0.55 * mult;

export interface HubPoint {
  t: number;
  h: number;
  solarKW: number;
  biogasKW: number;
  loadKW: number;
  gridKW: number;
  pumpKW: number;
  blowerKW: number;
  pumpOn: boolean;
  pumpSource: "solar" | "biogas" | "grid" | "off";
  tankPct: number;
  demandL: number;
  shortageL: number;
  rainMm: number;
  runoffL: number;
  rechargeL: number;
  streetL: number;
  treatedL: number;
  reuseL: number;
  pitTopupL: number;
  surplusL: number;
  dischargedL: number;
  wasteDivertedKg: number;
  wasteGeneratedKg: number;
  outage: boolean;
  peak: boolean;
  renewablePumpKWh: number;
  pumpKWh: number;
}

const cache = new Map<string, HubPoint[]>();

export function simulateHubDay(hub: Hub, s: Scenario, withLoop: boolean): HubPoint[] {
  const key = `${hub.id}|${hub.flats}|${hub.solarKwp}|${hub.pits}|${hub.biogasKgDay}|${hub.stpKLD}|${s}|${withLoop ? 1 : 0}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const dt = STEP_MIN / 60;
  const cap = hub.ohtKL * 1000;
  const pk = pumpKW(hub);
  const pumpLph = pk * 2400;
  let tank = cap * (withLoop ? 0.68 : 0.55);
  let pumpWasOn = false;
  // Biogas balloon: produced all day, burnt by the genset at 3 kW when needed.
  let balloonKWh = 2;
  const out: HubPoint[] = [];

  for (let i = 0; i <= STEPS; i++) {
    const t = i * STEP_MIN;
    const h = Math.min(23.99, t / 60);
    const hi = Math.floor(h);
    const w = weatherAt(s, h);
    const peak = isPeakHour(h);

    const solarKW = hub.solarKwp * Math.max(0, Math.sin((Math.PI * (h - 6.2)) / 12.6)) * (1 - 0.75 * w.cloud) * (w.temp > 38 ? 0.92 : 1);
    const generatedKg = (wetWasteKgDay(hub, w.wasteMult) / STEPS);
    const divertShare = hub.biogasKgDay > 0 ? (withLoop ? Math.min(1, hub.segregation / 100 + 0.12) : 0.35) : 0;
    const divertedKg = Math.min(generatedKg * divertShare, hub.biogasKgDay / STEPS);
    balloonKWh = Math.min(30, balloonKWh + divertedKg * 0.06 * 1.7);

    const demandL = (PERSONS_PER_FLAT * LPCD * hub.flats * w.demandMult * DEMAND_PROFILE[hi]) / DEMAND_SUM / 6;
    const pct = (tank / cap) * 100;

    let on = false;
    let source: HubPoint["pumpSource"] = "off";
    let rateFactor = 1;
    if (withLoop) {
      const toCut = hoursToOutage(s, h);
      const target = toCut <= 4 ? 98 : solarKW >= pk * 0.55 ? 96 : 35;
      if (w.outage) {
        if (balloonKWh > 0.5 && pct < 85) {
          on = true;
          source = "biogas";
          rateFactor = Math.min(1, 3 / pk);
        }
      } else if (pct < target || (pumpWasOn && pct < target + 2)) {
        on = true;
        source = solarKW >= pk * 0.55 ? "solar" : balloonKWh > 4 && w.cloud > 0.6 ? "biogas" : "grid";
        if (source === "biogas") rateFactor = Math.min(1, 3 / pk);
      }
    } else if (!w.outage) {
      const scheduled = (h >= 5.5 && h < 7.5) || (h >= 18 && h < 20.5);
      if ((scheduled && pct < 97) || pct < 15) {
        on = true;
        source = "grid";
      }
    }
    if (source === "biogas") balloonKWh = Math.max(0, balloonKWh - 3 * dt);
    pumpWasOn = on;

    const pumped = on ? pumpLph * rateFactor * dt : 0;
    tank += pumped - demandL;
    let shortageL = 0;
    if (tank < 0) {
      shortageL = -tank;
      tank = 0;
    }
    tank = Math.min(cap, tank);

    // STP
    const treatedL = hub.stpKLD > 0 ? Math.min((hub.stpKLD * 1000) / STEPS, demandL * 0.8) : 0;
    let reuseL = 0, pitTopupL = 0, surplusL = 0, dischargedL = 0;
    if (withLoop) {
      reuseL = Math.min(treatedL, demandL * 0.3);
      const rem = treatedL - reuseL;
      const qualityPass = w.rainMm < 5;
      pitTopupL = qualityPass && hub.pits > 0 ? Math.min(rem, hub.pits * 120) : 0;
      surplusL = rem - pitTopupL;
    } else {
      reuseL = treatedL * 0.1;
      dischargedL = treatedL - reuseL;
    }

    // Rain
    const runoffL = hub.roofM2 * w.rainMm * dt * 0.8;
    const pitCap = hub.pits * PIT_LPH * dt * (withLoop ? 1 : 0.3);
    const rechargeL = Math.min(runoffL, pitCap);
    const streetL = runoffL - rechargeL;

    // Energy
    const blowerBase = hub.stpKLD * 0.035;
    const blowerKW = withLoop ? blowerBase * (isSolarRebateHour(h) ? 1.4 : 0.6) : blowerBase;
    const pumpLoad = on ? pk * rateFactor : 0;
    const commonKW = hub.flats * 0.045 * COMMON_PROFILE[hi] * w.loadMult;
    const loadKW = commonKW + blowerKW + pumpLoad;
    const biogasKW = source === "biogas" ? 3 : 0;
    const gridKW = w.outage ? 0 : Math.max(0, loadKW - solarKW - biogasKW);
    const renewablePumpKWh = on ? (source === "biogas" ? pumpLoad * dt : Math.min(pumpLoad, solarKW) * dt) : 0;

    out.push({
      t, h, solarKW, biogasKW, loadKW, gridKW, pumpKW: pumpLoad, blowerKW, pumpOn: on, pumpSource: source,
      tankPct: (tank / cap) * 100, demandL, shortageL, rainMm: w.rainMm, runoffL, rechargeL, streetL,
      treatedL, reuseL, pitTopupL, surplusL, dischargedL, wasteDivertedKg: divertedKg, wasteGeneratedKg: generatedKg,
      outage: w.outage, peak, renewablePumpKWh, pumpKWh: pumpLoad * dt,
    });
  }
  cache.set(key, out);
  return out;
}

export interface HubSummary {
  hub: Hub;
  now: HubPoint;
  solarKWh: number;
  biogasKWh: number;
  gridKWh: number;
  peakKWhLoop: number;
  peakKWhBase: number;
  kwhShifted: number;
  rechargeL: number;
  runoffL: number;
  streetL: number;
  streetBaseL: number;
  reuseL: number;
  pitTopupL: number;
  surplusL: number;
  treatedL: number;
  wasteDivertedKg: number;
  wasteGeneratedKg: number;
  shortageL: number;
  shortageBaseL: number;
  outageHours: number;
  outageCoveredHours: number;
  outageCoveredBaseHours: number;
  tankersAvoided: number;
  savingsRs: number;
  scores: Record<LoopId, number>;
  score: number;
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export function summarizeHub(hub: Hub, s: Scenario, tMin: number): HubSummary {
  const loop = simulateHubDay(hub, s, true);
  const base = simulateHubDay(hub, s, false);
  const idx = clamp(Math.floor(tMin / STEP_MIN), 0, STEPS);
  const dt = STEP_MIN / 60;
  let solarKWh = 0, biogasKWh = 0, gridKWh = 0, peakL = 0, peakB = 0, recharge = 0, runoff = 0, street = 0, streetB = 0;
  let reuse = 0, reuseB = 0, topup = 0, surplus = 0, treated = 0, diverted = 0, generated = 0, short = 0, shortB = 0;
  let outH = 0, covH = 0, covBH = 0, renew = 0, pumpTot = 0;
  for (let i = 0; i <= idx; i++) {
    const p = loop[i], b = base[i];
    solarKWh += Math.min(p.solarKW, p.loadKW) * dt;
    biogasKWh += p.biogasKW * dt;
    gridKWh += p.gridKW * dt;
    if (p.peak) { peakL += p.gridKW * dt; peakB += b.gridKW * dt; }
    recharge += p.rechargeL; runoff += p.runoffL; street += p.streetL; streetB += b.streetL;
    reuse += p.reuseL; reuseB += b.reuseL; topup += p.pitTopupL; surplus += p.surplusL; treated += p.treatedL;
    diverted += p.wasteDivertedKg; generated += p.wasteGeneratedKg;
    short += p.shortageL; shortB += b.shortageL;
    if (p.outage) { outH += dt; if (p.tankPct > 0.5) covH += dt; if (b.tankPct > 0.5) covBH += dt; }
    renew += p.renewablePumpKWh; pumpTot += p.pumpKWh;
  }
  const kwhShifted = Math.max(0, peakB - peakL);
  const tankersAvoided = Math.max(0, (reuse - reuseB + topup + recharge * 0.25 + Math.max(0, shortB - short)) / TANKER_L);
  const savingsRs = kwhShifted * (TARIFF_RS + PEAK_SURCHARGE_RS) + solarKWh * TARIFF_RS + tankersAvoided * TANKER_RS;

  const wasteScore = hub.biogasKgDay > 0 ? hub.segregation * 0.45 + (generated > 0 ? (diverted / generated) * 55 : 40) : hub.segregation * 0.45;
  const solarScore = hub.solarKwp > 0 ? 25 + (pumpTot > 0 ? (renew / pumpTot) * 75 : 50) : 12;
  const readiness = hub.pits > 0 ? Math.min(100, 45 + hub.pits * 15) : 18;
  const rainScore = runoff > 0 ? readiness * 0.4 + (recharge / runoff) * 60 * (hub.pits > 0 ? 1 : 0) + (hub.pits > 0 ? 25 : 0) : readiness;
  const reuseScore = hub.stpKLD > 0 ? (treated > 0 ? ((reuse + topup + surplus * (hub.stpRegistered ? 1 : 0.35)) / treated) * 85 : 50) + (hub.stpRegistered ? 15 : 0) : 10;
  const saveScore = 30 + (peakB > 0 ? (kwhShifted / peakB) * 45 : 20) + Math.min(25, tankersAvoided * 8);
  const scores: Record<LoopId, number> = {
    waste: clamp(wasteScore, 0, 100),
    solar: clamp(solarScore, 0, 100),
    rain: clamp(rainScore, 0, 100),
    reuse: clamp(reuseScore, 0, 100),
    save: clamp(saveScore, 0, 100),
  };
  const score = (scores.waste + scores.solar + scores.rain + scores.reuse + scores.save) / 5;

  return {
    hub, now: loop[idx], solarKWh, biogasKWh, gridKWh, peakKWhLoop: peakL, peakKWhBase: peakB, kwhShifted,
    rechargeL: recharge, runoffL: runoff, streetL: street, streetBaseL: streetB, reuseL: reuse, pitTopupL: topup,
    surplusL: surplus, treatedL: treated, wasteDivertedKg: diverted, wasteGeneratedKg: generated,
    shortageL: short, shortageBaseL: shortB, outageHours: outH, outageCoveredHours: covH, outageCoveredBaseHours: covBH,
    tankersAvoided, savingsRs, scores, score,
  };
}

export interface LocalitySummary {
  hubs: HubSummary[];
  scores: Record<LoopId, number>;
  score: number;
  tankersAvoided: number;
  kwhShifted: number;
  rechargeL: number;
  wasteDivertedKg: number;
  reuseL: number;
  surplusL: number;
  solarKWh: number;
  savingsRs: number;
  streetL: number;
  streetBaseL: number;
  shortageL: number;
  shortageBaseL: number;
}

export function summarizeLocality(loc: Locality, s: Scenario, tMin: number, bonus = 0): LocalitySummary {
  const hubs = loc.hubs.map((h) => summarizeHub(h, s, tMin));
  const totalFlats = loc.hubs.reduce((a, h) => a + h.flats, 0);
  const keys: LoopId[] = ["waste", "solar", "rain", "reuse", "save"];
  const scores = Object.fromEntries(
    keys.map((k) => [k, hubs.reduce((a, hs) => a + hs.scores[k] * hs.hub.flats, 0) / totalFlats]),
  ) as Record<LoopId, number>;
  const sum = (f: (h: HubSummary) => number) => hubs.reduce((a, h) => a + f(h), 0);
  const raw = keys.reduce((a, k) => a + scores[k], 0) / keys.length;
  return {
    hubs,
    scores,
    score: clamp(raw + bonus, 0, 100),
    tankersAvoided: sum((h) => h.tankersAvoided),
    kwhShifted: sum((h) => h.kwhShifted),
    rechargeL: sum((h) => h.rechargeL),
    wasteDivertedKg: sum((h) => h.wasteDivertedKg),
    reuseL: sum((h) => h.reuseL + h.pitTopupL),
    surplusL: sum((h) => h.surplusL),
    solarKWh: sum((h) => h.solarKWh),
    savingsRs: sum((h) => h.savingsRs),
    streetL: sum((h) => h.streetL),
    streetBaseL: sum((h) => h.streetBaseL),
    shortageL: sum((h) => h.shortageL),
    shortageBaseL: sum((h) => h.shortageBaseL),
  };
}

/** Cumulative rain (mm) up to hour h. */
export function rainToDate(s: Scenario, h: number) {
  let mm = 0;
  for (let x = 0; x < h; x += 1 / 6) mm += weatherAt(s, x).rainMm / 6;
  return mm;
}

export function drainRisk(d: Drain, s: Scenario, tMin: number, cleared: boolean, wasteShare = 0.5) {
  const h = tMin / 60;
  let boost = 0;
  if (s === "storm") boost = h < 8 ? 4 : h < 16 ? 4 + ((h - 8) / 8) * 18 : 22;
  if (s === "heatwave") boost = -8;
  const rain = rainToDate(s, h) * 0.12;
  const waste = (1 - wasteShare) * 12;
  const r = d.baseRisk + boost + rain + waste - 6;
  return Math.round(clamp(cleared ? r * 0.32 : r, 3, 98));
}

export function feederLoad(f: Feeder, loc: Locality, s: Scenario, tMin: number) {
  const h = Math.min(23.99, tMin / 60);
  const w = weatherAt(s, h);
  if (w.outage) return { pct: 0, kva: 0, tripped: true };
  const hubSolar = loc.hubs
    .filter((hb) => hb.feeder === f.id)
    .reduce((a, hb) => a + hb.solarKwp * Math.max(0, Math.sin((Math.PI * (h - 6.2)) / 12.6)) * (1 - 0.75 * w.cloud), 0);
  const kva = f.baseLoadKVA * COMMON_PROFILE[Math.floor(h)] * w.loadMult * (w.temp > 36 ? 1.08 : 1) - hubSolar / 0.9;
  return { pct: Math.round((kva / f.capacityKVA) * 100), kva: Math.round(kva), tripped: false };
}

export function hourlySeries(hub: Hub, s: Scenario, withLoop: boolean) {
  const pts = simulateHubDay(hub, s, withLoop);
  const rows: { hour: string; h: number; solar: number; grid: number; load: number; tank: number; rain: number; recharge: number; reuse: number; biogas: number; pump: number }[] = [];
  for (let hh = 0; hh < 24; hh++) {
    const slice = pts.slice(hh * 6, hh * 6 + 6);
    const avg = (f: (p: HubPoint) => number) => slice.reduce((a, p) => a + f(p), 0) / slice.length;
    const sum = (f: (p: HubPoint) => number) => slice.reduce((a, p) => a + f(p), 0);
    rows.push({
      hour: `${String(hh).padStart(2, "0")}:00`, h: hh,
      solar: +avg((p) => p.solarKW).toFixed(1), grid: +avg((p) => p.gridKW).toFixed(1), load: +avg((p) => p.loadKW).toFixed(1),
      tank: +slice[slice.length - 1].tankPct.toFixed(0), rain: +avg((p) => p.rainMm).toFixed(1),
      recharge: Math.round(sum((p) => p.rechargeL)), reuse: Math.round(sum((p) => p.reuseL + p.pitTopupL)),
      biogas: +avg((p) => p.biogasKW).toFixed(1), pump: +avg((p) => p.pumpKW).toFixed(1),
    });
  }
  return rows;
}

export function localityHourly(loc: Locality, s: Scenario) {
  const per = loc.hubs.map((h) => ({ loop: hourlySeries(h, s, true), base: hourlySeries(h, s, false) }));
  return Array.from({ length: 24 }, (_, i) => {
    const r = { hour: per[0].loop[i].hour, solar: 0, grid: 0, gridBase: 0, recharge: 0, reuse: 0, rain: weatherAt(s, i + 0.5).rainMm, tank: 0, tankBase: 0, biogas: 0 };
    for (const p of per) {
      r.solar += p.loop[i].solar; r.grid += p.loop[i].grid; r.gridBase += p.base[i].grid; r.recharge += p.loop[i].recharge;
      r.reuse += p.loop[i].reuse; r.tank += p.loop[i].tank / per.length; r.tankBase += p.base[i].tank / per.length; r.biogas += p.loop[i].biogas;
    }
    return { ...r, solar: +r.solar.toFixed(1), grid: +r.grid.toFixed(1), gridBase: +r.gridBase.toFixed(1), tank: Math.round(r.tank), tankBase: Math.round(r.tankBase), rain: +r.rain.toFixed(1), biogas: +r.biogas.toFixed(1) };
  });
}

export function formatClock(tMin: number) {
  const m = Math.floor(tMin) % 1440;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  const ampm = h >= 12 ? "pm" : "am";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(mm).padStart(2, "0")} ${ampm}`;
}

export function formatHour(h: number) {
  const hh = ((Math.floor(h) % 24) + 24) % 24;
  const ampm = hh >= 12 ? "pm" : "am";
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  const min = Math.round((h - Math.floor(h)) * 60);
  return min ? `${h12}:${String(min).padStart(2, "0")} ${ampm}` : `${h12} ${ampm}`;
}
