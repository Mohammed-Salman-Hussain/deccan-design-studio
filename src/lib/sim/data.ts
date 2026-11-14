import type { Drain, Feeder, Hub, Landmark, Locality, LoopId } from "./types";

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const KUKATPALLY_HUBS: Hub[] = [
  { id: "H-SSR", name: "Sri Sai Residency", flats: 212, area: "KPHB Phase 3", lat: 17.4958, lng: 78.3902, solarKwp: 40, biogasKgDay: 250, ohtKL: 75, sumpKL: 150, roofM2: 2600, pits: 2, stpKLD: 160, stpRegistered: true, ownTransformer: true, sanctionedKW: 120, segregation: 78, feeder: "F-KP-03", section: "KPHB-III" },
  { id: "H-LKH", name: "Lakshmi Heights", flats: 140, area: "KPHB Phase 1", lat: 17.4889, lng: 78.3929, solarKwp: 22, biogasKgDay: 0, ohtKL: 50, sumpKL: 100, roofM2: 1750, pits: 0, stpKLD: 100, stpRegistered: false, ownTransformer: false, sanctionedKW: 85, segregation: 54, feeder: "F-KP-01", section: "KPHB-I" },
  { id: "H-GPC", name: "Green Park Colony Block C", flats: 96, area: "Moosapet", lat: 17.4702, lng: 78.4238, solarKwp: 15, biogasKgDay: 120, ohtKL: 34, sumpKL: 70, roofM2: 1500, pits: 1, stpKLD: 0, stpRegistered: false, ownTransformer: false, sanctionedKW: 60, segregation: 66, feeder: "F-MS-01", section: "Moosapet-II" },
  { id: "H-VSN", name: "Vasavi Nilayam", flats: 180, area: "KPHB Phase 6", lat: 17.4838, lng: 78.3962, solarKwp: 30, biogasKgDay: 180, ohtKL: 64, sumpKL: 130, roofM2: 2200, pits: 0, stpKLD: 140, stpRegistered: false, ownTransformer: true, sanctionedKW: 105, segregation: 71, feeder: "F-KP-06", section: "KPHB-VI" },
  { id: "H-BLE", name: "Balaji Enclave", flats: 120, area: "Balanagar", lat: 17.4801, lng: 78.4425, solarKwp: 0, biogasKgDay: 0, ohtKL: 42, sumpKL: 90, roofM2: 1600, pits: 1, stpKLD: 90, stpRegistered: true, ownTransformer: false, sanctionedKW: 72, segregation: 48, feeder: "F-BN-02", section: "Balanagar-I" },
  { id: "H-PGT", name: "Pragathi Towers", flats: 260, area: "KPHB Phase 4", lat: 17.4862, lng: 78.3868, solarKwp: 55, biogasKgDay: 300, ohtKL: 92, sumpKL: 180, roofM2: 3100, pits: 3, stpKLD: 200, stpRegistered: true, ownTransformer: true, sanctionedKW: 150, segregation: 84, feeder: "F-KP-04", section: "KPHB-IV" },
  { id: "H-SVG", name: "Srinivasa Gardens", flats: 160, area: "KPHB Phase 2", lat: 17.4932, lng: 78.3991, solarKwp: 28, biogasKgDay: 0, ohtKL: 56, sumpKL: 110, roofM2: 2000, pits: 2, stpKLD: 120, stpRegistered: false, ownTransformer: false, sanctionedKW: 95, segregation: 62, feeder: "F-KP-02", section: "KPHB-II" },
  { id: "H-ANN", name: "Annapurna Nest", flats: 88, area: "Nalla Cheruvu", lat: 17.4913, lng: 78.4121, solarKwp: 12, biogasKgDay: 90, ohtKL: 30, sumpKL: 60, roofM2: 1200, pits: 0, stpKLD: 0, stpRegistered: false, ownTransformer: false, sanctionedKW: 48, segregation: 69, feeder: "F-KP-02", section: "Kukatpally-V" },
];

