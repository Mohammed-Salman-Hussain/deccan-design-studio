import { Pause, Play, Sun, CloudLightning, Thermometer, Zap, Bell, Moon, Sunrise, Sunset, RotateCcw, MoreHorizontal, SlidersHorizontal } from "lucide-react";
import { useApp } from "@/store/app";
import { LOCALITIES } from "@/lib/sim/data";
import { formatClock, SCENARIOS } from "@/lib/sim/engine";
import { useLocality, useT } from "@/lib/hooks";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import type { Lang, Role, Scenario } from "@/lib/sim/types";
import { toast } from "sonner";

const SC_ICON: Record<Scenario, typeof Sun> = { normal: Sun, storm: CloudLightning, heatwave: Thermometer, peak: Zap };

/** One dropdown instead of four buttons: the scenario changes every page, so it stays in the header. */
export function ScenarioSwitch({ className }: { className?: string }) {
  const scenario = useApp((s) => s.scenario);
  const setScenario = useApp((s) => s.setScenario);
  const t = useT();
  return (
    <Select
      value={scenario}
      onValueChange={(v) => {
        const next = SCENARIOS.find((s) => s.id === v);
        setScenario(v as Scenario);
        if (next) toast(t(`scenario.${next.id}`), { description: `${next.blurb} Clock moved to ${formatClock(next.focusMin)} so you can see it happen.` });
      }}
    >
      <SelectTrigger aria-label="Conditions" className={cn("h-9 w-[150px] shrink-0 rounded-lg bg-card text-sm", scenario !== "normal" && "border-primary/60", className)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {SCENARIOS.map((s) => {
          const Icon = SC_ICON[s.id];
          return (
            <SelectItem key={s.id} value={s.id} className="text-sm">
              <span className="flex items-center gap-2"><Icon className="size-3.5" aria-hidden />{t(`scenario.${s.id}`)}</span>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}

export function ClockControl({ className }: { className?: string }) {
  const clock = useApp((s) => s.clock);
  const playing = useApp((s) => s.playing);
  const speed = useApp((s) => s.speed);
  const set = useApp((s) => s.set);
  const h = clock / 60;
  const DayIcon = h < 6 || h >= 19 ? Moon : h < 9 ? Sunrise : h >= 17 ? Sunset : Sun;
  const nextSpeed = speed === 1 ? 2 : speed === 2 ? 4 : 1;
  return (
    <div className={cn("hidden shrink-0 items-center gap-2 rounded-lg border bg-card py-0.5 pl-0.5 pr-2 md:flex", className)}>
      <button
        onClick={() => set({ playing: !playing })}
        aria-label={playing ? "Pause clock" : "Play clock"}
        className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground transition hover:brightness-95"
      >
        {playing ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
      </button>
      <DayIcon className="size-3.5 text-primary-glow" aria-hidden />
      <span className="w-[4.6rem] font-mono text-xs tabular" aria-live="off">{formatClock(clock)}</span>
      <Slider aria-label="Scrub time of day" className="w-24" min={0} max={1430} step={10} value={[clock]} onValueChange={([v]) => set({ clock: v })} />
      <button onClick={() => set({ speed: nextSpeed })} aria-label={`Clock speed ${speed}×, change to ${nextSpeed}×`} className="h-6 rounded-md px-1.5 font-mono text-[11px] text-muted-foreground hover:bg-accent hover:text-foreground">
        {speed}×
      </button>
    </div>
  );
}

export function LocalityHubSelect({ className }: { className?: string }) {
  const localityId = useApp((s) => s.localityId);
  const hubId = useApp((s) => s.hubId);
  const setLocality = useApp((s) => s.setLocality);
  const set = useApp((s) => s.set);
  const loc = useLocality();
  return (
    <div className={cn("flex shrink-0 items-center gap-2", className)}>
      <Select value={localityId} onValueChange={setLocality}>
        <SelectTrigger aria-label="Locality" className="h-9 w-[130px] rounded-lg bg-card text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {LOCALITIES.map((l) => (
            <SelectItem key={l.id} value={l.id} className="text-sm">{l.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={hubId} onValueChange={(v) => set({ hubId: v })}>
        <SelectTrigger aria-label="Hub" className="hidden h-9 w-[170px] rounded-lg bg-card text-sm sm:flex">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {loc.hubs.map((h) => (
            <SelectItem key={h.id} value={h.id} className="text-sm">
              {h.name} <span className="text-muted-foreground">· {h.flats} flats</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function RoleSwitch({ className, compact }: { className?: string; compact?: boolean }) {
  const role = useApp((s) => s.role);
  const setRole = useApp((s) => s.setRole);
  const t = useT();
  const roles: Role[] = ["officer", "resident", "worker"];
  return (
    <div role="radiogroup" aria-label="View as" className={cn("flex items-center gap-0.5 rounded-lg border bg-card p-0.5", className)}>
      {roles.map((r) => (
        <button
          key={r}
          role="radio"
          aria-checked={role === r}
          onClick={() => setRole(r)}
          className={cn("h-8 whitespace-nowrap rounded-md px-3 text-sm font-medium transition-colors", role === r ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:text-foreground")}
        >
          {compact ? t(`role.${r}`).split(" ")[0] : t(`role.${r}`)}
        </button>
      ))}
    </div>
  );
}

export function LangSwitch() {
  const lang = useApp((s) => s.lang);
  const set = useApp((s) => s.set);
  const L: { id: Lang; label: string }[] = [
    { id: "en", label: "English" },
    { id: "te", label: "తెలుగు" },
    { id: "hi", label: "हिन्दी" },
  ];
  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Language">
      {L.map((l) => (
        <button key={l.id} role="radio" aria-checked={lang === l.id} onClick={() => set({ lang: l.id })} className={cn("h-8 flex-1 rounded-md border px-2 text-sm", lang === l.id ? "border-transparent bg-secondary font-medium text-secondary-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground")}>
          {l.label}
        </button>
      ))}
    </div>
  );
}

/** Notifications, plus one menu for the things most people touch rarely. */
export function IconButtons() {
  const set = useApp((s) => s.set);
  const notices = useApp((s) => s.notices);
  const markRead = useApp((s) => s.markNoticesRead);
  const resetDemo = useApp((s) => s.resetDemo);
  const unread = notices.filter((n) => !n.read).length;
  return (
    <div className="flex items-center gap-1">
      <Popover onOpenChange={(o) => !o && markRead()}>
        <PopoverTrigger asChild>
          <button aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`} className="relative grid size-9 place-items-center rounded-lg border bg-card hover:bg-accent">
            <Bell className="size-4" />
            {unread > 0 && <span className="absolute -right-1 -top-1 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">{unread}</span>}
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80 p-0">
          <div className="border-b px-4 py-3 text-sm font-semibold">Notifications</div>
          <div className="max-h-80 overflow-y-auto">
            {notices.length === 0 ? (
              <p className="px-4 py-8 text-center text-xs text-muted-foreground">You're all caught up.</p>
            ) : (
              notices.map((n) => (
                <div key={n.id} className={cn("border-b px-4 py-3 last:border-0", !n.read && "bg-brand-yellow/40")}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium">{n.title}</p>
                    <span className="shrink-0 font-mono text-[10px] text-muted-foreground">{n.at}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{n.body}</p>
                </div>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <button aria-label="More options" className="grid size-9 place-items-center rounded-lg border bg-card hover:bg-accent">
            <MoreHorizontal className="size-4" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-64 space-y-3 p-3">
          <div>
            <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Language</p>
            <LangSwitch />
          </div>
          <div className="space-y-1 border-t pt-2">
            <button onClick={() => set({ assumptionsOpen: true })} className="flex h-9 w-full items-center gap-2 rounded-md px-2 text-sm hover:bg-accent">
              <SlidersHorizontal className="size-4 text-muted-foreground" aria-hidden /> Assumptions and formulas
            </button>
            <button
              onClick={() => {
                resetDemo();
                toast.success("Day reset", { description: "Tasks, reports and the clock are back to the start of the day." });
              }}
              className="flex h-9 w-full items-center gap-2 rounded-md px-2 text-sm hover:bg-accent"
            >
              <RotateCcw className="size-4 text-muted-foreground" aria-hidden /> Reset the day
            </button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
