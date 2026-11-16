import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis, ReferenceArea } from "recharts";
import { Sun, Flame, IndianRupee, CloudLightning, ZapOff, Droplet, Recycle, Award, Camera, MapPin, Send, Calculator, Share2, Thermometer, Zap, Trophy, ImagePlus, X, Bell } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/store/app";
import { useHub, useHubSummary, useLocality, useStepClock, useT, fmtL, fmtRs, useBonus } from "@/lib/hooks";
import { formatHour, hourlySeries, SCENARIO_BY_ID } from "@/lib/sim/engine";
import { hubPlan, type PlanItem } from "@/lib/sim/plan";
import { Panel, Stat } from "@/components/ll/primitives";
import { Credits } from "./Credits";
import { MonsoonShare } from "./MonsoonShare";
import { suggestMatch, MATCH_BONUS } from "@/lib/credits";

import { TankGauge } from "./TankGauge";
import { LocalityMap } from "@/components/map/LocalityMap";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const PLAN_ICON: Record<PlanItem["kind"], typeof Sun> = { waste: Recycle, solar: Sun, storm: CloudLightning, outage: ZapOff, tank: Droplet, reuse: Droplet, heat: Thermometer, peak: Zap };
const PLAN_COLOR: Record<PlanItem["kind"], string> = { waste: "var(--loop-waste)", solar: "var(--loop-solar)", storm: "var(--loop-rain)", outage: "var(--destructive)", tank: "var(--loop-reuse)", reuse: "var(--loop-reuse)", heat: "var(--destructive)", peak: "var(--loop-save)" };