const KUKATPALLY_DRAINS: Drain[] = [
  { id: "D-01", name: "IDL nala — Kukatpally reach", area: "IDL", lat: 17.4842, lng: 78.4205, baseRisk: 62, widthM: 2, designWidthM: 7, kind: "nala" },
  { id: "D-02", name: "IDL nala — Moosapet culvert", area: "Moosapet", lat: 17.4748, lng: 78.4232, baseRisk: 58, widthM: 2.5, designWidthM: 7, kind: "culvert" },
  { id: "D-03", name: "KPHB Phase 2 main road drain", area: "KPHB Phase 2", lat: 17.4925, lng: 78.4003, baseRisk: 44, widthM: 1.2, designWidthM: 1.5, kind: "storm drain" },
  { id: "D-04", name: "KPHB Phase 4 inner drain", area: "KPHB Phase 4", lat: 17.4871, lng: 78.3881, baseRisk: 36, widthM: 1, designWidthM: 1.2, kind: "storm drain" },
  { id: "D-05", name: "Rythu Bazar back-lane drain", area: "Kukatpally", lat: 17.4866, lng: 78.4052, baseRisk: 66, widthM: 0.6, designWidthM: 1.2, kind: "storm drain" },
  { id: "D-06", name: "Nalla Cheruvu inlet channel", area: "Nalla Cheruvu", lat: 17.4921, lng: 78.4138, baseRisk: 49, widthM: 2, designWidthM: 3, kind: "nala" },
  { id: "D-07", name: "Moosapet main road drain", area: "Moosapet", lat: 17.4693, lng: 78.4262, baseRisk: 70, widthM: 0.8, designWidthM: 1.5, kind: "storm drain" },
  { id: "D-08", name: "Balanagar industrial drain", area: "Balanagar", lat: 17.4812, lng: 78.4452, baseRisk: 52, widthM: 1.5, designWidthM: 2, kind: "storm drain" },
  { id: "D-09", name: "KPHB Phase 6 box drain", area: "KPHB Phase 6", lat: 17.4829, lng: 78.3975, baseRisk: 41, widthM: 1.2, designWidthM: 1.5, kind: "storm drain" },
  { id: "D-10", name: "Khaitlapur approach drain", area: "Khaitlapur", lat: 17.4655, lng: 78.4142, baseRisk: 55, widthM: 1, designWidthM: 1.5, kind: "storm drain" },
  { id: "D-11", name: "KPHB Phase 1 culvert, JNTU road", area: "KPHB Phase 1", lat: 17.4901, lng: 78.3914, baseRisk: 47, widthM: 1.4, designWidthM: 2, kind: "culvert" },
  { id: "D-12", name: "Kukatpally Y-junction drain", area: "Kukatpally", lat: 17.4846, lng: 78.4118, baseRisk: 59, widthM: 1, designWidthM: 1.8, kind: "storm drain" },
];

const KUKATPALLY_FEEDERS: Feeder[] = [
  { id: "F-KP-01", name: "KPHB-I 11 kV", area: "KPHB Phase 1", capacityKVA: 630, baseLoadKVA: 410 },
  { id: "F-KP-02", name: "KPHB-II 11 kV", area: "KPHB Phase 2", capacityKVA: 500, baseLoadKVA: 360 },
  { id: "F-KP-03", name: "KPHB-III 11 kV", area: "KPHB Phase 3", capacityKVA: 630, baseLoadKVA: 380 },
  { id: "F-KP-04", name: "KPHB-IV 11 kV", area: "KPHB Phase 4", capacityKVA: 800, baseLoadKVA: 470 },
  { id: "F-KP-06", name: "KPHB-VI 11 kV", area: "KPHB Phase 6", capacityKVA: 500, baseLoadKVA: 330 },
  { id: "F-MS-01", name: "Moosapet 11 kV", area: "Moosapet", capacityKVA: 400, baseLoadKVA: 300 },
  { id: "F-BN-02", name: "Balanagar 11 kV", area: "Balanagar", capacityKVA: 630, baseLoadKVA: 470 },
];

