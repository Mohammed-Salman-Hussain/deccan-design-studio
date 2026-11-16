import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Clock, ShieldAlert, Camera, Mic, Square, CheckCircle2, WifiOff, Wifi, ChevronRight, ChevronLeft, Inbox, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/store/app";
import { useLocality, useT } from "@/lib/hooks";
import { LOOP_BY_ID } from "@/lib/sim/loops";
import type { TaskRecord } from "@/lib/sim/types";
import { Meter, StatusPill, EmptyState } from "@/components/ll/primitives";
import { LocalityMap } from "@/components/map/LocalityMap";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { resizeImage } from "@/lib/image";

/** The crew app: one task at a time, in a phone-sized column. */
export function WorkerView() {
  const [openId, setOpenId] = useState<string | null>(null);
  const tasks = useApp((s) => s.tasks);
  const current = openId ? tasks[openId] : null;

  return (
    <div className="mx-auto w-full max-w-[380px]">
      <div className="relative overflow-hidden rounded-[32px] border-[7px] border-foreground bg-background shadow-xl">
        <div className="min-h-[640px]">
          {current ? <TaskDetail key={current.id} task={current} onClose={() => setOpenId(null)} /> : <TaskList onOpen={setOpenId} />}
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-muted-foreground">What a field crew sees on their phone.</p>
    </div>
  );
}

