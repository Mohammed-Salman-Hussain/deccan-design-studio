import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Cpu, Milestone, Radar, ShieldCheck } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ll/primitives";
import { Architecture } from "@/components/hardware/Architecture";
import { DataFlow } from "@/components/hardware/DataFlow";
import { SensorCatalog } from "@/components/hardware/SensorCatalog";
import { Wiring } from "@/components/hardware/Wiring";
import { NoHardware, Rollout } from "@/components/hardware/Plan";
import { Sizer } from "@/components/hardware/Sizer";
import { Security } from "@/components/platform/Security";

export const Route = createFileRoute("/platform")({
  head: () => ({
    meta: [
      { title: "Platform — LoopLocal" },
      { name: "description", content: "How LoopLocal connects to the real world: architecture, device catalogue, rollout phases and the security design." },
      { property: "og:title", content: "Platform — LoopLocal" },
      { property: "og:description", content: "From sensor to decision: the integration plan and security design for a Loop Hub." },
    ],
  }),
  component: PlatformPage,
});

const TABS = [
  { v: "connect", label: "How it connects", icon: Cpu },
  { v: "devices", label: "Devices", icon: Radar },
  { v: "rollout", label: "Rollout", icon: Milestone },
  { v: "security", label: "Security", icon: ShieldCheck },
] as const;

function PlatformPage() {
  const [wiring, setWiring] = useState(false);
  const [sizer, setSizer] = useState(false);

  return (
    <div className="mx-auto max-w-[1200px]">
      <PageHeader title="Platform" description="How LoopLocal connects to the real world. The Round 1 prototype runs on simulated data; this is the integration plan and security design for the production layer. The software recommends; people carry out the actions." />
      <Tabs defaultValue="connect" className="w-full">
        <div className="-mx-1 mb-3 overflow-x-auto px-1 no-scrollbar">
          <TabsList className="h-auto w-max gap-1 p-1">
            {TABS.map((t) => (
              <TabsTrigger key={t.v} value={t.v} className="gap-1.5 px-3 py-1.5 text-sm">
                <t.icon className="size-3.5" aria-hidden /> {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="connect" className="space-y-4">
          <Architecture />
          <Accordion type="single" collapsible className="glass rounded-xl px-4">
            <AccordionItem value="tech" className="border-b-0">
              <AccordionTrigger>Technical details: topics, messages and alert rules</AccordionTrigger>
              <AccordionContent><DataFlow /></AccordionContent>
            </AccordionItem>
          </Accordion>
        </TabsContent>

        <TabsContent value="devices" className="space-y-4">
          <SensorCatalog />
          <div className="glass flex items-center justify-between gap-3 rounded-xl px-4 py-3">
            <Label htmlFor="show-wiring" className="text-sm">Show device wiring for the selected hub</Label>
            <Switch id="show-wiring" checked={wiring} onCheckedChange={setWiring} />
          </div>
          {wiring && <Wiring />}
        </TabsContent>

        <TabsContent value="rollout" className="space-y-4">
          <Rollout />
          <NoHardware />
          <div className="flex items-center gap-2">
            <Button variant={sizer ? "soft" : "glass"} size="sm" aria-pressed={sizer} onClick={() => setSizer((s) => !s)}>{sizer ? "Hide hub estimate" : "Estimate devices for my hub"}</Button>
            <span className="text-xs text-muted-foreground">A guide, not a quote.</span>
          </div>
          {sizer && <Sizer />}
        </TabsContent>

        <TabsContent value="security"><Security /></TabsContent>
      </Tabs>
    </div>
  );
}
