import { motion } from "framer-motion";

export function TankGauge({ pct, label = "Overhead tank", size = 150 }: { pct: number; label?: string; size?: number }) {
  const h = size * 1.15;
  const level = Math.max(0, Math.min(100, pct));
  const color = level < 25 ? "var(--destructive)" : level < 50 ? "var(--warning)" : "var(--loop-rain)";
  const y = 12 + (h - 24) * (1 - level / 100);
  return (
    <div className="relative" style={{ width: size, height: h }} role="meter" aria-label={label} aria-valuenow={Math.round(level)} aria-valuemin={0} aria-valuemax={100}>
      <svg width={size} height={h} viewBox={`0 0 ${size} ${h}`}>
        <defs>
          <clipPath id="tank-clip">
            <rect x={10} y={12} width={size - 20} height={h - 24} rx={18} />
          </clipPath>
          <linearGradient id="tank-water" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor={color} stopOpacity={0.95} />
            <stop offset="1" stopColor={color} stopOpacity={0.55} />
          </linearGradient>
        </defs>
        <rect x={10} y={12} width={size - 20} height={h - 24} rx={18} fill="var(--muted)" stroke="var(--border)" />
        <g clipPath="url(#tank-clip)">
          <motion.g initial={false} animate={{ y }} transition={{ duration: 1, ease: "easeOut" }}>
            <g className="animate-wave">
              <path d={`M0 6 Q ${size / 4} -4 ${size / 2} 6 T ${size} 6 T ${size * 1.5} 6 T ${size * 2} 6 V ${h} H 0 Z`} fill="url(#tank-water)" />
            </g>
            <g className="animate-wave" style={{ animationDuration: "9s", opacity: 0.4 }}>
              <path d={`M0 8 Q ${size / 4} 16 ${size / 2} 8 T ${size} 8 T ${size * 1.5} 8 T ${size * 2} 8 V ${h} H 0 Z`} fill={color} />
            </g>
          </motion.g>
        </g>
        {[25, 50, 75].map((m) => (
          <g key={m}>
            <line x1={size - 22} x2={size - 12} y1={12 + (h - 24) * (1 - m / 100)} y2={12 + (h - 24) * (1 - m / 100)} stroke="var(--muted-foreground)" strokeOpacity={0.5} />
          </g>
        ))}
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <p className="font-display text-3xl font-semibold tabular">{Math.round(level)}%</p>
          <p className="text-[10px] uppercase tracking-wider text-foreground/80">{label}</p>
        </div>
      </div>
    </div>
  );
}
