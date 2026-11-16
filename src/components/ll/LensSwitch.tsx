import { useApp } from "@/store/app";
import { InfoTip } from "@/components/ll/primitives";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { id: "with", label: "With LoopLocal" },
  { id: "without", label: "Without" },
] as const;

/** Flips the headline numbers between the coordinated day and the same day with no coordination. */
export function LensSwitch({ className }: { className?: string }) {
  const lens = useApp((s) => s.lens);
  const set = useApp((s) => s.set);
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div role="radiogroup" aria-label="Compare" className="flex items-center gap-0.5 rounded-lg border bg-card p-0.5">
        {OPTIONS.map((o) => (
          <button
            key={o.id}
            role="radio"
            aria-checked={lens === o.id}
            onClick={() => set({ lens: o.id })}
            className={cn("h-7 whitespace-nowrap rounded-md px-2.5 text-xs font-medium transition-colors", lens === o.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
          >
            {o.label}
          </button>
        ))}
      </div>
      <InfoTip label="About this comparison" side="bottom">
        “Without” shows the same day with no coordination: recharge pits mostly idle, no tank top-ups ahead of cuts, treated water discharged and little wet waste sent to biogas. Both views use the same weather and the same outage.
      </InfoTip>
    </div>
  );
}
