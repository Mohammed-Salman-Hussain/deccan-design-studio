import { Copy, KeyRound, ShieldCheck, Lock, Users } from "lucide-react";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ll/primitives";
import { SAMPLE_PAYLOAD, THRESHOLDS, TOPIC_TREE } from "@/lib/hardware";

async function copyText(text: string, label: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  } catch {
    toast.error("Copy is not available in this browser");
  }
}

export function DataFlow() {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Panel title="MQTT topic structure" subtitle="One tree per hub; a device can publish only to its own branch" icon={Copy} action={<Button size="sm" variant="glass" onClick={() => copyText(TOPIC_TREE, "Topic tree")}><Copy /> Copy</Button>}>
        <pre className="max-h-[420px] overflow-auto rounded-lg border bg-muted/30 p-3 font-mono text-[11px] leading-relaxed" tabIndex={0} aria-label="MQTT topic tree">{TOPIC_TREE}</pre>
      </Panel>
      <div className="space-y-4">
        <Panel title="Sample payload" subtitle="Small JSON, one reading per message" icon={Copy} action={<Button size="sm" variant="glass" onClick={() => copyText(SAMPLE_PAYLOAD, "Payload")}><Copy /> Copy</Button>}>
          <pre className="overflow-auto rounded-lg border bg-muted/30 p-3 font-mono text-[11px] leading-relaxed" tabIndex={0} aria-label="Sample JSON payload">{SAMPLE_PAYLOAD}</pre>
        </Panel>
        <Panel title="Security approach" icon={ShieldCheck} action={<Button size="sm" variant="ghost" asChild><Link to="/security">Full security page</Link></Button>}>
          <ul className="grid gap-2 sm:grid-cols-3">
            {[[KeyRound, "Device certificates", "A unique X.509 certificate per device and gateway."], [Lock, "TLS everywhere", "TLS 1.2 or newer on every link, with signed commands."], [Users, "Role-based access", "Officer, Resident, Field Worker and Vendor see only what they need."]].map(([Icon, t, d]) => {
              const I = Icon as typeof KeyRound;
              return (<li key={t as string} className="rounded-lg border p-2.5 text-xs"><I className="mb-1.5 size-4 text-primary-glow" aria-hidden /><p className="font-medium">{t as string}</p><p className="mt-0.5 text-muted-foreground">{d as string}</p></li>);
            })}
          </ul>
        </Panel>
      </div>

      <Panel title="Alert thresholds that trigger actions" subtitle="Rules start conservative and are agreed with officers before going live" icon={ShieldCheck} className="xl:col-span-2">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-xs">
            <thead><tr className="text-[11px] uppercase tracking-wider text-muted-foreground"><th className="pb-2 pr-3 font-medium">Rule</th><th className="pb-2 pr-3 font-medium">When</th><th className="pb-2 pr-3 font-medium">Action</th><th className="pb-2 font-medium">Owner</th></tr></thead>
            <tbody className="divide-y">
              {THRESHOLDS.map((t) => (<tr key={t.rule}><td className="py-2 pr-3 font-medium">{t.rule}</td><td className="py-2 pr-3 font-mono text-[11px] text-muted-foreground">{t.when}</td><td className="py-2 pr-3">{t.action}</td><td className="py-2"><span className="rounded-full border px-2 py-0.5 text-[11px]">{t.owner}</span></td></tr>))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
