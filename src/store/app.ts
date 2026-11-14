import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Action, Lang, Role, Scenario, TaskRecord, TaskStatus } from "@/lib/sim/types";
import { formatClock } from "@/lib/sim/engine";
import { LOCALITY_BY_ID } from "@/lib/sim/data";
import { routineTasks } from "@/lib/sim/actions";

export interface Notice {
  id: string;
  kind: "storm" | "outage" | "advisory" | "task" | "info" | "success";
  title: string;
  body: string;
  at: string;
  read: boolean;
}

export interface AuditEntry {
  id: string;
  at: string;
  sim: string;
  actor: string;
  text: string;
}

export interface IssueReport {
  id: string;
  type: string;
  note: string;
  photo?: string;
  lat: number;
  lng: number;
  createdAt: string;
  status: "received" | "routed" | "resolved";
  hubId: string;
}

export interface SurplusOffer {
  id: string;
  fromHub: string;
  toHub?: string;
  resource: "water" | "biogas" | "solar";
  qty: number;
  unit: string;
  status: "open" | "matched";
  kind: "offer" | "request";
}

interface State {
  hydrated: boolean;
  role: Role;
  lang: Lang;
  theme: "dark" | "light";
  reduceMotion: boolean;
  localityId: string;
  hubId: string;
  scenario: Scenario;
  clock: number;
  playing: boolean;
  speed: number;
  tasks: Record<string, TaskRecord>;
  citizenActions: Action[];
  notices: Notice[];
  audit: AuditEntry[];
  reports: IssueReport[];
  offers: SurplusOffer[];
  checks: Record<string, boolean>;
  offline: boolean;
  scoreFlash: number;
  assumptionsOpen: boolean;

  set: (p: Partial<State>) => void;
  setRole: (r: Role) => void;
  setScenario: (s: Scenario) => void;
  setLocality: (id: string) => void;
  tick: (dMin: number) => void;
  dispatch: (a: Action, actor?: string) => void;
  dispatchMany: (a: Action[], actor?: string) => void;
  setStatus: (id: string, status: TaskStatus, extra?: Partial<TaskRecord>) => void;
  toggleStep: (id: string, i: number) => void;
  addNotice: (n: Omit<Notice, "id" | "at" | "read">) => void;
  markNoticesRead: () => void;
  log: (actor: string, text: string) => void;
  addReport: (r: Omit<IssueReport, "id" | "createdAt" | "status">) => void;
  addOffer: (o: Omit<SurplusOffer, "id" | "status">) => void;
  matchOffer: (id: string, toHub: string) => void;
  toggleCheck: (k: string) => void;
  syncOffline: () => void;
  resetDemo: () => void;
}

const uid = () => Math.random().toString(36).slice(2, 10);
const nowIso = () => new Date().toISOString();

function seedTasks(localityId: string): Record<string, TaskRecord> {
  const loc = LOCALITY_BY_ID[localityId];
  const out: Record<string, TaskRecord> = {};
  for (const a of routineTasks(loc)) {
    out[a.id] = { ...a, status: "dispatched", dispatchedAt: "7:30 am", checklist: a.steps.map(() => false) };
  }
  return out;
}

const SEED_OFFERS: SurplusOffer[] = [
  { id: "o1", fromHub: "H-PGT", resource: "water", qty: 24, unit: "kL treated", status: "open", kind: "offer" },
  { id: "o2", fromHub: "H-SSR", resource: "biogas", qty: 6, unit: "m³/day", status: "open", kind: "offer" },
  { id: "o3", fromHub: "H-GPC", resource: "water", qty: 10, unit: "kL for gardens", status: "open", kind: "request" },
  { id: "o4", fromHub: "H-VSN", resource: "solar", qty: 18, unit: "kWh midday", status: "matched", toHub: "H-LKH", kind: "offer" },
];

