import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Clock, ShieldAlert, Camera, Mic, Square, CheckCircle2, WifiOff, Wifi, ChevronRight, Inbox, Play, Trash2, CloudUpload } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/store/app";
import { useLocality, useT } from "@/lib/hooks";
import { LOOP_BY_ID } from "@/lib/sim/loops";
import type { TaskRecord } from "@/lib/sim/types";
import { LoopChip, Meter, StatusPill, EmptyState } from "@/components/ll/primitives";
import { LocalityMap } from "@/components/map/LocalityMap";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { resizeImage } from "@/lib/image";

export function WorkerView() {
  const t = useT();
  const loc = useLocality();
  const tasks = useApp((s) => s.tasks);
  const offline = useApp((s) => s.offline);
  const set = useApp((s) => s.set);
  const syncOffline = useApp((s) => s.syncOffline);
  const [crew, setCrew] = useState("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const mine = useMemo(
    () => Object.values(tasks).filter((x) => (x.id.startsWith(`${loc.id}:`) || x.id.startsWith("citizen:")) && x.target === "worker" && x.status !== "pending" && (crew === "all" || x.crew === crew)),
    [tasks, loc.id, crew],
  );
  const open = mine.filter((x) => x.status === "dispatched").sort((a, b) => b.priority - a.priority);
  const done = mine.filter((x) => x.status === "done" || x.status === "verified");
  const queued = Object.values(tasks).filter((x) => x.queuedOffline).length;
  const crews = Array.from(new Set(Object.values(tasks).filter((x) => x.target === "worker").map((x) => x.crew)));
  const impact = done.reduce((a, x) => ({ tankers: a.tankers + (x.impact.tankers ?? 0), kwh: a.kwh + (x.impact.kwh ?? 0), litres: a.litres + (x.impact.litres ?? 0), score: a.score + x.impact.score }), { tankers: 0, kwh: 0, litres: 0, score: 0 });
  const progress = mine.length ? (done.length / mine.length) * 100 : 0;
  const current = openId ? tasks[openId] : null;

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="glass flex flex-col gap-4 rounded-xl p-4 md:flex-row md:items-center">
        <div className="flex flex-1 items-center gap-3">
          <div className="grid size-12 place-items-center rounded-xl bg-accent font-display text-lg font-semibold text-primary-glow">{crew === "all" ? "FC" : crew.slice(0, 2).toUpperCase()}</div>
          <div>
            <p className="text-xs text-muted-foreground">Field crew app · {loc.name}</p>
            <Select value={crew} onValueChange={setCrew}>
              <SelectTrigger className="mt-1 h-8 w-56 text-sm font-medium" aria-label="Crew"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All crews</SelectItem>
                {crews.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className={cn("flex h-10 items-center gap-2 rounded-xl border px-3 text-sm", offline ? "border-warning/40 bg-warning/10 text-warning" : "")}>
            {offline ? <WifiOff className="size-4" /> : <Wifi className="size-4 text-success" />}
            {t("worker.offline")}
            <Switch checked={offline} onCheckedChange={(v) => { if (v) { set({ offline: true }); toast("Offline mode on", { description: "Completions are saved on the phone and sync later." }); } else { syncOffline(); toast.success("Back online", { description: queued ? `Synced ${queued} completion${queued > 1 ? "s" : ""}.` : "Everything is up to date." }); } }} aria-label="Offline mode" />
          </label>
        </div>
      </div>

      {queued > 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-warning/40 bg-warning/10 px-4 py-2.5 text-sm text-warning">
          <CloudUpload className="size-4" /> {queued} completion{queued > 1 ? "s" : ""} saved offline — will sync when you go online.
        </div>
      )}

      <div className="glass rounded-xl p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">{t("worker.shift")}</span>
          <span className="font-mono text-xs tabular">{done.length}/{mine.length} tasks</span>
        </div>
        <Meter value={progress} className="mt-2" label="Shift progress" />
        <p className="mt-2 text-xs text-muted-foreground">Loop Score added: +{impact.score.toFixed(1)}{impact.tankers > 0 ? ` · ${impact.tankers} tanker trip${impact.tankers > 1 ? "s" : ""} avoided` : ""}</p>
      </div>

      <section aria-labelledby="tasks-h">
        <h2 id="tasks-h" className="mb-3 flex items-center gap-2 text-lg font-semibold">{t("worker.tasks")} <span className="rounded-full bg-primary/15 px-2 py-0.5 font-mono text-xs text-primary-glow">{open.length}</span></h2>
        {open.length === 0 ? (
          <EmptyState icon={Inbox} title={t("worker.empty")} body="Officers dispatch actions from the Command view or the Storm Simulator." />
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            <AnimatePresence initial={false}>
              {open.map((x) => (
                <motion.li key={x.id} layout initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, x: 40 }}>
                  <button onClick={() => setOpenId(x.id)} className="glass group relative flex w-full flex-col gap-3 overflow-hidden rounded-xl p-4 text-left transition-colors hover:bg-accent">
                    <span className="absolute inset-x-0 top-0 h-1" style={{ background: LOOP_BY_ID[x.loop].color }} />
                    <p className="text-base font-semibold leading-snug">{x.title}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><MapPin className="size-3.5" />{x.place}</span>
                      <span className="flex items-center gap-1"><Clock className="size-3.5" />{t("worker.deadline")}: {x.deadline}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <LoopChip loop={x.loop} />
                      <span className="flex items-center gap-1 text-xs text-primary-glow">{x.checklist.filter(Boolean).length}/{x.steps.length} <ChevronRight className="size-4 transition group-hover:translate-x-0.5" /></span>
                    </div>
                  </button>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </section>

      {done.length > 0 && (
        <section aria-labelledby="done-h">
          <h2 id="done-h" className="mb-3 text-sm font-semibold text-muted-foreground">Completed today</h2>
          <ul className="space-y-2">
            {done.map((x) => (
              <li key={x.id} className="flex items-center gap-3 rounded-lg border p-3 text-sm">
                {x.proof ? <img src={x.proof} alt={`Proof for ${x.title}`} className="size-10 rounded-lg object-cover" /> : <CheckCircle2 className="size-5 text-success" />}
                <div className="min-w-0 flex-1"><p className="truncate font-medium">{x.title}</p><p className="text-xs text-muted-foreground">Done {x.doneAt}{x.voiceNote ? ` · voice note ${x.voiceNote}` : ""}{x.queuedOffline ? " · waiting to sync" : ""}</p></div>
                <StatusPill status={x.status} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <Sheet open={!!current} onOpenChange={(o) => !o && setOpenId(null)}>
        <SheetContent className="w-full overflow-y-auto bg-popover p-0 sm:max-w-lg">
          {current && <TaskDetail task={current} onClose={() => setOpenId(null)} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function TaskDetail({ task, onClose }: { task: TaskRecord; onClose: () => void }) {
  const t = useT();
  const toggleStep = useApp((s) => s.toggleStep);
  const setStatus = useApp((s) => s.setStatus);
  const offline = useApp((s) => s.offline);
  const [proof, setProof] = useState<string | undefined>(task.proof);
  const fileRef = useRef<HTMLInputElement>(null);
  const [rec, setRec] = useState<{ on: boolean; secs: number; url?: string; label?: string }>({ on: false, secs: 0 });
  const mr = useRef<MediaRecorder | null>(null);
  const timer = useRef<number | null>(null);
  const stream = useRef<MediaStream | null>(null);

  useEffect(() => () => { if (timer.current) window.clearInterval(timer.current); stream.current?.getTracks().forEach((tr) => tr.stop()); }, []);

  const startRec = async () => {
    setRec({ on: true, secs: 0 });
    timer.current = window.setInterval(() => setRec((r) => ({ ...r, secs: r.secs + 1 })), 1000);
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.current = s;
      const chunks: Blob[] = [];
      const m = new MediaRecorder(s);
      m.ondataavailable = (e) => chunks.push(e.data);
      m.onstop = () => {
        const url = URL.createObjectURL(new Blob(chunks, { type: m.mimeType }));
        setRec((r) => ({ ...r, url }));
        s.getTracks().forEach((tr) => tr.stop());
      };
      m.start();
      mr.current = m;
    } catch {
      mr.current = null; // microphone unavailable: keep a timed note so the crew can still log one
    }
  };
  const stopRec = () => {
    if (timer.current) window.clearInterval(timer.current);
    mr.current?.state === "recording" && mr.current.stop();
    setRec((r) => ({ ...r, on: false, label: `0:${String(r.secs).padStart(2, "0")}` }));
    toast.success("Voice note saved");
  };

  const complete = () => {
    setStatus(task.id, "done", { proof, voiceNote: rec.label, queuedOffline: offline });
    toast.success(offline ? "Saved offline" : "Task completed", { description: offline ? "Will sync when you're back online." : `Loop Score +${task.impact.score.toFixed(1)}` });
    onClose();
  };

  return (
    <div>
      <div className="h-44 border-b">
        <LocalityMap center={[task.lat, task.lng]} zoom={16} interactive={false} markers={[{ id: "t", lat: task.lat, lng: task.lng, color: LOOP_BY_ID[task.loop].color, shape: "pin", label: task.place }]} ariaLabel={`Location: ${task.place}`} />
      </div>
      <div className="space-y-5 p-5">
        <SheetHeader className="space-y-2 p-0 text-left">
          <div className="flex flex-wrap items-center gap-2">
            <LoopChip loop={task.loop} />
            {offline && <span className="flex items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 text-[11px] text-warning"><WifiOff className="size-3" /> {t("worker.offline")}</span>}
          </div>
          <SheetTitle className="font-display text-xl">{task.title}</SheetTitle>
          <SheetDescription className="flex flex-wrap gap-x-3 text-xs">
            <span className="flex items-center gap-1"><MapPin className="size-3.5" />{task.place}</span>
            <span className="flex items-center gap-1"><Clock className="size-3.5" />{t("worker.deadline")}: {task.deadline}</span>
          </SheetDescription>
        </SheetHeader>

        <div className="rounded-xl bg-muted/50 p-3 text-sm"><p className="mb-1 text-[11px] uppercase tracking-wider text-muted-foreground">{t("worker.reason")}</p>{task.reason}</div>

        <div>
          <p className="mb-2 text-[11px] uppercase tracking-wider text-muted-foreground">{t("worker.steps")}</p>
          <ul className="space-y-2">
            {task.steps.map((s, i) => (
              <li key={i}>
                <button onClick={() => toggleStep(task.id, i)} aria-pressed={task.checklist[i]} className={cn("flex w-full items-center gap-3 rounded-xl border p-3.5 text-left text-sm transition", task.checklist[i] ? "border-success/40 bg-success/10" : "hover:bg-accent/50")}>
                  <span className={cn("grid size-6 shrink-0 place-items-center rounded-full border-2", task.checklist[i] ? "border-success bg-success text-background" : "border-muted-foreground/40")}>{task.checklist[i] && <CheckCircle2 className="size-4" />}</span>
                  <span className={cn(task.checklist[i] && "text-muted-foreground line-through")}>{s}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex gap-3 rounded-xl border border-warning/30 bg-warning/10 p-3 text-sm">
          <ShieldAlert className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden />
          <div><p className="text-[11px] font-medium uppercase tracking-wider text-warning">{t("worker.safety")}</p><p className="text-foreground/90">{task.safety}</p></div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <input ref={fileRef} type="file" accept="image/*" capture="environment" className="sr-only" onChange={async (e) => { const f = e.target.files?.[0]; if (f) { try { setProof(await resizeImage(f)); toast.success("Photo attached"); } catch { toast.error("Couldn't read that photo"); } } e.target.value = ""; }} />
          {proof ? (
            <div className="relative h-24 overflow-hidden rounded-xl border">
              <img src={proof} alt="Photo proof" className="h-full w-full object-cover" />
              <button onClick={() => setProof(undefined)} aria-label="Remove photo" className="absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-full bg-background/80"><Trash2 className="size-3.5" /></button>
            </div>
          ) : (
            <button onClick={() => fileRef.current?.click()} className="flex h-24 flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed text-sm hover:bg-accent/50">
              <Camera className="size-6 text-primary-glow" /> {t("btn.photo")}
            </button>
          )}
          {rec.on ? (
            <button onClick={stopRec} className="flex h-24 flex-col items-center justify-center gap-1.5 rounded-xl border border-destructive/50 bg-destructive/10 text-sm text-destructive">
              <span className="relative flex size-6 items-center justify-center"><span className="absolute inset-0 animate-ping rounded-full bg-destructive/40" /><Square className="relative size-4" /></span>
              Recording 0:{String(rec.secs).padStart(2, "0")}
            </button>
          ) : rec.label ? (
            <div className="flex h-24 flex-col items-center justify-center gap-1.5 rounded-xl border text-sm">
              {rec.url ? <audio src={rec.url} controls className="h-8 w-full px-2" /> : <span className="flex items-center gap-1 text-success"><Play className="size-4" /> Voice note {rec.label}</span>}
              <button onClick={() => setRec({ on: false, secs: 0 })} className="text-[11px] text-muted-foreground underline">Re-record</button>
            </div>
          ) : (
            <button onClick={startRec} className="flex h-24 flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed text-sm hover:bg-accent/50">
              <Mic className="size-6 text-primary-glow" /> {t("btn.voice")}
            </button>
          )}
        </div>

        <Button variant="hero" size="xl" className="w-full" onClick={complete}>
          <CheckCircle2 /> {t("btn.markDone")}
        </Button>
      </div>
    </div>
  );
}
