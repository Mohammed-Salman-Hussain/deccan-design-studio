import type { LoopId } from "@/lib/sim/types";
import type { HubPart } from "@/components/ll/ClientCanvas";

export type CostBand = "Low" | "Medium" | "High";
export type SensorGroup = "water" | "energy" | "drains" | "waste" | "biogas" | "stp" | "air";

export const GROUPS: { id: SensorGroup; label: string; loops: LoopId[] }[] = [
  { id: "water", label: "Water", loops: ["save", "reuse"] },
  { id: "energy", label: "Pumps & energy", loops: ["solar", "save"] },
  { id: "drains", label: "Drains & rain", loops: ["rain"] },
  { id: "waste", label: "Waste", loops: ["waste"] },
  { id: "biogas", label: "Biogas", loops: ["waste", "solar"] },
  { id: "stp", label: "STP & treated water", loops: ["reuse"] },
  { id: "air", label: "Air & heat (optional)", loops: ["rain"] },
];

export interface Sensor {
  id: string;
  name: string;
  group: SensorGroup;
  loops: LoopId[];
  measures: string;
  mount: string;
  signal: string;
  connectivity: string;
  power: string;
  sampling: string;
  feeds: string;
  upkeep: string;
  failures: string;
  cost: CostBand;
  qty: (flats: number) => number;
}

const s = (x: Sensor) => x;

