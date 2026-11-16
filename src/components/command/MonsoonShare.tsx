import { useMemo } from "react";
import { Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Meter, Panel } from "@/components/ll/primitives";
import { useClearedDrains, useHub, useLocality } from "@/lib/hooks";
import { GRADE_COLOR, hubReadiness } from "@/lib/readiness";

/** A resident's monsoon report card for their own building, with a button to share it. */
export function MonsoonShare() {
  const hub = useHub();
  const loc = useLocality();
  const cleared = useClearedDrains();
  const r = useMemo(() => hubReadiness(hub, loc, cleared), [hub, loc, cleared]);
  const color = GRADE_COLOR[r.grade];

  const message = `${hub.name} has a monsoon readiness grade of ${r.grade} (${r.score}/100). Next step: ${r.next} Checked with LoopLocal.`;
  const share = async () => {
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title: "Monsoon readiness", text: message });
        return;
      }
      await navigator.clipboard.writeText(message);
      toast.success("Copied", { description: "Paste it into your building's group chat." });
    } catch {
      // The person closed the share sheet, or the browser blocked the clipboard. Nothing to do.
    }
  };

  return (
    <Panel
      title="Monsoon report card"
      subtitle={`${hub.name} · ${hub.flats} flats · ${hub.area}`}
      action={<Button size="sm" variant="soft" onClick={share}><Share2 /> Share</Button>}
    >
      <div className="grid gap-5 sm:grid-cols-[150px_1fr]">
        <div className="flex flex-col items-center justify-center rounded-xl border p-4 text-center" style={{ borderColor: color }}>
          <p className="font-display text-7xl font-semibold leading-none" style={{ color }} aria-label={`Grade ${r.grade}`}>{r.grade}</p>
          <p className="mt-2 font-mono text-xs tabular text-muted-foreground">{r.score} / 100</p>
        </div>
        <ul className="space-y-3">
          {r.parts.map((p) => (
            <li key={p.key}>
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span>{p.label}</span>
                <span className="font-mono text-xs tabular text-muted-foreground">{p.pct}</span>
              </div>
              <Meter value={p.pct} color={color} className="mt-1 h-1.5" label={p.label} />
              <p className="mt-1 text-xs text-muted-foreground">{p.note}</p>
            </li>
          ))}
        </ul>
      </div>
      <p className="mt-4 rounded-lg bg-accent/60 p-3 text-sm"><span className="font-medium">Next step: </span>{r.next}</p>
    </Panel>
  );
}
