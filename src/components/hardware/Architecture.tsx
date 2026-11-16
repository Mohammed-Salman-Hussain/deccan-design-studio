import { useState } from "react";
import { CloudOff, Cloud, Cpu, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ll/primitives";

interface BoxProps {
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  lines?: string[];
  color: string;
  dim?: boolean;
  glow?: boolean;
}

function Box({ x, y, w, h, title, lines, color, dim, glow }: BoxProps) {
  return (
    <g opacity={dim ? 0.3 : 1} style={{ transition: "opacity .4s" }}>
      <rect x={x} y={y} width={w} height={h} rx={12} fill="var(--surface)" stroke={color} strokeWidth={glow ? 2.5 : 1.25} strokeOpacity={glow ? 1 : 0.6} />
      <text x={x + w / 2} y={y + 20} textAnchor="middle" fontSize={11.5} fontWeight={700} fill={color}>{title}</text>
      {lines?.map((l, i) => (
        <text key={l} x={x + w / 2} y={y + 40 + i * 17} textAnchor="middle" fontSize={10.5} fill="var(--foreground)">{l}</text>
      ))}
    </g>
  );
}

function Flow({ d, color, off, label }: { d: string; color: string; off?: boolean; label?: { x: number; y: number; text: string } }) {
  return (
    <g opacity={off ? 0.25 : 1} style={{ transition: "opacity .4s" }}>
      <path d={d} fill="none" stroke={color} strokeOpacity={0.25} strokeWidth={5} strokeLinecap="round" />
      <path d={d} fill="none" stroke={color} strokeWidth={2} strokeDasharray="5 9" strokeLinecap="round" className={off ? "" : "animate-flow"} />
      {label && <text x={label.x} y={label.y} textAnchor="middle" fontSize={9} fill="var(--muted-foreground)">{label.text}</text>}
    </g>
  );
}

export function Architecture() {
  const [down, setDown] = useState(false);
  const water = "var(--loop-reuse)";
  const amber = "var(--loop-solar)";

  return (
    <Panel
      title="From sensor to decision"
      subtitle="Data flows left to right. Switch the cloud link off to see the hub keep working on its own."
      icon={Cpu}
      action={
        <Button size="sm" variant={down ? "soft" : "glass"} aria-pressed={down} onClick={() => setDown((d) => !d)}>
          {down ? <><RefreshCw /> Restore cloud link</> : <><CloudOff /> Drop the cloud link</>}
        </Button>
      }
    >
      <svg viewBox="0 0 1120 430" className="h-auto w-full" role="img" aria-label={`Architecture: sensors and meters feed an edge gateway at each hub, then LoRaWAN, NB-IoT or Wi-Fi connectivity, the cloud, the LoopLocal Core and three apps. ${down ? "The cloud link is down and the gateway runs local rules." : "All links are up."}`}>
        <text x={85} y={22} textAnchor="middle" fontSize={10} fill="var(--muted-foreground)" style={{ letterSpacing: 1.5 }}>SENSORS AND METERS</text>
        <text x={280} y={22} textAnchor="middle" fontSize={10} fill="var(--muted-foreground)" style={{ letterSpacing: 1.5 }}>EDGE GATEWAY · EACH HUB</text>
        <text x={470} y={22} textAnchor="middle" fontSize={10} fill="var(--muted-foreground)" style={{ letterSpacing: 1.5 }}>CONNECTIVITY</text>
        <text x={660} y={22} textAnchor="middle" fontSize={10} fill="var(--muted-foreground)" style={{ letterSpacing: 1.5 }}>CLOUD</text>
        <text x={850} y={22} textAnchor="middle" fontSize={10} fill="var(--muted-foreground)" style={{ letterSpacing: 1.5 }}>CORE</text>
        <text x={1020} y={22} textAnchor="middle" fontSize={10} fill="var(--muted-foreground)" style={{ letterSpacing: 1.5 }}>APPS</text>

        {["Tank levels", "Pump energy meter", "Flow and pressure", "Rain gauge and nala radar", "STP, biogas, waste"].map((t, i) => (
          <g key={t}>
            <Box x={10} y={36 + i * 74} w={150} h={52} title={t} color={i % 2 ? amber : water} />
            <Flow d={`M160 ${62 + i * 74} C 190 ${62 + i * 74}, 190 200, 215 200`} color={i % 2 ? amber : water} />
          </g>
        ))}

        <g>
          <Box x={215} y={90} w={130} h={230} title="Edge gateway" color="var(--primary-glow)" glow={down} />
          <rect x={227} y={118} width={106} height={90} rx={9} fill={down ? "var(--primary)" : "var(--muted)"} fillOpacity={down ? 0.22 : 0.4} stroke="var(--primary-glow)" strokeDasharray={down ? "0" : "3 3"} style={{ transition: "all .4s" }} />
          <text x={280} y={138} textAnchor="middle" fontSize={10.5} fontWeight={700} fill="var(--foreground)">Local rules</text>
          <text x={280} y={155} textAnchor="middle" fontSize={9.5} fill="var(--muted-foreground)">fill tanks before a cut</text>
          <text x={280} y={169} textAnchor="middle" fontSize={9.5} fill="var(--muted-foreground)">open recharge pits</text>
          <text x={280} y={183} textAnchor="middle" fontSize={9.5} fill="var(--muted-foreground)">stop dry-running pumps</text>
          <text x={280} y={197} textAnchor="middle" fontSize={9.5} fill="var(--muted-foreground)">gas alarms</text>
          <text x={280} y={232} textAnchor="middle" fontSize={10} fill="var(--foreground)">Log buffer</text>
          <rect x={235} y={240} width={90} height={8} rx={4} fill="var(--muted)" />
          <rect x={235} y={240} width={down ? 70 : 14} height={8} rx={4} fill="var(--primary-glow)" style={{ transition: "width 1.2s" }} />
          <text x={280} y={270} textAnchor="middle" fontSize={9.5} fill={down ? "var(--primary-glow)" : "var(--muted-foreground)"}>{down ? "Buffering. Will upload on reconnect." : "Streaming live"}</text>
          {down && <path d="M258 105 a22 22 0 1 1 44 0" fill="none" stroke="var(--primary-glow)" strokeWidth={2} className="animate-spin-slow" style={{ transformOrigin: "280px 105px" }} />}
        </g>

        {["LoRaWAN", "NB-IoT / LTE", "Wi-Fi"].map((t, i) => (
          <g key={t}>
            <Box x={410} y={112 + i * 66} w={120} h={46} title={t} color="var(--info)" />
            <Flow d={`M345 205 C 375 205, 380 ${135 + i * 66}, 410 ${135 + i * 66}`} color="var(--info)" />
          </g>
        ))}

        {["AWS IoT Core", "S3 data lake", "Lambda rules", "SageMaker forecasts", "Time-series store", "Dashboards"].map((t, i) => (
          <g key={t}>
            <Box x={565 + (i % 2) * 100} y={44 + Math.floor(i / 2) * 82} w={90} h={62} title={t.split(" ")[0]} lines={[t.split(" ").slice(1).join(" ")]} color="var(--loop-rain)" dim={down} />
          </g>
        ))}
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <Flow d={`M530 ${135 + i * 66} C 548 ${135 + i * 66}, 548 140, 565 ${75 + i * 82}`} color="var(--info)" off={down} />
          </g>
        ))}
        {down && (
          <g>
            <circle cx={545} cy={215} r={15} fill="var(--destructive)" fillOpacity={0.2} stroke="var(--destructive)" />
            <path d="M538 208 L552 222 M552 208 L538 222" stroke="var(--destructive)" strokeWidth={2.5} strokeLinecap="round" />
            <text x={545} y={246} textAnchor="middle" fontSize={9.5} fontWeight={600} fill="var(--destructive)">link down</text>
          </g>
        )}

        <Box x={790} y={110} w={120} h={120} title="LoopLocal Core" lines={["Map and signals", "Forecasts", "Decision engine", "Dispatch", "Loop Score"]} color="var(--primary-glow)" dim={down} glow={!down} />
        <Flow d="M765 140 C 778 140, 778 160, 790 160" color="var(--loop-rain)" off={down} />
        <Flow d="M765 222 C 778 222, 778 190, 790 190" color="var(--loop-rain)" off={down} />

        {["Officer app", "Resident app", "Field Worker app"].map((t, i) => (
          <g key={t}>
            <Box x={950} y={90 + i * 66} w={150} h={46} title={t} color="var(--loop-waste)" dim={down} />
            <Flow d={`M910 170 C 930 170, 930 ${113 + i * 66}, 950 ${113 + i * 66}`} color="var(--loop-waste)" off={down} />
          </g>
        ))}

        <g transform="translate(10 392)">
          <rect width={1100} height={30} rx={10} fill={down ? "var(--primary)" : "var(--muted)"} fillOpacity={down ? 0.15 : 0.3} stroke={down ? "var(--primary-glow)" : "var(--border)"} />
          <text x={550} y={19} textAnchor="middle" fontSize={11} fill="var(--foreground)">{down ? "Cloud link down: the gateway applies local rules, buffers readings, and the gateway can still alert the field crew by SMS." : "All links up: readings stream to the cloud, the Core decides, and dispatches reach the three apps."}</text>
        </g>
      </svg>
      <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground"><Cloud className="size-3.5" aria-hidden /> The prototype runs on simulated data. This is the integration plan for the production layer.</p>
    </Panel>
  );
}