export const SENSORS: Sensor[] = [
  s({ id: "tank-level", name: "Radar or ultrasonic tank level sensor", group: "water", loops: ["solar", "save"], measures: "Water level in overhead tank and sump, as a percentage", mount: "Top of each overhead tank and sump, above the water line, clear of the inlet", signal: "4–20 mA", connectivity: "Wired to gateway analogue input", power: "24 V DC loop power from the gateway", sampling: "Every 30 s; every 5 s while filling", feeds: "Pump scheduling, pre-cut top-up, low-tank alert", upkeep: "Wipe lens every quarter; check zero and span at install and yearly", failures: "Foam or condensation on the lens, wrong blanking distance, loose terminal", cost: "Low", qty: (f) => 2 + Math.floor(f / 250) }),
  s({ id: "flow-pump", name: "Flow meter on the pump outlet", group: "water", loops: ["solar", "save"], measures: "Litres pumped and flow rate", mount: "Straight pipe run on the pump outlet, with the arrow along flow", signal: "Pulse output", connectivity: "Wired to gateway digital input", power: "12–24 V DC", sampling: "Pulse count every 10 s", feeds: "Tankers-avoided estimate, pump efficiency, leak flag", upkeep: "Check pulse constant against a bucket test at install", failures: "Air in the line, partly filled pipe, debris on the impeller", cost: "Medium", qty: (f) => 1 + Math.floor(f / 200) }),
  s({ id: "pressure", name: "Pressure transducer", group: "water", loops: ["solar", "save"], measures: "Pump discharge and riser pressure", mount: "Tapping on the pump discharge manifold", signal: "4–20 mA", connectivity: "Wired to gateway analogue input", power: "24 V DC loop power", sampling: "Every 10 s", feeds: "Dry-run and blocked-line detection", upkeep: "Zero check yearly; replace the diaphragm if readings drift", failures: "Clogged port, water hammer damage, drift", cost: "Low", qty: (f) => 1 + Math.floor(f / 250) }),
  s({ id: "borewell", name: "Borewell water-level probe", group: "water", loops: ["rain", "save"], measures: "Standing water level in the borewell", mount: "Hung in the borewell casing on a marked cable", signal: "4–20 mA", connectivity: "Wired to gateway analogue input", power: "24 V DC loop power", sampling: "Every 15 min", feeds: "Recharge pit effect, tanker dependence trend", upkeep: "Re-check cable depth marks yearly; pull and clean the probe every year", failures: "Cable stretch, silt on the sensor, lightning surge", cost: "Medium", qty: () => 1 }),
  s({ id: "quality", name: "Water quality probes (pH, turbidity, TDS, residual chlorine)", group: "water", loops: ["reuse"], measures: "pH, turbidity, dissolved solids and residual chlorine of stored and treated water", mount: "Flow cell on a sample line from the sump or the STP outlet", signal: "RS485 Modbus RTU", connectivity: "Wired to gateway RS485 bus", power: "12–24 V DC", sampling: "Every 5 min", feeds: "The quality gate before a pit top-up or a Green Water booking", upkeep: "Calibrate pH and chlorine monthly with standard solutions; clean the cell", failures: "Fouled electrodes, dried-out pH probe, air bubbles in the flow cell", cost: "High", qty: () => 1 }),

  s({ id: "energy-meter", name: "Smart energy meter with CT clamps", group: "energy", loops: ["solar", "save"], measures: "kWh, kW, voltage and power factor on the pump panel and the incomer", mount: "Inside the pump panel and main LT panel, with split-core CTs on each phase", signal: "RS485 Modbus RTU", connectivity: "Wired to gateway RS485 bus", power: "Self-powered from the measured supply", sampling: "Every 10 s", feeds: "Peak-hour shift savings, solar share, load profile", upkeep: "Check CT direction and ratio at commissioning; annual accuracy check", failures: "Reversed CT, loose neutral, wrong ratio setting", cost: "Medium", qty: (f) => 2 + Math.floor(f / 200) }),
  s({ id: "relay", name: "Smart relay or contactor control for pump timers", group: "energy", loops: ["solar", "save"], measures: "Switches the pump on and off and reports contactor state", mount: "In the pump starter panel, in series with the existing starter", signal: "Digital output with state feedback", connectivity: "Wired to gateway digital I/O", power: "24 V DC coil supply", sampling: "State on change; heartbeat every 30 s", feeds: "Solar-hour pump scheduling, pre-cut top-up", upkeep: "Test manual override monthly; keep the low-level float interlock live", failures: "Welded contacts, bypassed override, coil supply drop", cost: "Low", qty: (f) => 1 + Math.floor(f / 200) }),
  s({ id: "inverter", name: "Solar inverter data link", group: "energy", loops: ["solar"], measures: "AC output, daily yield and fault codes from the existing inverter", mount: "Inverter communication port, cabled to the gateway", signal: "RS485 Modbus RTU", connectivity: "Wired to gateway RS485 bus", power: "Powered by the inverter", sampling: "Every 30 s", feeds: "Solar forecast check, pump scheduling", upkeep: "Confirm Modbus address and register map with the inverter maker", failures: "Wrong register map, address clash, inverter firmware change", cost: "Low", qty: () => 1 }),
  s({ id: "feeder", name: "Feeder and transformer load monitor", group: "energy", loops: ["save"], measures: "Load percentage and temperature of the transformer or feeder", mount: "At the transformer LT side, installed by the discom or with its permission", signal: "RS485 Modbus RTU", connectivity: "NB-IoT or LTE gateway", power: "Self-powered from the measured supply", sampling: "Every minute", feeds: "Transformer watch ranking, evening-peak alerts", upkeep: "Annual check with the discom's lineman", failures: "Permission delays, CT access, cellular signal in the substation", cost: "High", qty: () => 1 }),

  s({ id: "nala-radar", name: "Radar water-level sensor in nalas", group: "drains", loops: ["rain"], measures: "Water level in a nala or culvert", mount: "Bracket on a bridge or culvert parapet, facing straight down at the water", signal: "4–20 mA or RS485", connectivity: "LoRaWAN or NB-IoT", power: "Solar panel with battery", sampling: "Every 5 min; every minute above a set level", feeds: "Drain risk ranking, flood alerts", upkeep: "Clean the lens and panel each quarter; check mounting after storms", failures: "Debris strikes, vandalism, mounting loosened by floods", cost: "Medium", qty: () => 0 }),
  s({ id: "rain-gauge", name: "Tipping-bucket rain gauge", group: "drains", loops: ["rain"], measures: "Rainfall in millimetres per hour", mount: "Open roof or pole, level, clear of trees and walls", signal: "Pulse output (0.2 mm per tip)", connectivity: "Wired to gateway, or LoRaWAN node", power: "Reed switch, node battery", sampling: "Pulse count every minute", feeds: "Storm triggers, recharge pit opening, calibration of the forecast", upkeep: "Clear the funnel monthly; level check each season", failures: "Blocked funnel, insects in the bucket, unlevel mounting", cost: "Low", qty: (f) => 1 + Math.floor(f / 400) }),
  s({ id: "drain-cam", name: "Camera with AI that flags garbage blockage at drain inlets", group: "drains", loops: ["rain", "waste"], measures: "Whether the inlet grating is blocked and by what share", mount: "Pole above a high-risk inlet, looking down at the grating", signal: "Image events (no continuous video leaves the device)", connectivity: "LTE", power: "Solar panel with battery", sampling: "A frame every 10 min; every minute in rain", feeds: "Which drain to clear first, proof that it was cleared", upkeep: "Clean the lens; review false alerts monthly; mask people and vehicles in frame", failures: "Lens fouling, night glare, privacy concerns if aimed carelessly", cost: "High", qty: () => 0 }),

  s({ id: "bin-fill", name: "Bin fill-level sensors", group: "waste", loops: ["waste"], measures: "How full each wet-waste bin is", mount: "Under the lid of each green bin at the collection point", signal: "I2C ultrasonic distance", connectivity: "LoRaWAN node", power: "Battery, about 2 years", sampling: "Every 30 min", feeds: "Collection routing, wet-waste volume forecast", upkeep: "Battery change every 2 years; clean the sensor face", failures: "Waste piling under the sensor, lid left open, battery flat", cost: "Low", qty: (f) => Math.max(2, Math.ceil(f / 60)) }),
  s({ id: "load-cell", name: "Load cells at the segregation point", group: "waste", loops: ["waste"], measures: "Weight of wet waste handed over each day", mount: "Under the weighing platform at the segregation shed", signal: "I2C load-cell ADC", connectivity: "Wired to gateway", power: "5 V DC", sampling: "On each weighing", feeds: "Waste diverted to biogas, segregation score", upkeep: "Calibrate with a known weight every quarter", failures: "Overload, water ingress, platform not level", cost: "Medium", qty: () => 1 }),
  s({ id: "qr-rfid", name: "QR or RFID tags for collection checks", group: "waste", loops: ["waste"], measures: "That a bin or lane was actually collected", mount: "On each bin or at lane gates", signal: "Tag scan on the worker's phone", connectivity: "Field app over mobile data", power: "Passive tags", sampling: "On each scan", feeds: "Collection proof for the Officer view and the shift summary", upkeep: "Replace damaged tags", failures: "Worn or painted-over tags, scanning skipped", cost: "Low", qty: (f) => Math.max(4, Math.ceil(f / 40)) }),
  s({ id: "gps", name: "GPS on collection vehicles", group: "waste", loops: ["waste"], measures: "Vehicle position and stops", mount: "Hard-wired under the dashboard", signal: "GNSS location", connectivity: "LTE", power: "Vehicle battery", sampling: "Every 15 s while moving", feeds: "Route checks and arrival time at the biogas unit", upkeep: "Check power wiring after servicing", failures: "Unplugged during repairs, poor sky view", cost: "Low", qty: () => 0 }),

  s({ id: "gas-flow", name: "Gas flow meter", group: "biogas", loops: ["waste", "solar"], measures: "Biogas produced, in cubic metres", mount: "On the gas line between the digester and the balloon or genset", signal: "Pulse output", connectivity: "Wired to gateway digital input", power: "12–24 V DC", sampling: "Every 10 s", feeds: "Biogas kWh, genset scheduling on cloudy days", upkeep: "Drain condensate; check for leaks with soapy water", failures: "Condensate blocking the meter, wrong gas calibration", cost: "Medium", qty: () => 1 }),
  s({ id: "gas-safety", name: "Methane and H₂S sensor", group: "biogas", loops: ["waste", "solar"], measures: "Methane and hydrogen sulphide in the digester room", mount: "High point for methane, low point for H₂S, away from vents", signal: "4–20 mA", connectivity: "Wired to gateway analogue input", power: "24 V DC loop power", sampling: "Every 5 s", feeds: "Safety alarm and shut-off, gas quality for the genset", upkeep: "Bump-test monthly; replace the cell on schedule", failures: "Poisoned cell, drift, sensors placed in dead air", cost: "High", qty: () => 1 }),
  s({ id: "digester-temp", name: "Digester temperature and pH sensor", group: "biogas", loops: ["waste"], measures: "Slurry temperature and pH", mount: "Probe pocket in the digester wall", signal: "RS485 Modbus RTU", connectivity: "Wired to gateway RS485 bus", power: "12–24 V DC", sampling: "Every 5 min", feeds: "Feed-quality monitoring, early warning of a souring digester", upkeep: "Calibrate pH monthly; clean the probe", failures: "Fouled electrode, probe pocket leak", cost: "Medium", qty: () => 1 }),
  s({ id: "feed-scale", name: "Feed-weight scale", group: "biogas", loops: ["waste"], measures: "Weight of wet waste fed into the digester", mount: "Under the feed hopper", signal: "I2C load-cell ADC", connectivity: "Wired to gateway", power: "5 V DC", sampling: "On each feed", feeds: "Waste diverted to biogas and feed-rate guidance", upkeep: "Calibrate with a known weight every quarter", failures: "Overload, spillage on the platform", cost: "Medium", qty: () => 1 }),

  s({ id: "do-sensor", name: "Dissolved oxygen sensor", group: "stp", loops: ["reuse"], measures: "Dissolved oxygen in the aeration tank", mount: "Hung in the aeration tank on a guide rail", signal: "4–20 mA", connectivity: "Wired to gateway analogue input", power: "24 V DC loop power", sampling: "Every minute", feeds: "Blower scheduling and early warning of a failing plant", upkeep: "Clean and recalibrate monthly; replace the membrane yearly", failures: "Biofilm on the membrane, drift, cable damage", cost: "High", qty: () => 1 }),
  s({ id: "stp-flow", name: "Inflow and outflow flow meters", group: "stp", loops: ["reuse"], measures: "Sewage in and treated water out", mount: "On the inlet channel or pipe and on the treated-water outlet", signal: "Pulse output", connectivity: "Wired to gateway digital inputs", power: "12–24 V DC", sampling: "Every 10 s", feeds: "Treated-output drop with normal inflow, which flags a failing plant", upkeep: "Check totals against a tank fill each quarter", failures: "Partly filled pipes, solids on the sensor", cost: "Medium", qty: () => 2 }),
  s({ id: "stp-quality", name: "STP turbidity and pH", group: "stp", loops: ["reuse"], measures: "Clarity and pH of treated water", mount: "Flow cell on the treated-water line", signal: "RS485 Modbus RTU", connectivity: "Wired to gateway RS485 bus", power: "12–24 V DC", sampling: "Every 5 min", feeds: "The quality gate for reuse, pit top-up and Green Water booking", upkeep: "Clean the cell weekly at first; calibrate monthly", failures: "Fouling, air bubbles, expired buffer solutions", cost: "Medium", qty: () => 1 }),
  s({ id: "blower-ct", name: "Blower current monitor", group: "stp", loops: ["reuse", "solar"], measures: "Blower motor current and run hours", mount: "CT on the blower motor feed in the STP panel", signal: "4–20 mA or Modbus", connectivity: "Wired to gateway", power: "Self-powered CT loop", sampling: "Every 10 s", feeds: "Solar-hour blower schedule and a failing-blower flag", upkeep: "Check CT seating at each service", failures: "Loose CT, wrong rating", cost: "Low", qty: () => 1 }),

  s({ id: "pm", name: "PM2.5 and PM10 sensor", group: "air", loops: ["rain"], measures: "Fine particles in the air", mount: "Louvred housing on a pole or rooftop, 2–3 m above ground", signal: "I2C or UART", connectivity: "LoRaWAN node", power: "Solar panel with battery", sampling: "Every 5 min", feeds: "Optional air-quality overlay near waste hotspots", upkeep: "Blow out the inlet monthly; compare with a reference station yearly", failures: "Humidity errors, dust-clogged fan, drift", cost: "Low", qty: () => 0 }),
  s({ id: "temp-hum", name: "Temperature and humidity sensor", group: "air", loops: ["solar"], measures: "Air temperature and relative humidity", mount: "Radiation shield on the roof, away from heat sources", signal: "I2C", connectivity: "Wired to gateway or LoRaWAN node", power: "3.3–5 V DC", sampling: "Every minute", feeds: "Heat scenarios, solar derating, water demand forecast", upkeep: "Compare with a reference thermometer yearly", failures: "Sun-heated housing, condensation", cost: "Low", qty: () => 1 }),
];

