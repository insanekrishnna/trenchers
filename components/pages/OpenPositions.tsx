"use client";

import { ArrowSquareOutIcon, ChartLineUpIcon, CopyIcon } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { bot, fmtSol, formatHold } from "@/lib/data";
import { openDetail, pathSamples } from "@/lib/pageData";
import { Card, LiveDot, TokenIcon } from "@/components/ui/primitives";
import { Field, GhostButton, Page, Pills, SolidButton, Tabs } from "./kit";

type Filter = "all" | "win" | "loss" | "attention";

/** Market caps to two decimals here, so nearby levels (entry, ATH, now) stay distinct. */
const fmtMc = (v: number) => (v >= 1000 ? `$${(v / 1000).toFixed(2)}k` : `$${v.toFixed(0)}`);

export function OpenPositions() {
  const [filter, setFilter] = useState<Filter>("all");
  const o = openDetail;
  const win = o.unreal >= 0;
  const show = filter === "all" || (filter === "win" && win) || (filter === "loss" && !win);

  return (
    <Page>
      <div className="flex flex-wrap items-center justify-between gap-3">
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
        <span className="text-[12.5px] tabular-nums text-subtle">
          {o.entry.toFixed(4)} SOL at risk · {fmtSol(o.unreal)} SOL open P&amp;L
        </span>
      </div>

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
  const [tab, setTab] = useState<"position" | "execution">("position");
  const win = o.unreal >= 0;
  const tierTarget = 1.4;
  const toTier = Math.min(1, (o.multiple - 1) / (tierTarget - 1));

  return (
    <Card className="overflow-hidden">
      {/* header */}
      <div className="flex flex-wrap items-center gap-4 border-b border-line px-5 py-4">
        <TokenIcon symbol={o.symbol} hue={o.hue} size={42} badge />
        <div className="ml-1 min-w-0 flex-1">
          <p className="flex items-center gap-2">
            <span className="text-[15px] font-medium">{o.symbol}</span>
            <button className="icon-btn size-6" aria-label="Copy token address" title="Copy address">
              <CopyIcon className="size-3.5" />
            </button>
            <span className="text-[12.5px] text-subtle">{o.name}</span>
          </p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-[12px] tabular-nums text-muted">
            <span>MC {fmtMc(o.mcNow)}</span>
            <span className="text-subtle">·</span>
            <span>
              ATH {fmtMc(o.ath)} {o.atAth && <span className="text-green">· at ATH</span>}
            </span>
            <span className="text-subtle">·</span>
            <span className="flex items-center gap-1.5">
              <LiveDot size={5} /> {formatHold(o.heldSec)}
            </span>
          </p>
        </div>
        <GhostButton>Sell all</GhostButton>
      </div>

      <div className="grid lg:grid-cols-12">
        {/* chart */}
        <div className="border-b border-line p-5 lg:col-span-8 lg:border-b-0 lg:border-r">
          <div className="mb-3 flex items-center justify-between text-[12px]">
            <span className="text-muted">Market cap since entry</span>
            <span className="flex items-center gap-4 text-subtle">
              <span className="flex items-center gap-1.5">
                <span className="h-px w-3 border-t border-dashed border-white/40" /> entry
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-px w-3 border-t border-dashed border-accent" /> ATH
              </span>
            </span>
          </div>
          <MiniCandles />
        </div>

        {/* position */}
        <div className="flex flex-col lg:col-span-4">
          <div className="px-5 pt-4">
            <Tabs
              value={tab}
              onChange={setTab}
              tabs={[
                { key: "position", label: "Open position" },
                { key: "execution", label: "Execution" },
              ]}
            />
          </div>

          {tab === "position" ? (
            <div className="flex flex-1 flex-col px-5 py-4">
              <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                <Field label="In trade">{formatHold(o.heldSec)}</Field>
                <Field label="Now">
                  <span className="text-green">{o.multiple.toFixed(2)}×</span>
                </Field>
                <Field label="Entry">
                  {o.entry.toFixed(4)} SOL
                  <p className="text-[11.5px] text-subtle">
                    ${(o.entry * bot.solUsd).toFixed(2)} · MC {fmtMc(o.mc)}
                  </p>
                </Field>
                <Field label="Unrealized P&L">
                  <span className={win ? "text-green" : "text-red"}>{fmtSol(o.unreal)}</span>
                  <p className="text-[11.5px] text-subtle">
                    ${(o.unreal * bot.solUsd).toFixed(2)} · {o.unrealPct > 0 ? "+" : ""}
                    {o.unrealPct.toFixed(0)}%
                  </p>
                </Field>
              </div>

              <div className="mt-5 border-t border-line pt-4">
                <div className="flex items-baseline justify-between text-[12px]">
                  <span className="text-subtle">Waiting on</span>
                  <span className="rounded-full border border-line px-2 py-px text-[11px] text-subtle">cfg v2</span>
                </div>
                <p className="mt-1 text-[13.5px]">{o.nextTier}</p>
                <div className="mt-2.5 flex items-center gap-2.5">
                  <span className="relative h-[3px] flex-1 rounded-full bg-white/[.07]">
                    <span className="absolute inset-y-0 left-0 rounded-full bg-green" style={{ width: `${toTier * 100}%` }} />
                  </span>
                  <span className="text-[11.5px] tabular-nums text-subtle">{Math.round(toTier * 100)}%</span>
                </div>
              </div>

              <div className="mt-auto flex gap-2 pt-5">
                <GhostButton className="flex-1 justify-center">
                  <ChartLineUpIcon className="size-3.5" /> Chart
                </GhostButton>
                <SolidButton className="flex-1 justify-center">Sell</SolidButton>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-line px-5 py-2 text-[13px]">
              {[
                ["Buy fill", `${o.entry.toFixed(4)} SOL @ MC ${fmtMc(o.mc)}`],
                ["Slippage", "0.4%"],
                ["Priority fee", "0.0002 SOL"],
                ["Route", "Pump.fun bonding curve"],
                ["Landed in", "1 block · 412 ms"],
              ].map(([k, v]) => (
                <li key={k} className="flex items-baseline justify-between gap-4 py-2.5">
                  <span className="text-subtle">{k}</span>
                  <span className="text-right tabular-nums text-fg">{v}</span>
                </li>
              ))}
              <li className="py-2.5">
                <a href="#" className="btn-link">
                  View on Solscan <ArrowSquareOutIcon className="size-3.5" />
                </a>
              </li>
            </ul>
          )}
        </div>
      </div>
    </Card>
  );
}

/* A small, thin candle chart of the position's market cap since entry. */
function MiniCandles() {
  const o = openDetail;
  const W = 760;
  const H = 230;
  const PAD = { l: 4, r: 58, t: 10, b: 18 };

  const candles = useMemo(() => {
    // the position's path sets the trend; a seeded wobble adds the minute-to-minute trading
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const s = pathSamples(o.id, 61).map((m, i, all) => m * o.mc * (i === all.length - 1 ? 1 : 1 + (rnd() - 0.5) * 0.05));
    const out: { o: number; h: number; l: number; c: number }[] = [];
    for (let i = 0; i < 60; i += 2) {
      const seg = s.slice(i, i + 3);
      const hi = Math.max(...seg);
      const lo = Math.min(...seg);
      out.push({ o: seg[0], c: seg[seg.length - 1], h: hi * (1 + rnd() * 0.02), l: lo * (1 - rnd() * 0.02) });
    }
    return out;
  }, [o.id, o.mc]);

  const lo = Math.min(...candles.map((c) => c.l), o.mc) * 0.97;
  const hi = Math.max(...candles.map((c) => c.h), o.ath) * 1.03;
  const y = (v: number) => PAD.t + (1 - (v - lo) / (hi - lo)) * (H - PAD.t - PAD.b);
  const step = (W - PAD.l - PAD.r) / candles.length;
  const last = candles[candles.length - 1];
  // two quiet gridlines; the top of the chart is labelled by the live price tag
  const ticks = [lo + (hi - lo) * 0.15, lo + (hi - lo) * 0.5];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-[230px] w-full" preserveAspectRatio="none">
      {ticks.map((t) => (
        <g key={t}>
          <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} stroke="rgba(203,208,235,.05)" />
          <text x={W - PAD.r + 8} y={y(t) + 3} className="fill-subtle text-[10px] tabular-nums">
            {fmtMc(t)}
          </text>
        </g>
      ))}
      <line x1={PAD.l} x2={W - PAD.r} y1={y(o.mc)} y2={y(o.mc)} stroke="rgba(247,247,247,.35)" strokeDasharray="3 4" />
      <line x1={PAD.l} x2={W - PAD.r} y1={y(o.ath)} y2={y(o.ath)} stroke="#84ff01" strokeOpacity=".6" strokeDasharray="3 4" />
      {candles.map((c, i) => {
        const x = PAD.l + i * step + step / 2;
        const up = c.c >= c.o;
        const col = up ? "#21c95e" : "#ff622e";
        const top = y(Math.max(c.o, c.c));
        const bh = Math.max(1, Math.abs(y(c.o) - y(c.c)));
        return (
          <g key={i}>
            <line x1={x} x2={x} y1={y(c.h)} y2={y(c.l)} stroke={col} strokeWidth="1" />
            <rect x={x - 2.5} y={top} width="5" height={bh} rx="1" fill={col} />
          </g>
        );
      })}
      {/* current price tag */}
      <rect x={W - PAD.r + 2} y={y(last.c) - 8} width={PAD.r - 4} height={16} rx={4} fill="#f7f7f7" />
      <text x={W - PAD.r + 8} y={y(last.c) + 3.5} className="fill-bg text-[10px] font-medium tabular-nums">
        {fmtMc(last.c)}
      </text>
    </svg>
  );
}
