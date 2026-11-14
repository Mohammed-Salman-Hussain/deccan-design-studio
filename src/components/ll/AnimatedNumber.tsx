import { animate, useMotionValue, useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";

interface Props {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  format?: (n: number) => string;
}

export function AnimatedNumber({ value, decimals = 0, prefix = "", suffix = "", className, format }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const mv = useMotionValue(0);
  const reduce = useReducedMotion();
  const fmt = (n: number) => (format ? format(n) : n.toLocaleString("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }));

  useEffect(() => {
    if (reduce) {
      mv.set(value);
      if (ref.current) ref.current.textContent = prefix + fmt(value) + suffix;
      return;
    }
    const ctrl = animate(mv, value, {
      duration: 1.1,
      ease: [0.2, 0.7, 0.2, 1],
      onUpdate: (v) => {
        if (ref.current) ref.current.textContent = prefix + fmt(v) + suffix;
      },
    });
    return () => ctrl.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, reduce]);

  return (
    <span ref={ref} className={`tabular ${className ?? ""}`}>
      {prefix + fmt(0) + suffix}
    </span>
  );
}
