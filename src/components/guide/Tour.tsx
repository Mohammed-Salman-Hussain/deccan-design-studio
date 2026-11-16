import { useEffect } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Play, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/store/app";
import { markTourSeen, tourSeen, useGuide } from "@/store/guide";

interface TourStep {
  to: string;
  title: string;
  body: string;
}

const STEPS: TourStep[] = [
  { to: "/", title: "Welcome to LoopLocal", body: "One engine reads a colony's water, power, waste and drains together, then turns what it finds into a short list of actions. This tour takes about a minute." },
  { to: "/command", title: "Command: decide and send", body: "Officers see ranked actions, each with a place, a reason and a deadline. Use the buttons at the top to see the same day as a resident or a field worker." },
  { to: "/loophub", title: "LoopHub: one building block", body: "A hub is one apartment complex or colony block. This page follows its tank, solar, treated water and recharge pits through the day. Switch to Loops to see how the five loops feed each other." },
  { to: "/storm", title: "Storm: the stress test", body: "Run a storm day end to end: forecast, flagged drains, crews dispatched, tanks filled on solar and the power cut ridden through." },
  { to: "/impact", title: "Impact: what changed", body: "Switch between With and Without LoopLocal to compare the same day. Detailed adds secondary numbers, and every ⓘ explains how a figure is worked out." },
];

/** A skippable five-step walk through the app. Opens once on a first visit; the help button replays it. */
export function Tour() {
  const open = useGuide((s) => s.tourOpen);
  const step = useGuide((s) => s.tourStep);
  const setStep = useGuide((s) => s.setTourStep);
  const close = useGuide((s) => s.closeTour);
  const openTour = useGuide((s) => s.openTour);
  const startDemo = useGuide((s) => s.startDemo);
  const demoOn = useGuide((s) => s.demoOn);
  const hydrated = useApp((s) => s.hydrated);
  const navigate = useNavigate();
  const path = useRouterState({ select: (r) => r.location.pathname });

  // First visit only, and only on the front page, so a shared deep link is not covered.
  useEffect(() => {
    if (!hydrated || demoOn || path !== "/" || tourSeen()) return;
    const id = window.setTimeout(() => openTour(0), 900);
    return () => window.clearTimeout(id);
  }, [hydrated, demoOn, path, openTour]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  const go = (i: number) => {
    setStep(i);
    navigate({ to: STEPS[i].to });
  };
  const last = step === STEPS.length - 1;
  const s = STEPS[step];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="tour"
          role="dialog"
          aria-label="Quick tour"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-x-3 bottom-3 z-50 rounded-xl border bg-card p-4 shadow-lg sm:inset-x-auto sm:bottom-5 sm:right-5 sm:w-[360px]"
        >
          <div className="flex items-start justify-between gap-3">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Step {step + 1} of {STEPS.length}</p>
            <button onClick={close} aria-label="Skip the tour" className="-m-1 grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground">
              <X className="size-4" />
            </button>
          </div>
          <h2 className="mt-1 font-display text-lg font-semibold">{s.title}</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.body}</p>

          <div className="mt-3 flex gap-1" aria-hidden>
            {STEPS.map((_, i) => (
              <span key={i} className={`h-1 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-border"}`} />
            ))}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button variant="ghost" size="sm" onClick={close}>Skip</Button>
            <div className="ml-auto flex items-center gap-2">
              {step > 0 && <Button variant="glass" size="sm" onClick={() => go(step - 1)}>Back</Button>}
              {last ? (
                <>
                  <Button variant="glass" size="sm" onClick={close}>Done</Button>
                  <Button variant="hero" size="sm" onClick={startDemo}><Play /> Watch the demo</Button>
                </>
              ) : (
                <Button variant="hero" size="sm" onClick={() => go(step + 1)}>Next <ArrowRight /></Button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export { markTourSeen };
