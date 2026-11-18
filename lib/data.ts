// Demo dataset for the "insane" paper bot.
// Everything on the page is derived from the trade list below, so the chart,
// stats, diagnostics and AI briefing always agree with each other.

export type ExitReason = "stop_loss" | "stale_exit" | "take_profit";

export interface ClosedTrade {
  id: string;
  symbol: string;
  mint: string;
  entry: number; // SOL in
  exit: number; // SOL out
  pnl: number; // realized SOL
  pct: number; // realized %
  multiple: number;
  reason: ExitReason;
  holdSec: number;
  closedAt: string; // local wall time, ISO without zone
  hue: number;
  mc: number; // market cap at entry, USD
}

export interface OpenTrade {
  id: string;
  symbol: string;
  mint: string;
  entry: number;
  multiple: number; // live mark
  openedAt: string;
  hue: number;
  mc: number;
}

export const NOW_ISO = "2026-11-18T16:44:00";
const ENTRY = 0.0493; // 0.05 SOL minus entry fees
const PLATFORM_PER_LEG = 0.000425;
const EXEC_PER_LEG = 0.000217;

export const bot = {
  name: "insane",
  version: "v1",
  config: "config v2",
  mode: "paper" as "paper" | "live",
  launchedAt: "2026-11-18T09:00:00",
  startingBalance: 1.0,
  solUsd: 74.48,
};

type Seed = [symbol: string, mint: string, multiple: number, reason: ExitReason, holdSec: number, closedAt: string, hue: number, mc: number];

// Oldest first.
const seeds: Seed[] = [
  ["LOCKIN", "8kQp…pump", 0.72, "stop_loss", 1680, "09:40", 200, 6200],
  ["GSW", "9Spm…pump", 1.48, "take_profit", 3720, "11:02", 45, 8100],
  ["ANSEM", "5FQg…pump", 0.74, "stop_loss", 1440, "11:46", 350, 5400],
  ["AEXGTA", "5H3M…pump", 2.12, "take_profit", 4680, "13:24", 0, 7300],
  ["DeCetyCuin", "HJi6…pump", 1.31, "stale_exit", 2700, "14:30", 320, 2400],
  ["HALO", "Ha1o…pump", 1.44, "take_profit", 3120, "15:42", 55, 9200],
];

const r4 = (v: number) => Math.round(v * 1e4) / 1e4;

/** Newest first, as the product lists them. */
export const closedTrades: ClosedTrade[] = seeds
  .map(([symbol, mint, multiple, reason, holdSec, at, hue, mc], i) => {
    const exit = r4(ENTRY * multiple);
    const pnl = r4(exit - ENTRY);
    return {
      id: `t${i + 1}`,
      symbol,
      mint,
      entry: ENTRY,
      exit,
      pnl,
      pct: Math.round((multiple - 1) * 100),
      multiple,
      reason,
      holdSec,
      closedAt: `2026-11-18T${at}:00`,
      hue,
      mc,
    };
  })
  .reverse();

export const openTrades: OpenTrade[] = [
  { id: "o1", symbol: "WAVE", mint: "Wv3e…pump", entry: ENTRY, multiple: 1.27, openedAt: "2026-11-18T15:55:00", hue: 150, mc: 4300 },
];

/* ---------------- derived stats ---------------- */

const chron = [...closedTrades].reverse();
const wins = closedTrades.filter((t) => t.pnl > 0);
const losses = closedTrades.filter((t) => t.pnl <= 0);
const legs = closedTrades.length * 2 + openTrades.length;
const gross = r4(closedTrades.reduce((s, t) => s + t.pnl, 0));
const platformFee = -r4(legs * PLATFORM_PER_LEG);
const executionCost = -r4(legs * EXEC_PER_LEG);
const net = r4(gross + platformFee + executionCost);

// peak-to-trough on realized balance
let peak = 0;
let cum = 0;
let maxDD = 0;
for (const t of chron) {
  cum += t.pnl - 2 * (PLATFORM_PER_LEG + EXEC_PER_LEG);
  peak = Math.max(peak, cum);
  maxDD = Math.min(maxDD, cum - peak);
}

const sortedHold = [...closedTrades].sort((a, b) => a.holdSec - b.holdSec);
const best = [...closedTrades].sort((a, b) => b.pnl - a.pnl)[0];
const worst = [...closedTrades].sort((a, b) => a.pnl - b.pnl)[0];
const unrealized = r4(openTrades.reduce((s, t) => s + t.entry * (t.multiple - 1), 0));

export const pnl = {
  gross,
  platformFee,
  executionCost,
  net,
  netPct: (net / bot.startingBalance) * 100,
  unrealized,
  winRate: (wins.length / closedTrades.length) * 100,
  wins: wins.length,
  losses: losses.length,
  roundTrips: closedTrades.length,
  legs,
  avgMultiple: closedTrades.reduce((s, t) => s + t.multiple, 0) / closedTrades.length,
  avgHoldSec: Math.round(closedTrades.reduce((s, t) => s + t.holdSec, 0) / closedTrades.length),
  shortestHold: sortedHold[0].holdSec,
  longestHold: sortedHold[sortedHold.length - 1].holdSec,
  maxDrawdown: r4(maxDD),
  best,
  worst,
  balance: r4(bot.startingBalance + net),
  atRisk: r4(openTrades.reduce((s, t) => s + t.entry, 0)),
};