export function ResidentView() {
  const t = useT();
  const hub = useHub();
  const hs = useHubSummary();
  const scenario = useApp((s) => s.scenario);
  const clock = useStepClock();
  const notices = useApp((s) => s.notices);
  const plan = useMemo(() => hubPlan(hub, scenario), [hub, scenario]);
  const series = useMemo(() => hourlySeries(hub, scenario, true), [hub, scenario]);
  const base = useMemo(() => hourlySeries(hub, scenario, false), [hub, scenario]);
  const chart = series.map((r, i) => ({ ...r, without: base[i].tank }));
  const nowH = clock / 60;
  const outages = SCENARIO_BY_ID[scenario].outages;

  const alerts = useMemo(() => {
    const a: { icon: typeof Sun; title: string; body: string; tone: string }[] = [];
    if (scenario === "storm") a.push({ icon: CloudLightning, title: "Storm warning · 6 pm – midnight", body: "Heavy rain up to 38 mm/h with 48 km/h winds. Keep balcony drains clear and park away from trees.", tone: "var(--loop-rain)" });
    for (const [s, e] of outages) a.push({ icon: ZapOff, title: `Planned power cut · ${formatHour(s)} – ${formatHour(e % 24 === 0 ? 24 : e)}`, body: `Discom notice for section ${hub.section}. Tanks will be full beforehand.`, tone: "var(--destructive)" });
    if (scenario === "heatwave") a.push({ icon: Thermometer, title: "Heat advisory", body: "Stay hydrated. Garden watering switched to treated water today.", tone: "var(--warning)" });
    if (scenario === "storm") a.push({ icon: Droplet, title: "Boil-water advisory (precautionary)", body: "Boil drinking water for 24 hours after the storm if your sump was flooded.", tone: "var(--loop-reuse)" });
    return a;
  }, [scenario, outages, hub.section]);

  const hasAlerts = alerts.length > 0 || notices.length > 0;
  const status = hs.now.outage ? "Power is out. The tank is supplying your building." : hs.now.pumpOn ? `Pump is on, running on ${hs.now.pumpSource}.` : "Pump is idle.";

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
      <Panel title={t("resident.plan")} subtitle={`${hub.name} · ${hub.flats} flats · ${hub.area}`} icon={Sun}>
        <motion.p key={plan.headline} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="font-display text-xl font-semibold leading-snug">{plan.headline}</motion.p>
        <ol className="relative mt-5 space-y-3 border-l pl-5">
          {plan.items.slice(0, 5).map((it, i) => {
            const Icon = PLAN_ICON[it.kind];
            const past = it.h <= nowH;
            return (
              <motion.li key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="relative">
                <span className={cn("absolute -left-[31px] grid size-5 place-items-center rounded-full border-2 border-card", past ? "" : "opacity-60")} style={{ background: PLAN_COLOR[it.kind] }}>
                  <Icon className="size-2.5 text-card" aria-hidden />
                </span>
                <p className="font-mono text-[11px] text-muted-foreground">{formatHour(it.h)} {past && <span className="text-primary-glow">· done</span>}</p>
                <p className="text-sm">{it.text}</p>
              </motion.li>
            );
          })}
        </ol>
      </Panel>

        <div className="space-y-4">
      {hasAlerts && (
        <ul className="space-y-2" aria-label={t("resident.alerts")}>
          {alerts.map((a) => (
            <li key={a.title} className="flex gap-3 rounded-xl border p-3" style={{ borderColor: `color-mix(in oklab, ${a.tone} 35%, transparent)`, background: `color-mix(in oklab, ${a.tone} 8%, transparent)` }}>
              <a.icon className="mt-0.5 size-4 shrink-0" style={{ color: a.tone }} aria-hidden />
              <div><p className="text-sm font-medium">{a.title}</p><p className="text-xs text-muted-foreground">{a.body}</p></div>
            </li>
          ))}
          {notices.slice(0, 1).map((n) => (
            <li key={n.id} className="flex gap-3 rounded-xl border p-3">
              <Bell className="mt-0.5 size-4 shrink-0 text-primary-glow" aria-hidden />
              <div className="min-w-0"><p className="text-sm font-medium">{n.title}</p><p className="text-xs text-muted-foreground">{n.body}</p></div>
            </li>
          ))}
        </ul>
      )}

      <Panel
        title={t("kpi.tank")}
        icon={Droplet}
        subtitle={<>Outage covered: {hs.outageHours > 0 ? `${hs.outageCoveredHours.toFixed(1)} of ${hs.outageHours.toFixed(1)} h` : "no outage today"}. Shortage: {fmtL(hs.shortageL)}. Solar today: {hs.solarKWh.toFixed(0)} kWh (kWp × sun angle × (1 − 0.75 × cloud cover)). Tankers avoided: {hs.tankersAvoided.toFixed(1)} (5,000 L trips).</>}
      >
        <div className="flex items-center gap-5">
          <TankGauge pct={hs.now.tankPct} size={110} />
          <div className="min-w-0 flex-1 space-y-3">
            <p className="text-sm text-muted-foreground">{status}</p>
            <Stat label={t("kpi.savings")} icon={IndianRupee} color="var(--primary-glow)" value={<span className="tabular">{fmtRs(hs.savingsRs)}</span>} sub={`about ${fmtRs(hs.savingsRs / hub.flats)} per flat`} hint="Solar units × ₹8 + peak kWh avoided × ₹9.50 + tankers avoided × ₹1,000" />
          </div>
        </div>
      </Panel>

        </div>
      </div>

      <Tabs defaultValue="chart">
        <TabsList>
          <TabsTrigger value="chart">Tank today</TabsTrigger>
          <TabsTrigger value="monsoon">Monsoon</TabsTrigger>
          <TabsTrigger value="report">Report</TabsTrigger>
          <TabsTrigger value="share">Share</TabsTrigger>
          <TabsTrigger value="waste">Waste</TabsTrigger>
          <TabsTrigger value="payback">Payback</TabsTrigger>
        </TabsList>
        <TabsContent value="chart" className="mt-3">
          <Panel title="Tank level through the day" subtitle="With LoopLocal compared with the usual pump schedule. Shaded bands are power cuts." bodyClass="h-[220px]">
            <ResponsiveContainer>
              <AreaChart data={chart} margin={{ left: -18, right: 8, top: 6 }}>
                <defs>
                  <linearGradient id="gTank" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="var(--loop-rain)" stopOpacity={0.4} /><stop offset="1" stopColor="var(--loop-rain)" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="hour" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} interval={3} />
                <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} domain={[0, 100]} />
                {outages.map(([a, b]) => <ReferenceArea key={a} x1={`${String(Math.floor(a)).padStart(2, "0")}:00`} x2={`${String(Math.min(23, Math.floor(b))).padStart(2, "0")}:00`} fill="var(--destructive)" fillOpacity={0.08} />)}
                <RTooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="without" name="Without LoopLocal (%)" stroke="var(--muted-foreground)" strokeDasharray="4 4" fill="none" />
                <Area type="monotone" dataKey="tank" name="Tank (%)" stroke="var(--loop-rain)" strokeWidth={2} fill="url(#gTank)" />
                <ReferenceLine x={`${String(Math.floor(nowH)).padStart(2, "0")}:00`} stroke="var(--primary-glow)" strokeDasharray="3 3" label={{ value: "now", fill: "var(--primary-glow)", fontSize: 10, position: "top" }} />
              </AreaChart>
            </ResponsiveContainer>
          </Panel>
        </TabsContent>
        <TabsContent value="monsoon" className="mt-3"><MonsoonShare /></TabsContent>
        <TabsContent value="report" className="mt-3"><ReportIssue /></TabsContent>
        <TabsContent value="share" className="mt-3 grid gap-4 lg:grid-cols-2"><SurplusCard /><Credits /></TabsContent>
        <TabsContent value="waste" className="mt-3"><SegregationBoard /></TabsContent>
        <TabsContent value="payback" className="mt-3"><PaybackEstimator /></TabsContent>
      </Tabs>
    </div>
  );
}

