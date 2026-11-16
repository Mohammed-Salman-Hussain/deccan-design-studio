import { create } from "zustand";

const KEY = "looplocal-tour-seen";

export const tourSeen = (): boolean => {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return true; // storage blocked: never nag
  }
};
export const markTourSeen = () => {
  try {
    localStorage.setItem(KEY, "1");
  } catch {
    /* storage blocked */
  }
};

interface Guide {
  tourOpen: boolean;
  tourStep: number;
  demoOn: boolean;
  /** Bumped by the demo to ask the Storm page to run its day. */
  stormRun: number;
  openTour: (step?: number) => void;
  setTourStep: (n: number) => void;
  closeTour: () => void;
  startDemo: () => void;
  stopDemo: () => void;
  runStorm: () => void;
}

/** Guide state is per visit and never saved, except that the first-visit tour has been seen. */
export const useGuide = create<Guide>()((set) => ({
  tourOpen: false,
  tourStep: 0,
  demoOn: false,
  stormRun: 0,
  openTour: (step = 0) => set({ tourOpen: true, tourStep: step, demoOn: false }),
  setTourStep: (tourStep) => set({ tourStep }),
  closeTour: () => {
    markTourSeen();
    set({ tourOpen: false });
  },
  startDemo: () => {
    markTourSeen();
    set({ demoOn: true, tourOpen: false });
  },
  stopDemo: () => set({ demoOn: false }),
  runStorm: () => set((s) => ({ stormRun: s.stormRun + 1 })),
}));
