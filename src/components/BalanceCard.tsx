import { TrendingUp, Wallet } from "lucide-react";
import { HexaCoin } from "./HexaCoin";

export function BalanceCard({
  balance,
  bonus,
  label = "Saldo Bitcoin",
}: {
  balance: number;
  bonus?: string;
  label?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-[2rem] glass p-6">
      <div className="absolute -top-6 -right-6 opacity-40">
        <HexaCoin size={140} />
      </div>
      <div
        className="pointer-events-none absolute -bottom-20 -left-10 h-48 w-48 rounded-full"
        style={{
          background: "radial-gradient(circle, oklch(0.83 0.17 84 / 18%) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />
      <div className="relative">
        <div className="flex items-center gap-2 font-mono-tag text-white/50">
          <Wallet className="h-3 w-3" />
          {label}
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span
            key={balance}
            className="animate-count-up text-5xl font-semibold tracking-[-0.06em] shimmer-text tabular-nums"
          >
            {balance.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="font-mono-tag text-lime">BTC</span>
        </div>
        {bonus && (
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-glow/15 border border-emerald-glow/30 px-3 py-1 text-xs font-semibold text-emerald-glow">
            <TrendingUp className="h-3 w-3" />
            {bonus}
          </div>
        )}
      </div>
    </div>
  );
}
