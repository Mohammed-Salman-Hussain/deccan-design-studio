import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Cpu, FileKey2, Network, ScrollText, ShieldCheck, Users, X, Cloud, type LucideIcon } from "lucide-react";
import { useApp } from "@/store/app";
import { PageHeader, Panel } from "@/components/ll/primitives";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/security")({
  head: () => ({
    meta: [
      { title: "Security — LoopLocal" },
      { name: "description", content: "How LoopLocal protects devices, data and decisions: device certificates, TLS, topic-level access, role-based access, audit trails and a human in the loop." },
      { property: "og:title", content: "Security — LoopLocal" },
      { property: "og:description", content: "Layered security for neighbourhood infrastructure." },
    ],
  }),
  component: SecurityPage,
});

interface Layer {
  id: string;
  name: string;
  icon: LucideIcon;
  color: string;
  tagline: string;
  controls: string[];
}

const LAYERS: Layer[] = [
  { id: "device", name: "Devices", icon: Cpu, color: "var(--loop-waste)", tagline: "Every sensor proves who it is.", controls: ["Unique X.509 certificate per device and per gateway", "Secure boot and signed over-the-air firmware", "Tamper switch on enclosures raises an alert", "Keys stored in a secure element, never in plain flash"] },
  { id: "network", name: "Network", icon: Network, color: "var(--loop-reuse)", tagline: "Nothing travels in the clear.", controls: ["TLS 1.2 or newer on every link, including LoRaWAN backhaul", "Private APN or VPN for NB-IoT and LTE gateways", "MQTT topic-level permissions: a device can publish only to its own topics", "Rate limits and replay protection on every message"] },
  { id: "cloud", name: "Cloud", icon: Cloud, color: "var(--loop-rain)", tagline: "Least privilege, encrypted, logged.", controls: ["Role-scoped IAM with no shared admin keys", "Encryption at rest for storage and the time-series database", "Separate stores for telemetry and resident reports", "Backups, retention rules and region pinning to India"] },
  { id: "app", name: "Applications", icon: Users, color: "var(--loop-solar)", tagline: "Each role sees only what it needs.", controls: ["Role-based access for Officer, Resident, Field Worker and Vendor", "Short-lived sessions and re-authentication for dispatch actions", "Input validation on every form, photo and voice upload", "Resident views show their own hub, never other households"] },
  { id: "people", name: "People & process", icon: ShieldCheck, color: "var(--loop-save)", tagline: "The software recommends; people act.", controls: ["Every action is a recommendation until a named officer dispatches it", "Dispatch, completion and verification are all written to the audit log", "Field crews follow the task's safety checklist before starting", "Data-sharing rules are approved by the officer before any new feed goes live"] },
];

const THREATS: { threat: string; control: string; layer: string }[] = [
  { threat: "A spoofed sensor sends false tank levels", control: "Device certificates and per-device topics; unknown identities are rejected at the broker", layer: "Devices" },
  { threat: "Tampered firmware on a gateway", control: "Secure boot, signed OTA updates, tamper alerts", layer: "Devices" },
  { threat: "Someone listens in on telemetry", control: "TLS everywhere; private APN or VPN on cellular links", layer: "Network" },
  { threat: "Old messages replayed to trigger a pump", control: "Timestamps, sequence numbers and replay rejection", layer: "Network" },
  { threat: "A flood of messages knocks the service over", control: "Per-device rate limits and managed ingestion", layer: "Cloud" },
  { threat: "A user opens another hub's data", control: "Role and hub scoping on every query", layer: "Applications" },
  { threat: "Resident reports reveal who complained", control: "Reports store category, pin and note only, in a separate store", layer: "Cloud" },
  { threat: "The cloud link drops during a storm", control: "Gateway runs local rules: fill tanks, open pits, alert crews", layer: "Devices" },
  { threat: "An automated action goes wrong", control: "Recommendations need a named human to dispatch; every step is logged", layer: "People & process" },
];

const ACCESS: { cap: string; officer: boolean; resident: boolean; worker: boolean; vendor: boolean }[] = [
  { cap: "See locality map and rankings", officer: true, resident: false, worker: false, vendor: false },
  { cap: "Dispatch and verify actions", officer: true, resident: false, worker: false, vendor: false },
  { cap: "See own hub plan and tank level", officer: true, resident: true, worker: false, vendor: true },
  { cap: "Report an issue", officer: false, resident: true, worker: false, vendor: false },
  { cap: "Receive and complete tasks", officer: false, resident: false, worker: true, vendor: false },
  { cap: "Commission and calibrate devices", officer: false, resident: false, worker: false, vendor: true },
  { cap: "Read the audit log", officer: true, resident: false, worker: false, vendor: false },
];

