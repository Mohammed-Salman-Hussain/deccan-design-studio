import type { LoopId } from "./types";
import { Recycle, Sun, CloudRain, Droplets, Zap, type LucideIcon } from "lucide-react";

export interface LoopMeta {
  id: LoopId;
  name: string;
  short: string;
  color: string;
  token: string;
  icon: LucideIcon;
  why: string;
  from: string;
  to: string;
  sdg: number[];
}

export const LOOPS: LoopMeta[] = [
  {
    id: "waste",
    name: "Waste becomes power",
    short: "Waste → Power",
    color: "var(--loop-waste)",
    token: "loop-waste",
    icon: Recycle,
    why: "Wet waste that rots in drains becomes cooking gas and backup power — and the drains stay clear.",
    from: "Kitchen wet waste",
    to: "Biogas for pumps & kitchens",
    sdg: [7, 11],
  },
  {
    id: "solar",
    name: "Sun and biogas run the pumps",
    short: "Sun → Pumps",
    color: "var(--loop-solar)",
    token: "loop-solar",
    icon: Sun,
    why: "Pumps are the biggest common load. Running them on sunlight fills tanks for free before a cut.",
    from: "Rooftop solar + biogas",
    to: "Pumps, lifts, STP blowers",
    sdg: [7, 9],
  },
  {
    id: "rain",
    name: "Rain becomes water",
    short: "Rain → Water",
    color: "var(--loop-rain)",
    token: "loop-rain",
    icon: CloudRain,
    why: "Only ~0.95% of Hyderabad's rain soaks in. Every litre sent to a pit is a litre not flooding a street.",
    from: "Roof & street runoff",
    to: "Recharge pits & borewells",
    sdg: [6, 11],
  },
  {
    id: "reuse",
    name: "Used water becomes a resource",
    short: "Used water → Resource",
    color: "var(--loop-reuse)",
    token: "loop-reuse",
    icon: Droplets,
    why: "Treated STP water flushes toilets, greens gardens, refills pits and is sold to builders as Green Water.",
    from: "Sewage treatment plant",
    to: "Flushing, gardens, Green Water Tankers",
    sdg: [6, 9],
  },
  {
    id: "save",
    name: "Saved water saves power",
    short: "Water saved → Power saved",
    color: "var(--loop-save)",
    token: "loop-save",
    icon: Zap,
    why: "Fewer tanker trips and less pumping mean a smaller bill and a calmer evening grid.",
    from: "Reuse + recharge",
    to: "Less pumping, fewer tankers",
    sdg: [6, 7, 11],
  },
];

export const LOOP_BY_ID = Object.fromEntries(LOOPS.map((l) => [l.id, l])) as Record<LoopId, LoopMeta>;
