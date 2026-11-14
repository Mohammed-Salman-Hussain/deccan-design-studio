import { motion } from "framer-motion";
import { LOOPS } from "@/lib/sim/loops";
import type { LoopId } from "@/lib/sim/types";

interface Props {
  size?: number;
  stroke?: number;
  scores?: Partial<Record<LoopId, number>>;
  spin?: boolean;
  glow?: boolean;
  className?: string;
  children?: React.ReactNode;
  title?: string;
}

/** Signature motif: five colour-coded arcs. With `scores`, each arc fills by that loop's score. */
export function LoopRing({ size = 120, stroke = 10, scores, spin, glow = false, className, children, title = "Loop ring" }: Props) {
  const r = (size - stroke) / 2 - 2;
  const c = 2 * Math.PI * r;
  const gap = c * 0.025;
  const seg = c / 5 - gap;
  return (
    <div className={`relative inline-grid place-items-center ${className ?? ""}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={title} className={spin ? "animate-spin-slow" : ""}>
        {glow && (
          <defs>
            <filter id={`ring-glow-${size}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation={stroke * 0.45} result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
        )}
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          {LOOPS.map((l, i) => {
            const offset = -(i * (seg + gap));
            const frac = scores ? Math.max(0.04, Math.min(1, (scores[l.id] ?? 0) / 100)) : 1;
            return (
              <g key={l.id}>
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={l.color} strokeOpacity={0.16} strokeWidth={stroke} strokeDasharray={`${seg} ${c - seg}`} strokeDashoffset={offset} strokeLinecap="round" />
                <motion.circle
                  cx={size / 2}
                  cy={size / 2}
                  r={r}
                  fill="none"
                  stroke={l.color}
                  strokeWidth={stroke}
                  strokeLinecap="round"
                  strokeDashoffset={offset}
                  filter={glow ? `url(#ring-glow-${size})` : undefined}
                  initial={false}
                  animate={{ strokeDasharray: `${seg * frac} ${c - seg * frac}` }}
                  transition={{ duration: 1.1, ease: [0.2, 0.7, 0.2, 1] }}
                />
              </g>
            );
          })}
        </g>
      </svg>
      {children && <div className="absolute inset-0 grid place-items-center">{children}</div>}
    </div>
  );
}

export function Logo({ compact }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <LoopRing size={30} stroke={4} glow={false} title="LoopLocal logo">
        <span className="size-1.5 rounded-full bg-primary-glow" />
      </LoopRing>
      {!compact && (
        <span className="font-display text-[1.05rem] font-semibold tracking-tight">
          Loop<span className="text-primary-glow">Local</span>
        </span>
      )}
    </span>
  );
}
