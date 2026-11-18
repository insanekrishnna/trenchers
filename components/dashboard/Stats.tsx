"use client";

import { motion } from "motion/react";
import { closedTrades, formatHold, fmtSol, pnl } from "@/lib/data";
import { Card, TokenIcon } from "@/components/ui/primitives";

const EASE = [0.22, 1, 0.36, 1] as const;

/* Each part of the money flow gets its own colour, used for the bar and its legend dot. */
const FLOW = {
  net: "#f7f7f7",
  platform: "#ffc74f",
  exec: "#a78bfa",
};

/* ------------------------------------------------------------------ */
/*  Where the SOL went — one thin stacked bar + legend                 */
/* ------------------------------------------------------------------ */

export function PnlBreakdown() {
  const fee = Math.abs(pnl.platformFee);
  const exec = Math.abs(pnl.executionCost);
  const gross = Math.max(pnl.gross, 1e-9);
  const parts = [
    { key: "net", label: "You keep", v: pnl.net, color: FLOW.net },
    { key: "platform", label: "Platform fee", v: -fee, color: FLOW.platform },
    { key: "exec", label: "Execution cost", v: -exec, color: FLOW.exec },
  ];

  return (
    <Card data-tour="breakdown" className="flex h-full flex-col px-5 py-4">
      <div className="flex items-baseline justify-between">
        <h3 className="text-[14px] font-medium">Where the SOL went</h3>
        <span className="text-[12px] text-subtle">{pnl.legs} legs</span>
      </div>

      <div className="mt-4 flex items-baseline justify-between">
        <span className="text-[12px] text-muted">Gross result</span>
        <span className="text-[13px] tabular-nums text-green">{fmtSol(pnl.gross)}</span>
      </div>

      {/* stacked bar: the whole gross, split into what you keep and what fees took */}
      <div className="mt-2 flex h-[3px] gap-[3px]">
        {parts.map((p, i) => (
          <motion.span
            key={p.key}
            className="h-full rounded-full"
            style={{ background: p.color, width: `${(Math.abs(p.v) / gross) * 100}%`, transformOrigin: "left" }}
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: i * 0.12, ease: EASE }}
          />
        ))}
      </div>

      <ul className="mb-5 mt-4 space-y-2.5">
        {parts.map((p) => (
          <li key={p.key} className="flex items-center gap-2.5 text-[13px]">
            <span className="size-1.5 rounded-full" style={{ background: p.color }} />
            <span className="flex-1 text-muted">{p.label}</span>
            <span className="tabular-nums text-subtle">{((Math.abs(p.v) / gross) * 100).toFixed(0)}%</span>
            <span className={`w-16 text-right tabular-nums ${p.key === "net" ? "text-fg" : "text-muted"}`}>{fmtSol(p.v)}</span>
          </li>
        ))}
      </ul>

      {/* per round-trip, so the totals have a scale */}
      <div className="mt-auto grid grid-cols-2 gap-px overflow-hidden rounded-lg bg-line">
        <div className="bg-bg-2 px-3 py-2.5">
          <p className="text-[11.5px] text-subtle">Net per trade</p>
          <p className="mt-0.5 text-[15px] font-light tabular-nums">{fmtSol(pnl.net / pnl.roundTrips)}</p>
        </div>
        <div className="bg-bg-2 px-3 py-2.5">
          <p className="text-[11.5px] text-subtle">Fees per trade</p>
          <p className="mt-0.5 text-[15px] font-light tabular-nums">{fmtSol(-(fee + exec) / pnl.roundTrips)}</p>
        </div>
      </div>
      <p className="pt-3 text-[12px] text-subtle">Fees took {(((fee + exec) / gross) * 100).toFixed(0)}% of gross profit.</p>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Stats strip + hold time                                            */
/* ------------------------------------------------------------------ */

export function PerfTiles() {
  return (
    <div className="flex h-full flex-col gap-4">
      <StatsStrip />
      <HoldStrip />
    </div>
  );
}

