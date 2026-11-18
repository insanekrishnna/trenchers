"use client";

import { BroadcastIcon, GearSixIcon, HourglassMediumIcon, type Icon, TargetIcon, WarningIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { fmtSol, fmtTime, formatHold, pnl, reasonLabel } from "@/lib/data";
import { buildBars, clock } from "@/lib/chartData";
import { type AiEvent, aiEvents } from "@/lib/pageData";
import { Card, TokenIcon } from "@/components/ui/primitives";
import { Page, Pills, Switch } from "./kit";

type Filter = "all" | "trades" | "config" | "tuning";

const EVENT_LOOK: Record<string, { icon: Icon; color: string }> = {
  buy: { icon: BroadcastIcon, color: "#84ff01" },
  take_profit: { icon: TargetIcon, color: "#21c95e" },
  stale_exit: { icon: HourglassMediumIcon, color: "#7cc4ff" },
  stop_loss: { icon: WarningIcon, color: "#ff622e" },
  config: { icon: GearSixIcon, color: "#9899a3" },
};

export function AiOptimizations() {
  const [filter, setFilter] = useState<Filter>("all");
  const [on, setOn] = useState(false);

  const trades = aiEvents.filter((e) => e.kind !== "config");
  const configs = aiEvents.filter((e) => e.kind === "config");
  const shown = filter === "all" ? aiEvents : filter === "trades" ? trades : filter === "config" ? configs : [];
  const total = pnl.gross + pnl.unrealized;

  return (
    <Page>
      <div className="grid gap-5 xl:grid-cols-12">
        {/* activity */}
        <section className="min-w-0 xl:col-span-8">
          <Pills<Filter>
            value={filter}
            onChange={setFilter}
            options={[
              { key: "all", label: "All", count: aiEvents.length },
              { key: "trades", label: "Trades", count: trades.length },
              { key: "config", label: "Config", count: configs.length },
              { key: "tuning", label: "Tuning", count: 0 },
            ]}
          />

          <Card className="mt-4 overflow-hidden">
            <div className="flex items-baseline justify-between border-b border-line px-5 py-3">
              <span className="text-[12.5px] text-muted">Today</span>
              <span className="text-[12.5px] tabular-nums">
                <span className="text-subtle">{trades.length} trades · </span>
                <span className={total >= 0 ? "text-green" : "text-red"}>{fmtSol(total)} SOL</span>
              </span>
            </div>

            {shown.length === 0 ? (
              <p className="px-5 py-10 text-center text-[13px] text-subtle">No tuning runs yet. Turn AI optimizations on to start the first review.</p>
            ) : (
              <ol className="relative">
                <span className="absolute bottom-6 left-[86px] top-6 hidden w-px bg-line sm:block" aria-hidden />
                <AnimatePresence initial={false}>
                  {shown.map((e) => (
                    <motion.li
                      key={`${e.kind}-${e.at}`}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="group relative flex items-center gap-3 px-4 py-3.5 sm:gap-4 sm:px-5 transition-colors hover:bg-white/[.025]"
                    >
                      <EventRow e={e} />
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ol>
            )}
          </Card>
        </section>

        {/* status */}
        <aside className="space-y-4 xl:col-span-4">
          <Card className="flex items-center justify-between px-5 py-3.5">
            <span className="flex items-center gap-2.5 text-[13.5px]">
              <span className={`size-1.5 rounded-full ${on ? "bg-accent" : "bg-subtle"}`} />
              {on ? "On — reviewing every 10 trades" : "Off"}
            </span>
            <Switch checked={on} onChange={setOn} label="AI optimizations" />
          </Card>

          <Card className="px-5 py-4">
            <p className="text-[12px] text-muted">Progress</p>
            <p className="mt-1 flex items-baseline gap-2">
              <span className="text-[26px] font-light tabular-nums tracking-tight text-green">{fmtSol(pnl.net)}</span>
              <span className="text-[12px] text-muted">SOL</span>
            </p>
            <p className="text-[12px] text-subtle">From recent trades</p>
            <EquityLine />
          </Card>

          <Card className="flex items-center justify-between px-5 py-3.5 text-[13px]">
            <span className="text-subtle">Last run</span>
            <span>{on ? "Queued — after the next trade" : "Awaiting first review"}</span>
          </Card>

          <div>
            <p className="mb-2 px-1 text-[12px] text-subtle">Config changes</p>
            <Card className="px-5 py-5 text-center text-[13px] text-muted">No settings have changed since AI optimizations started.</Card>
          </div>
        </aside>
      </div>
    </Page>
  );
}

function EventRow({ e }: { e: AiEvent }) {
  const look = EVENT_LOOK[e.kind === "sell" ? e.reason : e.kind];
  const I = look.icon;
  return (
    <>
      <span className="w-10 shrink-0 text-[12px] tabular-nums text-subtle">{fmtTime(e.at)}</span>
      <span className="relative z-10 hidden size-7 shrink-0 place-items-center rounded-full bg-bg-2 sm:grid">
        <I className="size-4" style={{ color: look.color }} weight={e.kind === "buy" ? "bold" : "regular"} />
      </span>

      {e.kind === "config" ? (
        <div className="min-w-0 flex-1">
          <p className="text-[13.5px]">{e.title}</p>
          <p className="text-[12px] text-subtle">{e.detail}</p>
        </div>
      ) : (
        <>
          <TokenIcon symbol={e.symbol} hue={e.hue} size={32} badge />
          <div className="ml-1 min-w-0 flex-1">
            <p className="flex items-center gap-2 text-[13.5px]">
              Bought <span className="font-medium">{e.symbol}</span>
              {e.kind === "buy" && <span className="rounded-full border border-accent/40 px-1.5 text-[11px] leading-[16px] text-accent">open</span>}
            </p>
            <p className="text-[12px] text-subtle">
              {e.kind === "buy" ? (
                <>
                  Entry at <span className="tabular-nums text-muted">{e.entry.toFixed(4)}</span> SOL · v2
                </>
              ) : (
                <>
                  Sold by <span className="text-muted">{reasonLabel(e.reason).toLowerCase()}</span>, held for{" "}
                  <span className="text-muted">{formatHold(e.holdSec)}</span>
                </>
              )}
            </p>
          </div>
          <span className={`text-[13px] tabular-nums ${e.kind === "buy" ? "text-muted" : e.pnl >= 0 ? "text-green" : "text-red"}`}>
            {e.kind === "buy" ? `${e.entry.toFixed(4)}` : fmtSol(e.pnl)}
          </span>
        </>
      )}
    </>
  );
}

/* the bot's equity as a thin stepped line, like the dashboard chart */
function EquityLine() {
  const bars = useMemo(() => buildBars(15), []);
  const W = 320;
  const H = 120;
  const vals = bars.map((b) => b.close);
  const lo = Math.min(...vals);
  const hi = Math.max(...vals);
  const x = (i: number) => (i / (bars.length - 1)) * W;
  const y = (v: number) => 8 + (1 - (v - lo) / (hi - lo || 1)) * (H - 16);
  let d = `M0,${y(vals[0])}`;
  for (let i = 1; i < vals.length; i++) d += ` H${x(i).toFixed(1)} V${y(vals[i]).toFixed(1)}`;
  const ticks = [0, Math.floor(bars.length / 2), bars.length - 1];
  return (
    <div className="mt-4">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-[120px] w-full overflow-visible" preserveAspectRatio="none">
        <line x1="0" x2={W} y1={y(1)} y2={y(1)} stroke="rgba(247,247,247,.18)" strokeDasharray="3 4" vectorEffect="non-scaling-stroke" />
        <path d={d} fill="none" stroke="#f7f7f7" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
        <circle cx={W} cy={y(vals[vals.length - 1])} r="3" fill="#84ff01" />
      </svg>
      <div className="mt-2 flex justify-between text-[11px] tabular-nums text-subtle">
        {ticks.map((i) => (
          <span key={i}>{clock(bars[i].time)}</span>
        ))}
      </div>
    </div>
  );
}