function SegregationBoard() {
  const loc = useLocality();
  const hub = useHub();
  const bonus = useBonus();
  const rows = [...loc.hubs].map((h) => ({ h, s: Math.min(100, h.segregation + (h.id === hub.id ? Math.round(bonus) : 0)) })).sort((a, b) => b.s - a.s);
  const mine = rows.find((r) => r.h.id === hub.id)!;
  const badge = (s: number) => (s >= 80 ? { t: "Zero-waste hero", c: "var(--loop-waste)" } : s >= 70 ? { t: "Green bin pro", c: "var(--loop-reuse)" } : s >= 60 ? { t: "Rising", c: "var(--loop-solar)" } : { t: "Getting started", c: "var(--muted-foreground)" });
  return (
    <Panel title="Waste segregation" subtitle="Neighbourhood leaderboard" icon={Trophy}>
      <div className="mb-4 flex items-center gap-4 rounded-lg border p-3">
        <div className="grid size-14 place-items-center rounded-full border-4" style={{ borderColor: badge(mine.s).c }}>
          <span className="font-display text-lg font-semibold">{mine.s}</span>
        </div>
        <div>
          <p className="text-sm font-medium">Your hub's score</p>
          <p className="flex items-center gap-1 text-xs" style={{ color: badge(mine.s).c }}><Award className="size-3.5" /> {badge(mine.s).t}</p>
          <p className="text-[11px] text-muted-foreground">Rank #{rows.indexOf(mine) + 1} of {rows.length}</p>
        </div>
      </div>
      <ol className="space-y-1.5">
        {rows.map((r, i) => (
          <li key={r.h.id} className={cn("flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs", r.h.id === hub.id && "bg-primary/10")}>
            <span className="w-4 font-mono text-muted-foreground">{i + 1}</span>
            <span className="flex-1 truncate">{r.h.name}</span>
            {i < 3 && <Award className="size-3.5" style={{ color: ["var(--loop-solar)", "var(--loop-rain)", "var(--loop-save)"][i] }} aria-label={`Rank ${i + 1} badge`} />}
            <span className="font-mono tabular">{r.s}</span>
          </li>
        ))}
      </ol>
    </Panel>
  );
}

const ISSUE_TYPES = ["Blocked drain", "Garbage pile", "Foul-smelling water", "Streetlight out"];

function resizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, 480 / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = img.width * scale;
      c.height = img.height * scale;
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/jpeg", 0.75));
    };
    img.onerror = reject;
    img.src = url;
  });
}

