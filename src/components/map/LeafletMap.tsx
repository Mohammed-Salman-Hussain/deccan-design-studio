import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useApp } from "@/store/app";

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  color: string;
  label?: string;
  html?: string;
  size?: number;
  pulse?: boolean;
  shape?: "dot" | "hub" | "drain" | "pin" | "label";
  popup?: string;
  onClick?: () => void;
}

export interface MapCircle {
  lat: number;
  lng: number;
  radius: number;
  color: string;
  opacity?: number;
}

export interface LeafletMapProps {
  center: [number, number];
  zoom: number;
  markers?: MapMarker[];
  circles?: MapCircle[];
  onPick?: (lat: number, lng: number) => void;
  interactive?: boolean;
  className?: string;
  ariaLabel?: string;
}

function iconHtml(m: MapMarker) {
  const s = m.size ?? 14;
  const pulse = m.pulse ? `<span class="absolute inset-0 rounded-full animate-pulse-ring" style="background:${m.color}"></span>` : "";
  if (m.shape === "hub") {
    return `<div class="relative grid place-items-center" style="width:${s + 14}px;height:${s + 14}px">${pulse}<span class="relative grid place-items-center rounded-lg border-2 text-[9px] font-bold" style="width:${s + 10}px;height:${s + 10}px;background:color-mix(in oklab, ${m.color} 30%, var(--surface));border-color:${m.color};color:var(--foreground)">${m.html ?? ""}</span></div>`;
  }
  if (m.shape === "drain") {
    return `<div class="relative grid place-items-center" style="width:${s + 10}px;height:${s + 10}px">${pulse}<span class="relative rotate-45 border-2" style="width:${s}px;height:${s}px;background:${m.color};border-color:var(--surface)"></span></div>`;
  }
  if (m.shape === "pin") {
    return `<div class="relative" style="width:28px;height:36px"><svg viewBox="0 0 24 32" width="28" height="36"><path d="M12 0C5.4 0 0 5.2 0 11.7 0 20.4 12 32 12 32s12-11.6 12-20.3C24 5.2 18.6 0 12 0z" fill="${m.color}"/><circle cx="12" cy="11.5" r="4.5" fill="var(--surface)"/></svg></div>`;
  }
  if (m.shape === "label") {
    return `<span class="whitespace-nowrap rounded-md px-1.5 py-0.5 text-[10px] font-medium" style="background:color-mix(in oklab, var(--surface) 80%, transparent);color:var(--muted-foreground);border:1px solid var(--border)">${m.label}</span>`;
  }
  return `<div class="relative grid place-items-center" style="width:${s + 8}px;height:${s + 8}px">${pulse}<span class="relative rounded-full border-2" style="width:${s}px;height:${s}px;background:${m.color};border-color:var(--surface)"></span></div>`;
}

export default function LeafletMap({ center, zoom, markers = [], circles = [], onPick, interactive = true, className, ariaLabel = "Map" }: LeafletMapProps) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const tiles = useRef<L.TileLayer | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  const pickRef = useRef(onPick);
  pickRef.current = onPick;
  const theme = useApp((s) => s.theme);
  const [tileError, setTileError] = useState(false);

  useEffect(() => {
    if (!el.current || map.current) return;
    const m = L.map(el.current, {
      center,
      zoom,
      zoomControl: interactive,
      attributionControl: true,
      scrollWheelZoom: false,
      dragging: interactive,
      doubleClickZoom: interactive,
      touchZoom: interactive,
      keyboard: interactive,
    });
    layer.current = L.layerGroup().addTo(m);
    m.on("click", (e: L.LeafletMouseEvent) => pickRef.current?.(e.latlng.lat, e.latlng.lng));
    m.on("focus", () => m.scrollWheelZoom.enable());
    m.on("blur", () => m.scrollWheelZoom.disable());
    map.current = m;
    const ro = new ResizeObserver(() => m.invalidateSize());
    ro.observe(el.current);
    return () => {
      ro.disconnect();
      m.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const m = map.current;
    if (!m) return;
    tiles.current?.remove();
    const style = theme === "light" ? "light_all" : "dark_all";
    const t = L.tileLayer(`https://{s}.basemaps.cartocdn.com/${style}/{z}/{x}/{y}{r}.png`, {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 19,
    });
    let errors = 0;
    t.on("tileerror", () => {
      errors++;
      if (errors > 6) setTileError(true);
    });
    t.on("tileload", () => setTileError(false));
    t.addTo(m);
    tiles.current = t;
  }, [theme]);

  useEffect(() => {
    map.current?.flyTo(center, zoom, { duration: 0.8 });
  }, [center[0], center[1], zoom]);

  useEffect(() => {
    const g = layer.current;
    if (!g) return;
    g.clearLayers();
    for (const c of circles) {
      L.circle([c.lat, c.lng], { radius: c.radius, color: c.color, weight: 1, fillColor: c.color, fillOpacity: c.opacity ?? 0.2, opacity: 0.5, interactive: false }).addTo(g);
    }
    for (const mk of markers) {
      const s = mk.shape === "hub" ? (mk.size ?? 14) + 14 : mk.shape === "pin" ? 28 : (mk.size ?? 14) + 8;
      const icon = L.divIcon({
        className: "ll-marker",
        html: iconHtml(mk),
        iconSize: mk.shape === "label" ? undefined : [s, mk.shape === "pin" ? 36 : s],
        iconAnchor: mk.shape === "pin" ? [14, 36] : mk.shape === "label" ? [0, 0] : [s / 2, s / 2],
      });
      const marker = L.marker([mk.lat, mk.lng], { icon, keyboard: true, title: mk.label, interactive: mk.shape !== "label" }).addTo(g);
      if (mk.popup) marker.bindPopup(mk.popup);
      if (mk.onClick) marker.on("click", () => mk.onClick?.());
    }
  }, [markers, circles]);

  return (
    <div className={`ll-map relative h-full w-full ${className ?? ""}`}>
      <div ref={el} className="absolute inset-0 rounded-[inherit]" role="application" aria-label={ariaLabel} />
      {tileError && (
        <div className="pointer-events-none absolute inset-x-3 bottom-3 z-[500] rounded-lg border bg-popover/90 px-3 py-2 text-xs text-muted-foreground">
          Street tiles couldn't load — showing hubs and drains on a plain grid.
        </div>
      )}
    </div>
  );
}
