import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Clock, ShieldAlert, Camera, Mic, Square, CheckCircle2, WifiOff, Wifi, ChevronRight, ChevronLeft, Inbox, Trash2, Info } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/store/app";
import { useLocality, useT } from "@/lib/hooks";
import { LOOP_BY_ID } from "@/lib/sim/loops";
import type { TaskRecord } from "@/lib/sim/types";
import { Meter, StatusPill, EmptyState, InfoTip } from "@/components/ll/primitives";
import { LocalityMap } from "@/components/map/LocalityMap";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { resizeImage } from "@/lib/image";

/** The crew console: task queue on the left, the selected task on the right. On a phone it shows one at a time. */
export function WorkerView() {
  const t = useT();
  const loc = useLocality();
  const tasks = useApp((s) => s.tasks);
  const offline = useApp((s) => s.offline);
  const set = useApp((s) => s.set);
  const syncOffline = useApp((s) => s.syncOffline);
  const [crew, setCrew] = useState("all");
  const [picked, setPicked] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const mine = useMemo(
    () => Object.values(tasks).filter((x) => (x.id.startsWith(`${loc.id}:`) || x.id.startsWith("citizen:")) && x.target === "worker" && x.status !== "pending" && (crew === "all" || x.crew === crew)),
    [tasks, loc.id, crew],
  );
  const open = mine.filter((x) => x.status === "dispatched").sort((a, b) => b.priority - a.priority);
  const done = mine.filter((x) => x.status === "done" || x.status === "verified");
  const queued = Object.values(tasks).filter((x) => x.queuedOffline).length;
  const crews = Array.from(new Set(Object.values(tasks).filter((x) => x.target === "worker").map((x) => x.crew)));
  const progress = mine.length ? (done.length / mine.length) * 100 : 0;
  const current = (picked && mine.find((x) => x.id === picked)) || open[0] || null;

  const toggleOffline = () => {
    if (!offline) {
      set({ offline: true });
      toast("Offline mode on", { description: "Completions are saved on the device and sync later." });
    } else {
      syncOffline();
      toast.success("Back online", { description: "Saved completions have synced." });
    }
  };

  const choose = (id: string) => {
    setPicked(id);
    setShowDetail(true);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
      <aside className={cn("glass flex flex-col overflow-hidden rounded-xl lg:max-h-[calc(100dvh-13rem)]", showDetail && "hidden lg:flex")} aria-label="Task queue">
        <div className="space-y-3 border-b p-4">
          <div className="flex items-center justify-between gap-2">
            <Select value={crew} onValueChange={setCrew}>
              <SelectTrigger aria-label="Crew" className="h-8 w-auto gap-1.5 border-0 bg-transparent p-0 text-base font-semibold shadow-none focus:ring-0"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All crews</SelectItem>
                {crews.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
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
        </div>

        <div className="flex-1 overflow-y-auto">
          {open.length === 0 && done.length === 0 ? (
            <div className="p-4"><EmptyState icon={Inbox} title="All clear" body={t("worker.empty")} /></div>
          ) : (
            <>
              {open.length > 0 && (
                <section aria-label="To do">
                  <h3 className="px-4 pb-1 pt-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">To do · {open.length}</h3>
                  <ul>
                    <AnimatePresence initial={false}>
                      {open.map((x) => (
                        <motion.li key={x.id} layout exit={{ opacity: 0, height: 0 }}>
                          <button
                            onClick={() => choose(x.id)}
                            aria-current={current?.id === x.id}
                            className={cn("flex w-full items-center gap-3 border-l-2 px-4 py-3 text-left transition-colors hover:bg-accent", current?.id === x.id ? "border-primary bg-accent" : "border-transparent")}
                          >
                            <span className="size-2.5 shrink-0 rounded-full" style={{ background: LOOP_BY_ID[x.loop].color }} aria-hidden />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium">{x.title}</span>
                              <span className="block truncate text-xs text-muted-foreground">{x.place} · by {x.deadline}</span>
                            </span>
                            <ChevronRight className="size-4 shrink-0 text-muted-foreground lg:hidden" aria-hidden />
                          </button>
                        </motion.li>
                      ))}
                    </AnimatePresence>
                  </ul>
                </section>
              )}
              {done.length > 0 && (
                <section aria-label="Done">
                  <h3 className="px-4 pb-1 pt-4 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Done · {done.length}</h3>
                  <ul>
                    {done.map((x) => (
                      <li key={x.id}>
                        <button onClick={() => choose(x.id)} className={cn("flex w-full items-center gap-3 border-l-2 px-4 py-2.5 text-left hover:bg-accent", current?.id === x.id ? "border-primary bg-accent" : "border-transparent")}>
                          {x.proof ? <img src={x.proof} alt="" className="size-8 shrink-0 rounded-md object-cover" /> : <CheckCircle2 className="size-5 shrink-0 text-primary-glow" aria-hidden />}
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm text-muted-foreground">{x.title}</span>
                            <span className="block text-xs text-muted-foreground">{x.doneAt}{x.queuedOffline ? " · waiting to sync" : ""}</span>
                          </span>
                          <StatusPill status={x.status} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}
        </div>
      </aside>

      <section className={cn(!showDetail && "hidden lg:block")} aria-label="Task details">
        {current ? (
          <TaskDetail key={current.id} task={current} onBack={() => setShowDetail(false)} onDone={() => { setPicked(null); setShowDetail(false); }} />
        ) : (
          <div className="glass rounded-xl p-8"><EmptyState icon={Inbox} title="Nothing selected" body="Pick a task from the queue to see where it is and what to do." /></div>
        )}
      </section>
    </div>
  );
}

function TaskDetail({ task, onBack, onDone }: { task: TaskRecord; onBack: () => void; onDone: () => void }) {
  const t = useT();
  const toggleStep = useApp((s) => s.toggleStep);
  const setStatus = useApp((s) => s.setStatus);
  const offline = useApp((s) => s.offline);
  const finished = task.status === "done" || task.status === "verified";
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
    onDone();
  };

  const stepsDone = task.checklist.filter(Boolean).length;
  const loop = LOOP_BY_ID[task.loop];

  return (
    <article className="glass overflow-hidden rounded-xl">
      <div className="h-44 border-b md:h-56">
        <LocalityMap center={[task.lat, task.lng]} zoom={16} interactive={false} circles={[{ lat: task.lat, lng: task.lng, radius: 70, color: loop.color, opacity: 0.18 }]} markers={[{ id: "t", lat: task.lat, lng: task.lng, color: loop.color, shape: "pin", label: task.place }]} ariaLabel={`Location: ${task.place}`} />
      </div>

      <header className="flex items-start gap-3 border-b p-5">
        <button onClick={onBack} aria-label="Back to the queue" className="-ml-1 mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg border hover:bg-accent lg:hidden"><ChevronLeft className="size-4" /></button>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-xl font-semibold leading-snug">{task.title}</h2>
          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><MapPin className="size-4" />{task.place}</span>
            <span className="flex items-center gap-1.5"><Clock className="size-4" />{t("worker.deadline")} {task.deadline}</span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <StatusPill status={task.status} />
          <InfoTip label="Why this task">
            <p className="mb-1 font-medium text-foreground">{t("worker.reason")}</p>
            <p>{task.reason}</p>
            <p className="mt-2 font-mono text-[11px]">{loop.name} · priority {task.priority}</p>
          </InfoTip>
        </div>
      </header>

      <div className="grid gap-6 p-5 md:grid-cols-[1.2fr_1fr]">
        <section aria-label="Steps">
          <p className="mb-2 flex items-center justify-between text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            <span>{t("worker.steps")}</span>
            <span className="font-mono normal-case tracking-normal">{stepsDone} of {task.steps.length}</span>
          </p>
          <ul className="space-y-2">
            {task.steps.map((s, i) => (
              <li key={i}>
                <button
                  onClick={() => !finished && toggleStep(task.id, i)}
                  aria-pressed={task.checklist[i]}
                  disabled={finished}
                  className={cn("flex w-full items-center gap-3 rounded-xl border p-3 text-left text-sm transition", task.checklist[i] ? "border-transparent bg-accent" : "hover:bg-accent", finished && "cursor-default")}
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

        <div className="space-y-4">
          <div className="flex gap-2.5 rounded-xl bg-brand-yellow/60 p-3 text-sm">
            <ShieldAlert className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
            <p><span className="font-medium">{t("worker.safety")}: </span>{task.safety}</p>
          </div>

          {!finished ? (
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
          ) : (
            <div className="flex items-start gap-2.5 rounded-xl border p-3 text-sm">
              <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
              <p className="text-muted-foreground">Completed {task.doneAt}{task.voiceNote ? ` · voice note ${task.voiceNote}` : ""}. {task.status === "verified" ? "Verified by the officer." : "Waiting for the officer to verify."}</p>
            </div>
          )}
          {finished && task.proof && <img src={task.proof} alt="Photo proof" className="h-32 w-full rounded-xl border object-cover" />}
        </div>
      </div>

      {!finished && (
        <footer className="flex items-center justify-between gap-3 border-t bg-card p-4">
          <p className="text-xs text-muted-foreground">{offline ? "Offline: this will sync when you are back online." : `${stepsDone} of ${task.steps.length} steps ticked`}</p>
          <Button variant="hero" size="lg" onClick={complete}><CheckCircle2 /> {t("btn.markDone")}</Button>
        </footer>
      )}
    </article>
  );
}
