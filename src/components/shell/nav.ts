import { LayoutDashboard, Workflow, Building2, CloudLightning, BarChart3, Copy, BookCheck, Cpu, ShieldCheck, Lightbulb, Home } from "lucide-react";
import type { TKey } from "@/lib/i18n";

export const NAV = [
  { to: "/", key: "nav.home" as TKey, icon: Home },
  { to: "/command", key: "nav.command" as TKey, icon: LayoutDashboard },
  { to: "/loops", key: "nav.loops" as TKey, icon: Workflow },
  { to: "/hub-twin", key: "nav.twin" as TKey, icon: Building2 },
  { to: "/storm", key: "nav.storm" as TKey, icon: CloudLightning },
  { to: "/impact", key: "nav.impact" as TKey, icon: BarChart3 },
  { to: "/replicate", key: "nav.replicate" as TKey, icon: Copy },
  { to: "/evidence", key: "nav.evidence" as TKey, icon: BookCheck },
  { to: "/hardware", key: "nav.hardware" as TKey, icon: Cpu },
  { to: "/security", key: "nav.security" as TKey, icon: ShieldCheck },
  { to: "/innovation", key: "nav.innovation" as TKey, icon: Lightbulb },
] as const;

/** The six pages people use every day. */
export const NAV_MAIN = NAV.slice(0, 6);
/** Reference pages, kept one click away under "More". */
export const NAV_MORE = NAV.slice(6);
