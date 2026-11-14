import { drainRisk, feederLoad, formatHour, summarizeHub } from "./engine";
import type { Action, Hub, Locality, Scenario } from "./types";

export const CREW = {
  sanitation: { name: "Ramesh Kumar", crew: "Sanitation crew 4" },
  sanitation2: { name: "Lakshmamma", crew: "Sanitation crew 2" },
  pump: { name: "Srinivas Rao", crew: "Pump operator" },
  plumber: { name: "Mohammed Imran", crew: "Plumber" },
  lineman: { name: "Venkatesh Goud", crew: "Lineman · Discom" },
  stp: { name: "Prasad Naidu", crew: "STP technician" },
  rwa: { name: "Anjali Reddy", crew: "RWA secretary" },
};

const SAFETY = {
  drain: "Wear gloves and gumboots. Never enter a manhole alone — use the jetting rod from the surface.",
  pump: "Isolate the panel and test for live voltage before touching the contactor.",
  plumber: "Keep the pit cover barricaded while open; mark it with reflective tape at night.",
  lineman: "Obtain line clear (LC) from the substation before climbing. Use an insulated hot stick.",
  stp: "Blower room is loud — wear ear protection. Check H₂S meter before entering the tank area.",
  waste: "Use the covered cart. Do not mix sharps or sanitary waste into wet waste bins.",
};

function mk(a: Omit<Action, "deadline" | "lat" | "lng"> & { at: { lat: number; lng: number } }): Action {
  const { at, ...rest } = a;
  return { ...rest, lat: at.lat, lng: at.lng, deadline: formatHour(a.deadlineHour) };
}

const byRisk = (loc: Locality, s: Scenario, h: number) =>
  [...loc.drains].map((d) => ({ d, r: drainRisk(d, s, h * 60, false) })).sort((a, b) => b.r - a.r);

const pick = <T,>(arr: T[], f: (x: T) => boolean, fallback: number = 0): T => arr.find(f) ?? arr[fallback];

