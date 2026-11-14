export type LoopId = "waste" | "solar" | "rain" | "reuse" | "save";
export type Scenario = "normal" | "storm" | "heatwave" | "peak";
export type Role = "officer" | "resident" | "worker";
export type Lang = "en" | "te" | "hi";
export type TaskStatus = "pending" | "dispatched" | "done" | "verified";

export interface Hub {
  id: string;
  name: string;
  flats: number;
  area: string;
  lat: number;
  lng: number;
  solarKwp: number;
  biogasKgDay: number;
  ohtKL: number;
  sumpKL: number;
  roofM2: number;
  pits: number;
  stpKLD: number;
  stpRegistered: boolean;
  ownTransformer: boolean;
  sanctionedKW: number;
  segregation: number;
  feeder: string;
  section: string;
}

export interface Drain {
  id: string;
  name: string;
  area: string;
  lat: number;
  lng: number;
  baseRisk: number;
  widthM: number;
  designWidthM: number;
  kind: "nala" | "storm drain" | "culvert";
}

export interface Feeder {
  id: string;
  name: string;
  area: string;
  capacityKVA: number;
  baseLoadKVA: number;
}

export interface Landmark {
  name: string;
  lat: number;
  lng: number;
  kind: "lake" | "transfer" | "market" | "area" | "nala";
}

export interface Locality {
  id: string;
  name: string;
  zone: string;
  center: [number, number];
  zoom: number;
  hubs: Hub[];
  drains: Drain[];
  feeders: Feeder[];
  landmarks: Landmark[];
  fingerprint: Record<LoopId, number>;
  playbook: { loop: LoopId; title: string; why: string }[];
  tankerBookingsMonth: number;
  population: number;
}

export interface Action {
  id: string;
  title: string;
  loop: LoopId;
  place: string;
  lat: number;
  lng: number;
  reason: string;
  deadline: string;
  deadlineHour: number;
  priority: number;
  assignee: string;
  crew: string;
  target: "worker" | "resident";
  notifyResident?: string;
  steps: string[];
  safety: string;
  impact: { score: number; tankers?: number; litres?: number; kwh?: number };
  source: "engine" | "citizen" | "routine";
}

export interface TaskRecord extends Action {
  status: TaskStatus;
  dispatchedAt: string;
  doneAt?: string;
  verifiedAt?: string;
  checklist: boolean[];
  proof?: string;
  voiceNote?: string;
  queuedOffline?: boolean;
}
