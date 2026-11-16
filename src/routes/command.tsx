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

const ROLES: { id: Role; label: string; icon: LucideIcon }[] = [
  { id: "officer", label: "Officer", icon: Monitor },
  { id: "resident", label: "Resident", icon: Home },
  { id: "worker", label: "Field worker", icon: Wrench },
];

function CommandPage() {
  const role = useApp((s) => s.role);
  const setRole = useApp((s) => s.setRole);
  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        title="Command"
        description="Three views of the same neighbourhood: officers plan and dispatch, residents see their own building, and field workers work through their tasks. Actions an officer sends reach the field worker straight away."
      >
        <div role="tablist" aria-label="View as" className="inline-flex rounded-xl border bg-card p-1">
          {ROLES.map((r) => {
            const on = role === r.id;
            return (
              <button
                key={r.id}
                role="tab"
                aria-selected={on}
                onClick={() => setRole(r.id)}
                className={cn("flex h-8 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-colors", on ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground")}
              >
                <r.icon className="size-4" aria-hidden />
                <span className="hidden sm:inline">{r.label}</span>
              </button>
            );
          })}
        </div>
      </PageHeader>
      {role === "officer" && <OfficerView />}
      {role === "resident" && <ResidentView />}
      {role === "worker" && <WorkerView />}
    </div>
  );
}
