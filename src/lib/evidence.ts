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

/** Date the figures below were last compared with the named reports. */
export const EVIDENCE_CHECKED = "16 Nov 2026";

/**
 * Figures from public reports. "Verified" means the figure matches what the named
 * source reported. "Needs checking" means sources differ or the figure's scope is unclear.
 */
export const EVIDENCE: EvidenceItem[] = [
  { id: "ev-tankers", value: "40–45k / month", claim: "The Kukatpally zone gets about 40,000 to 45,000 tanker bookings a month, roughly 1,200 to 1,500 a day.", source: "HMWSSB general manager for Kukatpally, via South First", status: "verified", loops: ["save", "rain"], usedFor: "Sets the tanker baseline for Kukatpally." },
  { id: "ev-185", value: "+185%", claim: "Tanker bookings in the Kukatpally division rose 185% in October 2026, in HMWSSB booking data.", source: "Telangana Today, 15 Oct 2026", status: "verified", loops: ["save", "rain"], usedFor: "Why the rain and saved-water loops lead Kukatpally's playbook.", note: "The report does not state the comparison period for the per-area figure. Citywide, October bookings were up 233% on the same month last year." },
  { id: "ev-095", value: "0.95%", claim: "Only about 0.95% of Hyderabad's rainwater percolates into the ground.", source: "HMWSSB Managing Director, via Newsmeter, Dec 2025", status: "verified", loops: ["rain"], usedFor: "The reason recharge pits are opened before every storm.", note: "The same report gives the range as 0.75% to 0.95%." },
  { id: "ev-idl", value: "7 m → 2 m", claim: "The IDL nala in Kukatpally, originally 7 m wide, had narrowed to 2 m in places because of encroachment.", source: "HYDRAA, via Hyderabad Mail", status: "verified", loops: ["rain"], usedFor: "Drain D-01 and D-02 width-versus-design values and their clog risk." },
  { id: "ev-outage", value: "5–6 hours", claim: "More than 20 colonies across the Kukatpally, Kondapur, Gachibowli and Boinpally divisions lost power for 5 to 6 hours after a short spell of rain and wind.", source: "Hyderabad Mail", status: "verified", loops: ["solar", "save"], usedFor: "The storm scenario's outage window and the stored-water plan." },
  { id: "ev-15kw", value: "> 15 kW", claim: "Apartments whose load crosses 15 kW are expected to install their own transformer.", source: "Telangana Today, Sep 2024", status: "check", loops: ["solar", "save"], usedFor: "The transformer watch flag on the Officer view.", note: "The same report, and later notices, used 20 kW for the enforcement drive. The 15 kW norm is what the transformer watch uses." },
  { id: "ev-peak", value: "4,421 MW", claim: "Greater Hyderabad's power demand reached 4,421 MW on 3 March 2026, the highest recorded at that time.", source: "Newsmeter, Siasat and Telangana Today", status: "check", loops: ["solar", "save"], usedFor: "Context for evening-peak pressure on feeders.", note: "Sources agree on 4,421 MW for 3 March 2026. A later Deccan Chronicle report cites 4,381 MW as a new maximum, so whether it is still the highest is unclear." },
  { id: "ev-gwt", value: "61 of ~600", claim: "Only 61 of an estimated 600 private STPs had registered with HMWSSB by 18 October 2026, a week before the 25 October deadline. The Green Water Tanker service launched on 1 November 2026.", source: "Telangana Today and Deccan Chronicle (registration); Siasat (launch)", status: "verified", loops: ["reuse"], usedFor: "The STP registration tracker and the reuse loop's surplus-sale step." },
  { id: "ev-pits", value: "17,384 of 40,209", claim: "A survey of 40,209 residential complexes found 22,825 with rainwater pits and 17,384 without.", source: "HMWSSB release, via Telangana Today", status: "verified", loops: ["rain"], usedFor: "How hubs are ranked for recharge pit installation." },
  { id: "ev-wet", value: "50–60%", claim: "Wet waste is roughly 50 to 60 percent of urban India's waste, and dry waste 30 to 35 percent.", source: "CPCB paper (2022), via Down To Earth", status: "verified", loops: ["waste"], usedFor: "The wet-waste fraction in the biogas model." },
  { id: "ev-tariff", value: "+₹1.50 / −₹0.50", claim: "The 2026-27 tariff order keeps base tariffs unchanged. It raises the time-of-day peak surcharge from ₹1.00 to ₹1.50 per unit at peak hours and gives ₹0.50 per unit off from 10 am to 6 pm.", source: "Hans India and Deccan Chronicle", status: "check", loops: ["solar", "save"], usedFor: "Savings from shifting pumps into solar hours.", note: "Reports name HT consumers and EV charging stations. Applicability to apartment common-area meters is not confirmed." },
];
