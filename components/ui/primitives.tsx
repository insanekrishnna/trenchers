"use client";

import { useEffect, useId, useRef, useState } from "react";
import { animate, useInView } from "motion/react";

/* ---------- Solana glyph (three bars, product-native) ---------- */
export function Sol({ className = "size-[0.72em]" }: { className?: string }) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  return (
    <svg viewBox="0 0 24 20" className={`inline-block shrink-0 ${className}`} aria-label="SOL">
      <defs>
        <linearGradient id={`s${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#00FFA3" />
          <stop offset="1" stopColor="#DC1FFF" />
        </linearGradient>
      </defs>
      <path fill={`url(#s${id})`} d="M4 1h19l-4 4H0zM4 15h19l-4 4H0zM0 8h19l4 4H4z" />
    </svg>
  );
}

/* ---------- Live status dot ---------- */
export function LiveDot({ tone = "green", size = 8, still = false }: { tone?: "green" | "warn"; size?: number; still?: boolean }) {
  const bg = tone === "green" ? "bg-green" : "bg-warn";
  return (
    <span className="relative inline-flex shrink-0" style={{ width: size, height: size }}>
      {!still && <span className={`live-ping absolute inset-0 rounded-full ${bg}`} />}
      <span className={`relative inline-flex size-full rounded-full ${bg}`} />
    </span>
  );
}

/* ---------- Bot avatar: "insane", a lime blob ---------- */

// Wavy outline: a circle with seven soft, uneven lobes, smoothed with Catmull-Rom.
const BLOB_PATH = (() => {
  const N = 28;
  const pts: [number, number][] = [];
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2 - Math.PI / 2;
    const r = 20 + 2.3 * Math.sin(6 * a + 0.4) + 0.9 * Math.sin(2 * a + 2.2);
    pts.push([24 + r * Math.cos(a), 24.5 + r * Math.sin(a)]);
  }
  const f = (n: number) => n.toFixed(2);
  let d = `M${f(pts[0][0])},${f(pts[0][1])}`;
  for (let i = 0; i < N; i++) {
    const p0 = pts[(i - 1 + N) % N];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % N];
    const p3 = pts[(i + 2) % N];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${f(c1[0])},${f(c1[1])} ${f(c2[0])},${f(c2[1])} ${f(p2[0])},${f(p2[1])}`;
  }
  return `${d}Z`;
})();

// Still by default. It only reacts to the person: the pupils follow the cursor,
// it smiles when hovered, and squishes + blinks when clicked.
export function BotAvatar({ size = 40, live = false }: { size?: number; live?: boolean }) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const svgRef = useRef<SVGSVGElement>(null);
  const pupilsRef = useRef<SVGGElement>(null);
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    const svg = svgRef.current;
    const pupils = pupilsRef.current;
    if (!svg || !pupils) return;
    let frame = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const r = svg.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        const dist = Math.hypot(dx, dy) || 1;
        // pull is stronger when the cursor is close, capped so pupils stay inside the eye
        const reach = Math.min(1, dist / 160) * 1.7;
        pupils.style.transform = `translate(${((dx / dist) * reach).toFixed(2)}px, ${((dy / dist) * reach).toFixed(2)}px)`;
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  const poke = () => {
    setBlink(true);
    window.setTimeout(() => setBlink(false), 160);
  };

  return (
    <span className="bot-avatar group relative inline-flex shrink-0 cursor-pointer" style={{ width: size, height: size }} onPointerDown={poke}>
      <svg ref={svgRef} viewBox="0 0 48 48" width={size} height={size} aria-hidden className="overflow-visible">
        <defs>
          {/* soft light from the top-left so the body has some volume */}
          <radialGradient id={`b${id}`} cx="36%" cy="30%" r="75%">
            <stop offset="0" stopColor="#b8ff6a" />
            <stop offset=".55" stopColor="#84ff01" />
            <stop offset="1" stopColor="#5fc400" />
          </radialGradient>
        </defs>
        <g className="bot-body">
          <path d={BLOB_PATH} fill={`url(#b${id})`} />
          {/* eyes: whites, then pupils that track the cursor */}
          <g className="bot-eyes" style={{ transform: blink ? "scaleY(.12)" : undefined }}>
            <ellipse cx="17.6" cy="24" rx="5.4" ry="5.8" fill="#fff" stroke="#0b0a14" strokeWidth="1.2" transform="rotate(-8 17.6 24)" />
            <ellipse cx="30.6" cy="23" rx="5.4" ry="5.8" fill="#fff" stroke="#0b0a14" strokeWidth="1.2" transform="rotate(8 30.6 23)" />
            <g ref={pupilsRef} className="bot-pupils">
              <ellipse cx="18" cy="24" rx="2.9" ry="3.1" fill="#0b0a14" />
              <ellipse cx="31" cy="23" rx="2.9" ry="3.1" fill="#0b0a14" />
              <circle cx="18.9" cy="23" r=".85" fill="#fff" />
              <circle cx="31.9" cy="22" r=".85" fill="#fff" />
            </g>
          </g>
          {/* cheeks, only when hovered */}
          <g className="bot-cheeks" fill="#ff8fa3">
            <ellipse cx="12.6" cy="31" rx="2.4" ry="1.4" />
            <ellipse cx="35.6" cy="30" rx="2.4" ry="1.4" />
          </g>
          {/* small smile that widens on hover */}
          <path className="bot-smile" d="M22.4 31.4c1 1.2 2.6 1.2 3.6 0" stroke="#0b0a14" strokeWidth="1.4" strokeLinecap="round" fill="none" />
          <path className="bot-grin" d="M21 30.6c1.5 2.6 4.9 2.6 6.4 0" stroke="#0b0a14" strokeWidth="1.4" strokeLinecap="round" fill="none" />
        </g>
      </svg>
      {live && (
        <span className="absolute -bottom-0.5 -right-0.5 grid size-3.5 place-items-center rounded-full bg-bg">
          <span className="size-2 rounded-full bg-green pulse-dot" />
        </span>
      )}
    </span>
  );
}

/* ---------- Token art: original pixel sprite per token ---------- */

const spriteCache = new Map<string, { on: [number, number, string][]; bgTop: string; bgBottom: string }>();

function sprite(symbol: string, hue: number) {
  const key = `${symbol}:${hue}`;
  const hit = spriteCache.get(key);
  if (hit) return hit;
  // deterministic PRNG seeded from the symbol
  let h = 2166136261;
  for (const ch of symbol) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  const rnd = () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
  const body = `hsl(${hue} 78% 60%)`;
  const shade = `hsl(${hue} 70% 42%)`;
  const light = `hsl(${(hue + 25) % 360} 90% 78%)`;
  const eye = "#0b0a14";
  const on: [number, number, string][] = [];
  const N = 8;
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N / 2; x++) {
      // denser toward the middle so it reads as a creature, not noise
      const centre = 1 - Math.abs(x - 3.5) / 4.5 - Math.abs(y - 3.8) / 7;
      if (rnd() < 0.25 + centre * 0.55) {
        const c = y < 2 ? light : y > 5 ? shade : body;
        on.push([x, y, c], [N - 1 - x, y, c]);
      }
    }
  }
  // eyes: a pair on row 3, always present
  const ex = 1 + Math.floor(rnd() * 2);
  for (const x of [ex, N - 1 - ex]) {
    const i = on.findIndex(([px, py]) => px === x && py === 3);
    if (i >= 0) on.splice(i, 1);
    on.push([x, 3, eye]);
  }
  const bgHue = (hue + 160 + Math.floor(rnd() * 60)) % 360;
  const out = { on, bgTop: `hsl(${bgHue} 35% 26%)`, bgBottom: `hsl(${bgHue} 40% 14%)` };
  spriteCache.set(key, out);
  return out;
}