const KUKATPALLY_LANDMARKS: Landmark[] = [
  { name: "KPHB Phase 1", lat: 17.4892, lng: 78.3935, kind: "area" },
  { name: "KPHB Phase 2", lat: 17.4942, lng: 78.4005, kind: "area" },
  { name: "KPHB Phase 3", lat: 17.4975, lng: 78.3905, kind: "area" },
  { name: "KPHB Phase 4", lat: 17.4855, lng: 78.3855, kind: "area" },
  { name: "KPHB Phase 5", lat: 17.4995, lng: 78.3975, kind: "area" },
  { name: "KPHB Phase 6", lat: 17.4815, lng: 78.3955, kind: "area" },
  { name: "Moosapet", lat: 17.4688, lng: 78.4258, kind: "area" },
  { name: "Balanagar", lat: 17.4795, lng: 78.4455, kind: "area" },
  { name: "Nalla Cheruvu", lat: 17.4925, lng: 78.4145, kind: "lake" },
  { name: "IDL nala", lat: 17.4838, lng: 78.4222, kind: "nala" },
  { name: "Khaitlapur transfer station", lat: 17.4648, lng: 78.4128, kind: "transfer" },
  { name: "Kukatpally Rythu Bazar", lat: 17.4872, lng: 78.4044, kind: "market" },
];

const fp = (waste: number, solar: number, rain: number, reuse: number, save: number): Record<LoopId, number> => ({ waste, solar, rain, reuse, save });

interface Seed {
  id: string;
  name: string;
  zone: string;
  center: [number, number];
  areas: string[];
  hubNames: string[];
  drainNames: string[];
  landmarks: Landmark[];
  fingerprint: Record<LoopId, number>;
  playbook: Locality["playbook"];
  tankerBookingsMonth: number;
  population: number;
}