/* ---------- per-hub wiring ---------- */

export type ConnType = "4–20 mA" | "RS485 Modbus" | "Pulse" | "I²C" | "Digital I/O" | "UART / Wiegand" | "LoRaWAN" | "Ethernet / LTE";

export const CONN_COLOR: Record<ConnType, string> = {
  "4–20 mA": "var(--loop-reuse)",
  "RS485 Modbus": "var(--loop-solar)",
  Pulse: "var(--loop-rain)",
  "I²C": "var(--loop-waste)",
  "Digital I/O": "var(--loop-save)",
  "UART / Wiegand": "var(--primary-glow)",
  LoRaWAN: "var(--info)",
  "Ethernet / LTE": "var(--foreground)",
};

export interface WireDevice {
  name: string;
  conn: ConnType;
  port: string;
  topic: string;
  note?: string;
}

export const PART_LABEL: Record<HubPart, string> = {
  solar: "Solar roof", oht: "Overhead tank", sump: "Sump", pump: "Pump room", biogas: "Biogas unit", stp: "Sewage plant", pit: "Recharge pit", garden: "Garden reuse", gateway: "Edge gateway", kitchen: "Kitchens",
};

export const PART_ORDER: HubPart[] = ["gateway", "oht", "sump", "pump", "solar", "kitchen", "biogas", "stp", "pit", "garden"];

