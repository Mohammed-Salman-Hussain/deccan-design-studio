import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useApp } from "@/store/app";
import { LOOPS } from "@/lib/sim/loops";
import { LPCD, PERSONS_PER_FLAT, PIT_LPH, TANKER_L, TANKER_RS, TARIFF_RS, PEAK_SURCHARGE_RS, SOLAR_REBATE_RS } from "@/lib/sim/engine";

export const ASSUMPTIONS: { group: string; items: { k: string; v: string; note?: string }[] }[] = [
  {
    group: "Water",
    items: [
      { k: "Demand", v: `flats × ${PERSONS_PER_FLAT} persons × ${LPCD} L/day`, note: "Split across 24 h with morning and evening peaks." },
      { k: "Overhead tank", v: "≈ 0.35 kL per flat", note: "A tank is a battery: fill it when power is cheap or free." },
      { k: "Pump", v: "kW = flats ÷ 28 (3–11 kW) · 2,400 L/h per kW" },
      { k: "Tanker", v: `${TANKER_L.toLocaleString("en-IN")} L per trip · ₹${TANKER_RS.toLocaleString("en-IN")}` },
      { k: "Tankers avoided", v: "(extra reuse + pit top-up + 25% of recharge + shortage avoided) ÷ 5,000 L" },
    ],
  },
  {
    group: "Energy",
    items: [
      { k: "Solar output", v: "kWp × sin(π·(h−6.2)/12.6) × (1 − 0.75 × cloud)", note: "8% derate above 38 °C." },
      { k: "Common load", v: "flats × 0.045 kW × hourly profile × scenario load factor" },
      { k: "STP blower", v: "KLD × 0.035 kW · with LoopLocal 1.4× in 10 am–6 pm, 0.6× otherwise" },
      { k: "Tariff", v: `₹${TARIFF_RS}/unit · +₹${PEAK_SURCHARGE_RS} at 6–10 am & 6–10 pm · −₹${SOLAR_REBATE_RS} 10 am–6 pm`, note: "Applicability to common-area meters not confirmed." },
      { k: "kWh shifted", v: "Peak-hour grid kWh without LoopLocal − with LoopLocal" },
    ],
  },
  {
    group: "Waste & biogas",
    items: [
      { k: "Wet waste", v: "flats × 4.2 × 0.3 kg × 55% wet fraction" },
      { k: "Diverted", v: "min(wet waste × (segregation + 12%), digester capacity)" },
      { k: "Biogas", v: "0.06 m³ per kg · 1.7 kWh per m³ · genset runs at 3 kW" },
    ],
  },
  {
    group: "Rain & drains",
    items: [
      { k: "Roof runoff", v: "roof m² × rain mm × 0.8 (1 mm on 1 m² = 1 L)" },
      { k: "Recharge pit", v: `${PIT_LPH.toLocaleString("en-IN")} L/h per pit · 30% when not maintained` },
      { k: "Drain clog risk", v: "base silt risk + storm forecast (up to +22) + 0.12 × rain mm + 12 × (1 − waste diversion) − 6", note: "Cleared drains drop to 32% of their risk." },
    ],
  },
  {
    group: "Treated water",
    items: [
      { k: "STP output", v: "min(KLD capacity, 80% of water used)" },
      { k: "Priority", v: "1. flushing & gardens (30% of demand) → 2. recharge pit if quality passes → 3. Green Water Tanker sale" },
    ],
  },
  {
    group: "Loop Score",
    items: [
      { k: "Per loop", v: "0–100, see each loop's formula in the engine notes" },
      { k: "Locality", v: "flat-weighted mean of hub scores + completed task bonus (max +15)" },
    ],
  },
];

export function AssumptionsSheet() {
  const open = useApp((s) => s.assumptionsOpen);
  const set = useApp((s) => s.set);
  return (
    <Sheet open={open} onOpenChange={(o) => set({ assumptionsOpen: o })}>
      <SheetContent className="w-full overflow-y-auto border-l bg-popover sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="font-display">Assumptions & formulas</SheetTitle>
          <SheetDescription>Every estimate on screen comes from these transparent rules. Change a hub's inputs and the numbers follow.</SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-6 px-1 pb-8">
          <div className="flex flex-wrap gap-1.5">
            {LOOPS.map((l) => (
              <span key={l.id} className="rounded-full border px-2 py-0.5 text-[11px]" style={{ color: l.color, borderColor: `color-mix(in oklab, ${l.color} 40%, transparent)` }}>{l.short}</span>
            ))}
          </div>
          {ASSUMPTIONS.map((g) => (
            <div key={g.group}>
              <h4 className="mb-2 font-mono text-[11px] uppercase tracking-[0.18em] text-primary-glow">{g.group}</h4>
              <dl className="divide-y rounded-xl border">
                {g.items.map((i) => (
                  <div key={i.k} className="grid gap-1 px-3 py-2.5 text-xs">
                    <dt className="font-medium">{i.k}</dt>
                    <dd className="font-mono text-[11px] text-muted-foreground">{i.v}</dd>
                    {i.note && <dd className="text-[11px] italic text-muted-foreground/80">{i.note}</dd>}
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
