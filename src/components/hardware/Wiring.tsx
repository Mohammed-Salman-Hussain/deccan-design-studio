import { useMemo, useState } from "react";
import { Copy, Network } from "lucide-react";
import { toast } from "sonner";
import { Panel } from "@/components/ll/primitives";
import { CONN_COLOR, PART_LABEL, PART_ORDER, wiring, type HubPart, type WireDevice } from "@/lib/hardware";
import { useHub } from "@/lib/hooks";
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

/** Which devices connect to which part of the selected hub, and how. */
export function Wiring() {
  const hub = useHub();
  const [part, setPart] = useState<HubPart>("gateway");
  const map = useMemo(() => wiring(hub.id), [hub.id]);
  const devices = map[part];

  return (
    <Panel
      title={`${hub.name}: device wiring`}
      subtitle="Pick a part of the building to see which devices connect to the gateway, on which port and topic. Change the hub in the header to see another one."
      icon={Network}
    >
      <div className="mb-3 flex flex-wrap gap-1.5" role="group" aria-label="Choose a hub part">
        {PART_ORDER.map((p) => (
          <button key={p} onClick={() => setPart(p)} aria-pressed={part === p} className={cn("rounded-full border px-2.5 py-1 text-xs transition", part === p ? "border-transparent bg-secondary text-secondary-foreground" : "hover:bg-accent")}>{PART_LABEL[p]}</button>
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
        <div className="rounded-xl border p-3">
          <Schematic part={part} devices={devices} />
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
      </div>
    </Panel>
  );
}
