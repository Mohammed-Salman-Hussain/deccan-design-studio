import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Link2, PencilLine, RotateCcw, ShieldAlert, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/store/app";
import { cn } from "@/lib/utils";

interface Row {
  id: string;
  sim: string;
  actor: string;
  text: string;
}

const GENESIS = "0".repeat(64);
const SIZE = 8;

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Each hash covers the entry and the hash before it, so editing one entry breaks every hash after it. */
async function chainOf(rows: Row[]): Promise<string[]> {
  const out: string[] = [];
  let prev = GENESIS;
  for (const r of rows) {
    prev = await sha256(`${prev}|${r.id}|${r.sim}|${r.actor}|${r.text}`);
    out.push(prev);
  }
  return out;
}

type Verdict = { ok: true } | { ok: false; at: number } | null;

/**
 * Tamper-evident audit log. The latest entries are sealed into a SHA-256 hash chain in the browser.
 * "Verify chain" recomputes every hash and compares it with the sealed one. The edit button changes
 * a copy of one entry so you can watch the check fail. The real log is never modified here.
 */
export function AuditChain() {
  const audit = useApp((s) => s.audit);
  const supported = typeof crypto !== "undefined" && !!crypto.subtle;

  const [snapshot, setSnapshot] = useState<Row[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [sealed, setSealed] = useState<string[]>([]);
  const [verdict, setVerdict] = useState<Verdict>(null);
  const [busy, setBusy] = useState(false);

  const seal = useCallback(async () => {
    if (!supported) return;
    const latest = audit.slice(0, SIZE).reverse().map((a) => ({ id: a.id, sim: a.sim, actor: a.actor, text: a.text }));
    setBusy(true);
    const hashes = await chainOf(latest);
    setSnapshot(latest);
    setRows(latest);
    setSealed(hashes);
    setVerdict(null);
    setBusy(false);
  }, [audit, supported]);

  useEffect(() => {
    void seal();
    // Seal once on open; later entries are offered through the "Seal again" button.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tampered = useMemo(() => rows.some((r, i) => r.text !== snapshot[i]?.text), [rows, snapshot]);
  const lastId = snapshot[snapshot.length - 1]?.id;
  const newer = lastId ? audit.findIndex((a) => a.id === lastId) : 0;

  const verify = async () => {
    setBusy(true);
    const now = await chainOf(rows);
    const at = now.findIndex((h, i) => h !== sealed[i]);
    setVerdict(at === -1 ? { ok: true } : { ok: false, at });
    setBusy(false);
  };

  const edit = () => {
    if (rows.length === 0) return;
    const i = Math.floor(rows.length / 2);
    setRows(rows.map((r, k) => (k === i ? { ...r, text: `${r.text} (edited)` } : r)));
    setVerdict(null);
  };

  const restore = () => {
    setRows(snapshot);
    setVerdict(null);
  };

  if (!supported) {
    return <p className="text-sm text-muted-foreground">This browser cannot compute SHA-256 on this page, so the chain check is unavailable here.</p>;
  }

  return (
    <div>
      <p className="mb-3 text-xs text-muted-foreground">
        The latest entries are sealed into a chain. Each hash includes the one before it, so changing any entry breaks every hash after it. The edit button changes a copy of one entry; the real log is not touched.
      </p>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={verify} disabled={busy || rows.length === 0}><ShieldCheck /> Verify chain</Button>
        <Button size="sm" variant="glass" onClick={edit} disabled={busy || tampered || rows.length === 0}><PencilLine /> Edit an entry</Button>
        <Button size="sm" variant="ghost" onClick={restore} disabled={!tampered}><RotateCcw /> Undo edit</Button>
        {newer > 0 && <Button size="sm" variant="soft" onClick={() => void seal()} disabled={busy}><Link2 /> Seal again ({newer} new)</Button>}
        <div role="status" aria-live="polite" className="ml-auto text-xs font-medium">
          {verdict?.ok && <span className="inline-flex items-center gap-1 text-success"><CheckCircle2 className="size-4" aria-hidden /> Chain intact: {rows.length} of {rows.length} entries match</span>}
          {verdict && !verdict.ok && <span className="inline-flex items-center gap-1 text-destructive"><ShieldAlert className="size-4" aria-hidden /> Broken at entry {verdict.at + 1}: that entry was changed</span>}
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">Nothing in the audit log yet. Dispatch an action and it will appear here.</p>
      ) : (
        <ol className="space-y-1.5 text-xs">
          {rows.map((r, i) => {
            const broken = verdict && !verdict.ok && i >= verdict.at;
            const first = verdict && !verdict.ok && i === verdict.at;
            const good = verdict?.ok;
            return (
              <li key={r.id} className={cn("grid grid-cols-[28px_56px_1fr_auto] items-center gap-2 rounded-lg border px-2.5 py-1.5", first && "border-destructive/50 bg-destructive/5", broken && !first && "border-destructive/30", good && "border-success/30")}>
                <span className="font-mono text-[10px] text-muted-foreground">#{i + 1}</span>
                <span className="font-mono text-[10px] text-muted-foreground">{r.sim}</span>
                <span className="min-w-0"><strong className="font-medium">{r.actor}</strong> · {r.text}</span>
                <code className="font-mono text-[10px] text-muted-foreground" title={sealed[i]}>{sealed[i]?.slice(0, 8)}</code>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
