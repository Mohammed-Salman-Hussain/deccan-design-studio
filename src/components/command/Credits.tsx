import { useMemo } from "react";
import { Award, Coins } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Panel } from "@/components/ll/primitives";
import { useApp } from "@/store/app";
import { useHub, useLocality, useStepClock } from "@/lib/hooks";
import { summarizeHub } from "@/lib/sim/engine";
import { CREDIT_RULES, dailyCredits, matchLines, totalCredits } from "@/lib/credits";
import { cn } from "@/lib/utils";

/** Loop Credits: what each complex has earned today, a ranking, and how the points are worked out. */
export function Credits() {
  const loc = useLocality();
  const hub = useHub();
  const scenario = useApp((s) => s.scenario);
  const offers = useApp((s) => s.offers);
  const clock = useStepClock();
  const nameOf = (id?: string) => loc.hubs.find((h) => h.id === id)?.name ?? "A neighbour hub";

  const rows = useMemo(
    () =>
      loc.hubs
        .map((h) => {
          const lines = [...dailyCredits(summarizeHub(h, scenario, clock)), ...matchLines(h.id, offers, nameOf)];
          return { h, lines, total: totalCredits(lines) };
        })
        .sort((a, b) => b.total - a.total),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [loc, scenario, clock, offers],
  );
  const mine = rows.find((r) => r.h.id === hub.id) ?? rows[0];

  return (
    <Panel title="Loop Credits" subtitle="Points a complex earns for what it recycles. For the demo only; not money." icon={Coins}>
      <div className="flex items-center gap-4 rounded-lg border p-3">
        <div className="grid size-14 place-items-center rounded-full bg-secondary font-display text-xl font-semibold text-secondary-foreground tabular">{mine.total}</div>
        <div>
          <p className="text-sm font-medium">{mine.h.name}</p>
          <p className="text-xs text-muted-foreground">Rank {rows.indexOf(mine) + 1} of {rows.length} today</p>
        </div>
      </div>

      <ul className="mt-3 space-y-1">
        {mine.lines.filter((l) => l.credits > 0).map((l, i) => (
          <li key={`${l.label}-${i}`} className="flex items-baseline gap-2 text-xs">
            <span className="flex-1 truncate">{l.label} <span className="text-muted-foreground">· {l.detail}</span></span>
            <span className="font-mono tabular text-success">+{l.credits}</span>
          </li>
        ))}
      </ul>

      <ol className="mt-4 space-y-1 border-t pt-3" aria-label="Credits leaderboard">
        {rows.map((r, i) => (
          <li key={r.h.id} className={cn("flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs", r.h.id === hub.id && "bg-primary/10")}>
            <span className="w-4 font-mono text-muted-foreground">{i + 1}</span>
            <span className="flex-1 truncate">{r.h.name}</span>
            {i === 0 && <Award className="size-3.5" style={{ color: "var(--loop-solar)" }} aria-label="Top of the board" />}
            <span className="font-mono tabular">{r.total}</span>
          </li>
        ))}
      </ol>

      <Accordion type="single" collapsible className="mt-1">
        <AccordionItem value="rules" className="border-b-0">
          <AccordionTrigger className="py-2 text-xs hover:no-underline">How credits are earned</AccordionTrigger>
          <AccordionContent>
            <ul className="space-y-1 text-xs text-muted-foreground">
              {CREDIT_RULES.map((c) => <li key={c.label}><span className="font-medium text-foreground">{c.label}.</span> {c.rule}.</li>)}
            </ul>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Panel>
  );
}