function TaskList({ onOpen }: { onOpen: (id: string) => void }) {
  const t = useT();
  const loc = useLocality();
  const tasks = useApp((s) => s.tasks);
  const offline = useApp((s) => s.offline);
  const set = useApp((s) => s.set);
  const syncOffline = useApp((s) => s.syncOffline);
  const [crew, setCrew] = useState("all");

  const mine = useMemo(
    () => Object.values(tasks).filter((x) => (x.id.startsWith(`${loc.id}:`) || x.id.startsWith("citizen:")) && x.target === "worker" && x.status !== "pending" && (crew === "all" || x.crew === crew)),
    [tasks, loc.id, crew],
  );
  const open = mine.filter((x) => x.status === "dispatched").sort((a, b) => b.priority - a.priority);
  const done = mine.filter((x) => x.status === "done" || x.status === "verified");
  const queued = Object.values(tasks).filter((x) => x.queuedOffline).length;
  const crews = Array.from(new Set(Object.values(tasks).filter((x) => x.target === "worker").map((x) => x.crew)));
  const progress = mine.length ? (done.length / mine.length) * 100 : 0;
  const [next, ...later] = open;

  const toggleOffline = () => {
    if (!offline) {
      set({ offline: true });
      toast("Offline mode on", { description: "Completions are saved on the phone and sync later." });
    } else {
      syncOffline();
      toast.success("Back online", { description: "Saved completions have synced." });
    }
  };

  return (
    <div>
      <header className="space-y-3 bg-brand-blue/40 px-5 pb-4 pt-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="font-display text-2xl font-semibold">Today</h2>
            <Select value={crew} onValueChange={setCrew}>
              <SelectTrigger aria-label="Crew" className="mt-1 h-7 w-auto gap-1 border-0 bg-transparent p-0 text-xs text-muted-foreground shadow-none focus:ring-0"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All crews</SelectItem>
                {crews.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <button
            onClick={toggleOffline}
            aria-pressed={offline}
            className={cn("flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium", offline ? "border-transparent bg-brand-yellow text-foreground" : "bg-card text-muted-foreground")}
          >
            {offline ? <WifiOff className="size-3.5" /> : <Wifi className="size-3.5" />}
            {offline ? (queued > 0 ? `Offline · ${queued} saved` : t("worker.offline")) : "Online"}
          </button>
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
            <span>{t("worker.shift")}</span>
            <span className="font-mono tabular">{done.length} of {mine.length} done</span>
          </div>
          <Meter value={progress} className="h-1.5" label="Shift progress" />
        </div>
      </header>

      <div className="space-y-5 p-5">
        {!next ? (
          <EmptyState icon={Inbox} title="All clear" body={t("worker.empty")} />
        ) : (
          <section aria-label="Next task">
            <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Next up</p>
            <motion.div layout className="relative overflow-hidden rounded-2xl border bg-card p-4 shadow-sm">
              <span className="absolute inset-y-0 left-0 w-1.5" style={{ background: LOOP_BY_ID[next.loop].color }} aria-hidden />
              <p className="pl-2 text-lg font-semibold leading-snug">{next.title}</p>
              <div className="mt-2 space-y-1 pl-2 text-sm text-muted-foreground">
                <p className="flex items-center gap-1.5"><MapPin className="size-4 shrink-0" />{next.place}</p>
                <p className="flex items-center gap-1.5"><Clock className="size-4 shrink-0" />{t("worker.deadline")} {next.deadline}</p>
              </div>
              <Button variant="hero" size="lg" className="mt-4 w-full" onClick={() => onOpen(next.id)}>Start</Button>
            </motion.div>
          </section>
        )}

        {later.length > 0 && (
          <section aria-label="Later tasks">
            <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Then ({later.length})</p>
            <ul className="divide-y overflow-hidden rounded-xl border">
              <AnimatePresence initial={false}>
                {later.map((x) => (
                  <motion.li key={x.id} layout exit={{ opacity: 0 }}>
                    <button onClick={() => onOpen(x.id)} className="flex w-full items-center gap-3 px-3.5 py-3 text-left hover:bg-accent">
                      <span className="size-2.5 shrink-0 rounded-full" style={{ background: LOOP_BY_ID[x.loop].color }} aria-hidden />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{x.title}</span>
                        <span className="block truncate text-xs text-muted-foreground">{x.place} · {x.deadline}</span>
                      </span>
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                    </button>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          </section>
        )}

        {done.length > 0 && (
          <details className="group rounded-xl border">
            <summary className="flex cursor-pointer list-none items-center justify-between px-3.5 py-3 text-sm font-medium">
              Done today ({done.length})
              <ChevronRight className="size-4 text-muted-foreground transition-transform group-open:rotate-90" aria-hidden />
            </summary>
            <ul className="divide-y border-t">
              {done.map((x) => (
                <li key={x.id} className="flex items-center gap-3 px-3.5 py-2.5 text-sm">
                  {x.proof ? <img src={x.proof} alt={`Proof for ${x.title}`} className="size-9 rounded-lg object-cover" /> : <CheckCircle2 className="size-5 shrink-0 text-success" aria-hidden />}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{x.title}</span>
                    <span className="block text-xs text-muted-foreground">{x.doneAt}{x.queuedOffline ? " · waiting to sync" : ""}</span>
                  </span>
                  <StatusPill status={x.status} />
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
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

  const stepsDone = task.checklist.filter(Boolean).length;

  return (
    <div className="flex min-h-[640px] flex-col">
      <header className="bg-brand-blue/40 px-4 pb-4 pt-4">
        <button onClick={onClose} className="mb-2 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ChevronLeft className="size-4" /> Tasks</button>
        <h2 className="font-display text-xl font-semibold leading-snug">{task.title}</h2>
        <div className="mt-1.5 space-y-0.5 text-sm text-muted-foreground">
          <p className="flex items-center gap-1.5"><MapPin className="size-4 shrink-0" />{task.place}</p>
          <p className="flex items-center gap-1.5"><Clock className="size-4 shrink-0" />{t("worker.deadline")} {task.deadline}</p>
        </div>
      </header>

      <div className="h-28 border-b">
        <LocalityMap center={[task.lat, task.lng]} zoom={16} interactive={false} circles={[{ lat: task.lat, lng: task.lng, radius: 70, color: LOOP_BY_ID[task.loop].color, opacity: 0.18 }]} markers={[{ id: "t", lat: task.lat, lng: task.lng, color: LOOP_BY_ID[task.loop].color, shape: "pin", label: task.place }]} ariaLabel={`Location: ${task.place}`} />
      </div>

      <div className="flex-1 space-y-5 p-4">
        <details className="rounded-xl bg-muted px-3.5 py-2.5 text-sm">
          <summary className="cursor-pointer list-none font-medium">Why this task</summary>
          <p className="mt-2 text-muted-foreground">{task.reason}</p>
        </details>

        <section aria-label="Steps">
          <p className="mb-2 flex items-center justify-between text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            <span>{t("worker.steps")}</span>
            <span className="font-mono normal-case tracking-normal">{stepsDone} of {task.steps.length}</span>
          </p>
          <ul className="space-y-2">
            {task.steps.map((s, i) => (
              <li key={i}>
                <button
                  onClick={() => toggleStep(task.id, i)}
                  aria-pressed={task.checklist[i]}
                  className={cn("flex w-full items-center gap-3 rounded-xl border p-3 text-left text-sm transition", task.checklist[i] ? "border-transparent bg-accent" : "hover:bg-accent")}
                >
                  <span className={cn("grid size-6 shrink-0 place-items-center rounded-full border-2", task.checklist[i] ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40")}>
                    {task.checklist[i] && <CheckCircle2 className="size-4" aria-hidden />}
                  </span>
                  <span className={cn(task.checklist[i] && "text-muted-foreground line-through")}>{s}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <div className="flex gap-2.5 rounded-xl bg-brand-yellow/60 p-3 text-sm">
          <ShieldAlert className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
          <p><span className="font-medium">{t("worker.safety")}: </span>{task.safety}</p>
        </div>

        <section aria-label="Add proof">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Proof (optional)</p>
          <div className="grid grid-cols-2 gap-2.5">
            <input ref={fileRef} type="file" accept="image/*" capture="environment" className="sr-only" onChange={async (e) => { const f = e.target.files?.[0]; if (f) { try { setProof(await resizeImage(f)); toast.success("Photo attached"); } catch { toast.error("Could not read that photo"); } } }} />
            {proof ? (
              <div className="relative h-20 overflow-hidden rounded-xl border">
                <img src={proof} alt="Photo proof" className="h-full w-full object-cover" />
                <button onClick={() => setProof(undefined)} aria-label="Remove photo" className="absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-full bg-card"><Trash2 className="size-3.5" /></button>
              </div>
            ) : (
              <button onClick={() => fileRef.current?.click()} className="flex h-20 flex-col items-center justify-center gap-1 rounded-xl border border-dashed text-sm hover:bg-accent">
                <Camera className="size-5 text-primary-glow" /> {t("btn.photo")}
              </button>
            )}
            {rec.on ? (
              <button onClick={stopRec} className="flex h-20 flex-col items-center justify-center gap-1 rounded-xl border border-destructive/50 bg-destructive/10 text-sm text-destructive">
                <Square className="size-4" /> Stop 0:{String(rec.secs).padStart(2, "0")}
              </button>
            ) : rec.label ? (
              <div className="flex h-20 flex-col items-center justify-center gap-1 rounded-xl border text-sm">
                {rec.url ? <audio src={rec.url} controls className="h-8 w-full px-2" /> : <span className="flex items-center gap-1 text-primary-glow"><CheckCircle2 className="size-4" /> Note {rec.label}</span>}
                <button onClick={() => setRec({ on: false, secs: 0 })} className="text-[11px] text-muted-foreground underline">Re-record</button>
              </div>
            ) : (
              <button onClick={startRec} className="flex h-20 flex-col items-center justify-center gap-1 rounded-xl border border-dashed text-sm hover:bg-accent">
                <Mic className="size-5 text-primary-glow" /> {t("btn.voice")}
              </button>
            )}
          </div>
        </section>
      </div>

      <div className="sticky bottom-0 border-t bg-background p-4">
        <Button variant="hero" size="xl" className="w-full" onClick={complete}>
          <CheckCircle2 /> {t("btn.markDone")}
        </Button>
        {offline && <p className="mt-2 text-center text-xs text-muted-foreground">Offline: this will sync when you are back online.</p>}
      </div>
    </div>
  );
}
