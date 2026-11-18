"use client";

import {
  CandlestickSeries,
  createChart,
  CrosshairMode,
  HistogramSeries,
  LastPriceAnimationMode,
  LineSeries,
  LineStyle,
  LineType,
  PriceScaleMode,
  type IChartApi,
  type IPriceLine,
  type ISeriesApi,
  type MouseEventParams,
  type Time,
  type UTCTimestamp,
} from "lightweight-charts";
import { AnimatePresence, motion } from "motion/react";
import { Camera, ChartCandlestick, ChartSpline, Check, ChevronDown, Maximize2, Minimize2, RotateCcw, SquareFunction } from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { bot, fmtMc, fmtSol, formatHold, reasonLabel } from "@/lib/data";
import { barTime, buildBars, buildChecks, clock, END, START, trades, type Interval, type TradeWindow } from "@/lib/chartData";
import { Chip, LiveDot, TokenIcon } from "@/components/ui/primitives";

type Kind = "line" | "candle";
type Unit = "SOL" | "USD";
type Range = "30m" | "1H" | "4H" | "All";
export type Scrub = { equity: number; time: number } | null;

const C = {
  line: "#f7f7f7",
  up: "#21c95e",
  down: "#ff622e",
  flat: "#3b3d4a",
  accent: "#84ff01",
  text: "#9899a3",
  grid: "rgba(203,208,235,0.045)",
  card: "#0d0c17",
  label: "#161522",
};

const RANGES: { key: Range; sec: number }[] = [
  { key: "30m", sec: 30 * 60 },
  { key: "1H", sec: 60 * 60 },
  { key: "4H", sec: 4 * 60 * 60 },
  { key: "All", sec: 0 },
];

interface Marker {
  id: string;
  side: "buy" | "sell";
  t: number;
  trade: TradeWindow;
}

const MARKERS: Marker[] = trades.flatMap((tr) =>
  tr.open
    ? [{ id: `${tr.id}-b`, side: "buy" as const, t: tr.t0, trade: tr }]
    : [
        { id: `${tr.id}-b`, side: "buy" as const, t: tr.t0, trade: tr },
        { id: `${tr.id}-s`, side: "sell" as const, t: tr.t1, trade: tr },
      ]
);

