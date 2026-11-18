"use client";

import { motion } from "motion/react";
import { ArrowRight, Radar } from "lucide-react";
import { useState } from "react";
import { closedTrades, config, fmtMc, fmtPct, fmtSol, fmtTime, formatHold, openTrades, pnl, reasonLabel } from "@/lib/data";
import { END, trades } from "@/lib/chartData";

const openWindows = trades.filter((t) => t.open);

const REASON_COLOR = { take_profit: "#21c95e", stale_exit: "#7cc4ff", stop_loss: "#ff622e" } as const;
import { Card, CardHeader, LiveDot, Sol, TokenIcon } from "@/components/ui/primitives";

export function OpenPositions() {
  return (
    <Card data-tour="open" className="overflow-hidden">
      <CardHeader
        title="Open positions"
        meta={`${openTrades.length} live · ${pnl.atRisk.toFixed(4)} SOL at risk`}
        right={<button className="btn-link">View all <ArrowRight className="size-3.5" /></button>}
      />
      <div className="space-y-2 px-5">
        {openWindows.map((o) => {
          const value = o.entry * o.multiple;
          const up = o.multiple >= 1;
          const held = END - o.t0;
          return (
            <div key={o.id} className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-lg bg-white/[.03] px-4 py-3.5">
              <div className="flex min-w-[150px] items-center gap-3">
                <TokenIcon symbol={o.symbol} hue={o.hue} size={40} badge />
                <div>
                  <p className="flex items-center gap-2 font-medium">
                    {o.symbol}
                    <span className="flex items-center gap-1 text-[11px] font-normal text-green">
                      <LiveDot size={6} /> live
                    </span>
                  </p>
                  <p className="text-[12px] text-subtle">
                    MC {fmtMc(o.mc)} · held {formatHold(held)}
                  </p>
                </div>
              </div>
              <Sparkline path={o.path} up={up} />
              <div className="ml-auto flex items-center gap-8 text-right">
                <div>
                  <p className="text-[12px] text-subtle">Entry → now</p>
                  <p className="flex items-center gap-1.5 tabular-nums">
                    <span className="text-muted">{o.entry.toFixed(4)}</span>
                    <span className="text-subtle">→</span>
                    {value.toFixed(4)} <Sol />
                  </p>
                </div>
                <div>
                  <p className="text-[12px] text-subtle">Unrealized</p>
                  <p className={`font-medium tabular-nums ${up ? "text-green" : "text-red"}`}>
                    {fmtSol(o.pnl)} <span className="text-[12px] opacity-80">{fmtPct((o.multiple - 1) * 100, 0)}</span>
                  </p>
                </div>
                <button className="btn-ghost h-8 px-3 text-[13px]">Sell</button>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mx-5 mb-5 mt-2 flex items-center gap-3 rounded-lg px-4 py-3 text-[13px] text-muted">
        <span className="relative grid size-7 shrink-0 place-items-center rounded-full bg-white/[.05] text-fg">
          <span className="absolute inset-0 rounded-full border border-white/20 radar-ping" />
          <Radar className="size-3.5" />
        </span>
        Scanning for the next entry — 2,000 tokens checked in 24h, each must pass all {config.gates} checks.
      </div>
    </Card>
  );
}

function Sparkline({ path, up }: { path: (u: number) => number; up: boolean }) {
  const W = 140;
  const H = 32;
  const pts = Array.from({ length: 48 }, (_, i) => path(i / 47));
  const lo = Math.min(...pts);
  const hi = Math.max(...pts);
  const d = pts
    .map((v, i) => `${i ? "L" : "M"}${((i / 47) * W).toFixed(1)},${(H - 2 - ((v - lo) / (hi - lo || 1)) * (H - 4)).toFixed(1)}`)
    .join(" ");
  return (
    <svg width={W} height={H} className="hidden shrink-0 md:block" aria-hidden>
      <path d={d} fill="none" stroke={up ? "#f7f7f7" : "#ff622e"} strokeWidth={1.5} strokeLinejoin="round" />
    </svg>
  );
}

type Filter = "all" | "win" | "loss";

export function ClosedPositions() {
  const [filter, setFilter] = useState<Filter>("all");
  const rows = closedTrades.filter((t) => (filter === "all" ? true : filter === "win" ? t.pnl > 0 : t.pnl < 0)).slice(0, 6);
  return (
    <Card data-tour="closed" className="overflow-hidden">
      <CardHeader
        title="Closed positions"
        meta="Newest first · realized after exit"
        right={
          <div className="flex items-center gap-2">
            <div className="hidden rounded-full border border-line p-0.5 sm:flex">
              {(["all", "win", "loss"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`relative rounded-full px-2.5 py-0.5 text-[12px] capitalize transition-colors ${filter === f ? "text-fg" : "text-subtle hover:text-fg"}`}
                >
                  {filter === f && <motion.span layoutId="cp-f" className="absolute inset-0 rounded-full bg-white/[.08]" />}
                  <span className="relative">{f === "all" ? `All ${pnl.roundTrips}` : f === "win" ? `Wins ${pnl.wins}` : `Losses ${pnl.losses}`}</span>
                </button>
              ))}
            </div>
            <button className="btn-link">View all <ArrowRight className="size-3.5" /></button>
          </div>
        }
      />

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] table-fixed text-[13px]">
          <colgroup>
            <col className="w-[26%]" />
            <col className="w-[22%]" />
            <col className="w-[20%]" />
            <col className="w-[17%]" />
            <col className="w-[15%]" />
          </colgroup>
          <thead>
            <tr className="border-y border-line text-left text-[11.5px] text-subtle">
              <th className="py-2 pl-5 font-normal">Token</th>
              <th className="py-2 font-normal">Entry → Exit · SOL</th>
              <th className="py-2 font-normal">Multiple</th>
              <th className="py-2 font-normal">Exit</th>
              <th className="py-2 pr-5 text-right font-normal">P&amp;L · Hold</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t, i) => {
              const win = t.pnl > 0;
              return (
                <motion.tr
                  key={t.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-line/60 transition-colors last:border-0 hover:bg-white/[.04]"
                >
                  <td className="py-2.5 pl-5">
                    <div className="flex items-center gap-3">
                      <TokenIcon symbol={t.symbol} hue={t.hue} size={32} badge />
                      <div className="ml-0.5 min-w-0">
                        <p className="truncate text-fg">{t.symbol}</p>
                        <p className="text-[11.5px] text-subtle">
                          MC {fmtMc(t.mc)} · {fmtTime(t.closedAt)}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 tabular-nums">
                    <span className="text-subtle">{t.entry.toFixed(4)}</span>
                    <span className="px-1.5 text-subtle">→</span>
                    <span className="text-fg">{t.exit.toFixed(4)}</span>
                  </td>
                  <td className="py-2.5">
                    <MultLine m={t.multiple} />
                  </td>
                  <td className="py-2.5">
                    <span className="inline-flex items-center gap-2 text-muted">
                      <span className="size-1.5 rounded-full" style={{ background: REASON_COLOR[t.reason] }} />
                      {reasonLabel(t.reason)}
                    </span>
                  </td>
                  <td className="py-2.5 pr-5 text-right tabular-nums">
                    <p className={win ? "text-green" : "text-red"}>
                      {fmtSol(t.pnl)} <span className="text-[11.5px] opacity-70">{fmtPct(t.pct, 0)}</span>
                    </p>
                    <p className="text-[11.5px] text-subtle">{formatHold(t.holdSec)}</p>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/* the multiple on a 0–2.5× scale with a tick at break-even */
function MultLine({ m }: { m: number }) {
  const win = m >= 1;
  const pos = (v: number) => `${Math.min(1, v / 2.5) * 100}%`;
  return (
    <div className="flex items-center gap-2.5 pr-6">
      <span className="w-10 text-right tabular-nums text-fg">{m.toFixed(2)}×</span>
      <span className="relative h-[2px] flex-1 rounded-full bg-white/[.07]">
        {/* from break-even to the multiple */}
        <span
          className={`absolute inset-y-0 rounded-full ${win ? "bg-green" : "bg-red"}`}
          style={win ? { left: pos(1), width: `calc(${pos(m)} - ${pos(1)})` } : { left: pos(m), width: `calc(${pos(1)} - ${pos(m)})` }}
        />
        <span className="absolute -top-[3px] h-2 w-px bg-fg/50" style={{ left: pos(1) }} />
      </span>
    </div>
  );
}