function SecurityPage() {
  const [sel, setSel] = useState(0);
  const audit = useApp((s) => s.audit);
  const layer = LAYERS[sel];
  const radii = [58, 88, 118, 148, 178];

  return (
    <div className="mx-auto max-w-[1200px]">
      <PageHeader title="Security" description="From the sensor in a tank to the officer pressing Dispatch. These are design controls for LoopLocal's production layer, part of the integration plan. They describe what the system is built to do; they are not an audit result. Principles that do not change: sensors measure water, power and waste rather than people; resident reports hold only a category, a pin and a note; and the software recommends while people carry out the actions." />

      <Tabs defaultValue="layers">
        <TabsList>
          <TabsTrigger value="layers">Layers</TabsTrigger>
          <TabsTrigger value="threats">Threats</TabsTrigger>
          <TabsTrigger value="access">Who can do what</TabsTrigger>
          <TabsTrigger value="audit">Audit trail</TabsTrigger>
        </TabsList>

        <TabsContent value="layers" className="mt-3">
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Panel bodyClass="p-3">
          <svg viewBox="0 0 400 400" className="mx-auto h-auto w-full max-w-[460px]" role="img" aria-label="Five concentric security layers from devices at the centre to people and process on the outside">
            {[...LAYERS].reverse().map((l, ri) => {
              const i = LAYERS.length - 1 - ri;
              return (
                <g key={l.id} onClick={() => setSel(i)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSel(i); } }} tabIndex={0} role="button" aria-label={l.name} aria-pressed={sel === i} style={{ cursor: "pointer", outline: "none" }}>
                  <circle cx={200} cy={200} r={radii[i]} fill={l.color} fillOpacity={sel === i ? 0.22 : 0.08} stroke={l.color} strokeWidth={sel === i ? 2.5 : 1} strokeOpacity={sel === i ? 1 : 0.5} style={{ transition: "all .25s" }} />
                </g>
              );
            })}
            {LAYERS.map((l, i) => (
              <text key={l.id} x={200} y={200 - radii[i] + 18} textAnchor="middle" fontSize={11} fontWeight={600} fill={sel === i ? "var(--foreground)" : "var(--muted-foreground)"} pointerEvents="none">{l.name}</text>
            ))}
            <g transform="translate(176 176)" pointerEvents="none">
              <FileKey2 x={0} y={0} width={48} height={48} color="var(--primary-glow)" />
            </g>
            <circle cx={200} cy={200} r={16} fill="none" stroke="var(--primary-glow)" strokeWidth={1.5} className="animate-pulse-ring" style={{ transformOrigin: "200px 200px" }} pointerEvents="none" />
          </svg>
        </Panel>

        <Panel title={layer.name} subtitle={layer.tagline} icon={layer.icon} action={<span className="size-2.5 rounded-full" style={{ background: layer.color }} aria-hidden />}>
          <ul className="space-y-2.5">
            {layer.controls.map((c) => (
              <li key={c} className="flex gap-2.5 text-sm"><Check className="mt-0.5 size-4 shrink-0" style={{ color: layer.color }} aria-hidden />{c}</li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {LAYERS.map((l, i) => (
              <button key={l.id} onClick={() => setSel(i)} aria-pressed={sel === i} className={cn("rounded-full border px-2.5 py-1 text-xs transition", sel === i ? "border-primary bg-primary/15" : "hover:bg-accent/50")}>{l.name}</button>
            ))}
          </div>
        </Panel>
      </div>
        </TabsContent>

        <TabsContent value="threats" className="mt-3">
        <Panel title="Threat to control" subtitle="What could go wrong, and what stops it" icon={ShieldCheck}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-xs">
              <thead><tr className="text-[11px] uppercase tracking-wider text-muted-foreground"><th className="pb-2 pr-3 font-medium">Threat</th><th className="pb-2 pr-3 font-medium">Control</th><th className="pb-2 font-medium">Layer</th></tr></thead>
              <tbody className="divide-y">
                {THREATS.map((t) => (<tr key={t.threat}><td className="py-2 pr-3 font-medium">{t.threat}</td><td className="py-2 pr-3 text-muted-foreground">{t.control}</td><td className="py-2"><span className="rounded-full border px-2 py-0.5 text-[11px]">{t.layer}</span></td></tr>))}
              </tbody>
            </table>
          </div>
        </Panel>
        </TabsContent>

        <TabsContent value="access" className="mt-3">
        <Panel title="Who can do what" subtitle="Role-based access" icon={Users}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[360px] text-xs">
              <thead><tr className="text-[11px] uppercase tracking-wider text-muted-foreground"><th className="pb-2 text-left font-medium">Capability</th>{["Officer", "Resident", "Worker", "Vendor"].map((r) => <th key={r} className="pb-2 text-center font-medium">{r}</th>)}</tr></thead>
              <tbody className="divide-y">
                {ACCESS.map((a) => (
                  <tr key={a.cap}>
                    <td className="py-2 pr-2">{a.cap}</td>
                    {[a.officer, a.resident, a.worker, a.vendor].map((v, i) => (
                      <td key={i} className="py-2 text-center">{v ? <Check className="mx-auto size-4 text-success" aria-label="Allowed" /> : <X className="mx-auto size-4 text-muted-foreground/40" aria-label="Not allowed" />}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
        </TabsContent>

        <TabsContent value="audit" className="mt-3">
        <Panel title="Live audit trail" subtitle="Every dispatch, completion and verification in this session." icon={ScrollText}>
          <ol className="max-h-72 space-y-1.5 overflow-y-auto pr-1 text-xs">
            {audit.slice(0, 14).map((a) => (
              <li key={a.id} className="grid grid-cols-[64px_1fr] gap-2 rounded-lg border px-2.5 py-1.5"><span className="font-mono text-[10px] text-muted-foreground">{a.sim}</span><span><strong className="font-medium">{a.actor}</strong> · {a.text}</span></li>
            ))}
          </ol>
        </Panel>
        </TabsContent>
      </Tabs>
    </div>
  );
}