const SEEDS: Seed[] = [
  {
    id: "lbnagar", name: "LB Nagar", zone: "LB Nagar Zone", center: [17.3457, 78.5522],
    areas: ["Kothapet", "Chaitanyapuri", "Vanasthalipuram", "Hayathnagar", "Saroornagar"],
    hubNames: ["Mythri Enclave", "Sai Krupa Apartments", "Venkatadri Towers", "Saroor Lake View", "Padmavathi Residency"],
    drainNames: ["Saroornagar lake inflow channel", "Kothapet main drain", "Chaitanyapuri box drain", "Vanasthalipuram culvert", "Inner Ring Road drain", "Hayathnagar nala"],
    landmarks: [{ name: "Saroornagar Lake", lat: 17.3528, lng: 78.5355, kind: "lake" }, { name: "LB Nagar junction", lat: 17.3487, lng: 78.5513, kind: "area" }],
    fingerprint: fp(44, 55, 26, 36, 50),
    playbook: [
      { loop: "rain", title: "Recharge pits + drain triage first", why: "Low-lying colonies flood every monsoon; storm runoff is the biggest lever." },
      { loop: "reuse", title: "Register STPs for Green Water", why: "Many large complexes, few registered plants." },
      { loop: "solar", title: "Solar pumping second", why: "Good roof area once flood risk is under control." },
    ],
    tankerBookingsMonth: 31000, population: 520000,
  },
  {
    id: "uppal", name: "Uppal", zone: "Uppal Circle", center: [17.4018, 78.5602],
    areas: ["Ramanthapur", "Habsiguda", "Nacharam", "Uppal Depot", "Boduppal"],
    hubNames: ["Sree Nilayam", "Ramanthapur Heights", "Nacharam Park Homes", "Habsiguda Classic", "Boduppal Meadows"],
    drainNames: ["Nacharam industrial drain", "Ramanthapur cheruvu inlet", "Uppal ring road drain", "Habsiguda storm drain", "Boduppal culvert", "Musi feeder nala"],
    landmarks: [{ name: "Ramanthapur Cheruvu", lat: 17.3985, lng: 78.5415, kind: "lake" }, { name: "Uppal X Roads", lat: 17.4057, lng: 78.5591, kind: "area" }],
    fingerprint: fp(58, 49, 46, 28, 42),
    playbook: [
      { loop: "reuse", title: "Treated water for industry", why: "Nacharam industrial belt is a ready Green Water buyer." },
      { loop: "waste", title: "Community biogas", why: "Large market waste stream near the depot." },
      { loop: "save", title: "Tanker substitution", why: "Reuse cuts rising tanker spend." },
    ],
    tankerBookingsMonth: 24000, population: 410000,
  },
  {
    id: "yousufguda", name: "Yousufguda", zone: "Khairatabad Zone", center: [17.4365, 78.426],
    areas: ["Krishna Nagar", "Venkatagiri", "Rahmath Nagar", "Srinagar Colony", "Jubilee Hills Check Post"],
    hubNames: ["Krishna Kuteer", "Venkatagiri Residency", "Srinagar Enclave", "Rahmath Gardens", "Check Post Towers"],
    drainNames: ["Krishna Nagar lane drain", "Yousufguda basti nala", "Srinagar Colony box drain", "Venkatagiri culvert", "Rahmath Nagar drain", "Ameerpet link nala"],
    landmarks: [{ name: "Yousufguda Basti", lat: 17.4365, lng: 78.4255, kind: "area" }, { name: "Krishna Nagar", lat: 17.4398, lng: 78.4205, kind: "area" }],
    fingerprint: fp(38, 36, 52, 55, 46),
    playbook: [
      { loop: "waste", title: "Lane-level wet waste pickup", why: "Dense lanes with mixed waste choke small drains." },
      { loop: "solar", title: "Shared solar on low-rise blocks", why: "Few large roofs; pool small ones." },
      { loop: "save", title: "Peak-hour pump shift", why: "Evening peak strains old feeders." },
    ],
    tankerBookingsMonth: 15000, population: 260000,
  },
  {
    id: "ameerpet", name: "Ameerpet", zone: "Khairatabad Zone", center: [17.4375, 78.4482],
    areas: ["SR Nagar", "Begumpet", "Balkampet", "Sanjeevaiah Park", "Ameerpet X Roads"],
    hubNames: ["SR Nagar Residency", "Balkampet Homes", "Begumpet Court", "Mythrivanam Apartments", "Sanjeeva Enclave"],
    drainNames: ["Balkampet nala", "SR Nagar main drain", "Begumpet storm drain", "Ameerpet metro underpass drain", "Mythrivanam culvert", "Hussain Sagar surplus nala"],
    landmarks: [{ name: "Ameerpet X Roads", lat: 17.4375, lng: 78.4482, kind: "area" }, { name: "Balkampet Yellamma Temple", lat: 17.4448, lng: 78.4472, kind: "area" }],
    fingerprint: fp(35, 44, 30, 48, 39),
    playbook: [
      { loop: "waste", title: "Commercial wet waste to biogas", why: "Coaching centres and hostels generate steady food waste." },
      { loop: "rain", title: "Underpass flood triage", why: "Metro underpasses and Balkampet flood first." },
      { loop: "save", title: "Shift commercial pumping", why: "High peak tariff exposure." },
    ],
    tankerBookingsMonth: 19000, population: 300000,
  },
];