export function wiring(hubId: string): Record<HubPart, WireDevice[]> {
  const t = (p: string) => `looplocal/${hubId}/${p}`;
  return {
    gateway: [
      { name: "Edge gateway (rules engine, 4 GB log buffer)", conn: "Ethernet / LTE", port: "WAN-1 / SIM-1", topic: t("gateway/status"), note: "Runs local rules if the cloud link drops." },
      { name: "LoRaWAN concentrator for remote nodes", conn: "LoRaWAN", port: "LORA-1", topic: t("gateway/lora/uplink") },
    ],
    oht: [
      { name: "Radar level sensor", conn: "4–20 mA", port: "AI-1", topic: t("water/oht/level_pct") },
      { name: "Float switch (backup low level)", conn: "Digital I/O", port: "DI-3", topic: t("water/oht/low_float") },
    ],
    sump: [
      { name: "Ultrasonic level sensor", conn: "4–20 mA", port: "AI-2", topic: t("water/sump/level_pct") },
      { name: "Quality probe set (pH, turbidity, TDS, chlorine)", conn: "RS485 Modbus", port: "RS485-A · addr 12", topic: t("water/sump/quality") },
    ],
    pump: [
      { name: "Smart energy meter with CT clamps", conn: "RS485 Modbus", port: "RS485-A · addr 1", topic: t("energy/pump/meter") },
      { name: "Pump outlet flow meter", conn: "Pulse", port: "DI-1", topic: t("water/pump/flow_lpm") },
      { name: "Pressure transducer", conn: "4–20 mA", port: "AI-3", topic: t("water/pump/pressure_bar") },
      { name: "Smart contactor relay", conn: "Digital I/O", port: "DO-1 / DI-2", topic: t("energy/pump/state"), note: "Manual override and low-level float stay in series." },
    ],
    solar: [
      { name: "Solar inverter data link", conn: "RS485 Modbus", port: "RS485-B · addr 5", topic: t("energy/solar/inverter") },
      { name: "Temperature and humidity sensor", conn: "I²C", port: "I2C-1", topic: t("air/roof/temp_rh") },
    ],
    kitchen: [
      { name: "Bin fill-level sensors", conn: "LoRaWAN", port: "via LORA-1", topic: t("waste/bins/fill_pct") },
      { name: "Load cell at the segregation point", conn: "I²C", port: "I2C-2", topic: t("waste/segregation/kg") },
      { name: "QR or RFID reader", conn: "UART / Wiegand", port: "UART-1", topic: t("waste/collection/scan") },
    ],
    biogas: [
      { name: "Gas flow meter", conn: "Pulse", port: "DI-4", topic: t("biogas/flow_m3") },
      { name: "Methane and H₂S sensor", conn: "4–20 mA", port: "AI-4", topic: t("biogas/safety") },
      { name: "Digester temperature and pH", conn: "RS485 Modbus", port: "RS485-B · addr 20", topic: t("biogas/digester") },
      { name: "Feed-weight scale", conn: "I²C", port: "I2C-3", topic: t("biogas/feed_kg") },
    ],
    stp: [
      { name: "Dissolved oxygen sensor", conn: "4–20 mA", port: "AI-5", topic: t("stp/do_mgl") },
      { name: "Inflow flow meter", conn: "Pulse", port: "DI-5", topic: t("stp/inflow_lpm") },
      { name: "Outflow flow meter", conn: "Pulse", port: "DI-6", topic: t("stp/outflow_lpm") },
      { name: "Blower current monitor", conn: "4–20 mA", port: "AI-6", topic: t("stp/blower_amp") },
      { name: "Turbidity and pH", conn: "RS485 Modbus", port: "RS485-B · addr 30", topic: t("stp/quality") },
    ],
    pit: [
      { name: "Pit water-level probe", conn: "4–20 mA", port: "AI-7", topic: t("rain/pit/level_cm") },
      { name: "Diverter valve actuator", conn: "Digital I/O", port: "DO-2 / DI-7", topic: t("rain/pit/valve") },
      { name: "Tipping-bucket rain gauge", conn: "Pulse", port: "DI-8", topic: t("rain/gauge/mm") },
    ],
    garden: [
      { name: "Irrigation line flow meter", conn: "Pulse", port: "DI-9", topic: t("reuse/garden/flow_lpm") },
    ],
  };
}