/** Pump-launch badge: a pill in a green ring. */
export function PumpBadge({ size = 14 }: { size?: number }) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} aria-label="Launched on pump">
      <circle cx="8" cy="8" r="7.1" fill="#0d0c17" stroke="#21c95e" strokeWidth="1.6" />
      <g transform="rotate(-45 8 8)">
        <rect x="3.6" y="6.1" width="8.8" height="3.8" rx="1.9" fill="#f7f7f7" />
        <path d="M5.5 6.1H8v3.8H5.5a1.9 1.9 0 0 1 0-3.8z" fill="#21c95e" />
      </g>
    </svg>
  );
}

export function TokenIcon({
  symbol,
  hue,
  size = 36,
  badge = false,
}: {
  symbol: string;
  hue: number;
  size?: number;
  badge?: boolean;
}) {
  const art = sprite(symbol, hue);
  return (
    <span className="relative inline-flex shrink-0" style={{ width: size, height: size }}>
      <span
        className="block size-full overflow-hidden"
        style={{
          borderRadius: size * 0.26,
          background: `linear-gradient(180deg, ${art.bgTop}, ${art.bgBottom})`,
          boxShadow: "inset 0 0 0 1px rgba(255,255,255,.1)",
        }}
      >
        <svg viewBox="-1 -1 10 10" width={size} height={size} shapeRendering="crispEdges" aria-label={symbol} role="img">
          {art.on.map(([x, y, c], i) => (
            <rect key={i} x={x} y={y} width={1} height={1} fill={c} />
          ))}
        </svg>
      </span>
      {badge && (
        <span className="absolute -bottom-1 -right-1 grid place-items-center rounded-full">
          <PumpBadge size={Math.max(12, Math.round(size * 0.42))} />
        </span>
      )}
    </span>
  );
}

/* ---------- Animated number ---------- */
export function CountUp({
  value,
  decimals = 4,
  prefix = "",
  suffix = "",
  signed = false,
  className = "",
}: {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  signed?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const c = animate(0, value, { duration: 1.1, ease: [0.22, 1, 0.36, 1], onUpdate: setV });
    return () => c.stop();
  }, [inView, value]);
  const abs = Math.abs(v).toFixed(decimals);
  const sign = signed ? (value > 0 ? "+" : value < 0 ? "−" : "") : value < 0 ? "−" : "";
  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {sign}
      {prefix}
      {abs}
      {suffix}
    </span>
  );
}

/* ---------- Card ---------- */
export function Card({
  children,
  className = "",
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`card ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  meta,
  right,
}: {
  title: string;
  meta?: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 pb-3 pt-4">
      <div className="min-w-0">
        <h3 className="text-[14px] font-medium text-fg">{title}</h3>
        {meta && <p className="mt-0.5 text-[12px] text-subtle">{meta}</p>}
      </div>
      {right}
    </div>
  );
}

/* ---------- Pill / chip ---------- */
export function Chip({
  tone = "neutral",
  children,
  className = "",
}: {
  tone?: "neutral" | "green" | "red" | "accent" | "warn";
  children: React.ReactNode;
  className?: string;
}) {
  const tones = {
    neutral: "bg-white/[.06] text-muted",
    green: "bg-green/15 text-green",
    red: "bg-red/15 text-red",
    accent: "bg-accent/15 text-accent-soft",
    warn: "bg-warn/15 text-warn",
  } as const;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-medium ${tones[tone]} ${className}`}>
      {children}
    </span>
  );
}