function generate(seed: Seed, idx: number): Locality {
  const r = rng(1000 + idx * 97);
  const [clat, clng] = seed.center;
  const hubs: Hub[] = seed.hubNames.map((name, i) => {
    const flats = Math.round(80 + r() * 200);
    const hasSolar = r() > 0.25;
    const hasBio = r() > 0.45;
    const stp = r() > 0.3 ? Math.round(flats * 0.75) : 0;
    return {
      id: `H-${seed.id.slice(0, 2).toUpperCase()}${i + 1}`,
      name,
      flats,
      area: seed.areas[i % seed.areas.length],
      lat: clat + (r() - 0.5) * 0.028,
      lng: clng + (r() - 0.5) * 0.034,
      solarKwp: hasSolar ? Math.round(flats * (0.12 + r() * 0.1)) : 0,
      biogasKgDay: hasBio ? Math.round(flats * 1.1) : 0,
      ohtKL: Math.round(flats * 0.35),
      sumpKL: Math.round(flats * 0.7),
      roofM2: Math.round(flats * 12),
      pits: r() > 0.45 ? Math.ceil(r() * 3) : 0,
      stpKLD: stp,
      stpRegistered: stp > 0 && r() > 0.6,
      ownTransformer: r() > 0.5,
      sanctionedKW: Math.round(flats * 0.55),
      segregation: Math.round(40 + r() * 45),
      feeder: `F-${seed.id.slice(0, 2).toUpperCase()}-0${(i % 3) + 1}`,
      section: `${seed.areas[i % seed.areas.length]}`,
    };
  });
  const drains: Drain[] = seed.drainNames.map((name, i) => {
    const design = 1 + Math.round(r() * 5);
    return {
      id: `D-0${i + 1}`,
      name,
      area: seed.areas[i % seed.areas.length],
      lat: clat + (r() - 0.5) * 0.03,
      lng: clng + (r() - 0.5) * 0.036,
      baseRisk: Math.round(35 + r() * 38),
      widthM: Math.max(0.6, +(design * (0.4 + r() * 0.5)).toFixed(1)),
      designWidthM: design,
      kind: name.includes("nala") ? "nala" : name.includes("culvert") ? "culvert" : "storm drain",
    };
  });
  const feeders: Feeder[] = [1, 2, 3].map((n) => {
    const cap = [400, 500, 630][n - 1];
    return { id: `F-${seed.id.slice(0, 2).toUpperCase()}-0${n}`, name: `${seed.areas[n - 1]} 11 kV`, area: seed.areas[n - 1], capacityKVA: cap, baseLoadKVA: Math.round(cap * (0.6 + r() * 0.15)) };
  });
  const landmarks: Landmark[] = [...seed.landmarks, ...seed.areas.map((a, i) => ({ name: a, lat: clat + Math.sin(i * 1.3) * 0.012, lng: clng + Math.cos(i * 1.3) * 0.015, kind: "area" as const }))];
  return { id: seed.id, name: seed.name, zone: seed.zone, center: seed.center, zoom: 14, hubs, drains, feeders, landmarks, fingerprint: seed.fingerprint, playbook: seed.playbook, tankerBookingsMonth: seed.tankerBookingsMonth, population: seed.population };
}

export const LOCALITIES: Locality[] = [
  {
    id: "kukatpally",
    name: "Kukatpally",
    zone: "Kukatpally Zone · KPHB",
    center: [17.4835, 78.4085],
    zoom: 14,
    hubs: KUKATPALLY_HUBS,
    drains: KUKATPALLY_DRAINS,
    feeders: KUKATPALLY_FEEDERS,
    landmarks: KUKATPALLY_LANDMARKS,
    fingerprint: fp(52, 61, 34, 41, 48),
    playbook: [
      { loop: "rain", title: "Recharge pits before the monsoon", why: "Tanker bookings up 185% while the IDL nala chokes — the rain loop is weakest." },
      { loop: "reuse", title: "Register STPs for Green Water", why: "Large gated complexes with idle treated water and builders nearby." },
      { loop: "solar", title: "Solar-hour pumping", why: "Outages trip pumps across KPHB; full tanks carry the night." },
    ],
    tankerBookingsMonth: 42500,
    population: 680000,
  },
  ...SEEDS.map(generate),
];

export const LOCALITY_BY_ID = Object.fromEntries(LOCALITIES.map((l) => [l.id, l])) as Record<string, Locality>;