/* ---------- data flow ---------- */

export const TOPIC_TREE = `looplocal/
└── {hub_id}/                    e.g. H-SSR
    ├── water/
    │   ├── oht/level_pct        tank level, %
    │   ├── sump/level_pct
    │   ├── pump/flow_lpm
    │   └── pump/pressure_bar
    ├── energy/
    │   ├── pump/meter           kW, kWh, pf
    │   ├── pump/state           on | off | fault
    │   └── solar/inverter       kW, yield, fault
    ├── rain/
    │   ├── gauge/mm
    │   └── pit/level_cm
    ├── waste/
    │   ├── bins/fill_pct
    │   └── segregation/kg
    ├── biogas/
    │   ├── flow_m3
    │   └── safety               ch4_pct, h2s_ppm
    ├── stp/
    │   ├── inflow_lpm   outflow_lpm
    │   ├── do_mgl       blower_amp
    │   └── quality              ph, ntu
    ├── gateway/status           link, rules, firmware
    └── cmd/                     (cloud → hub, signed)
        ├── pump/schedule
        └── pit/valve`;

export const SAMPLE_PAYLOAD = `{
  "hub": "H-SSR",
  "topic": "water/oht/level_pct",
  "ts": "2026-11-14T13:42:10+05:30",
  "seq": 48213,
  "value": 27.4,
  "unit": "pct",
  "sensor": "oht-radar-01",
  "quality": "good",
  "battery_v": null,
  "fw": "1.4.2"
}`;