export const TradeChart = memo(function TradeChart({ onScrub }: { onScrub: (s: Scrub) => void }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const markerEls = useRef<Map<string, HTMLButtonElement>>(new Map());
  const markerPos = useRef<Map<string, { x: number; y: number }>>(new Map());
  const extremeEls = useRef<{ hi: HTMLDivElement | null; lo: HTMLDivElement | null }>({ hi: null, lo: null });

  const chartRef = useRef<IChartApi | null>(null);
  const lineRef = useRef<ISeriesApi<"Line"> | null>(null);
  const candleRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const checksRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const startLines = useRef<IPriceLine[]>([]);

  const [interval, setIntervalMin] = useState<Interval>(1);
  const [kind, setKind] = useState<Kind>("line");
  const [unit, setUnit] = useState<Unit>("SOL");
  const [show, setShow] = useState({ markers: true, checks: true, start: true });
  const [scale, setScale] = useState({ log: false, pct: false, auto: true });
  const [range, setRange] = useState<Range>("All");
  const [full, setFull] = useState(false);
  const [tip, setTip] = useState<{ x: number; y: number; t: number; v: number } | null>(null);
  const [active, setActive] = useState<{ m: Marker; x: number; y: number } | null>(null);
  const [drawKey, setDrawKey] = useState(0);

  const k = unit === "USD" ? bot.solUsd : 1;
  const dp = unit === "USD" ? 2 : 4;
  const bars = useMemo(() => buildBars(interval), [interval]);
  const checks = useMemo(() => buildChecks(interval), [interval]);
  const barMap = useMemo(() => new Map(bars.map((b) => [b.time, b])), [bars]);
  const extremes = useMemo(() => {
    let hi = bars[0];
    let lo = bars[0];
    for (const b of bars) {
      if (b.close > hi.close) hi = b;
      if (b.close < lo.close) lo = b;
    }
    return { hi, lo };
  }, [bars]);

  const live = useRef({ bars, barMap, k, kind, interval, show, extremes, hovering: false, onScrub });
  useEffect(() => {
    live.current = { ...live.current, bars, barMap, k, kind, interval, show, extremes, onScrub };
  }, [bars, barMap, k, kind, interval, show, extremes, onScrub]);

  /* ---------------- create chart once ---------------- */
  useEffect(() => {
    const el = boxRef.current!;
    const chart = createChart(el, {
      autoSize: true,
      layout: {
        background: { color: "transparent" },
        textColor: C.text,
        fontFamily: getComputedStyle(document.body).fontFamily,
        fontSize: 11,
        attributionLogo: true,
      },
      grid: { vertLines: { visible: false }, horzLines: { color: C.grid } },
      crosshair: {
        mode: CrosshairMode.Magnet,
        vertLine: { color: "rgba(247,247,247,0.25)", width: 1, style: LineStyle.Dashed, labelBackgroundColor: C.label },
        horzLine: { visible: false, labelVisible: false },
      },
      rightPriceScale: { borderVisible: false, scaleMargins: { top: 0.16, bottom: 0.22 } },
      timeScale: { borderVisible: false, timeVisible: true, secondsVisible: false, rightOffset: 6, minBarSpacing: 0.5 },
      handleScale: { axisPressedMouseMove: { time: true, price: true } },
    });

    const line = chart.addSeries(LineSeries, {
      color: C.line,
      lineWidth: 2,
      lineType: LineType.WithSteps,
      crosshairMarkerRadius: 5,
      crosshairMarkerBorderColor: C.line,
      crosshairMarkerBorderWidth: 2,
      crosshairMarkerBackgroundColor: C.card,
      lastPriceAnimation: LastPriceAnimationMode.Continuous,
      priceLineColor: "rgba(247,247,247,0.35)",
      priceLineStyle: LineStyle.Dotted,
    });
    const candle = chart.addSeries(CandlestickSeries, {
      upColor: C.up,
      downColor: C.down,
      wickUpColor: C.up,
      wickDownColor: C.down,
      borderVisible: false,
      visible: false,
      priceLineStyle: LineStyle.Dotted,
    });
    const hist = chart.addSeries(HistogramSeries, {
      priceScaleId: "checks",
      priceFormat: { type: "volume" },
      lastValueVisible: false,
      priceLineVisible: false,
    });
    chart.priceScale("checks").applyOptions({ scaleMargins: { top: 0.86, bottom: 0 } });

    chartRef.current = chart;
    lineRef.current = line;
    candleRef.current = candle;
    checksRef.current = hist;

    const onMove = (p: MouseEventParams<Time>) => {
      const L = live.current;
      // live data ticks also fire this event; only real pointer movement may change the readout
      if (p.point && !p.sourceEvent) return;
      if (p.time === undefined || !p.point) {
        L.hovering = false;
        setTip(null);
        L.onScrub(null);
        return;
      }
      const b = L.barMap.get(p.time as number);
      if (!b) return;
      const series = L.kind === "line" ? line : candle;
      const y = series.priceToCoordinate(b.close * L.k) ?? p.point.y;
      L.hovering = true;
      setTip({ x: p.point.x, y, t: b.time, v: b.close });
      L.onScrub({ equity: b.close, time: b.time });
    };
    chart.subscribeCrosshairMove(onMove);

    // glue HTML overlays (markers, high/low) to the chart every frame
    let raf = 0;
    const tick = () => {
      const L = live.current;
      const ts = chart.timeScale();
      const paneW = ts.width();
      const paneH = el.clientHeight - ts.height();
      if (overlayRef.current) {
        overlayRef.current.style.width = `${paneW}px`;
        overlayRef.current.style.height = `${paneH}px`;
      }
      const series = L.kind === "line" ? line : candle;
      for (const m of MARKERS) {
        const node = markerEls.current.get(m.id);
        if (!node) continue;
        const bar = L.barMap.get(barTime(m.t, L.interval));
        const x = bar ? ts.timeToCoordinate(bar.time as UTCTimestamp) : null;
        const anchor = bar ? (L.kind === "candle" ? (m.side === "buy" ? bar.high : bar.low) : bar.close) * L.k : null;
        const py = anchor !== null ? series.priceToCoordinate(anchor) : null;
        if (!L.show.markers || x === null || py === null || x < 8 || x > paneW - 8) {
          node.style.opacity = "0";
          node.style.pointerEvents = "none";
          continue;
        }
        const y = m.side === "buy" ? py - 20 : py + 20;
        node.style.opacity = "1";
        node.style.pointerEvents = "auto";
        node.style.transform = `translate(${x - 12}px, ${y - 12}px)`;
        markerPos.current.set(m.id, { x, y });
      }
      for (const key of ["hi", "lo"] as const) {
        const node = extremeEls.current[key];
        if (!node) continue;
        const b = L.extremes[key];
        const x = ts.timeToCoordinate(b.time as UTCTimestamp);
        const y = series.priceToCoordinate(b.close * L.k);
        if (L.hovering || L.kind !== "line" || x === null || y === null || x < 20 || x > paneW - 20) {
          node.style.opacity = "0";
          continue;
        }
        node.style.opacity = "1";
        node.style.transform = `translate(${x}px, ${y}px)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      chart.unsubscribeCrosshairMove(onMove);
      chart.remove();
      chartRef.current = null;
    };
  }, []);

  /* ---------------- data ---------------- */
  useEffect(() => {
    const line = lineRef.current;
    const candle = candleRef.current;
    const hist = checksRef.current;
    if (!line || !candle || !hist) return;
    const priceFormat = { type: "price" as const, precision: dp, minMove: 1 / 10 ** dp };
    line.applyOptions({ priceFormat });
    candle.applyOptions({ priceFormat });
    line.setData(bars.map((b) => ({ time: b.time as UTCTimestamp, value: b.close * k })));
    candle.setData(
      bars.map((b) => ({
        time: b.time as UTCTimestamp,
        open: b.open * k,
        high: b.high * k,
        low: b.low * k,
        close: b.close * k,
        ...(b.flat ? { color: C.flat, wickColor: C.flat } : {}),
      }))
    );
    hist.setData(
      checks.map((c) => ({
        time: c.time as UTCTimestamp,
        value: c.value,
        color: c.entered ? "rgba(132,255,1,0.55)" : "rgba(152,153,163,0.18)",
      }))
    );
    startLines.current.forEach((l, i) => (i === 0 ? line : candle).removePriceLine(l));
    const opts = { price: bot.startingBalance * k, color: "rgba(247,247,247,0.22)", lineWidth: 1 as const, lineStyle: LineStyle.Dashed, axisLabelVisible: true, title: "Start" };
    startLines.current = [line.createPriceLine(opts), candle.createPriceLine(opts)];
    startLines.current.forEach((l) => l.applyOptions({ lineVisible: show.start, axisLabelVisible: show.start }));
    applyRange(range);
    setDrawKey((d) => d + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bars, checks, k, dp]);

  /* live tick: the open position keeps moving */
  useEffect(() => {
    const last = bars[bars.length - 1];
    let phase = 0;
    const id = setInterval(() => {
      phase += 1;
      const wobble = Math.round(Math.sin(phase * 0.7) * 2) * 0.0004;
      const v = (last.close + wobble) * k;
      lineRef.current?.update({ time: last.time as UTCTimestamp, value: v });
      candleRef.current?.update({
        time: last.time as UTCTimestamp,
        open: last.open * k,
        high: Math.max(last.high * k, v),
        low: Math.min(last.low * k, v),
        close: v,
      });
    }, 1400);
    return () => clearInterval(id);
  }, [bars, k]);

  /* ---------------- toggles ---------------- */
  useEffect(() => {
    lineRef.current?.applyOptions({ visible: kind === "line" });
    candleRef.current?.applyOptions({ visible: kind === "candle" });
    setDrawKey((d) => d + 1);
  }, [kind]);

  useEffect(() => {
    checksRef.current?.applyOptions({ visible: show.checks });
    startLines.current.forEach((l) => l.applyOptions({ lineVisible: show.start, axisLabelVisible: show.start }));
  }, [show]);

  useEffect(() => {
    chartRef.current?.priceScale("right").applyOptions({
      mode: scale.pct ? PriceScaleMode.Percentage : scale.log ? PriceScaleMode.Logarithmic : PriceScaleMode.Normal,
      autoScale: scale.auto,
    });
  }, [scale]);

  const applyRange = useCallback((r: Range) => {
    const ts = chartRef.current?.timeScale();
    if (!ts) return;
    const sec = RANGES.find((x) => x.key === r)!.sec;
    if (!sec) ts.fitContent();
    else ts.setVisibleRange({ from: Math.max(START, END - sec) as UTCTimestamp, to: END as UTCTimestamp });
  }, []);

  const pickRange = (r: Range) => {
    setRange(r);
    applyRange(r);
    setDrawKey((d) => d + 1);
  };

  /* ---------------- fullscreen + screenshot ---------------- */
  useEffect(() => {
    const on = () => setFull(document.fullscreenElement === wrapRef.current);
    document.addEventListener("fullscreenchange", on);
    return () => document.removeEventListener("fullscreenchange", on);
  }, []);

  const toggleFull = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else wrapRef.current?.requestFullscreen?.();
  };

  const snapshot = () => {
    const canvas = chartRef.current?.takeScreenshot(true);
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `insane-equity-${interval}m.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    });
  };

  const tipW = 150;
  const boxW = overlayRef.current?.clientWidth ?? 800;
  const tipLeft = tip ? Math.max(4, Math.min(boxW - tipW - 4, tip.x - tipW / 2)) : 0;
  const tipTop = tip ? (tip.y - 78 >= 4 ? tip.y - 78 : tip.y + 18) : 0;
  const tipChg = tip ? tip.v - bot.startingBalance : 0;

  return (
    <div ref={wrapRef} className={`flex flex-col bg-bg-2 ${full ? "h-screen" : ""}`}>
      {/* toolbar */}
      <div className="flex h-11 items-center gap-0.5 border-y border-line px-2 text-[13px]">
        <Menu
          label={<span className="font-medium tabular-nums">{interval}m</span>}
          items={([1, 5, 15] as Interval[]).map((m) => ({ label: `${m} minute${m > 1 ? "s" : ""}`, on: interval === m, act: () => setIntervalMin(m) }))}
        />
        <Sep />
        <div className="flex rounded-md bg-white/[.04] p-0.5">
          {(
            [
              { key: "line", icon: ChartSpline, title: "Line" },
              { key: "candle", icon: ChartCandlestick, title: "Candles" },
            ] as const
          ).map((o) => (
            <button
              key={o.key}
              title={o.title}
              aria-label={o.title}
              onClick={() => setKind(o.key)}
              className={`grid size-7 place-items-center rounded transition-colors ${kind === o.key ? "bg-white/[.1] text-fg" : "text-muted hover:text-fg"}`}
            >
              <o.icon className="size-4" />
            </button>
          ))}
        </div>
        <Sep />
        <Menu
          label={
            <span className="flex items-center gap-1.5">
              <SquareFunction className="size-4" /> Indicators
            </span>
          }
          items={[
            { label: "Trade markers", on: show.markers, act: () => setShow((s) => ({ ...s, markers: !s.markers })) },
            { label: "Bot checks", on: show.checks, act: () => setShow((s) => ({ ...s, checks: !s.checks })) },
            { label: "Starting balance", on: show.start, act: () => setShow((s) => ({ ...s, start: !s.start })) },
          ]}
          keepOpen
        />
        <Sep />
        <div className="flex items-center px-2 font-medium">
          {(["SOL", "USD"] as Unit[]).map((u, i) => (
            <span key={u} className="flex items-center">
              {i > 0 && <span className="px-1 text-subtle">/</span>}
              <button onClick={() => setUnit(u)} className={`transition-colors ${unit === u ? "text-fg" : "text-subtle hover:text-fg"}`}>
                {u}
              </button>
            </span>
          ))}
        </div>
        <div className="flex-1" />
        <ToolBtn
          title="Reset view"
          onClick={() => {
            setScale((s) => ({ ...s, auto: true }));
            applyRange(range);
          }}
        >
          <RotateCcw className="size-4" />
        </ToolBtn>
        <ToolBtn title="Download snapshot" onClick={snapshot}>
          <Camera className="size-4" />
        </ToolBtn>
        <ToolBtn title={full ? "Exit full screen" : "Full screen"} onClick={toggleFull}>
          {full ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
        </ToolBtn>
      </div>

      {/* chart */}
      <div className={`relative ${full ? "flex-1" : "h-[380px]"}`}>
        <div ref={boxRef} className="absolute inset-0" />

        {/* legend */}
        <div className="pointer-events-none absolute left-3 top-2.5 z-10 flex items-center gap-3 text-[12px]">
          <span className="font-medium text-fg">insane · Equity · {interval}m</span>
          <span className="flex items-center gap-1.5 text-muted">
            <LiveDot size={6} /> Live
          </span>
        </div>

        <div ref={overlayRef} className="pointer-events-none absolute left-0 top-0 z-[5] overflow-hidden">
          {/* high / low */}
          {(["hi", "lo"] as const).map((key) => (
            <div
              key={key}
              ref={(n) => {
                extremeEls.current[key] = n;
              }}
              className="absolute left-0 top-0 opacity-0 transition-opacity duration-300"
            >
              <span className="absolute -left-[3px] -top-[3px] size-1.5 rounded-full bg-fg" />
              <span
                className={`absolute whitespace-nowrap text-[10.5px] tabular-nums text-muted ${key === "hi" ? "-top-[22px] -translate-x-1/2" : "-top-[7px] left-[10px]"}`}
              >
                {key === "hi" ? "High" : "Low"} {(extremes[key].close * k).toFixed(dp)}
              </span>
            </div>
          ))}

          {/* trade markers */}
          {MARKERS.map((m) => {
            const win = m.trade.pnl > 0;
            return (
              <button
                key={m.id}
                ref={(n) => {
                  if (n) markerEls.current.set(m.id, n);
                  else markerEls.current.delete(m.id);
                }}
                className="absolute left-0 top-0 size-[24px] rounded-[7px] opacity-0 transition-opacity duration-200 hover:z-10"
                onMouseEnter={() => {
                  const p = markerPos.current.get(m.id);
                  if (p) setActive({ m, ...p });
                }}
                onMouseLeave={() => setActive(null)}
                aria-label={`${m.side === "buy" ? "Bought" : "Sold"} ${m.trade.symbol}`}
              >
                <span className="block rounded-[7px] ring-2 ring-bg-2 transition-transform duration-200 hover:scale-125">
                  <TokenIcon symbol={m.trade.symbol} hue={m.trade.hue} size={24} />
                </span>
                <span
                  className={`absolute -bottom-1 -right-1.5 grid size-[12px] place-items-center rounded-full text-[7px] font-bold leading-none ring-2 ring-bg-2 ${
                    m.side === "buy" ? "bg-fg text-bg" : win ? "bg-green text-bg" : "bg-red text-bg"
                  }`}
                >
                  {m.side === "buy" ? "B" : "S"}
                </span>
              </button>
            );
          })}

          {/* draw-in reveal */}
          <motion.div
            key={drawKey}
            className="absolute inset-0 z-20 bg-bg-2"
            style={{ transformOrigin: "right" }}
            initial={{ scaleX: 1 }}
            animate={{ scaleX: 0 }}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>

        {/* scrub tooltip — glides after the pointer */}
        <AnimatePresence>
          {tip && !active && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0, left: tipLeft, top: tipTop }}
              exit={{ opacity: 0, transition: { duration: 0.12 } }}
              transition={{
                left: { type: "tween", duration: 0.08, ease: "easeOut" },
                top: { type: "tween", duration: 0.08, ease: "easeOut" },
                y: { type: "spring", stiffness: 500, damping: 35 },
                opacity: { duration: 0.12 },
              }}
              style={{ width: tipW, left: tipLeft, top: tipTop }}
              className="pointer-events-none absolute z-20 flex flex-col gap-0.5 rounded-lg border border-line bg-bg-3/95 px-3 py-2 shadow-pop backdrop-blur"
            >
              <span className="text-[11px] text-muted">Nov 18, {clock(tip.t)}</span>
              <span className="text-[14px] font-medium tabular-nums">
                {(tip.v * k).toFixed(dp)} {unit}
              </span>
              <span className={`text-[11px] tabular-nums ${tipChg >= 0 ? "text-green" : "text-red"}`}>
                {fmtSol(tipChg * k, dp)} since start
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* marker card */}
        {active && (
          <div
            className="pointer-events-none absolute z-20 w-[236px] rounded-lg border border-line bg-bg-3 p-3 shadow-pop"
            style={{
              left: Math.max(8, Math.min(boxW - 244, active.x - 118)),
              top:
                active.m.side === "buy" || active.y + 130 > (overlayRef.current?.clientHeight ?? 340)
                  ? Math.max(8, active.y - 118)
                  : active.y + 20,
            }}
          >
            <div className="flex items-center gap-2.5">
              <TokenIcon symbol={active.m.trade.symbol} hue={active.m.trade.hue} size={32} badge />
              <div className="ml-0.5 min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium">
                  {active.m.side === "buy" ? "Bought" : "Sold"} {active.m.trade.symbol}
                </p>
                <p className="text-[11px] text-subtle">
                  MC {fmtMc(active.m.trade.mc)} · {clock(active.m.t)}
                </p>
              </div>
            </div>
            {active.m.side === "buy" ? (
              <p className="mt-2.5 text-[12px] text-muted">
                <span className="tabular-nums text-fg">{active.m.trade.entry.toFixed(4)} SOL</span> in ·{" "}
                {active.m.trade.open ? "still open" : `held ${formatHold(active.m.trade.t1 - active.m.trade.t0)}`}
              </p>
            ) : (
              <div className="mt-2.5 flex items-center justify-between">
                <span className={`whitespace-nowrap text-[15px] font-medium tabular-nums ${active.m.trade.pnl > 0 ? "text-green" : "text-red"}`}>
                  {fmtSol(active.m.trade.pnl)} SOL
                </span>
                {active.m.trade.closed && (
                  <Chip tone={active.m.trade.pnl > 0 ? "green" : "red"} className="whitespace-nowrap">
                    {reasonLabel(active.m.trade.closed.reason)} {active.m.trade.multiple}×
                  </Chip>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* bottom bar */}
      <div className="flex h-10 items-center gap-1 border-t border-line px-2 text-[12px]">
        <div className="flex rounded-full bg-white/[.04] p-0.5">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => pickRange(r.key)}
              className={`relative h-6 min-w-9 rounded-full px-2.5 font-medium tabular-nums transition-colors ${range === r.key ? "text-fg" : "text-muted hover:text-fg"}`}
            >
              {range === r.key && (
                <motion.span layoutId="chart-range" className="absolute inset-0 rounded-full bg-white/[.1]" transition={{ type: "spring", stiffness: 500, damping: 38 }} />
              )}
              <span className="relative">{r.key}</span>
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <Clock />
        <Sep />
        <ScaleBtn on={scale.pct} onClick={() => setScale((s) => ({ ...s, pct: !s.pct, log: false }))}>%</ScaleBtn>
        <ScaleBtn on={scale.log} onClick={() => setScale((s) => ({ ...s, log: !s.log, pct: false }))}>log</ScaleBtn>
        <ScaleBtn on={scale.auto} onClick={() => setScale((s) => ({ ...s, auto: !s.auto }))}>auto</ScaleBtn>
      </div>
    </div>
  );
});

/* ---------------- small parts ---------------- */

function Sep() {
  return <span className="mx-1 h-5 w-px bg-line" />;
}

function ToolBtn({ children, title, onClick }: { children: React.ReactNode; title: string; onClick: () => void }) {
  return (
    <button title={title} aria-label={title} onClick={onClick} className="grid size-8 place-items-center rounded-md text-muted transition-colors hover:bg-white/[.06] hover:text-fg">
      {children}
    </button>
  );
}

function ScaleBtn({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`rounded-md px-2 py-1 font-medium transition-colors ${on ? "bg-white/[.08] text-fg" : "text-muted hover:text-fg"}`}>
      {children}
    </button>
  );
}

function Menu({ label, items, keepOpen = false }: { label: React.ReactNode; items: { label: string; on: boolean; act: () => void }[]; keepOpen?: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", close);
    return () => window.removeEventListener("mousedown", close);
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex h-8 items-center gap-1 rounded-md px-2 transition-colors hover:bg-white/[.06] ${open ? "bg-white/[.06] text-fg" : "text-fg/90"}`}
      >
        {label}
        <ChevronDown className={`size-3.5 text-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute left-0 top-9 z-30 min-w-[180px] rounded-lg border border-line bg-bg-3 p-1 shadow-pop">
          {items.map((it) => (
            <button
              key={it.label}
              onClick={() => {
                it.act();
                if (!keepOpen) setOpen(false);
              }}
              className="flex w-full items-center justify-between gap-6 rounded-lg px-2.5 py-1.5 text-left text-[13px] text-fg/90 hover:bg-white/[.06]"
            >
              {it.label}
              <Check className={`size-3.5 text-fg ${it.on ? "opacity-100" : "opacity-0"}`} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Clock() {
  const [now, setNow] = useState("");
  useEffect(() => {
    const f = () => {
      const d = new Date();
      const off = -d.getTimezoneOffset();
      const sign = off >= 0 ? "+" : "−";
      const h = Math.floor(Math.abs(off) / 60);
      const m = Math.abs(off) % 60;
      setNow(`${d.toLocaleTimeString("en-GB")} UTC${sign}${h}${m ? `:${String(m).padStart(2, "0")}` : ""}`);
    };
    f();
    const id = setInterval(f, 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="px-2 tabular-nums text-muted">{now}</span>;
}
