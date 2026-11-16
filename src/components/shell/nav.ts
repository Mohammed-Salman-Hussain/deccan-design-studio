import { LayoutDashboard, Building2, CloudLightning, BarChart3, Home } from "lucide-react";
import type { TKey } from "@/lib/i18n";

export const NAV = [
  { to: "/", key: "nav.home" as TKey, icon: Home },
  { to: "/command", key: "nav.command" as TKey, icon: LayoutDashboard },
  { to: "/loophub", key: "nav.twin" as TKey, icon: Building2 },
  { to: "/storm", key: "nav.storm" as TKey, icon: CloudLightning },
  { to: "/impact", key: "nav.impact" as TKey, icon: BarChart3 },
] as const;
