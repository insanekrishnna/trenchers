"use client";

import { motion } from "motion/react";
import { ArrowRight, Pencil } from "lucide-react";
import { blockers, closedTrades, config, exitReasons, fmtSol, formatHold, openTrades } from "@/lib/data";
import { Card, Sol } from "@/components/ui/primitives";

const EASE = [0.22, 1, 0.36, 1] as const;

export { WinLoss } from "./WinLoss";

/* Shared header for the strategy cards: title left, quiet meta right. */
function Head({ title, meta }: { title: string; meta: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between">
      <h3 className="text-[14px] font-medium">{title}</h3>
      <span className="text-[12px] text-subtle">{meta}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Exit reasons — one thin stacked line + legend                      */
/* ------------------------------------------------------------------ */

const REASON_COLOR = {
  take_profit: "#21c95e",
  stale_exit: "#7cc4ff",
  stop_loss: "#ff622e",
} as const;

export function ExitReasons() {
  const total = exitReasons.reduce((s, r) => s + r.count, 0);
  const green = exitReasons.filter((r) => r.pnl > 0).reduce((s, r) => s + r.count, 0);
  const sl = exitReasons.find((r) => r.key === "stop_loss")!;
  return (
    <Card data-tour="exits" className="flex flex-col px-5 py-4">
      <Head title="Exit reasons" meta={`${total} exits`} />

      <div className="mt-4 flex h-[3px] gap-[3px]">
        {exitReasons.map((r, i) => (
          <motion.span
            key={r.key}
            className="h-full rounded-full"
            style={{ background: REASON_COLOR[r.key], width: `${(r.count / total) * 100}%`, transformOrigin: "left" }}
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: i * 0.12, ease: EASE }}
          />
        ))}
      </div>

      <ul className="mt-4 space-y-2.5">
        {exitReasons.map((r) => (
          <li key={r.key} className="flex items-center gap-2.5 text-[13px]">
            <span className="size-1.5 rounded-full" style={{ background: REASON_COLOR[r.key] }} />
            <span className="flex-1 text-muted">{r.label}</span>
            <span className="tabular-nums text-subtle">×{r.count}</span>
            <span className={`w-16 text-right tabular-nums ${r.pnl >= 0 ? "text-fg" : "text-red"}`}>{fmtSol(r.pnl)}</span>
          </li>
        ))}
      </ul>

      {/* how long each kind of exit took */}
      <div className="mt-4 border-t border-line pt-3.5">
        <p className="text-[11.5px] text-subtle">Average hold</p>
        <div className="mt-2 grid grid-cols-3 gap-3">
          {exitReasons.map((r) => {
            const ts = closedTrades.filter((t) => t.reason === r.key);
            const avg = ts.length ? Math.round(ts.reduce((s, t) => s + t.holdSec, 0) / ts.length) : 0;
            return (
              <div key={r.key}>
                <p className="text-[14px] font-light tabular-nums">{avg ? formatHold(avg) : "—"}</p>
                <div className="mt-1.5 h-[2px] rounded-full" style={{ background: REASON_COLOR[r.key], opacity: 0.7 }} />
                <p className="mt-1.5 text-[11.5px] text-subtle">{r.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      <p className="mt-auto pt-4 text-[12px] leading-relaxed text-subtle">
        {green} of {total} exits closed green. Stop-losses cost {fmtSol(sl.pnl)} SOL.
      </p>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Top blockers — thin lines, one colour                              */
/* ------------------------------------------------------------------ */

export function TopBlockers() {
  const entered = closedTrades.length + openTrades.length;
  return (
    <Card data-tour="blockers" className="flex flex-col px-5 py-4">
      <Head title="Top blockers" meta={`${blockers.checks.toLocaleString()} checks · 24h`} />

      <div className="mt-4 space-y-3.5">
        {blockers.rows.map((b, i) => (
          <div key={b.label} className="group" title={b.hint}>
            <div className="flex items-baseline justify-between text-[13px]">
              <span className="text-muted transition-colors group-hover:text-fg">{b.label}</span>
              <span className="tabular-nums">
                <span className="text-fg">{b.pct}%</span>
                <span className="text-subtle"> · {b.fails}</span>
              </span>
            </div>
            <div className="mt-2 h-[3px] rounded-full bg-white/[.06]">
              <motion.div
                className="h-full rounded-full bg-warn"
                style={{ width: `${b.pct}%`, transformOrigin: "left" }}
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: i * 0.1, ease: EASE }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* the bottom of the funnel: what actually got through */}
      <div className="mt-4 border-t border-line pt-3.5">
        <div className="flex items-baseline justify-between text-[13px]">
          <span className="text-muted">Passed all {config.gates} gates</span>
          <span className="tabular-nums">
            <span className="text-fg">{entered}</span>
            <span className="text-subtle"> of {blockers.checks.toLocaleString()}</span>
          </span>
        </div>
        <div className="mt-2 flex h-[3px] items-center gap-[3px]">
          <span className="h-full rounded-full bg-accent" style={{ width: `${Math.max(1.5, (entered / blockers.checks) * 100)}%` }} />
          <span className="h-full flex-1 rounded-full bg-white/[.06]" />
        </div>
        <p className="mt-1.5 text-[11.5px] text-subtle">{((entered / blockers.checks) * 100).toFixed(2)}% became trades</p>
      </div>

      <div className="mt-auto flex items-center justify-between pt-4">
        <span className="text-[12px] text-subtle">% of rejections, by gate</span>
        <button className="btn-link">
          Tune <ArrowRight className="size-3.5" />
        </button>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Configuration                                                      */
/* ------------------------------------------------------------------ */

export function ConfigSummary() {
  const items = [
    { k: "Per trade", v: <span className="flex items-center gap-1">{config.perTrade.toFixed(3)} <Sol className="size-3" /></span> },
    { k: "Max open", v: config.maxOpen },
    { k: "Stop loss", v: config.stopLoss },
    { k: "Stale exit", v: config.staleAfter },
    { k: "Overrides", v: config.overrides },
    { k: "Active gates", v: config.gates },
  ];
  return (
    // One slim strip: the rules that drive everything in the funnel below.
    <Card data-tour="config" className="flex flex-col gap-3 px-5 py-3.5 lg:flex-row lg:items-center lg:gap-8">
      <div className="shrink-0">
        <h3 className="text-[14px] font-medium">Strategy rules</h3>
        <p className="text-[12px] text-subtle">config v2 · edited today</p>
      </div>
      <dl className="grid flex-1 grid-cols-3 gap-y-3 sm:grid-cols-6 sm:divide-x sm:divide-line">
        {items.map((i) => (
          <div key={i.k} className="sm:px-5 sm:first:pl-0">
            <dt className="text-[11.5px] text-subtle">{i.k}</dt>
            <dd className="mt-0.5 text-[14px] font-light tabular-nums">{i.v}</dd>
          </div>
        ))}
      </dl>
      <button className="flex h-8 shrink-0 items-center gap-1.5 self-start rounded-full border border-line px-3 text-[12.5px] text-muted transition-colors hover:border-white/20 hover:text-fg lg:self-center">
        <Pencil className="size-3.5" /> Edit rules
      </button>
    </Card>
  );
}
