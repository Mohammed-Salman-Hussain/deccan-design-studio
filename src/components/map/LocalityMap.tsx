import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Minus, Plus, X } from "lucide-react";

/**
 * A clean neighbourhood plan drawn in SVG. It needs no map service or key, so it always loads.
 * Positions are real coordinates; streets are deliberately not drawn, the grid just gives scale.
 */

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  color: string;
  label?: string;
  /** Short text shown inside a hub marker. */
  text?: string;
  size?: number;
  pulse?: boolean;
  shape?: "dot" | "hub" | "drain" | "pin" | "label";
  /** Shown in a small card when the marker is selected. */
  detail?: { title: string; lines: string[] };
  onClick?: () => void;
}

export interface MapCircle {
  lat: number;
  lng: number;
  radius: number;
  color: string;
  opacity?: number;
}

export interface LocalityMapProps {
  center: [number, number];
  zoom: number;
  markers?: MapMarker[];
  circles?: MapCircle[];
  onPick?: (lat: number, lng: number) => void;
  interactive?: boolean;
  /** Frame every non-label marker instead of using `zoom`. */
  fit?: boolean;
  className?: string;
  ariaLabel?: string;
}

const M_LAT = 110540;
const GRID_STEPS = [25, 50, 100, 250, 500, 1000, 2500];

