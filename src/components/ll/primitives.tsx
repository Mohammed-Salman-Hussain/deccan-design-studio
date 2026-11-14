import { cn } from "@/lib/utils";
import { LOOP_BY_ID } from "@/lib/sim/loops";
import type { LoopId, TaskStatus } from "@/lib/sim/types";
import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useT } from "@/lib/hooks";

export function Panel({ title, icon: Icon, action, className, children, subtitle, bodyClass }: { title?: React.ReactNode; subtitle?: React.ReactNode; icon?: LucideIcon; action?: React.ReactNode; className?: string; children: React.ReactNode; bodyClass?: string }) {
  return (
    <section className={cn("glass glow-border rounded-2xl", className)}>
      {(title || action) && (
        <header className="flex items-start justify-between gap-3 px-4 pt-3">
          <div className="min-w-0">
            {title && (
              <h3 className="flex items-center gap-2 text-sm font-semibold tracking-tight">
                {Icon && <Icon className="size-4 text-primary-glow" aria-hidden />}
                {title}
              </h3>
            )}
            {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={cn("p-4", title && "pt-2.5", bodyClass)}>{children}</div>
    </section>
  );
}

export function PageHeader({ eyebrow, title, description, children }: { eyebrow?: string; title: React.ReactNode; description?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="mb-4 flex flex-col gap-3 md:mb-5 md:flex-row md:items-end md:justify-between">
      <div className="max-w-3xl">
        {eyebrow && <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.2em] text-primary-glow">{eyebrow}</p>}
        <h1 className="text-gradient text-2xl font-semibold leading-tight md:text-[2rem]">{title}</h1>
        {description && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

export function LoopChip({ loop, className, short = true }: { loop: LoopId; className?: string; short?: boolean }) {
  const l = LOOP_BY_ID[loop];
  const Icon = l.icon;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium", className)} style={{ color: l.color, borderColor: `color-mix(in oklab, ${l.color} 35%, transparent)`, background: `color-mix(in oklab, ${l.color} 10%, transparent)` }}>
      <Icon className="size-3" aria-hidden />
      {short ? l.short : l.name}
    </span>
  );
}

const STATUS_STYLE: Record<TaskStatus, string> = {
  pending: "bg-muted text-muted-foreground border-border",
  dispatched: "bg-warning/15 text-warning border-warning/30",
  done: "bg-success/15 text-success border-success/30",
  verified: "bg-info/15 text-info border-info/30",
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
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={cn("glass glow-border relative overflow-hidden rounded-xl p-3", className)}>
      <div className="pointer-events-none absolute -right-8 -top-8 size-24 rounded-full opacity-30 blur-2xl" style={{ background: color ?? "var(--primary)" }} />
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
        <span className="flex items-center gap-1">
          {hint && (
            <Tooltip>
              <TooltipTrigger aria-label={`How ${label} is calculated`} className="text-muted-foreground hover:text-foreground">
                <Info className="size-3.5" />
              </TooltipTrigger>
              <TooltipContent className="max-w-64 text-xs">{hint}</TooltipContent>
            </Tooltip>
          )}
          {Icon && <Icon className="size-4" style={{ color: color ?? "var(--primary-glow)" }} aria-hidden />}
        </span>
      </div>
      <div className="mt-1.5 font-display text-xl font-semibold tracking-tight md:text-2xl">{value}</div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </motion.div>
  );
}

export function Meter({ value, color, className, label }: { value: number; color?: string; className?: string; label?: string }) {
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", className)} role="meter" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <motion.div className="h-full rounded-full" style={{ background: color ?? "var(--gradient-primary)" }} initial={false} animate={{ width: `${Math.max(0, Math.min(100, value))}%` }} transition={{ duration: 0.8, ease: "easeOut" }} />
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
    <div className={cn("relative overflow-hidden rounded-2xl bg-muted/60", className)} role="status" aria-label={label}>
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-foreground/5 to-transparent" />
    </div>
  );
}
