import type { LoopId } from "@/lib/sim/types";

export type EvidenceStatus = "verified" | "check";

export interface EvidenceItem {
  id: string;
  value: string;
  claim: string;
  source: string;
  status: EvidenceStatus;
  loops: LoopId[];
  usedFor: string;
  note?: string;
}

/**
 * Figures from public reports. "Verified" means the figure matches what the named
 * source reported; "Needs checking" means sources differ or applicability is unconfirmed.
 */
export const EVIDENCE: EvidenceItem[] = [
  { id: "ev-tankers", value: "40–45k / month", claim: "The Kukatpally zone handles about 40,000 to 45,000 tanker bookings a month.", source: "HMWSSB official, via South First", status: "verified", loops: ["save", "rain"], usedFor: "Sets the tanker baseline for Kukatpally in the Impact and Replicate pages." },
  { id: "ev-185", value: "+185%", claim: "Kukatpally tanker bookings were up 185% year on year in October 2026.", source: "Telangana Today", status: "verified", loops: ["save", "rain"], usedFor: "Why the rain and saved-water loops lead Kukatpally's playbook." },
  { id: "ev-095", value: "0.95%", claim: "Only about 0.95% of Hyderabad's rainwater percolates into the ground.", source: "HMWSSB Managing Director, via Newsmeter", status: "verified", loops: ["rain"], usedFor: "The reason recharge pits are opened before every storm." },
  { id: "ev-idl", value: "7 m → 2 m", claim: "The IDL nala has narrowed from 7 m to 2 m in places because of encroachment.", source: "Hyderabad Mail", status: "verified", loops: ["rain"], usedFor: "Drain D-01 and D-02 width-versus-design values and their clog risk." },
  { id: "ev-outage", value: "5–6 hours", claim: "More than 20 colonies lost power for 5 to 6 hours after one rain and wind spell.", source: "Hyderabad Mail", status: "verified", loops: ["solar", "save"], usedFor: "The storm scenario's outage window and the stored-water plan." },
  { id: "ev-15kw", value: "> 15 kW", claim: "Apartments with a connected load above 15 kW should have their own transformer.", source: "Telangana Today", status: "verified", loops: ["solar", "save"], usedFor: "The transformer watch flag on the Officer view." },
  { id: "ev-peak", value: "4,421 MW", claim: "Greater Hyderabad recorded a peak demand of 4,421 MW on 3 March 2026.", source: "Newsmeter", status: "check", loops: ["solar", "save"], usedFor: "Context for evening-peak pressure on feeders.", note: "Peak figures differ across sources, so treat this number as unconfirmed." },
  { id: "ev-gwt", value: "61 of ~600", claim: "The Green Water Tanker service launched on 1 November 2026. Only 61 of about 600 private STPs had registered before the 25 October deadline.", source: "Hans India", status: "verified", loops: ["reuse"], usedFor: "The STP registration tracker and the reuse loop's surplus-sale step." },
  { id: "ev-pits", value: "17,384 of 40,209", claim: "HMWSSB found 17,384 of 40,209 surveyed complexes had no recharge pit.", source: "Telangana Today", status: "verified", loops: ["rain"], usedFor: "How hubs are ranked for recharge pit installation." },
  { id: "ev-wet", value: "50–60%", claim: "Wet waste is roughly 50 to 60 percent of urban waste.", source: "CPCB paper, cited by Down To Earth", status: "verified", loops: ["waste"], usedFor: "The wet-waste fraction (55%) in the biogas model." },
  { id: "ev-tariff", value: "+₹1.50 / −₹0.50", claim: "The 2026-27 tariff adds ₹1.50 per unit at peak hours (6 to 10 am and 6 to 10 pm) and gives ₹0.50 off from 10 am to 6 pm, for the categories it covers.", source: "Hans India", status: "check", loops: ["solar", "save"], usedFor: "Savings from shifting pumps into solar hours.", note: "Applicability to apartment common-area meters not confirmed." },
];