export const THRESHOLDS: { rule: string; when: string; action: string; owner: string }[] = [
  { rule: "Tank low before a cut", when: "Tank level < 30% and a discom cut is forecast within 4 hours", action: "Start the pump on the best source, alert the pump operator", owner: "Pump operator" },
  { rule: "Pre-storm top-up", when: "Rain forecast > 20 mm/h and tank < 95%", action: "Fill tanks on solar, open recharge pit valves", owner: "Core engine" },
  { rule: "Dry run", when: "Pump on, flow < 10% of rated, pressure low for 60 s", action: "Stop the pump, flag a fault", owner: "Gateway (local)" },
  { rule: "Drain at risk", when: "Nala level > 80% of design depth or inlet blocked > 60%", action: "Raise the drain to the top of the queue", owner: "Officer" },
  { rule: "Failing STP", when: "Inflow normal and treated output down > 15% over 3 days", action: "Create a blower-check task", owner: "STP technician" },
  { rule: "Gas hazard", when: "Methane > 20% LEL or H₂S > 10 ppm", action: "Sound the alarm, close the feed valve, notify the operator", owner: "Gateway (local)" },
  { rule: "Feeder overload", when: "Transformer load > 90% during the evening peak", action: "Ask hubs to defer pumping to the solar window", owner: "Officer" },
  { rule: "Quality fails", when: "Treated turbidity > 10 NTU or pH outside 6.5–8.5", action: "Block pit top-up and Green Water booking", owner: "Core engine" },
];

/* ---------- integrations without new hardware ---------- */

export type Availability = "Public" | "Needs permission" | "Simulated";

export const NO_HARDWARE: { source: string; data: string; use: string; status: Availability }[] = [
  { source: "Weather forecast API", data: "Rain, wind, temperature and cloud forecast", use: "Storm triggers, solar forecast, heat scenarios", status: "Public" },
  { source: "Satellite imagery", data: "Cloud cover, flooded areas, land cover", use: "Solar forecast check and flood footprint", status: "Public" },
  { source: "Public complaint portals", data: "Reported blocked drains, garbage and water issues", use: "Priority for drain clearing and waste routing", status: "Needs permission" },
  { source: "Discom planned-outage notices", data: "Planned cut times by section", use: "Pre-cut tank top-up and outage plans", status: "Needs permission" },
  { source: "HMWSSB tanker and registration data", data: "Tanker bookings and STP registration status", use: "Tanker baseline and the STP registration tracker", status: "Needs permission" },
  { source: "Existing meter readings and bills", data: "Monthly kWh and water use per hub", use: "Phase 1 baseline before any sensors are added", status: "Needs permission" },
  { source: "Resident and worker reports", data: "Issue reports with a pin and photo; task completions", use: "Task queue and proof of work", status: "Simulated" },
  { source: "Hub telemetry (tanks, pumps, STP)", data: "Live levels, flows and power", use: "Everything on the Hub Twin and Command screens", status: "Simulated" },
];

/* ---------- role checklists ---------- */

export type RoleKey = "officer" | "vendor" | "tech" | "resident";

export const CHECKLISTS: Record<RoleKey, { title: string; blurb: string; items: string[] }> = {
  officer: {
    title: "Officer",
    blurb: "Approvals, data-sharing and alert rules before anything goes live.",
    items: [
      "Approve which hubs and feeders take part, and who owns each",
      "Sign data-sharing terms for discom outage notices and HMWSSB booking data",
      "Set alert thresholds with the water board and discom (tank, drain, feeder)",
      "Decide who may press Dispatch, and who verifies completed tasks",
      "Agree escalation: who is called if a task is not acknowledged",
      "Approve the privacy rules for resident reports and camera use",
      "Review the audit log weekly for the first month",
    ],
  },
  vendor: {
    title: "Vendor",
    blurb: "Install and test steps for each hub.",
    items: [
      "Survey the hub: pump panel, tanks, STP, digester, roof and network signal",
      "Fit the gateway in a lockable, ventilated enclosure with surge protection",
      "Install and label each sensor; photograph every connection",
      "Commission each device with its certificate and confirm the topic in the broker",
      "Check CT direction and ratio on every energy meter",
      "Run a bucket test on each flow meter and record the pulse constant",
      "Test local rules: unplug the WAN and confirm tanks still fill and alerts fire",
      "Hand over the as-built wiring diagram and the spare parts list",
    ],
  },
  tech: {
    title: "Field technician",
    blurb: "Calibration and maintenance routine.",
    items: [
      "Weekly: walk the hub, check gateway lights and the last-seen time of each device",
      "Monthly: calibrate pH, DO and chlorine probes; bump-test the gas sensor",
      "Monthly: clear rain gauge funnels and wipe level-sensor lenses",
      "Quarterly: check load cells with a known weight and flow meters with a bucket",
      "Quarterly: test the pump manual override and the low-level float interlock",
      "After every storm: check nala sensor mountings and drain cameras",
      "Yearly: re-check CT ratios, borewell probe depth marks and surge protection",
      "Log every visit in the field app, with a photo",
    ],
  },
  resident: {
    title: "Resident",
    blurb: "What residents will see and do.",
    items: [
      "See today's plan for the hub in plain language, in English, Telugu or Hindi",
      "Watch the tank level and the solar and biogas share",
      "Get alerts for storms, planned power cuts for their section and boil-water advisories",
      "Segregate wet and dry waste; see the hub's segregation score",
      "Report a blocked drain, garbage pile, foul-smelling water or streetlight with a photo and pin",
      "Offer or request surplus treated water, biogas or solar from a neighbouring hub",
      "Nothing to install and no personal data collected from sensors",
    ],
  },
};

