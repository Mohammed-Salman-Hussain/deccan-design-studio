import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Download } from "lucide-react";
import { useActionQueue, useLocality, useLocalitySummary, fmtL, fmtRs } from "@/lib/hooks";
import { useApp } from "@/store/app";
import { LOOPS } from "@/lib/sim/loops";
import { formatClock, SCENARIO_BY_ID } from "@/lib/sim/engine";

export function ExportReport({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const loc = useLocality();
  const sum = useLocalitySummary();
  const queue = useActionQueue();
  const scenario = useApp((s) => s.scenario);
  const clock = useApp((s) => s.clock);
  const audit = useApp((s) => s.audit);
  const log = useApp((s) => s.log);
  const date = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  const downloadHtml = () => {
    const el = document.getElementById("ll-report");
    if (!el) return;
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>LoopLocal report — ${loc.name}</title><style>body{font-family:system-ui,sans-serif;color:#09251C;background:#fff;padding:32px;max-width:800px;margin:auto}table{width:100%;border-collapse:collapse}td,th{border-bottom:1px solid #e5d9c8;padding:6px;text-align:left;font-size:12px}h1,h2{margin:.4em 0}.k{display:inline-block;margin:4px 12px 4px 0}</style></head><body>${el.innerHTML}</body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `LoopLocal-${loc.name}-report.html`;
    a.click();
    URL.revokeObjectURL(a.href);
    log("Officer", "Exported locality report");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] max-w-3xl overflow-y-auto bg-popover">
        <DialogHeader>
          <DialogTitle className="font-display">Locality report preview</DialogTitle>
          <DialogDescription>Print to PDF or download a shareable copy for the zonal office.</DialogDescription>
        </DialogHeader>
        <div className="rounded-xl bg-[var(--cream)] p-1">
          <article id="ll-report" className="rounded-lg bg-[var(--cream)] p-6 text-[var(--ink)] md:p-8">
            <header className="flex items-start justify-between border-b border-[color-mix(in_oklab,var(--ink)_15%,transparent)] pb-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] opacity-60">LoopLocal · Daily loop report</p>
                <h1 className="font-display text-2xl font-semibold">{loc.name} — {loc.zone}</h1>
                <p className="text-xs opacity-70">{date} · {SCENARIO_BY_ID[scenario].label} · as of {formatClock(clock)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase opacity-60">Loop Score</p>
                <p className="font-display text-4xl font-semibold text-[var(--amber)]">{sum.score.toFixed(1)}</p>
              </div>
            </header>
            <section className="mt-4 grid grid-cols-2 gap-3 text-xs md:grid-cols-4">
              {[
                ["Tankers avoided", sum.tankersAvoided.toFixed(1)],
                ["kWh shifted off-peak", Math.round(sum.kwhShifted).toString()],
                ["Water recharged & reused", fmtL(sum.rechargeL + sum.reuseL)],
                ["Savings", fmtRs(sum.savingsRs)],
              ].map(([k, v]) => (
                <div key={k} className="rounded-lg border border-[color-mix(in_oklab,var(--ink)_12%,transparent)] p-3">
                  <p className="opacity-60">{k}</p>
                  <p className="font-display text-lg font-semibold">{v}</p>
                </div>
              ))}
            </section>
            <h2 className="mt-6 font-display text-sm font-semibold">Loop breakdown</h2>
            <table className="mt-2 w-full text-xs">
              <tbody>
                {LOOPS.map((l) => (
                  <tr key={l.id} className="border-b border-[color-mix(in_oklab,var(--ink)_10%,transparent)]">
                    <td className="py-1.5">{l.name}</td>
                    <td className="py-1.5 text-right font-mono">{Math.round(sum.scores[l.id])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <h2 className="mt-6 font-display text-sm font-semibold">Actions</h2>
            <table className="mt-2 w-full text-xs">
              <thead><tr className="text-left opacity-60"><th className="py-1">Action</th><th>Assignee</th><th>Due</th><th>Status</th></tr></thead>
              <tbody>
                {queue.map((a) => (
                  <tr key={a.id} className="border-b border-[color-mix(in_oklab,var(--ink)_10%,transparent)]">
                    <td className="py-1.5 pr-2">{a.title}</td><td>{a.assignee}</td><td>{a.deadline}</td><td className="capitalize">{a.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <h2 className="mt-6 font-display text-sm font-semibold">Hubs</h2>
            <table className="mt-2 w-full text-xs">
              <thead><tr className="text-left opacity-60"><th className="py-1">Hub</th><th>Flats</th><th>Score</th><th>Tank</th></tr></thead>
              <tbody>
                {sum.hubs.map((h) => (
                  <tr key={h.hub.id} className="border-b border-[color-mix(in_oklab,var(--ink)_10%,transparent)]">
                    <td className="py-1.5">{h.hub.name}</td><td>{h.hub.flats}</td><td>{h.score.toFixed(0)}</td><td>{h.now.tankPct.toFixed(0)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <h2 className="mt-6 font-display text-sm font-semibold">Recent audit entries</h2>
            <ul className="mt-2 space-y-1 text-[11px]">
              {audit.slice(0, 8).map((e) => <li key={e.id}><span className="font-mono opacity-60">{e.sim}</span> — {e.actor}: {e.text}</li>)}
            </ul>
            <footer className="mt-6 border-t border-[color-mix(in_oklab,var(--ink)_15%,transparent)] pt-3 text-[10px] opacity-70">
              Estimates follow the formulas in the Assumptions panel. The software recommends; people carry out the actions.
            </footer>
          </article>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="glass" onClick={downloadHtml}><Download /> Download</Button>
          <Button variant="hero" onClick={() => { log("Officer", "Printed locality report"); window.print(); }}><Printer /> Print / Save as PDF</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
