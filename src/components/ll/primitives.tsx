import { cn } from "@/lib/utils";
import { LOOP_BY_ID } from "@/lib/sim/loops";
import type { LoopId, TaskStatus } from "@/lib/sim/types";
import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useT } from "@/lib/hooks";
import { useApp } from "@/store/app";
import { GLOSSARY, type GlossaryKey } from "@/lib/glossary";

/**
 * A small "i" button that keeps secondary detail out of the way.
 * It opens on click, tap or Enter, so it works on touch screens and with a keyboard.
 */
export function InfoTip({ children, label = "More information", className, side }: { children: React.ReactNode; label?: string; className?: string; side?: "top" | "right" | "bottom" | "left" }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" aria-label={label} className={cn("inline-grid size-5 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground", className)}>
          <Info className="size-3.5" aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent side={side} className="w-72 text-xs leading-relaxed text-muted-foreground">{children}</PopoverContent>
    </Popover>
  );
}

/** A word in running text with a dotted underline. Tap or hover to see what it means. */
export function Term({ k, children }: { k: GlossaryKey; children?: React.ReactNode }) {
  const g = GLOSSARY[k];
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="cursor-help rounded-sm underline decoration-dotted decoration-muted-foreground/70 underline-offset-2 hover:text-primary-glow">{children ?? g.label}</button>
      </PopoverTrigger>
      <PopoverContent className="w-64 text-xs leading-relaxed">
        <p className="font-medium text-foreground">{g.label}</p>
        <p className="mt-1 text-muted-foreground">{g.def}</p>
      </PopoverContent>
    </Popover>
  );
}

export function Panel({ title, icon: Icon, action, className, children, subtitle, bodyClass }: { title?: React.ReactNode; subtitle?: React.ReactNode; icon?: LucideIcon; action?: React.ReactNode; className?: string; children: React.ReactNode; bodyClass?: string }) {
  return (
    <section className={cn("glass rounded-xl", className)}>
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 px-4 pt-3">
          {title && (
            <h3 className="flex min-w-0 items-center gap-2 text-sm font-semibold tracking-tight">
              {Icon && <Icon className="size-4 shrink-0 text-primary-glow" aria-hidden />}
              <span className="truncate">{title}</span>
              {subtitle && <InfoTip label={`About ${typeof title === "string" ? title : "this panel"}`}>{subtitle}</InfoTip>}
            </h3>
          )}
          {action}
        </header>
      )}
      <div className={cn("p-4", title && "pt-3", bodyClass)}>{children}</div>
    </section>
  );
}

/** Page title. The longer description is available behind the info button. */
export function PageHeader({ title, description, children }: { eyebrow?: string; title: React.ReactNode; description?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between md:mb-5">
      <div className="flex min-w-0 items-center gap-2">
        <h1 className="text-gradient text-xl font-semibold leading-tight md:text-2xl">{title}</h1>
        {description && <InfoTip label="About this page" side="bottom">{description}</InfoTip>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

export function LoopChip({ loop, className, short = true }: { loop: LoopId; className?: string; short?: boolean }) {
  const l = LOOP_BY_ID[loop];
  const Icon = l.icon;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium text-foreground", className)} style={{ borderColor: `color-mix(in oklab, ${l.color} 40%, transparent)`, background: `color-mix(in oklab, ${l.color} 10%, transparent)` }}>
      <Icon className="size-3" style={{ color: l.color }} aria-hidden />
      {short ? l.short : l.name}
    </span>
  );
}

const STATUS_STYLE: Record<TaskStatus, string> = {
  pending: "bg-muted text-muted-foreground border-border",
  dispatched: "bg-brand-yellow/60 text-warning border-warning/30",
  done: "bg-success/10 text-success border-success/30",
  verified: "bg-primary-glow/10 text-primary-glow border-primary-glow/30",
};

export function StatusPill({ status }: { status: TaskStatus }) {
  const t = useT();
  return <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium", STATUS_STYLE[status])}>
    <span className="size-1.5 rounded-full bg-current" />
    {t(`status.${status}`)}
  </span>;
}

export function Stat({ label, value, sub, icon: Icon, color, hint, className }: { label: string; value: React.ReactNode; sub?: React.ReactNode; icon?: LucideIcon; color?: string; hint?: string; className?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={cn("glass rounded-xl p-3", className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
          {hint && (
            <InfoTip label={`How ${label} is calculated`}>
              <p>{hint}</p>
              <button type="button" onClick={() => useApp.getState().set({ assumptionsOpen: true })} className="mt-2 font-medium text-primary-glow underline underline-offset-2">All assumptions and formulas</button>
            </InfoTip>
          )}
        </span>
        {Icon && <Icon className="size-4" style={{ color: color ?? "var(--primary-glow)" }} aria-hidden />}
      </div>
      <div className="mt-1.5 font-display text-xl font-semibold tracking-tight md:text-2xl">{value}</div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </motion.div>
  );
}

export function Meter({ value, color, className, label }: { value: number; color?: string; className?: string; label?: string }) {
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", className)} role="meter" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <motion.div className="h-full rounded-full" style={{ background: color ?? "var(--primary)" }} initial={false} animate={{ width: `${Math.max(0, Math.min(100, value))}%` }} transition={{ duration: 0.8, ease: "easeOut" }} />
    </div>
  );
}

export function EmptyState({ icon: Icon, title, body, children }: { icon: LucideIcon; title: string; body?: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-6 py-10 text-center">
      <div className="grid size-12 place-items-center rounded-full bg-muted">
        <Icon className="size-5 text-muted-foreground" aria-hidden />
      </div>
      <p className="text-sm font-medium">{title}</p>
      {body && <p className="max-w-sm text-xs text-muted-foreground">{body}</p>}
      {children}
    </div>
  );
}

export function SkeletonBlock({ className, label = "Loading" }: { className?: string; label?: string }) {
  return (
    <div className={cn("relative overflow-hidden rounded-xl bg-muted", className)} role="status" aria-label={label}>
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-card/60 to-transparent" />
    </div>
  );
}
