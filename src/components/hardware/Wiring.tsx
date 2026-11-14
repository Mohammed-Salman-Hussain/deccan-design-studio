import { useEffect, useMemo, useState } from "react";
import { Box, Copy, Layers, Network } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { HubModel3D, type HubPart } from "@/components/ll/ClientCanvas";
import { Panel } from "@/components/ll/primitives";
import { CONN_COLOR, PART_LABEL, PART_ORDER, wiring, type WireDevice } from "@/lib/hardware";
import { useHub } from "@/lib/hooks";
import { useApp } from "@/store/app";
import { cn } from "@/lib/utils";

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success("Topic copied");
  } catch {
    toast.error("Copy is not available in this browser");
  }
}

function Schematic({ part, devices }: { part: HubPart; devices: WireDevice[] }) {
  const rowH = 58;
  const h = Math.max(150, 40 + devices.length * rowH);
  return (
    <svg viewBox={`0 0 760 ${h}`} className="h-auto w-full" role="img" aria-label={`Wiring diagram for ${PART_LABEL[part]}: ${devices.length} devices connected to the edge gateway`}>
      <rect x={10} y={10} width={150} height={h - 20} rx={12} fill="var(--surface)" stroke="var(--primary-glow)" strokeWidth={1.5} />
      <text x={85} y={32} textAnchor="middle" fontSize={11.5} fontWeight={700} fill="var(--primary-glow)">Edge gateway</text>
      {devices.map((d, i) => {
        const y = 48 + i * rowH;
        const c = CONN_COLOR[d.conn];
        return (
          <g key={d.topic}>
            <rect x={150} y={y - 2} width={22} height={24} rx={5} fill="var(--surface-2)" stroke={c} />
            <text x={85} y={y + 14} textAnchor="middle" fontSize={10} fill="var(--foreground)">{d.port}</text>
            <path d={`M172 ${y + 10} C 280 ${y + 10}, 320 ${y + 10}, 420 ${y + 10}`} fill="none" stroke={c} strokeWidth={2} strokeDasharray="5 8" className="animate-flow" />
            <text x={296} y={y + 4} textAnchor="middle" fontSize={9.5} fill={c}>{d.conn}</text>
            <rect x={420} y={y - 10} width={330} height={44} rx={9} fill="var(--surface)" stroke={c} strokeOpacity={0.7} />
            <text x={432} y={y + 7} fontSize={11} fontWeight={600} fill="var(--foreground)">{d.name.length > 44 ? `${d.name.slice(0, 43)}…` : d.name}</text>
            <text x={432} y={y + 23} fontSize={9.5} fill="var(--muted-foreground)" style={{ fontFamily: "var(--font-mono)" }}>{d.topic.length > 52 ? `…${d.topic.slice(-51)}` : d.topic}</text>
          </g>
        );
      })}
    </svg>
  );
}

export function Wiring() {
  const hub = useHub();
  const reduce = useApp((s) => s.reduceMotion);
  const [sel, setSel] = useState<HubPart | null>("gateway");
  const [exploded, setExploded] = useState(false);
  const [view, setView] = useState<"3d" | "schematic">("3d");
  const [webgl, setWebgl] = useState(true);

  useEffect(() => {
    try {
      const c = document.createElement("canvas");
      const ok = !!(c.getContext("webgl2") || c.getContext("webgl"));
      setWebgl(ok);
      if (!ok) setView("schematic");
    } catch {
      setWebgl(false);
      setView("schematic");
    }
  }, []);

  const map = useMemo(() => wiring(hub.id), [hub.id]);
  const part: HubPart = sel ?? "gateway";
  const devices = map[part];

  return (
    <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
      <Panel
        title={`${hub.name}: interactive hub`}
        subtitle="Click a part of the building to see how it connects to the gateway"
        icon={Box}
        action={
          <div className="flex gap-1.5">
            <Button size="sm" variant={view === "3d" ? "soft" : "glass"} disabled={!webgl} onClick={() => setView("3d")}>3D</Button>
            <Button size="sm" variant={view === "schematic" ? "soft" : "glass"} onClick={() => setView("schematic")}>Schematic</Button>
            <Button size="sm" variant={exploded ? "soft" : "glass"} aria-pressed={exploded} disabled={view !== "3d"} onClick={() => setExploded((e) => !e)}><Layers /> Explode</Button>
          </div>
        }
        bodyClass="p-2"
      >
        {view === "3d" && webgl ? (
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-gradient-to-b from-surface-2/50 to-background/40">
            <HubModel3D selected={sel} onSelect={setSel} exploded={exploded} reduce={reduce} />
          </div>
        ) : (
          <div className="rounded-xl border bg-muted/20 p-3">
            {!webgl && <p className="mb-2 text-xs text-muted-foreground">3D is not available on this device, so the schematic is shown instead.</p>}
            <Schematic part={part} devices={devices} />
          </div>
        )}
      </Panel>

      <Panel title={PART_LABEL[part]} subtitle={`${devices.length} device${devices.length === 1 ? "" : "s"} · hub ${hub.id}`} icon={Network}>
        <div className="mb-3 flex flex-wrap gap-1.5" role="group" aria-label="Choose a hub part">
          {PART_ORDER.map((p) => (
            <button key={p} onClick={() => setSel(p)} aria-pressed={part === p} className={cn("rounded-full border px-2.5 py-1 text-xs transition", part === p ? "border-primary bg-primary/15" : "hover:bg-accent/50")}>{PART_LABEL[p]}</button>
          ))}
        </div>
        <ul className="space-y-2">
          {devices.map((d) => (
            <li key={d.topic} className="rounded-lg border p-2.5 text-xs">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium">{d.name}</p>
                <span className="shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium" style={{ color: CONN_COLOR[d.conn], borderColor: `color-mix(in oklab, ${CONN_COLOR[d.conn]} 40%, transparent)` }}>{d.conn}</span>
              </div>
              <dl className="mt-1.5 space-y-1">
                <div className="grid grid-cols-[64px_1fr] gap-2"><dt className="text-muted-foreground">Port</dt><dd>{d.port}</dd></div>
                <div className="grid grid-cols-[64px_1fr] items-center gap-2"><dt className="text-muted-foreground">Topic</dt><dd className="flex min-w-0 items-center gap-1.5"><code className="min-w-0 truncate font-mono text-[11px]">{d.topic}</code><button onClick={() => copyText(d.topic)} aria-label={`Copy topic ${d.topic}`} className="shrink-0 rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"><Copy className="size-3.5" /></button></dd></div>
              </dl>
              {d.note && <p className="mt-1.5 text-[11px] text-muted-foreground">{d.note}</p>}
            </li>
          ))}
        </ul>
      </Panel>

      {view === "3d" && webgl && (
        <Panel title="Wiring diagram" subtitle={`${PART_LABEL[part]} to the edge gateway`} icon={Network} className="xl:col-span-2">
          <Schematic part={part} devices={devices} />
        </Panel>
      )}
    </div>
  );
}
