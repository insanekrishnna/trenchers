// Builds the bot's equity series (cash + open positions marked to market)
// from the trade list. Equity only moves while a position is open and on fees.

import { bot, closedTrades, NOW_ISO, openTrades, pnl, type ClosedTrade } from "./data";

export type Interval = 1 | 5 | 15; // minutes

/** Wall-clock ISO (no TZ) -> seconds, pinned to UTC so the chart shows the same clock everywhere. */
export function wall(iso: string) {
  const [d, t] = iso.split("T");
  const [y, mo, da] = d.split("-").map(Number);
  const [h, mi, s] = t.split(":").map(Number);
  return Date.UTC(y, mo - 1, da, h, mi, s || 0) / 1000;
}

export const START = wall(bot.launchedAt);
export const END = wall(NOW_ISO);
const STEP = 10; // seconds
const FEE_PER_LEG = Math.abs(pnl.platformFee + pnl.executionCost) / pnl.legs;

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface TradeWindow {
  id: string;
  symbol: string;
  mint: string;
  hue: number;
  mc: number;
  entry: number;
  multiple: number;
  pnl: number;
  open: boolean;
  closed?: ClosedTrade;
  t0: number;
  t1: number; // exit, or END for open trades
  path: (u: number) => number;
}

function makePath(seed: number, endMultiple: number, holdSec: number, win: boolean) {
  const r = rng(seed);
  // A few irregular steps per trade: long flat holds, then a jump.
  // Step times are random, and step sizes are skewed so one or two moves dominate.
  const n = Math.max(3, Math.round(holdSec / 600));
  const times = Array.from({ length: n }, () => r()).sort((a, b) => a - b);
  const weights = Array.from({ length: n }, () => r() ** 2.2 + 0.03);
  const total = weights.reduce((s, w) => s + w, 0);
  const levels: number[] = [];
  let acc = 0;
  for (let i = 0; i < n; i++) {
    acc += weights[i] / total;
    // a small counter-move now and then, so it is not a perfect staircase
    const jitter = i < n - 1 && r() < 0.35 ? -(r() * 0.12) * Math.sign(endMultiple - 1) : 0;
    levels.push(acc + jitter);
  }
  // winners often dip first, losers often pump first
  const early = win ? -(0.03 + r() * 0.05) : 0.03 + r() * 0.05;
  const earlyAt = times[0] * 0.6;
  return (u: number) => {
    if (u >= 1) return endMultiple;
    let lvl = 0;
    for (let i = 0; i < n; i++) if (u >= times[i]) lvl = levels[i];
    const pre = u >= earlyAt && u < times[0] ? early : 0;
    return 1 + (endMultiple - 1) * lvl + pre;
  };
}

const closedWindows: TradeWindow[] = [...closedTrades].reverse().map((tr, idx) => {
  const t1 = wall(tr.closedAt);
  const t0 = t1 - tr.holdSec;
  return {
    id: tr.id,
    symbol: tr.symbol,
    mint: tr.mint,
    hue: tr.hue,
    mc: tr.mc,
    entry: tr.entry,
    multiple: tr.multiple,
    pnl: tr.pnl,
    open: false,
    closed: tr,
    t0,
    t1,
    path: makePath(idx * 977 + 13, tr.multiple, tr.holdSec, tr.pnl > 0),
  };
});

const openWindows: TradeWindow[] = openTrades.map((o, idx) => {
  const t0 = wall(o.openedAt);
  return {
    id: o.id,
    symbol: o.symbol,
    mint: o.mint,
    hue: o.hue,
    mc: o.mc,
    entry: o.entry,
    multiple: o.multiple,
    pnl: o.entry * (o.multiple - 1),
    open: true,
    t0,
    t1: END,
    path: makePath(9001 + idx, o.multiple, END - t0, true),
  };
});

export const trades: TradeWindow[] = [...closedWindows, ...openWindows];

export function equityAt(t: number) {
  let b = bot.startingBalance;
  for (const tr of trades) {
    if (t < tr.t0) continue;
    b -= FEE_PER_LEG;
    if (!tr.open && t >= tr.t1) {
      b -= FEE_PER_LEG;
      b += tr.pnl;
    } else if (tr.t1 > tr.t0) {
      const u = Math.min(1, (t - tr.t0) / (tr.t1 - tr.t0));
      b += tr.entry * (tr.path(u) - 1);
    }
  }
  return b;
}

export interface Bar {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  flat: boolean;
}

export function buildBars(interval: Interval): Bar[] {
  const span = interval * 60;
  const bars: Bar[] = [];
  for (let s = START; s <= END; s += span) {
    const o = equityAt(s);
    let h = o;
    let l = o;
    for (let t = s; t < s + span && t <= END; t += STEP) {
      const v = equityAt(t);
      h = Math.max(h, v);
      l = Math.min(l, v);
    }
    const c = equityAt(Math.min(s + span - 1, END));
    h = Math.max(h, c);
    l = Math.min(l, c);
    bars.push({ time: s, open: o, high: h, low: l, close: c, flat: h - l < 1e-7 });
  }
  return bars;
}

/** Tokens the bot screened per bar (2,000 / 24h ≈ 1.4 a minute). */
export function buildChecks(interval: Interval) {
  const r = rng(42);
  const span = interval * 60;
  const out: { time: number; value: number; entered: boolean }[] = [];
  for (let s = START; s <= END; s += span) {
    let v = 0;
    for (let m = 0; m < interval; m++) v += Math.round(r() * r() * 5);
    const entered = trades.some((tr) => tr.t0 >= s && tr.t0 < s + span);
    out.push({ time: s, value: v + (entered ? 2 : 0), entered });
  }
  return out;
}

export function barTime(t: number, interval: Interval) {
  const span = interval * 60;
  return START + Math.floor((Math.min(t, END) - START) / span) * span;
}

export function clock(sec: number) {
  const d = new Date(sec * 1000);
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}