export function LocalityMap({ center, zoom, markers = [], circles = [], onPick, interactive = true, fit = false, className, ariaLabel = "Map" }: LocalityMapProps) {
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 640, h: 400 });
  const [mul, setMul] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [selected, setSelected] = useState<string | null>(null);
  const drag = useRef<{ x: number; y: number; px: number; py: number; moved: number } | null>(null);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const read = () => setSize({ w: Math.max(200, el.clientWidth), h: Math.max(140, el.clientHeight) });
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    setMul(1);
    setPan({ x: 0, y: 0 });
    setSelected(null);
  }, [center[0], center[1], zoom]);

  const points = useMemo(() => markers.filter((m) => m.shape !== "label"), [markers]);

  // Centre and base scale (pixels per metre).
  const { cLat, cLng, base, mLng } = useMemo(() => {
    let lat = center[0];
    let lng = center[1];
    const mLngAt = (la: number) => 111320 * Math.cos((la * Math.PI) / 180);
    if (fit && points.length > 1) {
      const lats = points.map((p) => p.lat);
      const lngs = points.map((p) => p.lng);
      lat = (Math.min(...lats) + Math.max(...lats)) / 2;
      lng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
      const ml = mLngAt(lat);
      const spanX = Math.max(120, (Math.max(...lngs) - Math.min(...lngs)) * ml);
      const spanY = Math.max(120, (Math.max(...lats) - Math.min(...lats)) * M_LAT);
      const s = Math.min((size.w * 0.78) / spanX, (size.h * 0.74) / spanY);
      return { cLat: lat, cLng: lng, base: s, mLng: ml };
    }
    const mpp = (156543.03 * Math.cos((lat * Math.PI) / 180)) / 2 ** zoom;
    return { cLat: lat, cLng: lng, base: 1 / mpp, mLng: mLngAt(lat) };
  }, [center, zoom, fit, points, size.w, size.h]);

  const s = base * mul;
  const ox = size.w / 2 + pan.x;
  const oy = size.h / 2 + pan.y;
  const px = useCallback((lng: number) => ox + (lng - cLng) * mLng * s, [ox, cLng, mLng, s]);
  const py = useCallback((lat: number) => oy - (lat - cLat) * M_LAT * s, [oy, cLat, s]);

  // Scale grid: smallest step that is at least ~64px apart.
  const step = GRID_STEPS.find((g) => g * s >= 64) ?? GRID_STEPS[GRID_STEPS.length - 1];
  const sp = step * s;
  const vLines: number[] = [];
  for (let x = ox - Math.ceil(ox / sp) * sp; x <= size.w; x += sp) if (x >= 0) vLines.push(x);
  const hLines: number[] = [];
  for (let y = oy - Math.ceil(oy / sp) * sp; y <= size.h; y += sp) if (y >= 0) hLines.push(y);

  const sel = markers.find((m) => m.id === selected && m.detail);
  const order = (m: MapMarker) => (m.shape === "label" ? 0 : m.shape === "drain" ? 1 : m.shape === "dot" ? 2 : m.shape === "hub" ? 3 : 4);
  const sorted = useMemo(() => [...markers].sort((a, b) => order(a) - order(b)), [markers]);

  const onDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!interactive && !onPick) return;
    drag.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y, moved: 0 };
    (e.currentTarget as SVGSVGElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    d.moved = Math.max(d.moved, Math.abs(dx) + Math.abs(dy));
    if (interactive && d.moved > 4) setPan({ x: d.px + dx, y: d.py + dy });
  };
  const onUp = (e: React.PointerEvent<SVGSVGElement>) => {
    const d = drag.current;
    drag.current = null;
    if (!d || d.moved > 4) return;
    setSelected(null);
    if (onPick) {
      const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      onPick(cLat - (y - oy) / (M_LAT * s), cLng + (x - ox) / (mLng * s));
    }
  };

  const zoomBy = (f: number) => setMul((m) => Math.min(6, Math.max(0.5, m * f)));

  return (
    <div ref={box} className={`relative h-full w-full overflow-hidden rounded-[inherit] bg-muted ${className ?? ""}`}>
      <svg
        width={size.w}
        height={size.h}
        className={interactive || onPick ? "block touch-none cursor-grab active:cursor-grabbing" : "block"}
        role="application"
        aria-label={ariaLabel}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
      >
        <g stroke="var(--border)" strokeWidth={1} opacity={0.9}>
          {vLines.map((x) => <line key={`v${x}`} x1={x} x2={x} y1={0} y2={size.h} />)}
          {hLines.map((y) => <line key={`h${y}`} x1={0} x2={size.w} y1={y} y2={y} />)}
        </g>

        {circles.map((c, i) => (
          <circle key={i} cx={px(c.lng)} cy={py(c.lat)} r={Math.max(2, c.radius * s)} fill={c.color} fillOpacity={c.opacity ?? 0.2} stroke={c.color} strokeOpacity={0.45} pointerEvents="none" />
        ))}

        {sorted.map((m) => {
          const x = px(m.lng);
          const y = py(m.lat);
          if (x < -40 || y < -40 || x > size.w + 40 || y > size.h + 40) return null;
          if (m.shape === "label") {
            return (
              <text key={m.id} x={x} y={y} textAnchor="middle" fontSize={10} fontWeight={500} fill="var(--muted-foreground)" stroke="var(--muted)" strokeWidth={3} paintOrder="stroke" pointerEvents="none">
                {m.label}
              </text>
            );
          }
          const active = selected === m.id;
          const click = m.detail || m.onClick;
          const sz = m.size ?? 12;
          return (
            <g
              key={m.id}
              transform={`translate(${x} ${y})`}
              role={click ? "button" : undefined}
              tabIndex={click ? 0 : undefined}
              aria-label={m.label}
              className={click ? "cursor-pointer outline-none [&:focus-visible>*:last-child]:stroke-[var(--ring)]" : undefined}
              onPointerDown={(e) => e.stopPropagation()}
              onPointerUp={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                if (m.detail) setSelected(active ? null : m.id);
                m.onClick?.();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  if (m.detail) setSelected(active ? null : m.id);
                  m.onClick?.();
                }
              }}
            >
              {m.pulse && (
                <circle r={sz} fill={m.color} opacity={0.4}>
                  <animate attributeName="r" values={`${sz * 0.6};${sz * 1.9}`} dur="1.8s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.45;0" dur="1.8s" repeatCount="indefinite" />
                </circle>
              )}
              {active && <circle r={sz + 12} fill="none" stroke="var(--foreground)" strokeWidth={1.5} strokeDasharray="3 3" />}
              {m.shape === "hub" ? (
                <>
                  <rect x={-(sz + 6)} y={-(sz + 6)} width={(sz + 6) * 2} height={(sz + 6) * 2} rx={8} fill={m.color} stroke="var(--card)" strokeWidth={2} />
                  {m.text && <text textAnchor="middle" dy="0.35em" fontSize={11} fontWeight={700} fill="var(--card)" pointerEvents="none">{m.text}</text>}
                </>
              ) : m.shape === "drain" ? (
                <rect x={-sz / 2 - 1} y={-sz / 2 - 1} width={sz + 2} height={sz + 2} rx={2} transform="rotate(45)" fill={m.color} stroke="var(--card)" strokeWidth={2} />
              ) : m.shape === "pin" ? (
                <path d="M0 0C-9 -11 -12 -15 -12 -21A12 12 0 0 1 12 -21C12 -15 9 -11 0 0Z" fill={m.color} stroke="var(--card)" strokeWidth={2}>
                  <title>{m.label}</title>
                </path>
              ) : (
                <circle r={sz / 2 + 1} fill={m.color} stroke="var(--card)" strokeWidth={2} />
              )}
            </g>
          );
        })}

        {/* scale bar */}
        <g transform={`translate(14 ${size.h - 16})`} pointerEvents="none">
          <line x1={0} x2={sp} y1={0} y2={0} stroke="var(--foreground)" strokeWidth={2} />
          <line x1={0} x2={0} y1={-4} y2={4} stroke="var(--foreground)" strokeWidth={2} />
          <line x1={sp} x2={sp} y1={-4} y2={4} stroke="var(--foreground)" strokeWidth={2} />
          <text x={sp + 6} y={3.5} fontSize={10} fontWeight={500} fill="var(--foreground)">{step >= 1000 ? `${step / 1000} km` : `${step} m`}</text>
        </g>
      </svg>

      {interactive && (
        <div className="absolute right-2.5 top-2.5 flex flex-col overflow-hidden rounded-lg border bg-card shadow-sm">
          <button onClick={() => zoomBy(1.4)} aria-label="Zoom in" className="grid size-8 place-items-center hover:bg-accent"><Plus className="size-4" /></button>
          <button onClick={() => zoomBy(1 / 1.4)} aria-label="Zoom out" className="grid size-8 place-items-center border-t hover:bg-accent"><Minus className="size-4" /></button>
        </div>
      )}

      {sel?.detail && (
        <div className="absolute inset-x-2.5 bottom-9 max-w-[280px] rounded-xl border bg-card p-3 text-xs shadow-md" role="status">
          <button onClick={() => setSelected(null)} aria-label="Close details" className="absolute right-1.5 top-1.5 grid size-6 place-items-center rounded-md text-muted-foreground hover:bg-accent"><X className="size-3.5" /></button>
          <p className="pr-6 text-sm font-semibold">{sel.detail.title}</p>
          {sel.detail.lines.map((l) => <p key={l} className="mt-0.5 text-muted-foreground">{l}</p>)}
        </div>
      )}
    </div>
  );
}