const SEED_AUDIT: AuditEntry[] = [
  { id: "a0", at: "2026-11-14T02:00:00.000Z", sim: "7:30 am", actor: "Core engine", text: "Routine tasks dispatched to sanitation and STP crews" },
  { id: "a1", at: "2026-11-14T01:30:00.000Z", sim: "7:00 am", actor: "Core engine", text: "Weather forecast ingested · IMD Hyderabad nowcast" },
  { id: "a2", at: "2026-11-14T01:00:00.000Z", sim: "6:30 am", actor: "Discom feed", text: "Planned outage notices synced for KPHB sections" },
];

const initial = {
  hydrated: false,
  role: "officer" as Role,
  lang: "en" as Lang,
  theme: "dark" as const,
  reduceMotion: false,
  localityId: "kukatpally",
  hubId: "H-SSR",
  scenario: "normal" as Scenario,
  clock: 630,
  playing: true,
  speed: 1,
  tasks: seedTasks("kukatpally"),
  citizenActions: [] as Action[],
  notices: [] as Notice[],
  audit: SEED_AUDIT,
  reports: [] as IssueReport[],
  offers: SEED_OFFERS,
  checks: {} as Record<string, boolean>,
  offline: false,
  scoreFlash: 0,
  assumptionsOpen: false,
};

