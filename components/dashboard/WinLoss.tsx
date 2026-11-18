"use client";

import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { bot, closedTrades, formatHold } from "@/lib/data";
import { END, equityAt, START, wall } from "@/lib/chartData";
import { Card } from "@/components/ui/primitives";

/* ------------------------------------------------------------------ */
/*  SplitBar — a value on each side, the bar shows the balance         */
/* ------------------------------------------------------------------ */

export function SplitBar({
  left,
  right,
  leftLabel,
  rightLabel,
  leftText,
  rightText,
}: {
  left: number;
  right: number;
  leftLabel: string;
  rightLabel: string;
  leftText: string;
  rightText: string;
}) {
  const total = left + right;
  // keep a sliver of each side visible so "0" still reads as a split
  const share = total > 0 ? Math.min(0.96, Math.max(0.04, left / total)) : 0.5;
  return (
    <div>
      <div className="flex items-baseline justify-between text-[13px]">
        <span>
          <span className="tabular-nums text-fg">{leftText}</span> <span className="text-muted">{leftLabel}</span>
        </span>
        <span>
          <span className="tabular-nums text-fg">{rightText}</span> <span className="text-muted">{rightLabel}</span>
        </span>
      </div>
      <div className="mt-2 flex h-[3px] gap-[3px]">
        <motion.span
          className="h-full rounded-full bg-green"
          initial={false}
          animate={{ width: `${share * 100}%` }}
          transition={{ type: "spring", stiffness: 180, damping: 26 }}
        />
        <span className="h-full flex-1 rounded-full bg-red" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Win / loss card                                                    */
/* ------------------------------------------------------------------ */

const WINDOWS = [
  { key: "2H", sec: 2 * 3600 },
  { key: "4H", sec: 4 * 3600 },
  { key: "6H", sec: 6 * 3600 },
  { key: "All", sec: 0 },
] as const;
type WindowKey = (typeof WINDOWS)[number]["key"];

const sum = (xs: number[]) => xs.reduce((s, x) => s + x, 0);
const avg = (xs: number[]) => (xs.length ? sum(xs) / xs.length : 0);

export function WinLoss() {
  const [win, setWin] = useState<WindowKey>("All");

  // equity change over each window, for the tiles
  const tiles = useMemo(
    () =>
      WINDOWS.map((w) => {
        const from = w.sec ? Math.max(START, END - w.sec) : START;
        const base = w.sec ? equityAt(from) : bot.startingBalance;
        const pct = ((equityAt(END) - base) / base) * 100;
        return { ...w, from, pct };
      }),
    []
  );

  const from = tiles.find((t) => t.key === win)!.from;
  const trades = closedTrades.filter((t) => wall(t.closedAt) >= from);
  const winners = trades.filter((t) => t.pnl > 0);
  const losers = trades.filter((t) => t.pnl <= 0);
  const won = sum(winners.map((t) => t.pnl));
  const lost = Math.abs(sum(losers.map((t) => t.pnl)));
  const best = winners.length ? Math.max(...winners.map((t) => t.pnl)) : 0;
  const worst = losers.length ? Math.abs(Math.min(...losers.map((t) => t.pnl))) : 0;
  const holdW = avg(winners.map((t) => t.holdSec));
  const holdL = avg(losers.map((t) => t.holdSec));

  return (
    <Card data-tour="winloss" className="flex flex-col px-5 py-4">
      <div className="flex items-baseline justify-between">
        <h3 className="text-[14px] font-medium">Win / loss split</h3>
        <span className="text-[12px] text-subtle">
          {trades.length} round-trip{trades.length === 1 ? "" : "s"}
        </span>
      </div>

      {/* timeframe tiles */}
      <div className="mt-3.5 grid grid-cols-4 divide-x divide-line overflow-hidden rounded-lg border border-line">
        {tiles.map((t) => {
          const on = t.key === win;
          const up = t.pct >= 0;
          return (
            <button
              key={t.key}
              onClick={() => setWin(t.key)}
              className={`px-2 py-1.5 text-center transition-colors ${on ? "bg-white/[.06]" : "hover:bg-white/[.03]"}`}
            >
              <span className={`block text-[11.5px] ${on ? "text-fg" : "text-subtle"}`}>{t.key}</span>
              <span className={`block text-[12.5px] tabular-nums ${up ? "text-green" : "text-red"}`}>
                <span className="mr-0.5 text-[8px]">{up ? "▲" : "▼"}</span>
                {Math.abs(t.pct).toFixed(2)}%
              </span>
            </button>
          );
        })}
      </div>

      {/* split rows */}
      <div className="mt-4 flex-1 space-y-3.5">
        <SplitBar left={winners.length} right={losers.length} leftText={`${winners.length}`} leftLabel={winners.length === 1 ? "win" : "wins"} rightText={`${losers.length}`} rightLabel={losers.length === 1 ? "loss" : "losses"} />
        <SplitBar left={won} right={lost} leftText={won.toFixed(4)} leftLabel="SOL won" rightText={lost.toFixed(4)} rightLabel="SOL lost" />
        <SplitBar left={best} right={worst} leftText={best.toFixed(4)} leftLabel="best" rightText={worst.toFixed(4)} rightLabel="worst" />
        <SplitBar
          left={holdW}
          right={holdL}
          leftText={holdW ? formatHold(Math.round(holdW)) : "—"}
          leftLabel="avg win hold"
          rightText={holdL ? formatHold(Math.round(holdL)) : "—"}
          rightLabel="avg loss hold"
        />
      </div>
    </Card>
  );
}
