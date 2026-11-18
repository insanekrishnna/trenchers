"use client";

import { ArrowSquareOutIcon, CaretDownIcon, ChartLineUpIcon, CopyIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { bot, fmtSol, formatHold } from "@/lib/data";
import { openDetail, pathSamples } from "@/lib/pageData";
import { Card, LiveDot, TokenIcon } from "@/components/ui/primitives";
import { GhostButton, Page, Pills, SolidButton } from "./kit";

type Filter = "all" | "win" | "loss" | "attention";

/** Market caps to two decimals here, so nearby levels (entry, ATH, now) stay distinct. */
const fmtMc = (v: number) => (v >= 1000 ? `$${(v / 1000).toFixed(2)}k` : `$${v.toFixed(0)}`);

export function OpenPositions() {
  const [filter, setFilter] = useState<Filter>("all");
  const o = openDetail;
  const win = o.unreal >= 0;
  const show = filter === "all" || (filter === "win" && win) || (filter === "loss" && !win);

  return (
    <Page width="narrow">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-medium tracking-tight">Open positions</h1>
          <p className="mt-1 flex items-center gap-2 text-[13px] text-subtle">
            <LiveDot size={6} /> 1 live · {o.entry.toFixed(4)} SOL at risk
          </p>
        </div>
        <GhostButton>Sell all</GhostButton>
      </div>

      <Pills<Filter>
        value={filter}
        onChange={setFilter}
        options={[
          { key: "all", label: "All", count: 1 },
          { key: "win", label: "Winners", count: win ? 1 : 0 },
          { key: "loss", label: "Losers", count: win ? 0 : 1 },
          { key: "attention", label: "Needs attention", count: 0 },
        ]}
      />

      {show ? (
        <PositionCard />
      ) : (
        <Card className="px-5 py-10 text-center text-[13px] text-subtle">
          {filter === "attention" ? "Nothing needs attention — every position is inside its rules." : "No positions match this filter."}
        </Card>
      )}
    </Page>
  );
}

function PositionCard() {
  const o = openDetail;
  const [exec, setExec] = useState(false);
  const win = o.unreal >= 0;
  const tierTarget = 1.4;
  const toTier = Math.min(1, (o.multiple - 1) / (tierTarget - 1));

  return (
    <Card className="overflow-hidden">
      {/* header: who it is, and what it's worth right now */}
      <div className="flex items-center gap-4 px-5 pb-3 pt-4">
        <TokenIcon symbol={o.symbol} hue={o.hue} size={40} badge />
        <div className="ml-1 min-w-0 flex-1">
          <p className="flex items-center gap-2">
            <span className="text-[15px] font-medium">{o.symbol}</span>
            <button className="icon-btn size-6" aria-label="Copy token address" title="Copy address">
              <CopyIcon className="size-3.5" />
            </button>
            <span className="truncate text-[12.5px] text-subtle">{o.name}</span>
          </p>
          <p className="mt-0.5 text-[12px] tabular-nums text-subtle">
            MC <span className="text-muted">{fmtMc(o.mcNow)}</span> · ATH <span className="text-muted">{fmtMc(o.ath)}</span>
            {o.atAth && <span className="text-green"> · at ATH</span>}
          </p>
        </div>
        <div className="text-right">
          <p className={`text-[22px] font-light leading-none tabular-nums tracking-tight ${win ? "text-green" : "text-red"}`}>{fmtSol(o.unreal)}</p>
          <p className="mt-1 text-[12px] tabular-nums text-subtle">
            {o.unrealPct > 0 ? "+" : ""}
            {o.unrealPct.toFixed(0)}% · ${(o.unreal * bot.solUsd).toFixed(2)}
          </p>
        </div>
      </div>

      <div className="px-5 pb-1">
        <MiniCandles />
      </div>

      {/* the four numbers that matter */}
      <dl className="grid grid-cols-2 gap-px border-y border-line bg-line sm:grid-cols-4">
        <Cell label="In trade" value={formatHold(o.heldSec)} sub="since 15:55" />
        <Cell label="Entry" value={`${o.entry.toFixed(4)}`} sub={`$${(o.entry * bot.solUsd).toFixed(2)} · MC ${fmtMc(o.mc)}`} />
        <Cell label="Now" value={<span className="text-green">{o.multiple.toFixed(2)}×</span>} sub={`${o.value.toFixed(4)} SOL`} />
        <div className="bg-bg-2 px-4 py-3">
          <dt className="text-[11.5px] text-subtle">Next exit</dt>
          <dd className="mt-0.5 text-[13.5px] tabular-nums">TP tier 1 · {tierTarget.toFixed(2)}×</dd>
          <dd className="mt-2 flex items-center gap-2">
            <span className="relative h-[2px] flex-1 rounded-full bg-white/[.08]">
              <motion.span
                className="absolute inset-y-0 left-0 rounded-full bg-green"
                initial={{ width: 0 }}
                animate={{ width: `${toTier * 100}%` }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              />
            </span>
            <span className="text-[11px] tabular-nums text-subtle">{Math.round(toTier * 100)}%</span>
          </dd>
        </div>
      </dl>

      {/* footer */}
      <div className="flex items-center justify-between gap-3 px-5 py-3">
        <button onClick={() => setExec((e) => !e)} aria-expanded={exec} className="btn-link">
          Execution <span className="rounded-full border border-line px-1.5 text-[10.5px] text-subtle">cfg v2</span>
          <CaretDownIcon className={`size-3 transition-transform ${exec ? "rotate-180" : ""}`} />
        </button>
        <div className="flex gap-2">
          <GhostButton>
            <ChartLineUpIcon className="size-3.5" /> Chart
          </GhostButton>
          <SolidButton>Sell</SolidButton>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {exec && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="divide-y divide-line overflow-hidden border-t border-line px-5 text-[12.5px]"
          >
            {[
              ["Buy fill", `${o.entry.toFixed(4)} SOL @ MC ${fmtMc(o.mc)}`],
              ["Slippage", "0.4%"],
              ["Priority fee", "0.0002 SOL"],
              ["Route", "Pump.fun bonding curve"],
              ["Landed in", "1 block · 412 ms"],
            ].map(([k, v]) => (
              <li key={k} className="flex items-baseline justify-between gap-4 py-2.5">
                <span className="text-subtle">{k}</span>
                <span className="text-right tabular-nums">{v}</span>
              </li>
            ))}
            <li className="py-2.5">
              <a href="#" className="btn-link">
                View on Solscan <ArrowSquareOutIcon className="size-3.5" />
              </a>
            </li>
          </motion.ul>
        )}
      </AnimatePresence>
    </Card>
  );
}

function Cell({ label, value, sub }: { label: string; value: React.ReactNode; sub: string }) {
  return (
    <div className="bg-bg-2 px-4 py-3">
      <dt className="text-[11.5px] text-subtle">{label}</dt>
      <dd className="mt-0.5 text-[13.5px] tabular-nums">{value}</dd>
      <dd className="text-[11.5px] tabular-nums text-subtle">{sub}</dd>
    </div>
  );
}

/* A short, thin candle chart of the position's market cap since entry. */
function MiniCandles() {
  const o = openDetail;
  const W = 760;
  const H = 150;
  const PAD = { l: 2, r: 58, t: 10, b: 8 };

  const candles = useMemo(() => {
    // the position's path sets the trend; a seeded wobble adds the minute-to-minute trading
    let seed = 7;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const s = pathSamples(o.id, 61).map((m, i, all) => m * o.mc * (i === all.length - 1 ? 1 : 1 + (rnd() - 0.5) * 0.05));
    const out: { o: number; h: number; l: number; c: number }[] = [];
    for (let i = 0; i < 60; i += 2) {
      const seg = s.slice(i, i + 3);
      out.push({ o: seg[0], c: seg[seg.length - 1], h: Math.max(...seg) * (1 + rnd() * 0.02), l: Math.min(...seg) * (1 - rnd() * 0.02) });
    }
    return out;
  }, [o.id, o.mc]);

  const lo = Math.min(...candles.map((c) => c.l), o.mc) * 0.97;
  const hi = Math.max(...candles.map((c) => c.h), o.ath) * 1.03;
  const y = (v: number) => Math.round((PAD.t + (1 - (v - lo) / (hi - lo)) * (H - PAD.t - PAD.b)) * 100) / 100;
  const step = (W - PAD.l - PAD.r) / candles.length;
  const last = candles[candles.length - 1];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-[150px] w-full" preserveAspectRatio="none" aria-label="Market cap since entry">
      <line x1={PAD.l} x2={W - PAD.r} y1={y(o.mc)} y2={y(o.mc)} stroke="rgba(247,247,247,.3)" strokeDasharray="3 4" vectorEffect="non-scaling-stroke" />
      <text x={W - PAD.r + 8} y={y(o.mc) + 3} className="fill-subtle text-[10px] tabular-nums">
        entry
      </text>
      <line x1={PAD.l} x2={W - PAD.r} y1={y(o.ath)} y2={y(o.ath)} stroke="#84ff01" strokeOpacity=".5" strokeDasharray="3 4" vectorEffect="non-scaling-stroke" />
      {candles.map((c, i) => {
        const x = Math.round((PAD.l + i * step + step / 2) * 100) / 100;
        const col = c.c >= c.o ? "#21c95e" : "#ff622e";
        const top = y(Math.max(c.o, c.c));
        const bh = Math.max(1, Math.abs(y(c.o) - y(c.c)));
        return (
          <g key={i}>
            <line x1={x} x2={x} y1={y(c.h)} y2={y(c.l)} stroke={col} strokeWidth="1" vectorEffect="non-scaling-stroke" />
            <rect x={x - 2.5} y={top} width="5" height={bh} rx="1" fill={col} />
          </g>
        );
      })}
      <rect x={W - PAD.r + 2} y={y(last.c) - 8} width={PAD.r - 4} height={16} rx={4} fill="#f7f7f7" />
      <text x={W - PAD.r + 8} y={y(last.c) + 3.5} className="fill-bg text-[10px] font-medium tabular-nums">
        {fmtMc(last.c)}
      </text>
    </svg>
  );
}
