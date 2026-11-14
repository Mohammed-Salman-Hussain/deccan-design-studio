import { formatHour, SCENARIO_BY_ID, simulateHubDay, weatherAt } from "./engine";
import type { Hub, Scenario } from "./types";

export interface PlanItem {
  h: number;
  kind: "waste" | "solar" | "storm" | "outage" | "tank" | "reuse" | "heat" | "peak";
  text: string;
}

export function hubPlan(hub: Hub, s: Scenario): { headline: string; items: PlanItem[] } {
  const pts = simulateHubDay(hub, s, true);
  const items: PlanItem[] = [];
  if (hub.biogasKgDay > 0) items.push({ h: 8, kind: "waste", text: `Kitchen wet waste goes to the biogas unit (about ${Math.round(hub.flats * 0.69)} kg today).` });
  else items.push({ h: 8, kind: "waste", text: "Wet waste is collected for the shared biogas unit at a neighbouring hub." });

  const solarStart = pts.find((p) => p.pumpSource === "solar");
  const solarEnd = [...pts].reverse().find((p) => p.pumpSource === "solar");
  if (solarStart && solarEnd) items.push({ h: solarStart.h, kind: "solar", text: `Tank fills on rooftop solar from ${formatHour(solarStart.h)} to ${formatHour(solarEnd.h)}.` });
  else if (hub.solarKwp === 0) items.push({ h: 10, kind: "solar", text: "No solar roof yet — pumps run in the cheaper 10 am – 6 pm window instead of peak hours." });

  const outages = SCENARIO_BY_ID[s].outages;
  const rainStart = pts.find((p) => p.rainMm > 1);
  if (s === "storm" && rainStart) {
    const full = pts.find((p) => p.h > 12 && p.tankPct >= 95);
    items.push({ h: 15, kind: "storm", text: `Storm expected around ${formatHour(Math.round(rainStart.h))}. Tanks top up${full ? ` by ${formatHour(Math.ceil(full.h * 2) / 2)}` : " early"}.` });
    if (hub.pits > 0) items.push({ h: rainStart.h + 0.5, kind: "reuse", text: `Roof runoff goes into ${hub.pits} recharge pit${hub.pits > 1 ? "s" : ""} instead of the street.` });
  }
  for (const [a, b] of outages) {
    const end = pts[Math.min(pts.length - 1, Math.floor((b * 60) / 10) - 1)];
    items.push({ h: a, kind: "outage", text: `Planned power cut ${formatHour(a)} – ${formatHour(b % 24 === 0 ? 24 : b)} for section ${hub.section}. Your tank carries you through — about ${Math.round(end.tankPct)}% left when power returns.` });
  }
  if (s === "heatwave") items.push({ h: 13, kind: "heat", text: "Heatwave: 42 °C by 2 pm. Gardens use treated water; please save water 2 – 5 pm." });
  if (s === "peak") items.push({ h: 18, kind: "peak", text: "Evening peak: pumps pause 6 – 10 pm. Lifts stay on; tanks were filled on solar." });
  if (hub.stpKLD > 0) items.push({ h: 21, kind: "reuse", text: hub.stpRegistered ? "Surplus treated water is listed for a Green Water Tanker booking tomorrow." : "Treated water flushes toilets and waters the garden. Register the STP to sell surplus." });
  items.sort((a, b) => a.h - b.h);

  const w = weatherAt(s, 14);
  const headline =
    s === "storm" ? "Storm tonight — tanks fill on solar first, then ride out the cut." :
    s === "heatwave" ? `Hot day ahead (${Math.round(w.temp + 6)} °C) — fill early, save water in the afternoon.` :
    s === "peak" ? "Busy evening on the grid — your hub pumps in daylight instead." :
    "A calm day — sunshine runs the pumps and nothing goes to waste.";
  return { headline, items };
}