export function generateActions(loc: Locality, s: Scenario): Action[] {
  const id = (k: string) => `${loc.id}:${s}:${k}`;
  const hubs = loc.hubs;
  const pitHub = [...hubs].sort((a, b) => b.pits - a.pits)[0];
  const noPit = pick(hubs, (h) => h.pits === 0);
  const noSolarSched = pick(hubs, (h) => h.solarKwp > 0 && h.solarKwp < 25, 1);
  const stpHub = [...hubs].sort((a, b) => b.stpKLD - a.stpKLD)[0];
  const unreg = pick(hubs, (h) => h.stpKLD > 0 && !h.stpRegistered);
  const bioHub = pick(hubs, (h) => h.biogasKgDay > 0 && h.name.includes("Block")) ?? hubs[0];
  const bio = bioHub.biogasKgDay > 0 ? bioHub : pick(hubs, (h) => h.biogasKgDay > 0);
  const noTx = pick(hubs, (h) => !h.ownTransformer && h.sanctionedKW > 15);
  const feeders = [...loc.feeders].map((f) => ({ f, l: feederLoad(f, loc, s, 19.5 * 60) })).sort((a, b) => b.l.pct - a.l.pct);
  const sur = summarizeHub(stpHub, s, 1439);
  const surplusKL = Math.max(8, Math.round(sur.surplusL / 1000));
  const site = loc.landmarks.find((l) => l.kind === "area")?.name ?? loc.name;

  const out: Action[] = [];

  if (s === "storm") {
    const top = byRisk(loc, s, 16);
    top.slice(0, 2).forEach(({ d, r }, i) =>
      out.push(mk({
        id: id(`drain-${d.id}`), title: `Clear Drain ${d.id} before 6 pm`, loop: "rain", place: d.name, at: d,
        reason: `Clog risk ${r}% with 38 mm/h rain forecast at 8 pm. ${d.kind === "nala" ? `Channel narrowed to ${d.widthM} m of ${d.designWidthM} m design width.` : "Silt and plastic at inlet reported this week."}`,
        deadlineHour: 18, priority: r, assignee: i === 0 ? CREW.sanitation.name : CREW.sanitation2.name, crew: i === 0 ? CREW.sanitation.crew : CREW.sanitation2.crew, target: "worker",
        notifyResident: `Drain ${d.id} near ${d.area} is being cleared before the storm.`,
        steps: ["Barricade the inlet and place the warning board", "Remove plastic and silt from the grating with the rake", "Jet the first 20 m of the channel", "Photograph the cleared inlet"],
        safety: SAFETY.drain, impact: { score: 1.6, litres: 0 }, source: "engine",
      })),
    );
    const pumpHub = pick(hubs, (h) => h.area === "Moosapet", 2);
    out.push(mk({
      id: id("pumpline"), title: `Inspect pump line PL-3 at ${pumpHub.name}`, loop: "solar", place: `${pumpHub.name}, ${pumpHub.area}`, at: pumpHub,
      reason: "Starter tripped twice on voltage dips last storm. A failed pump during the 7 pm cut leaves the block dry.",
      deadlineHour: 16, priority: 74, assignee: CREW.pump.name, crew: CREW.pump.crew, target: "worker",
      steps: ["Check the starter and overload relay", "Tighten loose terminals on the panel", "Test-run on solar for 10 minutes", "Log motor current"],
      safety: SAFETY.pump, impact: { score: 1.2, kwh: 6 }, source: "engine",
    }));
    out.push(mk({
      id: id("topup"), title: "Top up all overhead tanks by 4 pm on solar", loop: "solar", place: `All ${hubs.length} hubs`, at: { lat: loc.center[0], lng: loc.center[1] },
      reason: "Discom cut announced 7 pm – midnight for these sections. Full tanks carry homes through the outage.",
      deadlineHour: 16, priority: 71, assignee: CREW.pump.name, crew: CREW.pump.crew, target: "worker",
      notifyResident: "Tanks are filling on solar now and will be full by 4 pm, ahead of the 7 pm power cut.",
      steps: ["Switch pump timers to 'pre-storm fill'", "Confirm each OHT reaches 95%+", "Close the overflow valve"],
      safety: SAFETY.pump, impact: { score: 1.0, tankers: 2 }, source: "engine",
    }));
    out.push(mk({
      id: id("pits"), title: `Open recharge pit valves at ${pitHub.name}`, loop: "rain", place: `${pitHub.name}, ${pitHub.area}`, at: pitHub,
      reason: `${pitHub.pits} pits can take ~${(pitHub.pits * 9).toFixed(0)} kL/h of roof runoff instead of sending it to the street.`,
      deadlineHour: 17, priority: 66, assignee: CREW.plumber.name, crew: CREW.plumber.crew, target: "worker",
      steps: ["Remove leaf litter from the filter chamber", "Open the diverter valve from the roof downpipe", "Check the overflow to the drain is clear"],
      safety: SAFETY.plumber, impact: { score: 1.3, litres: pitHub.pits * 40000 }, source: "engine",
    }));
    const hot = loc.drains.find((d) => d.name.toLowerCase().includes("bazar")) ?? top[2].d;
    out.push(mk({
      id: id("market"), title: `Route market wet waste to biogas, keep it out of ${hot.id}`, loop: "waste", place: hot.name, at: hot,
      reason: "Vegetable waste dumped near the inlet is the top cause of this drain choking. Biogas unit has spare capacity today.",
      deadlineHour: 15, priority: 58, assignee: CREW.sanitation2.name, crew: CREW.sanitation2.crew, target: "worker",
      steps: ["Collect waste from the market back-lane", "Weigh at the segregation point", `Deliver to ${bio.name} biogas feed`],
      safety: SAFETY.waste, impact: { score: 0.9 }, source: "engine",
    }));
    out.push(mk({
      id: id("trees"), title: `Trim branches along ${feeders[0].f.name}`, loop: "save", place: feeders[0].f.area, at: { lat: loc.center[0] + 0.004, lng: loc.center[1] - 0.006 },
      reason: "48 km/h winds expected. Branches on the line caused the last 6-hour outage across 20+ colonies.",
      deadlineHour: 17, priority: 55, assignee: CREW.lineman.name, crew: CREW.lineman.crew, target: "worker",
      steps: ["Take line clear from the substation", "Trim branches within 1 m of conductors", "Pick up and clear cuttings from the road"],
      safety: SAFETY.lineman, impact: { score: 0.8 }, source: "engine",
    }));
    out.push(mk({
      id: id("boil"), title: "Send boil-water advisory to low-lying blocks", loop: "reuse", place: `${loc.name} low-lying lanes`, at: { lat: loc.center[0] - 0.006, lng: loc.center[1] + 0.008 },
      reason: "Flooded sumps can mix with drain water. Precautionary advice for 24 hours after the storm.",
      deadlineHour: 18, priority: 44, assignee: CREW.rwa.name, crew: CREW.rwa.crew, target: "resident",
      notifyResident: "Boil-water advisory: boil drinking water for 24 hours after tonight's storm if your sump was flooded.",
      steps: ["Share advisory on the RWA group", "Put a notice at the gate"], safety: "No field risk.", impact: { score: 0.4 }, source: "engine",
    }));
  }

  if (s === "normal") {
    out.push(mk({
      id: id("timer"), title: `Shift pump timer to 10 am – 3 pm at ${noSolarSched.name}`, loop: "solar", place: `${noSolarSched.name}, ${noSolarSched.area}`, at: noSolarSched,
      reason: "Pumps currently run 6 – 8 am at peak tariff (+₹1.50/unit). Solar covers them fully at midday.",
      deadlineHour: 11, priority: 64, assignee: CREW.pump.name, crew: CREW.pump.crew, target: "worker",
      notifyResident: "Your hub's pumps now run on rooftop solar between 10 am and 3 pm.",
      steps: ["Open the pump panel timer", "Set ON 10:00, OFF 15:00", "Keep low-level float override active"],
      safety: SAFETY.pump, impact: { score: 1.1, kwh: 18 }, source: "engine",
    }));
    out.push(mk({
      id: id("collect"), title: `Collect wet waste from ${bio.name}`, loop: "waste", place: `${bio.name}, ${bio.area}`, at: bio,
      reason: `${Math.round(bio.flats * 0.69)} kg/day of kitchen waste. Segregation at ${bio.segregation}% — feed the digester before noon.`,
      deadlineHour: 10, priority: 52, assignee: CREW.sanitation.name, crew: CREW.sanitation.crew, target: "worker",
      steps: ["Collect green bins floor by floor", "Reject mixed bags and tag the flat number", "Weigh and feed the digester"],
      safety: SAFETY.waste, impact: { score: 0.8 }, source: "engine",
    }));
    out.push(mk({
      id: id("blower"), title: `Check STP blower at ${stpHub.name}`, loop: "reuse", place: `${stpHub.name}, ${stpHub.area}`, at: stpHub,
      reason: "Inflow is normal but treated output fell 18% this week — a blower or diffuser may be failing.",
      deadlineHour: 13, priority: 61, assignee: CREW.stp.name, crew: CREW.stp.crew, target: "worker",
      steps: ["Read the blower current and DO level", "Inspect the diffuser header for clogging", "Shift aeration to the 10 am – 6 pm solar window"],
      safety: SAFETY.stp, impact: { score: 1.0, kwh: 12 }, source: "engine",
    }));
    out.push(mk({
      id: id("gwt"), title: `Book Green Water Tanker: ${surplusKL} kL from ${stpHub.name}`, loop: "reuse", place: `Construction site near ${site}`, at: { lat: stpHub.lat + 0.003, lng: stpHub.lng + 0.004 },
      reason: "Treated water passed today's turbidity and pH test. A nearby site needs curing water.",
      deadlineHour: 15, priority: 48, assignee: CREW.rwa.name, crew: CREW.rwa.crew, target: "resident",
      notifyResident: `${surplusKL} kL of treated water from your STP is booked by a nearby construction site.`,
      steps: ["Confirm quality report", "Accept the booking", "Log the tanker number at the gate"], safety: "No field risk.", impact: { score: 0.9, tankers: 2 }, source: "engine",
    }));
    const top = byRisk(loc, s, 12)[0];
    out.push(mk({
      id: id("desilt"), title: `Routine desilting of Drain ${top.d.id}`, loop: "rain", place: top.d.name, at: top.d,
      reason: `Highest dry-weather risk in the locality (${top.r}%). Clearing now prevents a choke at the next rain.`,
      deadlineHour: 16, priority: top.r, assignee: CREW.sanitation2.name, crew: CREW.sanitation2.crew, target: "worker",
      steps: ["Barricade the inlet", "Remove silt and plastics", "Photograph the cleared section"], safety: SAFETY.drain, impact: { score: 1.0 }, source: "engine",
    }));
    out.push(mk({
      id: id("survey"), title: `Survey a recharge pit site at ${noPit.name}`, loop: "rain", place: `${noPit.name}, ${noPit.area}`, at: noPit,
      reason: `No recharge pit, ${noPit.roofM2.toLocaleString("en-IN")} m² roof. Could recharge ~${Math.round(noPit.roofM2 * 0.6)} kL a monsoon.`,
      deadlineHour: 17, priority: 46, assignee: CREW.plumber.name, crew: CREW.plumber.crew, target: "worker",
      steps: ["Mark downpipe locations", "Check soil type near the setback", "Share sketch with RWA"], safety: SAFETY.plumber, impact: { score: 0.7 }, source: "engine",
    }));
    out.push(mk({
      id: id("register"), title: `Register ${unreg.name} STP for Green Water`, loop: "reuse", place: `${unreg.name}, ${unreg.area}`, at: unreg,
      reason: `${unreg.stpKLD} KLD plant is not registered — its surplus cannot be sold through Green Water Tankers.`,
      deadlineHour: 18, priority: 42, assignee: CREW.rwa.name, crew: CREW.rwa.crew, target: "resident",
      notifyResident: "Your STP can be registered for Green Water Tanker sales. Paperwork checklist sent to the RWA.",
      steps: ["Upload the latest quality report", "Submit the registration form", "Schedule inspection"], safety: "No field risk.", impact: { score: 0.6 }, source: "engine",
    }));
  }

  if (s === "heatwave") {
    out.push(mk({
      id: id("prefill"), title: "Pre-fill tanks before the 3 pm load-shedding", loop: "solar", place: `All ${hubs.length} hubs`, at: { lat: loc.center[0], lng: loc.center[1] },
      reason: "Demand is 22% above normal and the discom has scheduled a 90-minute cut at 3 pm.",
      deadlineHour: 14.5, priority: 76, assignee: CREW.pump.name, crew: CREW.pump.crew, target: "worker",
      notifyResident: "Tanks are being filled on solar before the 3 pm power cut. Please save water between 2 and 5 pm.",
      steps: ["Set timers to fill until 98%", "Check float switches", "Confirm sump has inflow"], safety: SAFETY.pump, impact: { score: 1.1, tankers: 1 }, source: "engine",
    }));
    out.push(mk({
      id: id("tx"), title: `Inspect transformer on ${feeders[0].f.name} — ${feeders[0].l.pct}% load`, loop: "save", place: feeders[0].f.area, at: { lat: loc.center[0] + 0.005, lng: loc.center[1] - 0.004 },
      reason: "Oil temperature rises fast above 90% load in 42 °C heat. Stagger pumps and lifts on this feeder.",
      deadlineHour: 13, priority: Math.min(95, feeders[0].l.pct), assignee: CREW.lineman.name, crew: CREW.lineman.crew, target: "worker",
      steps: ["Read oil and winding temperature", "Check LT fuses and lugs", "Report if above 85 °C"], safety: SAFETY.lineman, impact: { score: 0.9 }, source: "engine",
    }));
    out.push(mk({
      id: id("blower-shift"), title: `Shift STP blowers to 10 am – 2 pm at ${stpHub.name}`, loop: "reuse", place: stpHub.name, at: stpHub,
      reason: "Solar is at its peak; blowers off the evening grid save ₹1.50/unit and relieve the feeder.",
      deadlineHour: 10, priority: 54, assignee: CREW.stp.name, crew: CREW.stp.crew, target: "worker",
      steps: ["Change blower timer", "Confirm DO stays above 2 mg/L"], safety: SAFETY.stp, impact: { score: 0.8, kwh: 14 }, source: "engine",
    }));
    out.push(mk({
      id: id("green-garden"), title: "Use treated water for all garden watering", loop: "reuse", place: `${loc.name} hubs with STPs`, at: stpHub,
      reason: "Garden watering is 15% of heatwave demand — treated water avoids ~3 tanker trips today.",
      deadlineHour: 9, priority: 50, assignee: CREW.rwa.name, crew: CREW.rwa.crew, target: "resident",
      notifyResident: "Gardens are watered with treated STP water during the heatwave. Drinking supply is unaffected.",
      steps: ["Switch garden line to STP outlet", "Inform gardeners"], safety: "No field risk.", impact: { score: 0.7, tankers: 3 }, source: "engine",
    }));
    out.push(mk({
      id: id("borewell"), title: `Check borewell level at ${noPit.name}`, loop: "rain", place: noPit.name, at: noPit,
      reason: "Borewell yield drops in heat; no recharge pit here. Early warning before tanker bookings spike.",
      deadlineHour: 16, priority: 47, assignee: CREW.plumber.name, crew: CREW.plumber.crew, target: "worker",
      steps: ["Measure static water level", "Log pump run time"], safety: SAFETY.plumber, impact: { score: 0.5 }, source: "engine",
    }));
  }

  if (s === "peak") {
    out.push(mk({
      id: id("move-pumps"), title: "Move all pump runs out of 6 – 10 pm", loop: "save", place: `All ${hubs.length} hubs`, at: { lat: loc.center[0], lng: loc.center[1] },
      reason: "Evening load is 1.5× normal. Pumping now costs +₹1.50/unit and pushes feeders past 90%.",
      deadlineHour: 17.5, priority: 72, assignee: CREW.pump.name, crew: CREW.pump.crew, target: "worker",
      notifyResident: "Pumps are paused 6 – 10 pm to ease the evening grid. Tanks were filled on solar.",
      steps: ["Lock out evening timer slot", "Confirm tanks above 80%"], safety: SAFETY.pump, impact: { score: 1.2, kwh: 30 }, source: "engine",
    }));
    out.push(mk({
      id: id("feeder"), title: `Stagger lifts and pumps on ${feeders[0].f.name} — ${feeders[0].l.pct}%`, loop: "save", place: feeders[0].f.area, at: { lat: loc.center[0] + 0.004, lng: loc.center[1] - 0.005 },
      reason: "Projected to cross 95% at 8 pm. A trip here caused the 8:30 pm outage last week.",
      deadlineHour: 18, priority: Math.min(96, feeders[0].l.pct), assignee: CREW.lineman.name, crew: CREW.lineman.crew, target: "worker",
      steps: ["Coordinate with RWAs on feeder", "Monitor load at substation"], safety: SAFETY.lineman, impact: { score: 0.9 }, source: "engine",
    }));
    out.push(mk({
      id: id("tx-flag"), title: `${noTx.name} needs its own transformer (${noTx.sanctionedKW} kW)`, loop: "save", place: noTx.name, at: noTx,
      reason: "Apartments above 15 kW should have their own transformer. This load sits on the shared feeder.",
      deadlineHour: 20, priority: 57, assignee: CREW.rwa.name, crew: CREW.rwa.crew, target: "resident",
      notifyResident: "The discom has flagged that your complex should have its own transformer. The RWA will receive details.",
      steps: ["Share load details with discom AE", "Get estimate"], safety: "No field risk.", impact: { score: 0.5 }, source: "engine",
    }));
    out.push(mk({
      id: id("genset"), title: `Keep biogas genset on standby at ${bio.name}`, loop: "waste", place: bio.name, at: bio,
      reason: "A feeder trip is likely around 8:30 pm. Biogas can run the pump at reduced rate for ~4 hours.",
      deadlineHour: 19.5, priority: 49, assignee: CREW.pump.name, crew: CREW.pump.crew, target: "worker",
      steps: ["Check balloon pressure", "Test-start genset for 2 minutes"], safety: SAFETY.pump, impact: { score: 0.6 }, source: "engine",
    }));
  }

  return out.sort((a, b) => b.priority - a.priority);
}

