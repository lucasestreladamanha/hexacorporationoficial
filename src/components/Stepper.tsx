import { Check } from "lucide-react";

export function Stepper({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5 w-full">
      {Array.from({ length: total }).map((_, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={i} className="flex-1 flex items-center gap-1.5">
            <div
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-bold transition-all ${
                done
                  ? "bg-lime text-black"
                  : active
                    ? "bg-lime text-black ring-2 ring-lime/30 animate-pulse-gold"
                    : "bg-white/[0.04] text-white/40 border border-white/10"
              }`}
            >
              {done ? <Check className="h-3 w-3" strokeWidth={3} /> : i + 1}
            </div>
            {i < total - 1 && (
              <div className="h-px flex-1 bg-white/10 overflow-hidden">
                <div
                  className={`h-full bg-lime transition-all duration-500 ${
                    done ? "w-full" : "w-0"
                  }`}
                  style={{ boxShadow: done ? "0 0 8px oklch(0.83 0.17 84 / 60%)" : "none" }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
