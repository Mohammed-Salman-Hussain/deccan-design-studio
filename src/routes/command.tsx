import { createFileRoute } from "@tanstack/react-router";
import { Landmark, Home, HardHat } from "lucide-react";
import { useApp } from "@/store/app";
import { useLocality, useT } from "@/lib/hooks";
import { PageHeader } from "@/components/ll/primitives";
import { OfficerView } from "@/components/command/OfficerView";
import { ResidentView } from "@/components/command/ResidentView";
import { WorkerView } from "@/components/command/WorkerView";
import type { Role } from "@/lib/sim/types";

export const Route = createFileRoute("/command")({
  head: () => ({
    meta: [
      { title: "Command — LoopLocal" },
      { name: "description", content: "One command screen for officers, residents and field workers: ranked actions, live hubs, drains, feeders and tasks for Kukatpally." },
      { property: "og:title", content: "Command — LoopLocal" },
      { property: "og:description", content: "Ranked actions, dispatch and live hub status for Hyderabad colonies." },
    ],
  }),
  component: CommandPage,
});

const ROLE_COPY: Record<Role, { eyebrow: string; title: string; description: string }> = {
  officer: { eyebrow: "Officer view", title: "Command", description: "Municipal, water board and discom officers see every loop at once, then dispatch the right action to the right crew." },
  resident: { eyebrow: "Resident view", title: "My hub today", description: "Plain-language plans, live tank and energy status, and ways to report issues or share surplus with a neighbour." },
  worker: { eyebrow: "Field worker view", title: "My tasks", description: "Big-button task cards with place, reason and deadline. Dispatches from the officer queue appear here instantly." },
};

const ROLE_ICON = { officer: Landmark, resident: Home, worker: HardHat } as const;

function CommandPage() {
  const role = useApp((s) => s.role);
  const loc = useLocality();
  const t = useT();
  const copy = ROLE_COPY[role];
  const Icon = ROLE_ICON[role];
  return (
    <div className="mx-auto max-w-[1500px]">
      <PageHeader eyebrow={`${copy.eyebrow} · ${loc.name}`} title={<span className="inline-flex items-center gap-3"><Icon className="size-7 text-primary-glow" aria-hidden />{copy.title}</span>} description={copy.description}>
        <span className="rounded-full border px-3 py-1 text-xs text-muted-foreground">{t(`role.${role}`)}</span>
      </PageHeader>
      {role === "officer" && <OfficerView />}
      {role === "resident" && <ResidentView />}
      {role === "worker" && <WorkerView />}
    </div>
  );
}
