/** Short plain-language definitions, shown on tap or hover wherever a term appears in the text. */
export const GLOSSARY = {
  loopScore: { label: "Loop Score", def: "A 0 to 100 score for how much a hub or locality recycles and saves across the five loops. Higher is better." },
  hub: { label: "Loop Hub", def: "One apartment complex or colony block that handles part of its own power, water and waste, with LoopLocal as its brain." },
  stp: { label: "STP", def: "Sewage treatment plant. It cleans a building's used water so it can be reused for flushing, gardens and cooling, or supplied as Green Water." },
  greenWater: { label: "Green Water", def: "Treated sewage water supplied by tanker for construction, gardening and industry. It is not for drinking." },
  rechargePit: { label: "Recharge pit", def: "A pit that lets rainwater soak into the ground instead of running off into the street." },
  peak: { label: "Peak hours", def: "6 to 10 am and 6 to 10 pm, when electricity costs more and the grid is under most strain." },
  solarHours: { label: "Solar hours", def: "10 am to 6 pm, when solar output is strongest and the time-of-day tariff gives a discount for the categories it covers." },
  tanker: { label: "Tanker trip", def: "One 5,000 litre water tanker delivery. Avoided trips are litres saved divided by 5,000." },
  biogas: { label: "Biogas", def: "Gas made from kitchen waste in a small digester. It runs pumps when the sun is weak." },
  nala: { label: "Nala", def: "An open drain or channel that carries storm water out of a colony." },
} as const;

export type GlossaryKey = keyof typeof GLOSSARY;