function StatsStrip() {
  const seq = [...closedTrades].reverse();
  return (
    <Card data-tour="perf" className="grid grid-cols-2 divide-line sm:grid-cols-4 sm:divide-x">
      <Stat label="Win rate" value={`${pnl.winRate.toFixed(1)}%`} foot={`${pnl.wins} of ${pnl.roundTrips} closed`}>
        <ThinRing pct={pnl.winRate} />
      </Stat>

      <Stat label="Avg multiple" value={`${pnl.avgMultiple.toFixed(2)}×`} foot="break-even 1.00×">
        <div className="relative h-[2px] w-full rounded-full bg-white/[.08]">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full bg-green"
            initial={{ width: 0 }}
            whileInView={{ width: `${Math.min(1, pnl.avgMultiple / 2) * 100}%` }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: EASE }}
          />
          <span className="absolute -top-[3px] left-1/2 h-2 w-px bg-fg/60" />
        </div>
      </Stat>

      <Stat label="Round-trips" value={`${pnl.roundTrips}`} foot={`${pnl.legs} legs · 1 open`}>
        <div className="flex h-[2px] w-full gap-[3px]">
          {seq.map((t) => (
            <span key={t.id} className={`h-full flex-1 rounded-full ${t.pnl > 0 ? "bg-green" : "bg-red"}`} />
          ))}
        </div>
      </Stat>

      <Stat label="Avg hold" value={formatHold(pnl.avgHoldSec)} foot={`${formatHold(pnl.shortestHold)} – ${formatHold(pnl.longestHold)}`}>
        <div className="relative h-[2px] w-full rounded-full bg-white/[.08]">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full bg-[#7cc4ff]"
            initial={{ width: 0 }}
            whileInView={{ width: `${(pnl.avgHoldSec / pnl.longestHold) * 100}%` }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: EASE }}
          />
        </div>
      </Stat>
    </Card>
  );
}

function Stat({ label, value, foot, children }: { label: string; value: string; foot: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col px-4 py-3.5">
      <p className="text-[12px] text-muted">{label}</p>
      <p className="mt-1 text-[22px] font-light leading-tight tracking-tight tabular-nums">{value}</p>
      <div className="mt-2.5 flex h-4 items-center">{children}</div>
      <p className="mt-1 text-[11.5px] text-subtle">{foot}</p>
    </div>
  );
}

function ThinRing({ pct }: { pct: number }) {
  const r = 6.5;
  const c = 2 * Math.PI * r;
  return (
    <div className="flex items-center gap-2">
      <svg viewBox="0 0 16 16" className="size-4 -rotate-90">
        <circle cx="8" cy="8" r={r} fill="none" stroke="rgba(255,98,46,.35)" strokeWidth="1.5" />
        <motion.circle
          cx="8"
          cy="8"
          r={r}
          fill="none"
          stroke="#21c95e"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          whileInView={{ strokeDashoffset: c * (1 - pct / 100) }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: EASE }}
        />
      </svg>
      <span className="text-[11.5px] tabular-nums text-subtle">
        {pnl.wins}W · {pnl.losses}L
      </span>
    </div>
  );
}

/* Hold time per trade: thin bars, token art underneath */
function HoldStrip() {
  const trades = [...closedTrades].reverse();
  const max = Math.max(...trades.map((t) => t.holdSec));
  return (
    <Card className="flex flex-1 flex-col px-5 py-4">
      <div className="flex items-baseline justify-between">
        <h3 className="text-[14px] font-medium">Hold time per trade</h3>
        <span className="flex items-center gap-3 text-[11.5px] text-subtle">
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-green" /> win
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-red" /> loss
          </span>
        </span>
      </div>
      <div className="mt-3 flex flex-1 items-end justify-between gap-2">
        {trades.map((t, i) => {
          const win = t.pnl > 0;
          return (
            <div key={t.id} className="group flex min-w-0 flex-1 flex-col items-center gap-1.5">
              <span className="text-[11px] tabular-nums text-subtle transition-colors group-hover:text-fg">{formatHold(t.holdSec)}</span>
              <span className="relative flex h-11 w-[3px] items-end rounded-full bg-white/[.06]">
                <motion.span
                  className={`block w-full rounded-full ${win ? "bg-green" : "bg-red"}`}
                  initial={{ height: 0 }}
                  whileInView={{ height: `${(t.holdSec / max) * 100}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7, delay: i * 0.06, ease: EASE }}
                />
              </span>
              <TokenIcon symbol={t.symbol} hue={t.hue} size={20} />
              <span className="max-w-full truncate text-[11px] text-muted">{t.symbol}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
