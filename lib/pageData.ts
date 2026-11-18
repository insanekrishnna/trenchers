// Extra data for the agent pages. Everything still comes from the same trade list
// in data.ts / chartData.ts, so every page agrees with the dashboard.

import { closedTrades, openTrades, pnl, type ClosedTrade } from "./data";
import { END, trades, wall } from "./chartData";

export const TOKEN_NAMES: Record<string, string> = {
  LOCKIN: "Lock In",
  GSW: "Golden State Whale",
  ANSEM: "Ansem's Pup",
  AEXGTA: "Aex Grand Theft",
  DeCetyCuin: "DeCety Cuin",
  HALO: "Halo Protocol",
  WAVE: "Wave Rider",
};

/** Fees for one round-trip (buy + sell leg). */
export const FEE_PER_TRIP = (Math.abs(pnl.platformFee + pnl.executionCost) / pnl.legs) * 2;

/** Highest multiple a trade reached while open (from its price path). */
export function peakMultiple(id: string) {
  const t = trades.find((x) => x.id === id);
  if (!t) return 1;
  let peak = 1;
  for (let k = 0; k <= 60; k++) peak = Math.max(peak, t.path(k / 60));
  return Math.round(peak * 100) / 100;
}

/** Sampled price path (as multiples) for sparklines and mini charts. */
export function pathSamples(id: string, n = 48) {
  const t = trades.find((x) => x.id === id);
  if (!t) return [];
  return Array.from({ length: n }, (_, k) => t.path(k / (n - 1)));
}

export interface ClosedDetail extends ClosedTrade {
  name: string;
  inWallet: number;
  inWalletPct: number;
  fees: number;
  peak: number;
  mcExit: number;
  mcNow: number;
  ath: number;
  agoMin: number;
}

export const closedDetails: ClosedDetail[] = closedTrades.map((t, i) => {
  const fees = FEE_PER_TRIP;
  const inWallet = t.pnl - fees;
  const peak = Math.max(peakMultiple(t.id), t.multiple);
  const mcExit = t.mc * t.multiple;
  // where the coin trades now: some kept running, some faded
  const drift = [1.18, 0.86, 1.42, 0.64, 1.07, 0.71][i % 6];
  const mcNow = mcExit * drift;
  return {
    ...t,
    name: TOKEN_NAMES[t.symbol] ?? t.symbol,
    fees,
    inWallet,
    inWalletPct: (inWallet / t.entry) * 100,
    peak,
    mcExit,
    mcNow,
    ath: Math.max(t.mc * peak, mcNow) * 1.06,
    agoMin: Math.round((END - wall(t.closedAt)) / 60),
  };
});

export const openDetail = (() => {
  const o = openTrades[0];
  const w = trades.find((t) => t.id === o.id)!;
  const heldSec = END - w.t0;
  const mcNow = o.mc * o.multiple;
  const peak = Math.max(peakMultiple(o.id), o.multiple);
  return {
    ...o,
    name: TOKEN_NAMES[o.symbol] ?? o.symbol,
    heldSec,
    value: o.entry * o.multiple,
    unreal: o.entry * (o.multiple - 1),
    unrealPct: (o.multiple - 1) * 100,
    mcNow,
    ath: o.mc * peak,
    atAth: o.multiple >= peak - 0.01,
    nextTier: "Take-profit tier 1 at 1.40×",
  };
})();

/* ---------------- AI optimizations timeline ---------------- */

export type AiEvent =
  | { kind: "buy"; at: string; symbol: string; hue: number; mc: number; entry: number; open: boolean }
  | { kind: "sell"; at: string; symbol: string; hue: number; mc: number; reason: ClosedTrade["reason"]; holdSec: number; pnl: number }
  | { kind: "config"; at: string; title: string; detail: string };

export const aiEvents: AiEvent[] = (() => {
  const out: AiEvent[] = [];
  for (const t of closedTrades) {
    out.push({ kind: "sell", at: t.closedAt, symbol: t.symbol, hue: t.hue, mc: t.mc, reason: t.reason, holdSec: t.holdSec, pnl: t.pnl });
  }
  for (const o of openTrades) {
    out.push({ kind: "buy", at: o.openedAt, symbol: o.symbol, hue: o.hue, mc: o.mc, entry: o.entry, open: true });
  }
  out.push({ kind: "config", at: "2026-11-18T08:58:00", title: "Config v2 saved", detail: "Stop loss 0.75× → 0.70×, stale exit 30m → 45m" });
  return out.sort((a, b) => b.at.localeCompare(a.at));
})();

/* ---------------- Watch feed ---------------- */

export const GATES = [
  { key: "launch", label: "Fresh launch" },
  { key: "pump", label: "Launched on Pump.fun" },
  { key: "volume", label: "Volume" },
  { key: "holders", label: "Holder count" },
  { key: "dev", label: "Dev history" },
  { key: "bundles", label: "Bundled buys" },
  { key: "snipers", label: "Snipers" },
  { key: "top", label: "Top holder share" },
  { key: "buyers", label: "Unique buyers" },
] as const;

export interface FeedToken {
  id: string;
  symbol: string;
  name: string;
  hue: number;
  ageSec: number;
  mc: number;
  vol: number;
  passed: boolean[]; // one per gate
}

const mk = (id: string, symbol: string, name: string, hue: number, ageSec: number, mc: number, vol: number, pass: string): FeedToken => ({
  id,
  symbol,
  name,
  hue,
  ageSec,
  mc,
  vol,
  passed: pass.split("").map((c) => c === "1"),
});

export const justSpotted: FeedToken[] = [
  mk("s1", "GTA", "Grand Token Auto", 32, 9, 2240, 382, "110110100"),
  mk("s2", "JIGGLE", "Jiggle Physics", 18, 11, 3410, 667, "111010100"),
  mk("s3", "FLOORED", "Floored", 270, 12, 2130, 5400, "110111010"),
  mk("s4", "DIH", "Dih The Dög", 40, 18, 739, 389, "110100000"),
  mk("s5", "MOSS", "Moss Coin", 120, 26, 1890, 912, "111101100"),
  mk("s6", "ORBIT", "Orbit Cat", 200, 41, 2760, 1240, "111110100"),
];

export const nearEntry: FeedToken[] = [
  mk("n1", "TAILWND", "AI Hacking Tailwind", 95, 60, 9410, 9400, "111111101"),
  mk("n2", "SCC", "Smoking Cool Crab", 10, 44, 5590, 7600, "111111011"),
  mk("n3", "CSC", "Cool Smoking Crab", 345, 3600, 7500, 102500, "111101111"),
  mk("n4", "MANGRV", "Mister Mangrove", 150, 600, 6600, 16800, "111111110"),
  mk("n5", "PEBBLE", "Pebble", 220, 300, 4120, 8800, "110111111"),
  mk("n6", "VELVET", "Velvet Hour", 300, 900, 8020, 21400, "111111101"),
];

export const feedCounts = { spotted: 36, near: 6 };

/* ---------------- Rewards ---------------- */

export const rewards = {
  claimableSol: 0.0042,
  earnedSol: 0.0042,
  points: 288,
  minClaim: 0.0001,
};
