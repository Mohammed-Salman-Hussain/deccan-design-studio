import { Pause, Play, Sun, CloudLightning, Thermometer, Zap, Moon, Languages, Bell, SlidersHorizontal, Sunrise, Sunset, RotateCcw } from "lucide-react";
import { useApp } from "@/store/app";
import { LOCALITIES } from "@/lib/sim/data";
import { formatClock, SCENARIOS } from "@/lib/sim/engine";
import { useLocality, useT } from "@/lib/hooks";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import type { Lang, Role, Scenario } from "@/lib/sim/types";
import { toast } from "sonner";

const SC_ICON: Record<Scenario, typeof Sun> = { normal: Sun, storm: CloudLightning, heatwave: Thermometer, peak: Zap };

export function ScenarioSwitch({ className }: { className?: string }) {
  const scenario = useApp((s) => s.scenario);
  const setScenario = useApp((s) => s.setScenario);
  const t = useT();
  return (
    <div role="radiogroup" aria-label="Scenario" className={cn("flex shrink-0 items-center gap-0.5 rounded-xl border bg-muted/40 p-0.5", className)}>
      {SCENARIOS.map((s) => {
        const Icon = SC_ICON[s.id];
        const active = scenario === s.id;
        return (
          <Tooltip key={s.id}>
            <TooltipTrigger asChild>
              <button
                role="radio"
                aria-checked={active}
                onClick={() => {
                  setScenario(s.id);
                  toast(`${t(`scenario.${s.id}`)}`, { description: s.blurb });
                }}
                className={cn(
                  "relative flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition-colors",
                  active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-3.5" aria-hidden />
                <span className="whitespace-nowrap">{t(`scenario.${s.id}`)}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent className="text-xs">{s.blurb}</TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}

export function ClockControl({ className }: { className?: string }) {
  const clock = useApp((s) => s.clock);
  const playing = useApp((s) => s.playing);
  const speed = useApp((s) => s.speed);
  const set = useApp((s) => s.set);
  const h = clock / 60;
  const DayIcon = h < 6 || h >= 19 ? Moon : h < 9 ? Sunrise : h >= 17 ? Sunset : Sun;
  return (
    <div className={cn("flex shrink-0 items-center gap-2 rounded-xl border bg-muted/40 py-0.5 pl-0.5 pr-2", className)}>
      <button
        onClick={() => set({ playing: !playing })}
        aria-label={playing ? "Pause clock" : "Play clock"}
        className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground transition hover:brightness-110"
      >
        {playing ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
      </button>
      <div className="flex items-center gap-1.5">
        <DayIcon className="size-3.5 text-primary-glow" aria-hidden />
        <span className="w-[4.6rem] font-mono text-xs tabular" aria-live="off">{formatClock(clock)}</span>
      </div>
      <Slider
        aria-label="Scrub time of day"
        className="w-24 md:w-28"
        min={0}
        max={1430}
        step={10}
        value={[clock]}
        onValueChange={([v]) => set({ clock: v })}
      />
      <div className="flex items-center gap-0.5" role="radiogroup" aria-label="Clock speed">
        {[1, 2, 4].map((s) => (
          <button
            key={s}
            role="radio"
            aria-checked={speed === s}
            onClick={() => set({ speed: s })}
            className={cn("h-6 rounded-md px-1.5 font-mono text-[10px]", speed === s ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground")}
          >
            {s}×
          </button>
        ))}
      </div>
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
        <SelectTrigger aria-label="Locality" className="h-9 w-[150px] rounded-xl bg-muted/40 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {LOCALITIES.map((l) => (
            <SelectItem key={l.id} value={l.id} className="text-xs">
              {l.name} <span className="text-muted-foreground">· Hyderabad</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={hubId} onValueChange={(v) => set({ hubId: v })}>
        <SelectTrigger aria-label="Hub" className="h-9 w-[200px] rounded-xl bg-muted/40 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {loc.hubs.map((h) => (
            <SelectItem key={h.id} value={h.id} className="text-xs">
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
    <div role="radiogroup" aria-label="Role" className={cn("flex items-center gap-0.5 rounded-xl border bg-muted/40 p-0.5", className)}>
      {roles.map((r) => (
        <button
          key={r}
          role="radio"
          aria-checked={role === r}
          onClick={() => setRole(r)}
          className={cn("h-8 rounded-lg px-2.5 text-xs font-medium transition-colors whitespace-nowrap", role === r ? "bg-secondary text-secondary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
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
    { id: "en", label: "EN" },
    { id: "te", label: "తె" },
    { id: "hi", label: "हि" },
  ];
  return (
    <div className="flex items-center gap-0.5 rounded-xl border bg-muted/40 p-0.5" role="radiogroup" aria-label="Language">
      <Languages className="mx-1 size-3.5 text-muted-foreground" aria-hidden />
      {L.map((l) => (
        <button key={l.id} role="radio" aria-checked={lang === l.id} onClick={() => set({ lang: l.id })} className={cn("h-7 min-w-7 rounded-lg px-1.5 text-xs font-medium", lang === l.id ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground")}>
          {l.label}
        </button>
      ))}
    </div>
  );
}

export function IconButtons() {
  const theme = useApp((s) => s.theme);
  const set = useApp((s) => s.set);
  const notices = useApp((s) => s.notices);
  const markRead = useApp((s) => s.markNoticesRead);
  const resetDemo = useApp((s) => s.resetDemo);
  const unread = notices.filter((n) => !n.read).length;
  return (
    <div className="flex items-center gap-1">
      <Popover onOpenChange={(o) => !o && markRead()}>
        <PopoverTrigger asChild>
          <button aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`} className="relative grid size-9 place-items-center rounded-xl border bg-muted/40 hover:bg-accent">
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
                <div key={n.id} className={cn("border-b px-4 py-3 last:border-0", !n.read && "bg-primary/5")}>
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
      <Tooltip>
        <TooltipTrigger asChild>
          <button onClick={() => set({ assumptionsOpen: true })} aria-label="Open assumptions" className="grid size-9 place-items-center rounded-xl border bg-muted/40 hover:bg-accent">
            <SlidersHorizontal className="size-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="text-xs">Assumptions & formulas</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <button onClick={() => set({ theme: theme === "dark" ? "light" : "dark" })} aria-label="Toggle light mode" className="grid size-9 place-items-center rounded-xl border bg-muted/40 hover:bg-accent">
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
        </TooltipTrigger>
        <TooltipContent className="text-xs">{theme === "dark" ? "Light mode" : "Night mode"}</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => {
              resetDemo();
              toast.success("Workspace reset", { description: "Tasks, reports and the clock are back to the start of the day." });
            }}
            aria-label="Reset workspace"
            className="hidden size-9 place-items-center rounded-xl border bg-muted/40 hover:bg-accent sm:grid"
          >
            <RotateCcw className="size-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="text-xs">Reset the day</TooltipContent>
      </Tooltip>
    </div>
  );
}
