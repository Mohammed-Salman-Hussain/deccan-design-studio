import type { HubSummary } from "@/lib/sim/engine";
import type { SurplusOffer } from "@/store/app";
import type { Hub } from "@/lib/sim/types";

/**
 * Loop Credits are a points scheme for the demo, not money. They are earned from what a complex actually
 * recycles in the simulated day, plus a bonus for each surplus share that is matched.
 */
export const CREDIT_RULES = [
  { label: "Water recycled", rule: "1 credit per kilolitre sent to a pit or reused" },
  { label: "Solar used", rule: "1 credit per 10 kWh of rooftop solar used" },
  { label: "Waste to biogas", rule: "1 credit per 10 kg of wet waste kept out of the drains" },
  { label: "Peak power shifted", rule: "1 credit per 5 kWh moved out of peak hours" },
  { label: "Surplus matched", rule: "10 credits to each side of a matched share" },
] as const;

export interface CreditLine {
  label: string;
  credits: number;
  detail: string;
}

export function dailyCredits(hs: HubSummary): CreditLine[] {
  const water = (hs.rechargeL + hs.reuseL + hs.pitTopupL) / 1000;
  return [
    { label: "Water recycled", credits: Math.round(water), detail: `${water.toFixed(1)} kL` },
    { label: "Solar used", credits: Math.round(hs.solarKWh / 10), detail: `${Math.round(hs.solarKWh)} kWh` },
    { label: "Waste to biogas", credits: Math.round(hs.wasteDivertedKg / 10), detail: `${Math.round(hs.wasteDivertedKg)} kg` },
    { label: "Peak power shifted", credits: Math.round(hs.kwhShifted / 5), detail: `${Math.round(hs.kwhShifted)} kWh` },
  ];
}

export const MATCH_BONUS = 10;

/** Matched shares this hub took part in, on either side. */
export function matchLines(hubId: string, offers: SurplusOffer[], nameOf: (id?: string) => string): CreditLine[] {
  return offers
    .filter((o) => o.status === "matched" && (o.fromHub === hubId || o.toHub === hubId))
    .map((o) => ({
      label: "Surplus matched",
      credits: MATCH_BONUS,
      detail: `${o.qty} ${o.unit}, ${nameOf(o.fromHub)}${o.toHub ? ` and ${nameOf(o.toHub)}` : ""}`,
    }));
}

export const totalCredits = (lines: CreditLine[]) => lines.reduce((a, l) => a + l.credits, 0);

export interface MatchSuggestion {
  offer: SurplusOffer;
  request: SurplusOffer;
  km: number;
}

const km = (a: Hub, b: Hub) => {
  const dy = (a.lat - b.lat) * 111;
  const dx = (a.lng - b.lng) * 111 * Math.cos((a.lat * Math.PI) / 180);
  return Math.hypot(dx, dy);
};

/** The nearest open offer that can cover an open request for the same resource. */
export function suggestMatch(offers: SurplusOffer[], hubs: Hub[]): MatchSuggestion | null {
  const open = offers.filter((o) => o.status === "open");
  let best: MatchSuggestion | null = null;
  for (const request of open.filter((o) => o.kind === "request")) {
    for (const offer of open.filter((o) => o.kind === "offer" && o.resource === request.resource && o.qty >= request.qty && o.fromHub !== request.fromHub)) {
      const a = hubs.find((h) => h.id === offer.fromHub);
      const b = hubs.find((h) => h.id === request.fromHub);
      if (!a || !b) continue;
      const d = km(a, b);
      if (!best || d < best.km) best = { offer, request, km: d };
    }
  }
  return best;
}