export function routineTasks(loc: Locality): Action[] {
  const h: Hub = pick(loc.hubs, (x) => x.name.includes("Block C"));
  const stp = pick(loc.hubs, (x) => x.stpKLD > 0);
  const p4 = pick(loc.hubs, (x) => x.area.includes("Phase 4"), 0);
  return [
    mk({ id: `${loc.id}:routine:waste`, title: `Collect wet waste from ${h.name}`, loop: "waste", place: `${h.name}, ${h.area}`, at: h, reason: "Daily pickup for the biogas digester.", deadlineHour: 9.5, priority: 40, assignee: CREW.sanitation.name, crew: CREW.sanitation.crew, target: "worker", steps: ["Collect green bins", "Weigh at segregation point", "Feed digester"], safety: SAFETY.waste, impact: { score: 0.5 }, source: "routine" }),
    mk({ id: `${loc.id}:routine:stp`, title: `Morning STP check at ${stp.name}`, loop: "reuse", place: `${stp.name}, ${stp.area}`, at: stp, reason: "Daily DO and turbidity reading before water is released for reuse.", deadlineHour: 10, priority: 38, assignee: CREW.stp.name, crew: CREW.stp.crew, target: "worker", steps: ["Read DO meter", "Take turbidity sample", "Log values"], safety: SAFETY.stp, impact: { score: 0.4 }, source: "routine" }),
    mk({ id: `${loc.id}:routine:trees`, title: `Pick up tree cuttings at ${p4.area}`, loop: "waste", place: `${p4.area} park road`, at: { lat: p4.lat + 0.001, lng: p4.lng - 0.001 }, reason: "Green cuttings go to the compost bay, not the drain.", deadlineHour: 12, priority: 30, assignee: CREW.sanitation2.name, crew: CREW.sanitation2.crew, target: "worker", steps: ["Load cuttings on the tractor", "Drop at compost bay"], safety: SAFETY.waste, impact: { score: 0.3 }, source: "routine" }),
  ];
}