/* ---------- rollout ---------- */

export const PHASES: { id: string; name: string; scope: string; needs: string; exit: string }[] = [
  { id: "p0", name: "Phase 0 · Simulated prototype", scope: "The software you are looking at: engine, three role views, storm simulator, hardware plan.", needs: "Nothing beyond a browser.", exit: "Officers and RWAs agree the actions and numbers make sense." },
  { id: "p1", name: "Phase 1 · Software with existing meters and bills", scope: "Pull weather, outage notices and booking data. Enter meter readings and bills by hand or by import for a few hubs.", needs: "Data-sharing permissions; one RWA volunteer per hub.", exit: "Recommendations match what officers and pump operators would have done." },
  { id: "p2", name: "Phase 2 · Low-cost sensors at one hub", scope: "Gateway, tank levels, pump meter and relay, rain gauge, and STP flow at a single willing hub.", needs: "A vendor install, a field technician, and a signed maintenance routine.", exit: "Local rules tested, calibration stable for 60 days, tanker and peak kWh baselines measured." },
  { id: "p3", name: "Phase 3 · A cluster of hubs with surplus sharing", scope: "Several hubs on one feeder or drain, sharing treated water and biogas, feeding the water board's platform.", needs: "Cluster agreement, booking integration, officer sign-off on dispatch rules.", exit: "Measured Loop Score and savings reported against the Phase 2 baseline." },
];

/* ---------- assistant knowledge base & tutorials ---------- */

export const KB: { q: string; keywords: string[]; a: string }[] = [
  { q: "Which sensor tells me the tank is low?", keywords: ["tank", "low", "level", "empty", "overhead", "sump"], a: "A radar or ultrasonic level sensor on top of each overhead tank and sump (4–20 mA into the gateway). A float switch sits alongside as a backup low-level alarm. The rule 'tank under 30% before a forecast cut' uses it to start the pump." },
  { q: "What if the internet drops?", keywords: ["internet", "drop", "offline", "cloud", "link", "connection", "network", "fail"], a: "The edge gateway at each hub keeps running local rules: fill tanks before a cut, open recharge pit valves when the gauge shows rain, stop a dry-running pump, and sound gas alarms. It buffers readings and uploads them when the link returns. The Architecture tab shows this failover." },
  { q: "How is the data secured?", keywords: ["secure", "security", "safe", "encrypt", "certificate", "tls", "privacy", "hack"], a: "Each device has its own certificate, every link uses TLS, MQTT topics are permissioned per device, and each role sees only what it needs. Dispatch and completion are written to an audit log. The Security page walks through each layer." },
  { q: "What does it cost to start?", keywords: ["cost", "price", "budget", "cheap", "expensive", "afford", "rupee", "money"], a: "Phase 1 needs no new hardware. Phase 2 starts with low-cost items: level sensors, a rain gauge, a smart relay and a gateway. Quality probes, gas sensors and cameras are the high-cost items. The Sizer tab gives indicative bands for your flat count; they are a guide, not a quote." },
  { q: "How do pumps run on solar?", keywords: ["pump", "solar", "schedule", "relay", "contactor", "timer", "sun"], a: "A smart relay in series with the pump starter lets the Core switch the pump into sunlit hours, using the inverter data link and the cloud forecast. The manual override and low-level float stay live, so people can always take control." },
  { q: "How do I connect a sensor to the gateway?", keywords: ["connect", "wire", "wiring", "port", "modbus", "rs485", "4-20", "pulse", "i2c", "install"], a: "Analogue sensors go to AI ports as 4–20 mA, pulse meters to DI ports, Modbus devices to the RS485 bus with a unique address, and small digital sensors over I²C. The Wiring tab shows each device's port and data topic for the hub you have selected." },
  { q: "How is STP water quality checked?", keywords: ["stp", "treated", "quality", "ph", "turbidity", "green", "sewage", "chlorine"], a: "Turbidity and pH probes sit on the treated-water line. The Core releases water for reuse, a pit top-up or a Green Water booking only when readings pass the thresholds. A normal inflow with falling output flags a failing plant." },
  { q: "How do I know a drain is about to choke?", keywords: ["drain", "nala", "clog", "choke", "flood", "camera", "blockage"], a: "A radar level sensor in the nala, a rain gauge and an AI camera at the inlet feed the drain risk ranking. Even without hardware, the model ranks drains from forecast rain, width versus design width and waste segregation." },
  { q: "What about biogas safety?", keywords: ["biogas", "methane", "gas", "h2s", "safety", "digester", "explosion"], a: "A methane and H₂S sensor in the digester room is wired for a local alarm and feed-valve shut-off at the gateway, independent of the cloud. Bump-test it monthly and replace cells on schedule." },
  { q: "How often does equipment need calibration?", keywords: ["calibrate", "calibration", "maintenance", "upkeep", "service", "clean", "monthly"], a: "pH, DO and chlorine probes monthly; gas sensors bump-tested monthly; load cells and flow meters quarterly; CT ratios and borewell probes yearly. The Checklists tab has the full technician routine." },
  { q: "Can I start without any hardware?", keywords: ["without", "software", "start", "begin", "no hardware", "phase", "rollout"], a: "Yes. Phase 1 uses weather, outage notices, booking data and existing meter bills. See the 'No hardware' tab for each source and whether it is public or needs permission." },
  { q: "What is MQTT and what do the topics look like?", keywords: ["mqtt", "topic", "payload", "json", "message", "broker"], a: "MQTT is a lightweight publish and subscribe protocol. Each reading goes to a topic like looplocal/H-SSR/water/oht/level_pct with a small JSON payload. The Data & alerts tab shows the full topic tree and a sample payload." },
  { q: "Who does what during installation?", keywords: ["vendor", "officer", "technician", "role", "responsibility", "who", "checklist"], a: "Officers approve hubs, data sharing and alert rules. The vendor installs and tests. Field technicians calibrate and maintain. Residents see plans and alerts. The Checklists tab has a list for each role." },
];

