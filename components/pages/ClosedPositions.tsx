"use client";

import { ArrowSquareOutIcon, CaretDownIcon, ChartLineUpIcon, CopyIcon, FunnelSimpleIcon, LightbulbIcon, ListChecksIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { fmtPct, fmtSol, fmtTime, formatHold, pnl, reasonLabel } from "@/lib/data";
import { closedDetails, type ClosedDetail, pathSamples } from "@/lib/pageData";
import { Card, TokenIcon } from "@/components/ui/primitives";
import { ClosedPositions as ClosedTable } from "@/components/dashboard/Positions";
import { GhostButton, Page, Pills, Tabs } from "./kit";

type Filter = "all" | "win" | "loss";
type View = "cards" | "table";
type Sort = "newest" | "best" | "worst";

const SORTS: { key: Sort; label: string }[] = [
  { key: "newest", label: "Newest closed" },
  { key: "best", label: "Biggest win" },
  { key: "worst", label: "Biggest loss" },
];

const REASON_COLOR = { take_profit: "#21c95e", stale_exit: "#7cc4ff", stop_loss: "#ff622e" } as const;
const fmtMc = (v: number) => (v >= 1000 ? `$${(v / 1000).toFixed(2)}k` : `$${v.toFixed(0)}`);
const ago = (m: number) => (m < 60 ? `${m}m ago` : `${Math.floor(m / 60)}h ${m % 60}m ago`);

export function ClosedPositions() {
  const [filter, setFilter] = useState<Filter>("all");
  const [view, setView] = useState<View>("cards");
  const [sort, setSort] = useState<Sort>("newest");
  const [open, setOpen] = useState<string | null>(closedDetails[0]?.id ?? null);

  const rows = useMemo(() => {
    const xs = closedDetails.filter((t) => (filter === "all" ? true : filter === "win" ? t.pnl > 0 : t.pnl <= 0));
    if (sort === "best") return [...xs].sort((a, b) => b.pnl - a.pnl);
    if (sort === "worst") return [...xs].sort((a, b) => a.pnl - b.pnl);
    return xs;
  }, [filter, sort]);

  const walletTotal = rows.reduce((s, t) => s + t.inWallet, 0);

  return (
    <Page width="narrow">
      {/* header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-medium tracking-tight">Closed positions</h1>
          <p className="mt-1 text-[13px] text-subtle">Execution history · includes failed buys</p>
        </div>
        <dl className="flex divide-x divide-line text-right">
          {[
            { k: "Closed, after fees", v: fmtSol(walletTotal), tone: walletTotal >= 0 ? "text-green" : "text-red" },
            { k: "Win rate", v: `${pnl.winRate.toFixed(0)}%`, tone: "text-fg" },
            { k: "Avg hold", v: formatHold(pnl.avgHoldSec), tone: "text-fg" },
          ].map((s) => (
            <div key={s.k} className="px-4 last:pr-0">
              <dt className="text-[11.5px] text-subtle">{s.k}</dt>
              <dd className={`mt-0.5 text-[15px] font-light tabular-nums ${s.tone}`}>{s.v}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Pills<Filter>
          value={filter}
          onChange={setFilter}
          options={[
            { key: "all", label: "All", count: pnl.roundTrips },
            { key: "win", label: "Winners", count: pnl.wins },
            { key: "loss", label: "Losers", count: pnl.losses },
          ]}
        />
        <div className="flex flex-wrap items-center gap-2">
          <Pills<View>
            value={view}
            onChange={setView}
            options={[
              { key: "cards", label: "Cards" },
              { key: "table", label: "Table" },
            ]}
          />
          <GhostButton>
            <FunnelSimpleIcon className="size-3.5" /> Filters
          </GhostButton>
          <SortMenu value={sort} onChange={setSort} />
        </div>
      </div>

      {view === "table" ? (
        <ClosedTable />
      ) : (
        <Card className="overflow-hidden">
          <div className="flex items-baseline justify-between border-b border-line px-5 py-2.5 text-[12px]">
            <span className="text-muted">Today</span>
            <span className="tabular-nums text-subtle">{rows.length} round-trips</span>
          </div>
          <ul className="divide-y divide-line">
            <AnimatePresence initial={false}>
              {rows.map((t) => (
                <motion.li key={t.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <TradeRow t={t} open={open === t.id} onToggle={() => setOpen((o) => (o === t.id ? null : t.id))} />
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </Card>
      )}
    </Page>
  );
}

function SortMenu({ value, onChange }: { value: Sort; onChange: (s: Sort) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        className="flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-line px-3 text-[12.5px] text-muted transition-colors hover:border-white/20 hover:bg-white/[.04] hover:text-fg"
      >
        <span className="text-subtle">Sort</span> {SORTS.find((s) => s.key === value)!.label}
        <CaretDownIcon className={`size-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-9 z-30 min-w-[170px] rounded-lg border border-line bg-bg-3 p-1 shadow-pop">
          {SORTS.map((s) => (
            <button
              key={s.key}
              onMouseDown={() => onChange(s.key)}
              className={`block w-full rounded-md px-2.5 py-1.5 text-left text-[12.5px] transition-colors hover:bg-white/[.06] ${s.key === value ? "text-fg" : "text-muted"}`}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* one slim row; click to unfold the detail */
function TradeRow({ t, open, onToggle }: { t: ClosedDetail; open: boolean; onToggle: () => void }) {
  const win = t.pnl > 0;
  return (
    <div className={open ? "bg-white/[.015]" : ""}>
      <button
        onClick={onToggle}
        aria-expanded={open}
        className="grid w-full grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] items-center gap-4 px-5 py-3 text-left transition-colors hover:bg-white/[.03] sm:grid-cols-[minmax(0,1.3fr)_110px_minmax(0,1fr)_64px_minmax(0,1fr)_16px]"
      >
        {/* token */}
        <span className="flex min-w-0 items-center gap-3">
          <TokenIcon symbol={t.symbol} hue={t.hue} size={32} badge />
          <span className="ml-0.5 min-w-0">
            <span className="block truncate text-[13.5px]">{t.symbol}</span>
            <span className="block text-[11.5px] tabular-nums text-subtle">
              {fmtTime(t.closedAt)} · {ago(t.agoMin)}
            </span>
          </span>
        </span>
        {/* path */}
        <span className="hidden sm:block">
          <Spark id={t.id} win={win} />
        </span>
        {/* exit */}
        <span className="hidden min-w-0 items-center gap-2 text-[12.5px] text-muted sm:flex">
          <span className="size-1.5 shrink-0 rounded-full" style={{ background: REASON_COLOR[t.reason] }} />
          <span className="truncate">{reasonLabel(t.reason)}</span>
          <span className="tabular-nums text-subtle">{t.multiple}×</span>
        </span>
        {/* hold */}
        <span className="hidden text-right text-[12.5px] tabular-nums text-subtle sm:block">{formatHold(t.holdSec)}</span>
        {/* pnl */}
        <span className="text-right tabular-nums">
          <span className={`block text-[13.5px] ${win ? "text-green" : "text-red"}`}>{fmtSol(t.inWallet)}</span>
          <span className="block text-[11.5px] text-subtle">{fmtPct(t.inWalletPct, 0)} in wallet</span>
        </span>
        <CaretDownIcon className={`hidden size-3.5 text-subtle transition-transform sm:block ${open ? "rotate-180 text-fg" : ""}`} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <Detail t={t} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Detail({ t }: { t: ClosedDetail }) {
  const [tab, setTab] = useState<"summary" | "execution">("summary");
  const win = t.pnl > 0;
  const mcChange = (t.mcExit / t.mc - 1) * 100;
  const sinceExit = (t.mcNow / t.mcExit - 1) * 100;
  const cells: [string, React.ReactNode, string?][] = [
    ["Before fees", <span key="b" className={win ? "text-green" : "text-red"}>{fmtSol(t.pnl)}</span>, fmtPct(t.pct, 0)],
    ["Fees", fmtSol(-t.fees), "2 legs"],
    ["Entry → exit", `${t.entry.toFixed(4)} → ${t.exit.toFixed(4)}`, `peak ${t.peak.toFixed(2)}×`],
    ["Market cap", `${fmtMc(t.mc)} → ${fmtMc(t.mcExit)}`, fmtPct(mcChange, 0)],
    ["MC now", fmtMc(t.mcNow), `ATH ${fmtMc(t.ath)}`],
    ["Since you sold", sinceExit >= 0 ? "Kept running" : "Faded", fmtPct(sinceExit, 0)],
  ];
  return (
    <div className="px-5 pb-4">
      <div className="rounded-lg border border-line sm:ml-[44px]">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-line px-4 py-2.5">
          <span className="flex items-center gap-2 text-[12.5px]">
            <span className="text-fg">{t.name}</span>
            <button className="icon-btn size-5" aria-label="Copy token address" title="Copy address">
              <CopyIcon className="size-3" />
            </button>
            <span className="text-subtle">· v2</span>
          </span>
          <div className="w-[170px]">
            <Tabs
              value={tab}
              onChange={setTab}
              tabs={[
                { key: "summary", label: "Summary" },
                { key: "execution", label: "Execution" },
              ]}
            />
          </div>
        </div>

        {tab === "summary" ? (
          <>
            <dl className="grid grid-cols-2 gap-px bg-line sm:grid-cols-3">
              {cells.map(([k, v, sub]) => (
                <div key={k} className="bg-bg-2 px-4 py-3">
                  <dt className="text-[11.5px] text-subtle">{k}</dt>
                  <dd className="mt-0.5 text-[13.5px] tabular-nums">{v}</dd>
                  {sub && <dd className="text-[11.5px] tabular-nums text-subtle">{sub}</dd>}
                </div>
              ))}
            </dl>
            <div className="flex flex-wrap gap-x-5 gap-y-2 border-t border-line px-4 py-2.5">
              <a href="#" className="btn-link">
                <LightbulbIcon className="size-3.5" /> Why it entered
              </a>
              <a href="#" className="btn-link">
                <ListChecksIcon className="size-3.5" /> Fill details <span className="text-subtle">(2)</span>
              </a>
              <a href="#" className="btn-link">
                <ChartLineUpIcon className="size-3.5" /> Chart
              </a>
            </div>
          </>
        ) : (
          <ul className="divide-y divide-line px-4 text-[12.5px]">
            {[
              ["Buy", `${t.entry.toFixed(4)} SOL @ MC ${fmtMc(t.mc)}`, "1 block"],
              ["Sell", `${t.exit.toFixed(4)} SOL @ MC ${fmtMc(t.mcExit)}`, "2 blocks"],
            ].map(([k, v, s]) => (
              <li key={k} className="flex items-center gap-4 py-2.5">
                <span className="w-10 text-subtle">{k}</span>
                <span className="flex-1 tabular-nums">{v}</span>
                <span className="text-subtle">{s}</span>
                <a href="#" className="icon-btn size-6" aria-label="View on Solscan" title="View on Solscan">
                  <ArrowSquareOutIcon className="size-3.5" />
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* entry → exit price path */
function Spark({ id, win }: { id: string; win: boolean }) {
  const pts = pathSamples(id, 32);
  if (!pts.length) return null;
  const lo = Math.min(...pts);
  const hi = Math.max(...pts);
  const d = pts.map((v, i) => `${i ? "L" : "M"}${((i / (pts.length - 1)) * 100).toFixed(1)},${(17 - ((v - lo) / (hi - lo || 1)) * 16).toFixed(1)}`).join(" ");
  return (
    <svg viewBox="0 0 100 18" className="h-[18px] w-full" preserveAspectRatio="none" aria-hidden>
      <path d={d} fill="none" stroke={win ? "#21c95e" : "#ff622e"} strokeWidth="1.25" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
