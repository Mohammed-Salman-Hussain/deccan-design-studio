import { createFileRoute } from "@tanstack/react-router";
import { Boxes, ClipboardCheck, Cpu, GraduationCap, Milestone, Network, PlugZap, Radar, Calculator } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/ll/primitives";
import { Architecture } from "@/components/hardware/Architecture";
import { SensorCatalog } from "@/components/hardware/SensorCatalog";
import { Wiring } from "@/components/hardware/Wiring";
import { DataFlow } from "@/components/hardware/DataFlow";
import { Checklists, NoHardware, Rollout } from "@/components/hardware/Plan";
import { Sizer } from "@/components/hardware/Sizer";
import { Guide } from "@/components/hardware/Guide";

export const Route = createFileRoute("/hardware")({
  head: () => ({
    meta: [
      { title: "Hardware & Integration — LoopLocal" },
      { name: "description", content: "How LoopLocal connects to the real world: architecture, sensor catalogue, 3D hub wiring, MQTT data flow, role checklists, rollout phases and a hub sizer." },
      { property: "og:title", content: "Hardware & Integration — LoopLocal" },
      { property: "og:description", content: "From sensor to decision: the integration plan for a Loop Hub." },
    ],
  }),
  component: HardwarePage,
});

const TABS = [
  { v: "architecture", label: "How it connects", icon: Cpu },
  { v: "sensors", label: "Sensors", icon: Radar },
  { v: "wiring", label: "Hub wiring", icon: Boxes },
  { v: "data", label: "Data and alerts", icon: Network },
  { v: "setup", label: "Set up", icon: ClipboardCheck },
  { v: "guide", label: "Help", icon: GraduationCap },
] as const;

const SETUP = [
  { v: "nohw", label: "Without new hardware", icon: PlugZap },
  { v: "checklists", label: "Checklists", icon: ClipboardCheck },
  { v: "rollout", label: "Rollout", icon: Milestone },
  { v: "sizer", label: "Hub sizer", icon: Calculator },
] as const;

function HardwarePage() {
  return (
    <div className="mx-auto max-w-[1300px]">
      <PageHeader title="Hardware and integration plan" description="How LoopLocal connects to the real world. The Round 1 prototype runs on simulated data; this is the integration plan for the production layer." />
      <Tabs defaultValue="architecture" className="w-full">
        <div className="-mx-1 mb-3 overflow-x-auto px-1 no-scrollbar">
          <TabsList className="h-auto w-max gap-1 p-1">
            {TABS.map((t) => (
              <TabsTrigger key={t.v} value={t.v} className="gap-1.5 px-3 py-1.5 text-sm">
                <t.icon className="size-3.5" aria-hidden /> {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        <TabsContent value="architecture"><Architecture /></TabsContent>
        <TabsContent value="sensors"><SensorCatalog /></TabsContent>
        <TabsContent value="wiring"><Wiring /></TabsContent>
        <TabsContent value="data"><DataFlow /></TabsContent>
        <TabsContent value="setup">
          <Tabs defaultValue="nohw">
            <div className="-mx-1 mb-3 overflow-x-auto px-1 no-scrollbar">
              <TabsList className="h-auto w-max gap-1 p-1">
                {SETUP.map((t) => (
                  <TabsTrigger key={t.v} value={t.v} className="gap-1.5 px-3 py-1.5 text-sm">
                    <t.icon className="size-3.5" aria-hidden /> {t.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            <TabsContent value="nohw"><NoHardware /></TabsContent>
            <TabsContent value="checklists"><Checklists /></TabsContent>
            <TabsContent value="rollout"><Rollout /></TabsContent>
            <TabsContent value="sizer"><Sizer /></TabsContent>
          </Tabs>
        </TabsContent>
        <TabsContent value="guide"><Guide /></TabsContent>
      </Tabs>
    </div>
  );
}
