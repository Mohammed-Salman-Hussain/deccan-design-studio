import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Pause, Play, RotateCcw, SkipForward, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/store/app";
import { useGuide } from "@/store/guide";
import { LOCALITY_BY_ID } from "@/lib/sim/data";
import { generateActions } from "@/lib/sim/actions";

interface Beat {
  /** Milliseconds into the step. */
  at: number;
  run: () => void;
}
interface DemoStep {
  to: string;
  ms: number;
  title: string;
  body: string;
  enter?: () => void;
  beats?: Beat[];
}

const app = () => useApp.getState();

/** The top storm actions for the selected locality, ranked by priority, for the demo to dispatch. */
const stormTop = () => {
  const loc = LOCALITY_BY_ID[app().localityId];
  return generateActions(loc, "storm").sort((a, b) => b.priority - a.priority).filter((a) => a.target === "worker").slice(0, 3);
};

function buildSteps(runStorm: () => void): DemoStep[] {
  return [
    {
      to: "/", ms: 9000, title: "One neighbourhood, five loops",
      body: "Kukatpally's water, power, waste and drains are run by different departments. LoopLocal reads them as one system and ranks what to do next.",
      enter: () => { app().resetDemo(); app().set({ lens: "with" }); },
    },
    {
      to: "/", ms: 10000, title: "The same day, with and without",
      body: "Without coordination, recharge pits sit idle and treated water is discharged. The score shows the gap.",
      beats: [
        { at: 1500, run: () => app().set({ lens: "without" }) },
        { at: 6000, run: () => app().set({ lens: "with" }) },
      ],
    },
    {
      to: "/command", ms: 10000, title: "A storm is forecast",
      body: "38 mm/h from 6 pm and a power cut from 7 pm. The Core re-ranks the actions: clear two drains, check a pump line, top up tanks.",
      enter: () => { app().setRole("officer"); app().setScenario("storm"); },
    },
    {
      to: "/command", ms: 9000, title: "The officer dispatches",
      body: "One tap sends a task to a named crew, with the place, the reason, a safety note and a deadline.",
      beats: [{ at: 2000, run: () => app().dispatchMany(stormTop(), "Officer") }],
    },
    {
      to: "/command", ms: 10000, title: "The field worker completes it",
      body: "The task lands in the worker's queue. Marking it done logs proof and lifts the Loop Score.",
      enter: () => { app().dispatchMany(stormTop(), "Officer"); app().setRole("worker"); },
      beats: [
        { at: 4500, run: () => { const t = stormTop()[0]; if (t) app().setStatus(t.id, "done"); } },
      ],
    },
    {
      to: "/command", ms: 8000, title: "The resident is told",
      body: "Residents get a plain notice for their own building, such as tanks filling on solar ahead of the cut.",
      enter: () => app().setRole("resident"),
    },
    {
      to: "/storm", ms: 29000, title: "The storm, end to end",
      body: "Forecast, flagged drains, crews dispatched, tanks filled on solar, recharge pits opened, the power cut ridden through.",
      enter: () => app().setRole("officer"),
      beats: [{ at: 800, run: runStorm }],
    },
    {
      to: "/impact", ms: 12000, title: "What changed",
      body: "Tankers avoided, rain put back in the ground and rupees saved, measured against the same day without LoopLocal. Every figure has an ⓘ that shows how it is worked out.",
    },
  ];
}

/** Plays a scripted two-minute walk through the product. Pause, skip a step or leave at any time. */
export function Demo() {
  const on = useGuide((s) => s.demoOn);
  return <AnimatePresence>{on && <DemoRun key="demo" />}</AnimatePresence>;
}

function DemoRun() {
  const stop = useGuide((s) => s.stopDemo);
  const runStorm = useGuide((s) => s.runStorm);
  const navigate = useNavigate();
  const steps = useMemo(() => buildSteps(runStorm), [runStorm]);
  // Step, time into the step and a replay counter live in one state so a step change and its clock reset land together.
  const [pos, setPos] = useState({ i: 0, t: 0, run: 0 });
  const [paused, setPaused] = useState(false);
  const [finished, setFinished] = useState(false);
  const fired = useRef<Set<number>>(new Set());
  const { i, t } = pos;
  const step = steps[i];

  // Entering a step: go to its page and run its set-up once.
  useEffect(() => {
    fired.current = new Set();
    navigate({ to: step.to });
    step.enter?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pos.i, pos.run]);

  // The clock for the step. Pausing freezes it, so beats and the progress bar stay in step.
  useEffect(() => {
    if (paused || finished) return;
    const id = window.setInterval(() => setPos((p) => ({ ...p, t: p.t + 100 })), 100);
    return () => window.clearInterval(id);
  }, [paused, finished]);

  useEffect(() => {
    step.beats?.forEach((b, k) => {
      if (t >= b.at && !fired.current.has(k)) {
        fired.current.add(k);
        b.run();
      }
    });
    if (t >= step.ms) {
      if (i < steps.length - 1) setPos((p) => ({ i: p.i + 1, t: 0, run: p.run }));
      else setFinished(true);
    }
  }, [t, step, i, steps.length]);

  // Leave the app as the viewer expects it, whichever way the demo ends.
  useEffect(() => () => app().set({ lens: "with" }), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && stop();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stop]);

  const replay = () => {
    setFinished(false);
    setPaused(false);
    setPos((p) => ({ i: 0, t: 0, run: p.run + 1 }));
  };
  const skip = () => (i < steps.length - 1 ? setPos((p) => ({ i: p.i + 1, t: 0, run: p.run })) : setFinished(true));
  const pct = finished ? 100 : Math.min(100, (t / step.ms) * 100);

  return (
    <motion.div
      role="region"
      aria-label="Product demo"
      aria-live="polite"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-2xl overflow-hidden rounded-xl border bg-card shadow-lg"
    >
      <div className="h-1 bg-border" aria-hidden>
        <div className="h-full bg-primary transition-[width] duration-100 ease-linear" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex items-start gap-3 p-3 sm:p-4">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Demo · {finished ? "done" : `${i + 1} of ${steps.length}`}</p>
          <h2 className="mt-0.5 font-display text-base font-semibold sm:text-lg">{finished ? "That was LoopLocal" : step.title}</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {finished ? "Sense, decide, dispatch, verify, across water, power, waste and drains. Replay it, or keep exploring." : step.body}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {finished ? (
            <Button size="sm" variant="glass" onClick={replay}><RotateCcw /> Replay</Button>
          ) : (
            <>
              <Button size="icon" variant="glass" onClick={() => setPaused((p) => !p)} aria-label={paused ? "Resume demo" : "Pause demo"}>{paused ? <Play /> : <Pause />}</Button>
              <Button size="icon" variant="glass" onClick={skip} aria-label="Skip to next step"><SkipForward /></Button>
            </>
          )}
          <Button size="icon" variant={finished ? "hero" : "ghost"} onClick={stop} aria-label="Close demo"><X /></Button>
        </div>
      </div>
    </motion.div>
  );
}
