"use client";

import { useCallback, useState } from "react";
import { bot, fmtPct, fmtSol, pnl } from "@/lib/data";
import { Card, CountUp } from "@/components/ui/primitives";
import { TradeChart, type Scrub } from "./TradeChart";

export function PnlHero() {
  const [scrub, setScrub] = useState<Scrub>(null);
  // the count-up plays once on load; after the first scrub the number only changes when the pointer moves
  const [intro, setIntro] = useState(true);
  const onScrub = useCallback((s: Scrub) => {
    if (s) setIntro(false);
    setScrub(s);
  }, []);

  // resting: realized net P&L. scrubbing: equity change at that moment.
  const value = scrub ? scrub.equity - bot.startingBalance : pnl.net;
  const pct = (value / bot.startingBalance) * 100;
  const up = value >= 0;

  // Three supporting figures, all in calm white. Gross and fees live in "Where the SOL went".
  const stats = [
    { k: "Balance", v: pnl.balance.toFixed(4) },
    { k: "Open P&L", v: fmtSol(pnl.unrealized) },
    { k: "Max drawdown", v: fmtSol(pnl.maxDrawdown) },
  ];

  return (
    <Card data-tour="pnl" className="overflow-hidden">
      <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-3 px-5 py-3.5">
        <div className="min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="text-[28px] font-medium leading-none tracking-[-0.02em] tabular-nums">
              {intro && !scrub ? <CountUp value={pnl.net} signed /> : fmtSol(value)}
            </span>
            <span className="text-[13px] text-muted">SOL</span>
            <span className={`ml-1.5 text-[13px] font-medium tabular-nums ${up ? "text-green" : "text-red"}`}>
              {fmtPct(pct)}
            </span>
          </div>
        </div>

        <dl className="flex divide-x divide-line">
          {stats.map((s) => (
            <div key={s.k} className="px-5 first:pl-0 last:pr-0">
              <dt className="text-[11.5px] text-subtle">{s.k}</dt>
              <dd className="mt-0.5 text-[14px] tabular-nums text-fg">{s.v}</dd>
            </div>
          ))}
        </dl>
      </div>

      <TradeChart onScrub={onScrub} />
    </Card>
  );
}