export const useApp = create<State>()(
  persist(
    (set, get) => ({
      ...initial,
      set: (p) => set(p),
      setRole: (role) => {
        set({ role });
        get().log("You", `Switched view to ${role}`);
      },
      setScenario: (scenario) => {
        if (get().scenario === scenario) return;
        set({ scenario });
        get().log("You", `Scenario set to ${scenario}`);
      },
      setLocality: (id) => {
        const loc = LOCALITY_BY_ID[id];
        if (!loc) return;
        const existing = get().tasks;
        const seeded = Object.keys(existing).some((k) => k.startsWith(`${id}:`)) ? {} : seedTasks(id);
        set({ localityId: id, hubId: loc.hubs[0].id, tasks: { ...existing, ...seeded } });
        get().log("You", `Locality changed to ${loc.name}`);
      },
      tick: (d) => {
        const c = get().clock + d;
        set({ clock: c >= 1440 ? c - 1440 : c });
      },
      dispatch: (a, actor = "Officer") => {
        const { tasks, clock } = get();
        if (tasks[a.id] && tasks[a.id].status !== "pending") return;
        const rec: TaskRecord = { ...a, status: "dispatched", dispatchedAt: formatClock(clock), checklist: a.steps.map(() => false) };
        set({ tasks: { ...get().tasks, [a.id]: rec } });
        get().log(actor, `Dispatched “${a.title}” to ${a.assignee} (${a.crew})`);
        if (a.notifyResident) get().addNotice({ kind: a.loop === "rain" ? "storm" : "task", title: a.title, body: a.notifyResident });
      },
      dispatchMany: (list, actor = "Officer") => {
        list.forEach((a) => get().dispatch(a, actor));
      },
      setStatus: (id, status, extra) => {
        const t = get().tasks[id];
        if (!t) return;
        const sim = formatClock(get().clock);
        const patch: Partial<TaskRecord> = { status, ...extra };
        if (status === "done") patch.doneAt = sim;
        if (status === "verified") patch.verifiedAt = sim;
        set({ tasks: { ...get().tasks, [id]: { ...t, ...patch } }, scoreFlash: status === "done" ? Date.now() : get().scoreFlash });
        if (status === "done") {
          get().log(t.assignee, `Completed “${t.title}”${extra?.queuedOffline ? " (queued offline)" : ""}`);
          if (t.target === "worker") get().addNotice({ kind: "success", title: "Task completed", body: `${t.title} — done by ${t.crew.toLowerCase()}.` });
        }
        if (status === "verified") get().log("Officer", `Verified “${t.title}”`);
      },
      toggleStep: (id, i) => {
        const t = get().tasks[id];
        if (!t) return;
        const checklist = [...t.checklist];
        checklist[i] = !checklist[i];
        set({ tasks: { ...get().tasks, [id]: { ...t, checklist } } });
      },
      addNotice: (n) => set({ notices: [{ ...n, id: uid(), at: formatClock(get().clock), read: false }, ...get().notices].slice(0, 40) }),
      markNoticesRead: () => set({ notices: get().notices.map((n) => ({ ...n, read: true })) }),
      log: (actor, text) => set({ audit: [{ id: uid(), at: nowIso(), sim: formatClock(get().clock), actor, text }, ...get().audit].slice(0, 120) }),
      addReport: (r) => {
        const id = uid();
        const rep: IssueReport = { ...r, id, createdAt: formatClock(get().clock), status: "routed" };
        const loopFor: Record<string, Action["loop"]> = { "Blocked drain": "rain", "Garbage pile": "waste", "Foul-smelling water": "reuse", "Streetlight out": "save" };
        const crewFor: Record<string, [string, string]> = { "Blocked drain": ["Ramesh Kumar", "Sanitation crew 4"], "Garbage pile": ["Lakshmamma", "Sanitation crew 2"], "Foul-smelling water": ["Mohammed Imran", "Plumber"], "Streetlight out": ["Venkatesh Goud", "Lineman · Discom"] };
        const [assignee, crew] = crewFor[r.type] ?? ["Ramesh Kumar", "Sanitation crew 4"];
        const action: Action = {
          id: `citizen:${id}`, title: `${r.type} reported by resident`, loop: loopFor[r.type] ?? "rain", place: `Pinned location · ${r.lat.toFixed(4)}, ${r.lng.toFixed(4)}`,
          lat: r.lat, lng: r.lng, reason: r.note || "Resident report with photo and map pin.", deadline: "Today", deadlineHour: 20, priority: 60,
          assignee, crew, target: "worker", steps: ["Reach the pinned location", "Fix or escalate", "Upload photo proof"], safety: "Follow the standard safety checklist for this task type.",
          impact: { score: 0.6 }, source: "citizen",
        };
        set({ reports: [rep, ...get().reports], citizenActions: [action, ...get().citizenActions] });
        get().log("Resident", `Reported “${r.type}” — routed to officer queue`);
      },
      addOffer: (o) => {
        set({ offers: [{ ...o, id: uid(), status: "open" }, ...get().offers] });
        get().log("Resident", `Posted ${o.kind} for ${o.qty} ${o.unit} ${o.resource}`);
      },
      matchOffer: (id, toHub) => {
        set({ offers: get().offers.map((o) => (o.id === id ? { ...o, status: "matched", toHub } : o)) });
        get().log("Resident", "Surplus share matched between hubs");
      },
      toggleCheck: (k) => set({ checks: { ...get().checks, [k]: !get().checks[k] } }),
      syncOffline: () => {
        const tasks = { ...get().tasks };
        let n = 0;
        for (const k of Object.keys(tasks)) if (tasks[k].queuedOffline) { tasks[k] = { ...tasks[k], queuedOffline: false }; n++; }
        set({ tasks, offline: false });
        if (n) get().log("Field app", `Synced ${n} offline completion${n > 1 ? "s" : ""}`);
      },
      resetDemo: () => {
        set({ ...initial, hydrated: true, theme: get().theme, lang: get().lang, tasks: seedTasks("kukatpally") });
      },
    }),
    {
      name: "looplocal-v1",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({
        role: s.role, lang: s.lang, theme: s.theme, reduceMotion: s.reduceMotion, localityId: s.localityId, hubId: s.hubId,
        scenario: s.scenario, speed: s.speed, tasks: s.tasks, citizenActions: s.citizenActions, notices: s.notices,
        audit: s.audit, reports: s.reports, offers: s.offers, checks: s.checks, offline: s.offline,
      }),
    },
  ),
);
