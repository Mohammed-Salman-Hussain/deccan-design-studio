import type { LoopId } from "@/lib/sim/types";

export type HubPart = "solar" | "oht" | "sump" | "pump" | "biogas" | "stp" | "pit" | "garden" | "gateway" | "kitchen";

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
  { source: "Hub telemetry (tanks, pumps, STP)", data: "Live levels, flows and power", use: "Everything on the LoopHub and Command screens", status: "Simulated" },
];

/* ---------- rollout ---------- */

export const PHASES: { id: string; name: string; scope: string; needs: string; exit: string }[] = [
  { id: "p0", name: "Phase 0 · Simulated prototype", scope: "The software you are looking at: engine, three role views, storm simulator, hardware plan.", needs: "Nothing beyond a browser.", exit: "Officers and RWAs agree the actions and numbers make sense." },
  { id: "p1", name: "Phase 1 · Software with existing meters and bills", scope: "Pull weather, outage notices and booking data. Enter meter readings and bills by hand or by import for a few hubs.", needs: "Data-sharing permissions; one RWA volunteer per hub.", exit: "Recommendations match what officers and pump operators would have done." },
  { id: "p2", name: "Phase 2 · Low-cost sensors at one hub", scope: "Gateway, tank levels, pump meter and relay, rain gauge, and STP flow at a single willing hub.", needs: "A vendor install, a field technician, and a signed maintenance routine.", exit: "Local rules tested, calibration stable for 60 days, tanker and peak kWh baselines measured." },
  { id: "p3", name: "Phase 3 · A cluster of hubs with surplus sharing", scope: "Several hubs on one feeder or drain, sharing treated water and biogas, feeding the water board's platform.", needs: "Cluster agreement, booking integration, officer sign-off on dispatch rules.", exit: "Measured Loop Score and savings reported against the Phase 2 baseline." },
];
