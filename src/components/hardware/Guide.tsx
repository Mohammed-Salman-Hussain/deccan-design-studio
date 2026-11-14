import { useEffect, useRef, useState } from "react";
import { Bot, GraduationCap, Send, User } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Panel } from "@/components/ll/primitives";
import { KB, TUTORIALS } from "@/lib/hardware";
import { cn } from "@/lib/utils";

interface Msg {
  from: "bot" | "me";
  text: string;
}

function answer(question: string): string {
  const text = question.toLowerCase();
  let best = -1;
  let bestScore = 0;
  KB.forEach((e, i) => {
    let score = e.q.toLowerCase() === text ? 100 : 0;
    for (const k of e.keywords) if (text.includes(k)) score += k.length > 4 ? 2 : 1;
    if (score > bestScore) {
      bestScore = score;
      best = i;
    }
  });
  if (best < 0) return "I don't have a rule for that yet. Try asking about tank sensors, losing the internet, security, cost, pump scheduling, wiring, STP quality, drains, biogas safety, calibration or rollout.";
  return KB[best].a;
}

const SUGGESTED = [KB[0].q, KB[1].q, KB[2].q, KB[3].q, KB[5].q, KB[10].q];

export function Guide() {
  const [msgs, setMsgs] = useState<Msg[]>([{ from: "bot", text: "Hello. I answer questions about the hardware plan using fixed rules from this page. Pick a question or type your own." }]);
  const [input, setInput] = useState("");
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    end.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [msgs]);

  const ask = (q: string) => {
    const t = q.trim();
    if (!t) return;
    setMsgs((m) => [...m, { from: "me", text: t }, { from: "bot", text: answer(t) }]);
    setInput("");
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
      <Panel title="Install tutorials" subtitle="Step by step, per device type" icon={GraduationCap}>
        <Accordion type="single" collapsible className="w-full">
          {TUTORIALS.map((t) => (
            <AccordionItem key={t.id} value={t.id}>
              <AccordionTrigger className="text-sm"><span className="flex flex-1 items-center justify-between gap-3 pr-2"><span>{t.title}</span><span className="font-mono text-[10px] text-muted-foreground">{t.time}</span></span></AccordionTrigger>
              <AccordionContent>
                <ol className="space-y-2 text-xs">
                  {t.steps.map((s, i) => (<li key={i} className="flex gap-2.5"><span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-primary/15 font-mono text-[10px] text-primary-glow">{i + 1}</span><span>{s}</span></li>))}
                </ol>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Panel>

      <Panel title="Ask the hardware guide" subtitle="Rule-based answers drawn from this plan" icon={Bot}>
        <div className="flex h-[420px] flex-col">
          <div className="flex-1 space-y-2.5 overflow-y-auto pr-1" role="log" aria-live="polite" aria-label="Conversation with the hardware guide">
            {msgs.map((m, i) => (
              <div key={i} className={cn("flex gap-2", m.from === "me" && "flex-row-reverse")}>
                <span className={cn("mt-0.5 grid size-6 shrink-0 place-items-center rounded-full", m.from === "me" ? "bg-primary/20 text-primary-glow" : "bg-muted text-muted-foreground")}>{m.from === "me" ? <User className="size-3.5" aria-hidden /> : <Bot className="size-3.5" aria-hidden />}</span>
                <p className={cn("max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed", m.from === "me" ? "bg-primary/20" : "border bg-muted/30")}>{m.text}</p>
              </div>
            ))}
            <div ref={end} />
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {SUGGESTED.map((q) => (<button key={q} onClick={() => ask(q)} className="rounded-full border px-2.5 py-1 text-left text-[11px] transition hover:bg-accent/50">{q}</button>))}
          </div>
          <form className="mt-2 flex gap-2" onSubmit={(e) => { e.preventDefault(); ask(input); }}>
            <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about sensors, wiring, cost, security…" aria-label="Your question" />
            <Button type="submit" variant="hero" aria-label="Send question"><Send /></Button>
          </form>
        </div>
      </Panel>
    </div>
  );
}
