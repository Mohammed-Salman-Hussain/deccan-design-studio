import { createFileRoute } from "@tanstack/react-router";
import { useApp } from "@/store/app";
import { PageHeader } from "@/components/ll/primitives";
import { RoleSwitch } from "@/components/shell/Controls";
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

const ROLE_COPY: Record<Role, { title: string; description: string }> = {
  officer: { title: "Command", description: "Municipal, water board and discom officers see every loop at once, then send the right action to the right crew." },
  resident: { title: "My hub today", description: "A plain-language plan, live tank and energy status, and ways to report issues or share surplus with a neighbour." },
  worker: { title: "My tasks", description: "Task cards with place, reason and deadline. Actions sent from the officer queue appear here straight away." },
};

function CommandPage() {
  const role = useApp((s) => s.role);
  const copy = ROLE_COPY[role];
  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader title={copy.title} description={copy.description}>
        <RoleSwitch />
      </PageHeader>
      {role === "officer" && <OfficerView />}
      {role === "resident" && <ResidentView />}
      {role === "worker" && <WorkerView />}
    </div>
  );
}