const REASON_LABEL: Record<ExitReason, string> = {
  take_profit: "Take profit",
  stale_exit: "Stale exit",
  stop_loss: "Stop loss",
};
export const reasonLabel = (r: ExitReason) => REASON_LABEL[r];

export const exitReasons = (["take_profit", "stale_exit", "stop_loss"] as ExitReason[]).map((key) => {
  const ts = closedTrades.filter((t) => t.reason === key);
  return { key, label: REASON_LABEL[key], pnl: r4(ts.reduce((s, t) => s + t.pnl, 0)), count: ts.length };
});

export const blockers = {
  window: "Last 24h",
  checks: 2000,
  rows: [
    { label: "Buy spread", pct: 89, fails: 94, hint: "Spread between bid and ask too wide at entry" },
    { label: "Buy/sell ratio", pct: 79, fails: 84, hint: "Sell pressure above the ratio you allow" },
    { label: "Holder count", pct: 76, fails: 81, hint: "Too few unique holders for your floor" },
  ],
};

export const config = {
  perTrade: 0.05,
  maxOpen: "Unlimited",
  overrides: 3,
  gates: 34,
  stopLoss: "0.70×",
  takeProfit: "1.35×+",
  staleAfter: "45m",
};

/* ---------------- formatting ---------------- */

export function formatHold(sec: number) {
  if (sec < 1) return "<1s";
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m >= 60) return `${Math.floor(m / 60)}h ${m % 60}m`;
  return s ? `${m}m ${s}s` : `${m}m`;
}

export function fmtSol(v: number, digits = 4, sign = true) {
  const s = Math.abs(v).toFixed(digits);
  if (!sign) return s;
  return v > 0 ? `+${s}` : v < 0 ? `−${s}` : s;
}

export function fmtTime(iso: string) {
  return iso.slice(11, 16);
}

export const fmtMc = (usd: number) => (usd >= 1e6 ? `$${(usd / 1e6).toFixed(1)}M` : `$${Math.round(usd / 1000)}k`);

export const fmtPct = (v: number, d = 1) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v).toFixed(d)}%`;

/* ---------------- AI briefing (built from the numbers above) ---------------- */

const sl = exitReasons.find((e) => e.key === "stop_loss")!;
const tp = exitReasons.find((e) => e.key === "take_profit")!;
const feeTotal = Math.abs(platformFee + executionCost);

export const briefing = {
  steps: [
    { title: "Reading recent trades", body: "Pulling this bot's closed legs and open positions, newest first, so the read reflects what it just did." },
    { title: "Tallying wins, losses and exposure", body: "Splitting round-trips into winners and losers, then adding up realized PnL and what is still at risk." },
    { title: "Comparing results against config", body: "Weighing the entry filters, trade size and exit ladder against what those trades actually returned." },
    { title: "Writing the briefing", body: "Turning it into a few plain bullets: what is working, what is not, and what to watch next." },
  ],
  tabs: {
    // k: title · s: the one figure that matters · v: one short sentence
    intel: [
      { k: "Win rate", s: `${pnl.winRate.toFixed(0)}%`, v: `${pnl.wins} wins, ${pnl.losses} losses across ${pnl.roundTrips} trades. Net ${fmtSol(net)} SOL.` },
      { k: "Take-profit carries it", s: fmtSol(tp.pnl), v: `${tp.count} take-profit exits. Best was ${best.symbol} at ${best.multiple}×.` },
      { k: "Sample size", s: `${pnl.roundTrips}/20`, v: "Promising, but too few trades to call the edge reliable." },
      { k: `${openTrades[0].symbol} is open`, s: fmtPct((openTrades[0].multiple - 1) * 100, 0), v: `${fmtSol(unrealized)} SOL unrealized right now.` },
    ],
    risk: [
      { k: "Losses cut early", s: formatHold(Math.max(...closedTrades.filter((t) => t.reason === "stop_loss").map((t) => t.holdSec))), v: `All ${sl.count} stop-losses hit inside this window.` },
      { k: "Shallow drawdown", s: fmtSol(pnl.maxDrawdown), v: "Under 2% of the starting balance, peak to trough." },
      { k: "No max-open cap", s: "∞", v: "Fine in paper. Set a cap before going live." },
    ],
    exec: [
      { k: "Fees", s: `${((feeTotal / (gross || 1)) * 100).toFixed(0)}%`, v: `${feeTotal.toFixed(4)} SOL of gross profit, across ${legs} legs.` },
      { k: "Entry fills", s: `${ENTRY}`, v: "Every entry landed at the same price. No slippage issue." },
      { k: "Stale exit", s: "1.31×", v: "Closed green. Holding a little longer may add upside." },
    ],
  },
  suggestion: "Raise the stale-exit timer from 45m to 60m for the next 10 trades.",
};