function ReportIssue() {
  const hub = useHub();
  const loc = useLocality();
  const addReport = useApp((s) => s.addReport);
  const reports = useApp((s) => s.reports);
  const [type, setType] = useState(ISSUE_TYPES[0]);
  const [note, setNote] = useState("");
  const [photo, setPhoto] = useState<string | undefined>();
  const [pin, setPin] = useState<[number, number]>([hub.lat + 0.0012, hub.lng + 0.0015]);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const submit = () => {
    setBusy(true);
    setTimeout(() => {
      addReport({ type, note, photo, lat: pin[0], lng: pin[1], hubId: hub.id });
      toast.success("Report sent", { description: `${type} routed to the ward officer's queue.` });
      setNote("");
      setPhoto(undefined);
      setBusy(false);
    }, 600);
  };

  return (
    <Panel title="Report an issue" subtitle="Goes straight into the officer's action queue" icon={Camera}>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-1.5" role="radiogroup" aria-label="Issue type">
          {ISSUE_TYPES.map((it) => (
            <button key={it} role="radio" aria-checked={type === it} onClick={() => setType(it)} className={cn("rounded-lg border px-2 py-2 text-xs transition", type === it ? "border-primary bg-primary/15 text-foreground" : "text-muted-foreground hover:text-foreground")}>{it}</button>
          ))}
        </div>
        <div>
          <Label htmlFor="issue-note" className="text-xs">What did you see?</Label>
          <Textarea id="issue-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Plastic blocking the drain grate outside Block B gate" className="mt-1 min-h-16 text-sm" maxLength={300} />
        </div>
        <div className="flex items-center gap-2">
          <input ref={fileRef} type="file" accept="image/*" capture="environment" className="sr-only" id="issue-photo" onChange={async (e) => { const f = e.target.files?.[0]; if (f) { try { setPhoto(await resizeImage(f)); } catch { toast.error("Couldn't read that photo"); } } e.target.value = ""; }} />
          {photo ? (
            <div className="relative">
              <img src={photo} alt="Attached issue" className="h-16 w-20 rounded-lg object-cover" />
              <button onClick={() => setPhoto(undefined)} aria-label="Remove photo" className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-destructive text-destructive-foreground"><X className="size-3" /></button>
            </div>
          ) : (
            <Button type="button" variant="glass" size="sm" onClick={() => fileRef.current?.click()}><ImagePlus /> Add photo</Button>
          )}
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground"><MapPin className="size-3" /> Tap the map to move the pin</span>
        </div>
        <div className="h-40 overflow-hidden rounded-xl border">
          <LocalityMap center={[hub.lat, hub.lng]} zoom={16} markers={[{ id: "hub", lat: hub.lat, lng: hub.lng, color: "var(--primary-glow)", shape: "hub", size: 8, text: "H", label: hub.name }, { id: "pin", lat: pin[0], lng: pin[1], color: "var(--primary)", shape: "pin", label: "Issue location" }]} onPick={(la, ln) => setPin([la, ln])} ariaLabel={`Pick issue location near ${hub.name}, ${loc.name}`} />
        </div>
        <Button className="w-full" variant="hero" onClick={submit} disabled={busy}>{busy ? "Sending…" : <><Send /> Submit report</>}</Button>
        {reports.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">My reports</p>
            {reports.slice(0, 3).map((r) => (
              <div key={r.id} className="flex items-center gap-2 rounded-lg border p-2 text-xs">
                {r.photo ? <img src={r.photo} alt="" className="size-8 rounded object-cover" /> : <div className="grid size-8 place-items-center rounded bg-muted"><MapPin className="size-3.5" /></div>}
                <div className="min-w-0 flex-1"><p className="truncate font-medium">{r.type}</p><p className="text-muted-foreground">{r.createdAt}</p></div>
                <span className="rounded-full bg-info/15 px-2 py-0.5 text-[10px] capitalize text-info">{r.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Panel>
  );
}

function SurplusCard() {
  const loc = useLocality();
  const hub = useHub();
  const offers = useApp((s) => s.offers);
  const addOffer = useApp((s) => s.addOffer);
  const matchOffer = useApp((s) => s.matchOffer);
  const [res, setRes] = useState<"water" | "biogas" | "solar">("water");
  const [qty, setQty] = useState(10);
  const name = (id?: string) => loc.hubs.find((h) => h.id === id)?.name ?? "Neighbour hub";
  const suggestion = useMemo(() => suggestMatch(offers, loc.hubs), [offers, loc.hubs]);
  const unit = { water: "kL treated", biogas: "m³/day", solar: "kWh midday" }[res];
  const color = { water: "var(--loop-reuse)", biogas: "var(--loop-waste)", solar: "var(--loop-solar)" };
  return (
    <Panel title="Surplus sharing" subtitle="Hubs share extra treated water, biogas or solar" icon={Share2}>
      {suggestion && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-primary/40 bg-primary/5 p-2.5 text-xs" role="status">
          <p className="min-w-0 flex-1">
            <span className="font-medium">Suggested match · </span>
            {name(suggestion.offer.fromHub)} can cover {name(suggestion.request.fromHub)}'s request for {suggestion.request.qty} {suggestion.request.unit}. {suggestion.km.toFixed(1)} km apart, +{MATCH_BONUS} Loop Credits each.
          </p>
          <Button
            size="sm"
            variant="hero"
            className="h-7"
            onClick={() => {
              matchOffer(suggestion.offer.id, suggestion.request.fromHub);
              matchOffer(suggestion.request.id, suggestion.offer.fromHub);
              toast.success("Matched", { description: `${name(suggestion.offer.fromHub)} and ${name(suggestion.request.fromHub)} each earn ${MATCH_BONUS} Loop Credits.` });
            }}
          >
            Match them
          </Button>
        </div>
      )}
      <ul className="space-y-2">
        {offers.slice(0, 5).map((o) => (
          <li key={o.id} className="flex items-center gap-2 rounded-lg border p-2.5 text-xs">
            <span className="size-2 shrink-0 rounded-full" style={{ background: color[o.resource] }} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{o.kind === "offer" ? "Offer" : "Request"} · {o.qty} {o.unit}</p>
              <p className="truncate text-muted-foreground">{name(o.fromHub)}{o.toHub ? ` → ${name(o.toHub)}` : ""}</p>
            </div>
            {o.status === "matched" ? (
              <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] text-success">Matched</span>
            ) : o.fromHub === hub.id ? (
              <span className="text-[10px] text-muted-foreground">Yours</span>
            ) : (
              <Button size="sm" variant="soft" className="h-7" onClick={() => { matchOffer(o.id, hub.id); toast.success(o.kind === "offer" ? "Surplus accepted" : "Request fulfilled", { description: `${o.qty} ${o.unit} between ${name(o.fromHub)} and ${hub.name}.` }); }}>
                {o.kind === "offer" ? "Accept" : "Fulfil"}
              </Button>
            )}
          </li>
        ))}
      </ul>
      <div className="mt-4 space-y-2 rounded-xl border p-3">
        <p className="text-xs font-medium">Share from {hub.name}</p>
        <div className="flex gap-2">
          <Select value={res} onValueChange={(v) => setRes(v as typeof res)}>
            <SelectTrigger className="h-9 text-xs" aria-label="Resource"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="water">Treated water</SelectItem>
              <SelectItem value="biogas">Biogas</SelectItem>
              <SelectItem value="solar">Solar</SelectItem>
            </SelectContent>
          </Select>
          <Input type="number" min={1} max={500} value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))} className="h-9 w-20 text-xs" aria-label={`Quantity in ${unit}`} />
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="hero" className="flex-1" onClick={() => { addOffer({ fromHub: hub.id, resource: res, qty, unit, kind: "offer" }); toast.success("Offer posted", { description: `${qty} ${unit} available to neighbours.` }); }}>Offer</Button>
          <Button size="sm" variant="glass" className="flex-1" onClick={() => { addOffer({ fromHub: hub.id, resource: res, qty, unit, kind: "request" }); toast.success("Request posted"); }}>Request</Button>
        </div>
      </div>
    </Panel>
  );
}