export const TUTORIALS: { id: string; title: string; time: string; steps: string[] }[] = [
  { id: "t-level", title: "Install a tank level sensor", time: "30 min", steps: ["Isolate the tank inlet and note the maximum water level.", "Mount the sensor on the tank lid, facing straight down, at least the blanking distance above the water line.", "Run 2-core shielded cable to the gateway and connect to an AI port (24 V loop, 4–20 mA).", "Set 4 mA to empty and 20 mA to full in the gateway.", "Fill and drain a known volume to confirm the percentage, then label the cable and photograph it."] },
  { id: "t-energy", title: "Fit a smart energy meter with CTs", time: "45 min", steps: ["Switch off the panel and lock it out.", "Clip one CT around each phase conductor with the arrow towards the load.", "Wire the voltage taps and the RS485 pair, and set a unique Modbus address.", "Switch on, and compare the meter's kW with a clamp meter.", "Record the CT ratio in the gateway configuration."] },
  { id: "t-flow", title: "Commission a pulse flow meter", time: "40 min", steps: ["Install on a straight pipe run, with the arrow along flow and the pipe running full.", "Connect the pulse output to a DI port and confirm pulses on the gateway.", "Fill a marked bucket and count pulses to set the litres-per-pulse constant.", "Enter the constant and check the total after a full tank fill."] },
  { id: "t-relay", title: "Add a smart relay to a pump starter", time: "1 hour", steps: ["Isolate and lock out the starter panel.", "Wire the relay in series with the existing start command, keeping the manual override and low-level float in place.", "Connect the state feedback contact to a DI port.", "Test: manual override works, float stops the pump, and a schedule from the gateway starts it.", "Leave a laminated note on the panel explaining the override."] },
  { id: "t-rain", title: "Set up a rain gauge", time: "20 min", steps: ["Choose an open, level spot away from walls and trees.", "Fix the gauge with the funnel level, and clean the bucket mechanism.", "Connect the reed switch pulse output to a DI port.", "Pour a measured amount of water through the funnel and confirm the tips match 0.2 mm each."] },
  { id: "t-quality", title: "Calibrate a pH and turbidity probe", time: "30 min", steps: ["Rinse the probe in clean water.", "Place it in pH 7 buffer and set the offset, then pH 4 or 10 for the slope.", "Check turbidity against a standard solution.", "Return the probe to the flow cell, purge air bubbles, and log the date and readings."] },
  { id: "t-gas", title: "Bump-test a methane and H₂S sensor", time: "20 min", steps: ["Warn the digester operator and open the vents.", "Apply test gas from a small cylinder for 30 seconds.", "Confirm the reading rises and the gateway alarm triggers.", "Check the feed valve closes, then reset and log the result."] },
  { id: "t-gateway", title: "Commission the edge gateway", time: "1 hour", steps: ["Mount the gateway in a lockable, ventilated enclosure with surge protection.", "Load the device certificate and confirm the TLS connection to the broker.", "Add each sensor and check its data topic in the broker.", "Unplug the WAN and confirm local rules still run, then reconnect and confirm buffered data uploads."] },
];
