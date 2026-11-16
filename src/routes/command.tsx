import { createFileRoute } from "@tanstack/react-router";
import { Home, Monitor, Wrench, type LucideIcon } from "lucide-react";
import { useApp } from "@/store/app";
import { PageHeader } from "@/components/ll/primitives";
import { OfficerView } from "@/components/command/OfficerView";
import { ResidentView } from "@/components/command/ResidentView";
import { WorkerView } from "@/components/command/WorkerView";
import type { Role } from "@/lib/sim/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/command")({
  head: () => ({
    meta: [
      { title: "Command — LoopLocal" },
      { name: "description", content: "One command screen for officers, residents and field workers: ranked actions, hubs, drains, feeders and tasks for Kukatpally." },
      { property: "og:title", content: "Command — LoopLocal" },
      { property: "og:description", content: "Ranked actions, dispatch and hub status for Hyderabad colonies." },
    ],
  }),
  component: CommandPage,
});

const ROLES: { id: Role; label: string; tag: string; icon: LucideIcon; tint: string }[] = [
  { id: "officer", label: "Officer", tag: "Plan and dispatch", icon: Monitor, tint: "bg-brand-blue/60" },
  { id: "resident", label: "Resident", tag: "My building today", icon: Home, tint: "bg-brand-yellow/70" },
  { id: "worker", label: "Field worker", tag: "My tasks on site", icon: Wrench, tint: "bg-primary/25" },
];

function CommandPage() {
  const role = useApp((s) => s.role);
  const setRole = useApp((s) => s.setRole);
  return (
    <div className={cn("mx-auto", role === "officer" ? "max-w-[1400px]" : role === "resident" ? "max-w-3xl" : "max-w-xl")}>
      <PageHeader title="Command" description="Three views of the same neighbourhood: officers plan and dispatch, residents see their own building, and field workers get one task at a time. Actions sent by an officer reach the field worker straight away." />
      <div role="tablist" aria-label="Choose a view" className="mb-5 grid grid-cols-3 gap-2 rounded-2xl border bg-card p-1.5">
        {ROLES.map((r) => {
          const on = role === r.id;
          return (
            <button
              key={r.id}
              role="tab"
              aria-selected={on}
              onClick={() => setRole(r.id)}
              className={cn("flex items-center justify-center gap-2.5 rounded-xl px-2 py-2.5 text-left transition-colors sm:px-4", on ? `${r.tint} text-foreground` : "text-muted-foreground hover:bg-accent")}
            >
              <r.icon className="size-5 shrink-0" aria-hidden />
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">{r.label}</span>
                <span className="hidden truncate text-xs opacity-80 sm:block">{r.tag}</span>
              </span>
            </button>
          );
        })}
      </div>
      {role === "officer" && <OfficerView />}
      {role === "resident" && <ResidentView />}
      {role === "worker" && <WorkerView />}
    </div>
  );
}