function Field({ label, value, onChange, min, max, step, suffix, prefix }: { label: string; value: number; onChange: (n: number) => void; min: number; max: number; step: number; suffix?: string; prefix?: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <Label className="text-xs">{label}</Label>
        <div className="flex items-center gap-1">
          {prefix && <span className="text-muted-foreground">{prefix}</span>}
          <Input type="number" value={value} min={min} max={max} step={step} onChange={(e) => onChange(Number(e.target.value) || 0)} className="h-7 w-24 text-right text-xs" aria-label={label} />
          {suffix && <span className="w-12 text-muted-foreground">{suffix}</span>}
        </div>
      </div>
      <Slider min={min} max={max} step={step} value={[value]} onValueChange={([v]) => onChange(v)} aria-label={label} />
    </div>
  );
}

function PaybackEstimator() {
  const hub = useHub();
  const [kwp, setKwp] = useState(Math.max(10, hub.solarKwp || 25));
  const [costKwp, setCostKwp] = useState(48000);
  const [subsidy, setSubsidy] = useState(18000);
  const [tariff, setTariff] = useState(8);
  const [yieldK, setYieldK] = useState(4.2);
  const [kg, setKg] = useState(Math.round(hub.flats * 0.7));
  const [costKg, setCostKg] = useState(3800);
  const [lpg, setLpg] = useState(95);
  const [disposal, setDisposal] = useState(2);

  const solarCost = kwp * Math.max(0, costKwp - subsidy);
  const solarYear = kwp * yieldK * 365 * tariff;
  const solarPayback = solarYear > 0 ? solarCost / solarYear : 0;
  const bioCost = kg * costKg;
  const bioYear = kg * 365 * (0.06 * 0.43 * lpg + disposal);
  const bioPayback = bioYear > 0 ? bioCost / bioYear : 0;

  const Out = ({ items }: { items: [string, string][] }) => (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
      {items.map(([k, v]) => (
        <div key={k} className="rounded-lg border p-3">
          <p className="text-[11px] text-muted-foreground">{k}</p>
          <p className="font-display text-lg font-semibold tabular">{v}</p>
        </div>
      ))}
    </div>
  );

  return (
    <Panel title="Payback estimator" subtitle={`Should ${hub.name} add solar or biogas? Edit any assumption.`} icon={Calculator}>
      <Tabs defaultValue="solar">
        <TabsList>
          <TabsTrigger value="solar"><Sun className="mr-1 size-3.5" /> Solar roof</TabsTrigger>
          <TabsTrigger value="biogas"><Flame className="mr-1 size-3.5" /> Biogas unit</TabsTrigger>
        </TabsList>
        <TabsContent value="solar" className="mt-4 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          <div className="space-y-4">
            <Field label="System size" value={kwp} onChange={setKwp} min={5} max={150} step={1} suffix="kWp" />
            <Field label="Installed cost" value={costKwp} onChange={setCostKwp} min={30000} max={80000} step={500} prefix="₹" suffix="/kWp" />
            <Field label="Subsidy (group housing)" value={subsidy} onChange={setSubsidy} min={0} max={30000} step={500} prefix="₹" suffix="/kWp" />
            <Field label="Tariff" value={tariff} onChange={setTariff} min={4} max={12} step={0.5} prefix="₹" suffix="/unit" />
            <Field label="Daily yield" value={yieldK} onChange={setYieldK} min={3} max={5.5} step={0.1} suffix="kWh/kWp" />
          </div>
          <div className="space-y-3">
            <Out items={[["Net cost", fmtRs(solarCost)], ["Saved per year", fmtRs(solarYear)], ["Payback", `${solarPayback.toFixed(1)} yrs`], ["CO₂ avoided/yr", `${((kwp * yieldK * 365 * 0.82) / 1000).toFixed(1)} t`]]} />
            <PaybackBar years={solarPayback} life={25} color="var(--loop-solar)" />
            <p className="text-[11px] text-muted-foreground">Guide only, not a quote. Uses 0.82 kg CO₂/kWh grid factor; subsidy eligibility to be confirmed with the discom.</p>
          </div>
        </TabsContent>
        <TabsContent value="biogas" className="mt-4 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          <div className="space-y-4">
            <Field label="Wet waste capacity" value={kg} onChange={setKg} min={50} max={600} step={10} suffix="kg/day" />
            <Field label="Installed cost" value={costKg} onChange={setCostKg} min={2000} max={8000} step={100} prefix="₹" suffix="/kg" />
            <Field label="Commercial LPG price" value={lpg} onChange={setLpg} min={60} max={140} step={1} prefix="₹" suffix="/kg" />
            <Field label="Disposal fee avoided" value={disposal} onChange={setDisposal} min={0} max={6} step={0.5} prefix="₹" suffix="/kg" />
          </div>
          <div className="space-y-3">
            <Out items={[["Cost", fmtRs(bioCost)], ["Saved per year", fmtRs(bioYear)], ["Payback", `${bioPayback.toFixed(1)} yrs`], ["Gas per day", `${(kg * 0.06).toFixed(1)} m³`]]} />
            <PaybackBar years={bioPayback} life={15} color="var(--loop-waste)" />
            <p className="text-[11px] text-muted-foreground">0.06 m³ biogas per kg; 1 m³ ≈ 0.43 kg LPG. Guide only — site survey needed.</p>
          </div>
        </TabsContent>
      </Tabs>
    </Panel>
  );
}

function PaybackBar({ years, life, color }: { years: number; life: number; color: string }) {
  const pct = Math.min(100, (years / life) * 100);
  return (
    <div>
      <div className="relative h-3 overflow-hidden rounded-full bg-muted">
        <motion.div className="absolute inset-y-0 left-0 rounded-full" style={{ background: color }} initial={false} animate={{ width: `${pct}%` }} />
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-muted-foreground"><span>Install</span><span>Pays back in {years.toFixed(1)} yrs</span><span>{life}-yr life</span></div>
    </div>
  );
}
