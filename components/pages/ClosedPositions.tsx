"use client";

import { ArrowSquareOutIcon, CaretDownIcon, ChartLineUpIcon, CopyIcon, FunnelSimpleIcon, LightbulbIcon, ListChecksIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { fmtPct, fmtSol, fmtTime, formatHold, pnl, reasonLabel } from "@/lib/data";
import { closedDetails, type ClosedDetail, pathSamples } from "@/lib/pageData";
import { Card, TokenIcon } from "@/components/ui/primitives";
import { ClosedPositions as ClosedTable } from "@/components/dashboard/Positions";
import { Field, GhostButton, Page, Pills, Tabs } from "./kit";

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

  const rows = useMemo(() => {
    const xs = closedDetails.filter((t) => (filter === "all" ? true : filter === "win" ? t.pnl > 0 : t.pnl <= 0));
    if (sort === "best") return [...xs].sort((a, b) => b.pnl - a.pnl);
    if (sort === "worst") return [...xs].sort((a, b) => a.pnl - b.pnl);
    return xs;
  }, [filter, sort]);

  return (
    <Page className="max-w-[1100px]">
      <p className="text-[12.5px] text-subtle">Execution history · includes failed buys</p>

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
        <div className="flex items-center gap-2">
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
        <section>
          <h2 className="mb-4 text-[15px] font-medium">Trade activity</h2>
          <ol className="relative space-y-6">
            {/* the timeline spine */}
            <span className="absolute bottom-4 left-[15px] top-4 w-px bg-line" aria-hidden />
            <AnimatePresence initial={false}>
              {rows.map((t) => (
                <motion.li
                  key={t.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 32 }}
                  className="relative pl-12"
                >
                  <span className="absolute left-0 top-0 rounded-[9px] ring-4 ring-bg">
                    <TokenIcon symbol={t.symbol} hue={t.hue} size={32} />
                  </span>
                  <p className="text-[13.5px]">
                    Closed <span className="font-medium">${t.symbol}</span>
                  </p>
                  <p className="mt-0.5 text-[12px] text-subtle">
                    Today, {fmtTime(t.closedAt)} · {ago(t.agoMin)}
                  </p>
                  <TradeCard t={t} />
                </motion.li>
              ))}
            </AnimatePresence>
          </ol>
        </section>
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
        className="flex h-8 items-center gap-1.5 rounded-full border border-line px-3 text-[12.5px] text-muted transition-colors hover:border-white/20 hover:bg-white/[.04] hover:text-fg"
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

function TradeCard({ t }: { t: ClosedDetail }) {
  const [tab, setTab] = useState<"summary" | "execution">("summary");
  const win = t.pnl > 0;
  const tone = win ? "text-green" : "text-red";
  const mcChange = (t.mcExit / t.mc - 1) * 100;
  const sinceExit = (t.mcNow / t.mcExit - 1) * 100;

  return (
    <Card className="mt-3 overflow-hidden">
      <div className="grid gap-x-6 gap-y-5 px-5 py-4 sm:grid-cols-3">
        <Field label="Token">
          <span className="flex items-center gap-2.5">
            <TokenIcon symbol={t.symbol} hue={t.hue} size={28} badge />
            <span className="ml-0.5 leading-tight">
              <span className="flex items-center gap-1.5">
                {t.symbol}
                <button className="icon-btn size-5" aria-label="Copy token address" title="Copy address">
                  <CopyIcon className="size-3" />
                </button>
              </span>
              <span className="block text-[11.5px] text-subtle">{t.name}</span>
            </span>
          </span>
        </Field>
        <Field label="Before fees">
          <span className={tone}>
            {fmtSol(t.pnl)} <span className="text-[12px] opacity-75">{fmtPct(t.pct, 0)}</span>
          </span>
        </Field>
        <Field label="In your wallet">
          <span className={t.inWallet > 0 ? "text-green" : "text-red"}>
            {fmtSol(t.inWallet)} <span className="text-[12px] opacity-75">{fmtPct(t.inWalletPct, 0)}</span>
          </span>
          <p className="text-[11.5px] text-subtle">fees {t.fees.toFixed(4)}</p>
        </Field>

        <Field label="Entry → Exit">
          <span className="flex items-center gap-3">
            <span>
              <span className="text-subtle">{t.entry.toFixed(4)}</span> <span className="text-subtle">→</span> {t.exit.toFixed(4)}
            </span>
            <Spark id={t.id} win={win} />
          </span>
          <p className="text-[11.5px] text-subtle">
            MC {fmtMc(t.mc)} → {fmtMc(t.mcExit)} ({fmtPct(mcChange, 0)})
          </p>
        </Field>
        <Field label="Exit reason">
          <span className="flex items-center gap-2">
            <span className="size-1.5 rounded-full" style={{ background: REASON_COLOR[t.reason] }} />
            {reasonLabel(t.reason)}
            <span className="text-subtle">@ {t.multiple}×</span>
          </span>
          <p className="text-[11.5px] text-subtle">peak {t.peak.toFixed(2)}×</p>
        </Field>
        <Field label="Hold time">
          {formatHold(t.holdSec)} <span className="text-subtle">· v2</span>
        </Field>
      </div>

      <div className="grid gap-x-6 gap-y-4 border-t border-line px-5 py-3.5 sm:grid-cols-3">
        <Field label="MC now">{fmtMc(t.mcNow)}</Field>
        <Field label="ATH">{fmtMc(t.ath)}</Field>
        <Field label="Since you sold">
          <span className={sinceExit >= 0 ? "text-muted" : "text-subtle"}>
            {sinceExit >= 0 ? "Kept running " : "Faded "}
            <span className="tabular-nums">{fmtPct(sinceExit, 0)}</span>
          </span>
        </Field>
      </div>

      <div className="border-t border-line px-5 pt-3">
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { key: "summary", label: "Summary" },
            { key: "execution", label: "Execution" },
          ]}
        />
      </div>
      {tab === "summary" ? (
        <div className="flex flex-wrap gap-x-5 gap-y-2 px-5 py-3">
          <a href="#" className="btn-link">
            <LightbulbIcon className="size-3.5" /> Why it entered
          </a>
          <a href="#" className="btn-link">
            <ListChecksIcon className="size-3.5" /> View fill details <span className="text-subtle">(2)</span>
          </a>
          <a href="#" className="btn-link">
            <ChartLineUpIcon className="size-3.5" /> Chart
          </a>
        </div>
      ) : (
        <ul className="divide-y divide-line px-5 py-1 text-[12.5px]">
          {[
            ["Buy", `${t.entry.toFixed(4)} SOL @ MC ${fmtMc(t.mc)}`, "1 block"],
            ["Sell", `${t.exit.toFixed(4)} SOL @ MC ${fmtMc(t.mcExit)}`, "2 blocks"],
          ].map(([k, v, s]) => (
            <li key={k} className="flex items-center justify-between gap-4 py-2.5">
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
    </Card>
  );
}

/* entry → exit price path, 64 × 16 */
function Spark({ id, win }: { id: string; win: boolean }) {
  const pts = pathSamples(id, 32);
  if (!pts.length) return null;
  const lo = Math.min(...pts);
  const hi = Math.max(...pts);
  const d = pts.map((v, i) => `${i ? "L" : "M"}${((i / (pts.length - 1)) * 64).toFixed(1)},${(15 - ((v - lo) / (hi - lo || 1)) * 14).toFixed(1)}`).join(" ");
  return (
    <svg width="64" height="16" aria-hidden className="shrink-0">
      <path d={d} fill="none" stroke={win ? "#21c95e" : "#ff622e"} strokeWidth="1.25" strokeLinejoin="round" />
    </svg>
  );
}
