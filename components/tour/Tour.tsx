"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { BotAvatar } from "@/components/ui/primitives";

export interface TourStep {
  target: string; // data-tour value
  title: string;
  body: string;
}

export const steps: TourStep[] = [
  { target: "header", title: "Meet insane", body: "Your agent at a glance — whether it's running, which mode it's in, and how long it has been live." },
  { target: "pnl", title: "Net P&L, front and centre", body: "The number you actually keep, after fees. Scrub the chart to read any moment — hover a token bubble to see the trade behind it." },
  { target: "ai", title: "Your AI co-pilot", body: "Generate a briefing to get a plain-English read across Market Intel, Risk Alerts and Execution Notes — plus one change worth testing." },
  { target: "golive", title: "Go live, with a safety check", body: "Before real SOL is on the line, you'll see how ready this strategy looks based on its paper results." },
  { target: "breakdown", title: "Where the SOL went", body: "Gross result, platform fee and execution cost stacked into one view, so the net never surprises you." },
  { target: "blockers", title: "Why it passed on tokens", body: "The gates that rejected the most tokens in the last 24h. Hover a row to see what the gate checks." },
  { target: "closed", title: "Every trade, explained", body: "Entry, exit, the multiple against break-even, why it closed and how long it held." },
  { target: "open", title: "Live positions", body: "Live holdings with their unrealized P&L and a quick Sell. Right now one trade is open." },
  { target: "ask", title: "Ask insane anything", body: "Chat with your agent about a trade, a setting or the market — it answers with your bot's data." },
  { target: "help", title: "Replay anytime", body: "That's the tour. Tap this button whenever you want a refresher." },
];

type Rect = { x: number; y: number; w: number; h: number };
const PAD = 8;

export function Tour({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [vp, setVp] = useState({ w: 1280, h: 800 });
  const step = steps[i];

  // reset when reopened
  useEffect(() => {
    if (open) setI(0);
  }, [open]);

  // scroll target into view on step change
  useEffect(() => {
    if (!open) return;
    const el = document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [open, step]);

  // track target rect every frame while open (handles smooth scroll + resize)
  useLayoutEffect(() => {
    if (!open) return;
    let raf = 0;
    const tick = () => {
      const el = document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`);
      if (el) {
        const r = el.getBoundingClientRect();
        setRect((prev) =>
          prev && prev.x === r.left && prev.y === r.top && prev.w === r.width && prev.h === r.height
            ? prev
            : { x: r.left, y: r.top, w: r.width, h: r.height }
        );
      }
      setVp((p) => (p.w === window.innerWidth && p.h === window.innerHeight ? p : { w: window.innerWidth, h: window.innerHeight }));
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [open, step]);

  const next = useCallback(() => (i < steps.length - 1 ? setI(i + 1) : onClose()), [i, onClose]);
  const prev = useCallback(() => setI((v) => Math.max(0, v - 1)), []);

  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" || e.key === "Enter") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open, next, prev, onClose]);

  // tooltip placement: below if room, else above; clamp horizontally
  const CARD_W = 340;
  const CARD_H = 200;
  let cx = 0;
  let cy = 0;
  if (rect) {
    const GAP = PAD + 14;
    const clampX = (v: number) => Math.min(Math.max(v, 16), vp.w - CARD_W - 16);
    const clampY = (v: number) => Math.min(Math.max(v, 16), vp.h - CARD_H - 16);
    const below = rect.y + rect.h + GAP;
    const above = rect.y - GAP - CARD_H;
    const left = rect.x - GAP - CARD_W;
    const right = rect.x + rect.w + GAP;
    if (below + CARD_H < vp.h - 16) {
      cx = clampX(rect.x + rect.w / 2 - CARD_W / 2);
      cy = below;
    } else if (above > 16) {
      cx = clampX(rect.x + rect.w / 2 - CARD_W / 2);
      cy = above;
    } else if (left > 16) {
      cx = left;
      cy = clampY(rect.y + 24);
    } else if (right + CARD_W < vp.w - 16) {
      cx = right;
      cy = clampY(rect.y + 24);
    } else {
      // no room outside: dock to the bottom of the viewport
      cx = clampX(rect.x + rect.w / 2 - CARD_W / 2);
      cy = vp.h - CARD_H - 24;
    }
  }

  return (
    <AnimatePresence>
      {open && rect && (
        <motion.div className="fixed inset-0 z-[100]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          {/* click-catcher */}
          <div className="absolute inset-0" onClick={onClose} />
          {/* spotlight */}
          <motion.div
            className="pointer-events-none absolute rounded-[14px]"
            initial={false}
            animate={{ left: rect.x - PAD, top: rect.y - PAD, width: rect.w + PAD * 2, height: rect.h + PAD * 2 }}
            transition={{ type: "spring", stiffness: 260, damping: 32 }}
            style={{ boxShadow: "0 0 0 9999px rgba(6,5,16,.78), 0 0 0 1.5px rgba(184,255,106,.6), 0 0 40px 4px rgba(132,255,1,.25)" }}
          />
          {/* card */}
          <motion.div
            role="dialog"
            aria-label={step.title}
            className="absolute rounded-xl border border-line bg-bg-3 p-5 shadow-pop"
            style={{ width: CARD_W }}
            initial={false}
            animate={{ left: cx, top: cy }}
            transition={{ type: "spring", stiffness: 260, damping: 32 }}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <BotAvatar size={30} />
                <span className="text-[12px] tabular-nums text-muted">
                  Step {i + 1} of {steps.length}
                </span>
              </div>
              <button onClick={onClose} className="icon-btn size-7" aria-label="Close tour">
                <X className="size-4" />
              </button>
            </div>
            <AnimatePresence mode="wait">
              <motion.div key={i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.16 }}>
                <h4 className="mt-3 text-[17px] font-medium">{step.title}</h4>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">{step.body}</p>
              </motion.div>
            </AnimatePresence>
            <div className="mt-5 flex items-center justify-between">
              <div className="flex gap-1">
                {steps.map((_, k) => (
                  <span key={k} className={`h-1 rounded-full transition-all duration-300 ${k === i ? "w-5 bg-accent" : k < i ? "w-1.5 bg-accent/50" : "w-1.5 bg-white/15"}`} />
                ))}
              </div>
              <div className="flex gap-2">
                {i > 0 && (
                  <button onClick={prev} className="btn-ghost h-9 px-3" aria-label="Previous">
                    <ArrowLeft className="size-4" />
                  </button>
                )}
                <button onClick={next} className="btn-primary h-9 px-4">
                  {i === steps.length - 1 ? "Done" : "Next"} {i < steps.length - 1 && <ArrowRight className="size-4" />}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
