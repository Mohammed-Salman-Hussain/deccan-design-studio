import { Copy, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    <Tabs defaultValue="topics">
      <TabsList>
        <TabsTrigger value="topics">Topics</TabsTrigger>
        <TabsTrigger value="payload">Message</TabsTrigger>
        <TabsTrigger value="rules">Alert rules</TabsTrigger>
      </TabsList>

      <TabsContent value="topics" className="mt-3">
        <Panel
          title="MQTT topic structure"
          subtitle="One tree per hub; a device can publish only to its own branch. Devices authenticate with their own certificates and every link uses TLS, as set out on the Security tab."
          icon={Copy}
          action={<Button size="sm" variant="glass" onClick={() => copyText(TOPIC_TREE, "Topic tree")}><Copy /> Copy</Button>}
        >
          <pre className="max-h-[420px] overflow-auto rounded-lg border bg-muted p-3 font-mono text-[11px] leading-relaxed" tabIndex={0} aria-label="MQTT topic tree">{TOPIC_TREE}</pre>
        </Panel>
      </TabsContent>

      <TabsContent value="payload" className="mt-3">
        <Panel
          title="Sample message"
          subtitle="Small JSON, one reading per message."
          icon={Copy}
          action={<Button size="sm" variant="glass" onClick={() => copyText(SAMPLE_PAYLOAD, "Message")}><Copy /> Copy</Button>}
        >
          <pre className="overflow-auto rounded-lg border bg-muted p-3 font-mono text-[11px] leading-relaxed" tabIndex={0} aria-label="Sample JSON message">{SAMPLE_PAYLOAD}</pre>
        </Panel>
      </TabsContent>

      <TabsContent value="rules" className="mt-3">
        <Panel
          title="Alert rules"
          subtitle="Rules start conservative and are agreed with officers before going live."
          icon={ShieldCheck}
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-xs">
              <thead>
                <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="pb-2 pr-3 font-medium">Rule</th>
                  <th className="pb-2 pr-3 font-medium">When</th>
                  <th className="pb-2 pr-3 font-medium">Action</th>
                  <th className="pb-2 font-medium">Owner</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {THRESHOLDS.map((t) => (
                  <tr key={t.rule}>
                    <td className="py-2 pr-3 font-medium">{t.rule}</td>
                    <td className="py-2 pr-3 font-mono text-[11px] text-muted-foreground">{t.when}</td>
                    <td className="py-2 pr-3">{t.action}</td>
                    <td className="py-2 text-muted-foreground">{t.owner}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </TabsContent>
    </Tabs>
  );
}
