"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, FolderDown, Pause, Play, Share2, Wallet, ShieldAlert } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { BotAvatar, LiveDot } from "@/components/ui/primitives";
import { fmtPct, pnl } from "@/lib/data";

export function BotHeader() {
  const [paused, setPaused] = useState(false);
  const [liveOpen, setLiveOpen] = useState(false);
  const pop = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!liveOpen) return;
    const close = (e: MouseEvent) => {
      if (pop.current && !pop.current.contains(e.target as Node)) setLiveOpen(false);
    };
    window.addEventListener("mousedown", close);
    return () => window.removeEventListener("mousedown", close);
  }, [liveOpen]);

  return (
    <section data-tour="header" className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-4">
        <BotAvatar size={52} />
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-[26px] font-medium leading-none tracking-tight">insane</h1>
            <span className="rounded-full border border-white/60 px-2 py-px text-[12px] font-medium leading-[18px] text-fg">Paper</span>
          </div>
          <p className="mt-1.5 flex h-5 items-center gap-2 text-[13px] leading-5">
            <LiveDot tone={paused ? "warn" : "green"} still={paused} size={7} />
            <span className="text-fg/90">
              {paused ? "Paused" : "Running"} <span className="tabular-nums text-muted">{paused ? "after 7h 44m" : "for 7h 44m"}</span>
            </span>
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        {/* one grouped toolbar instead of four separate pills */}
        <div className="flex h-9 items-center rounded-full border border-line bg-white/[.02] p-0.5">
          <button
            onClick={() => setPaused((p) => !p)}
            data-tour="pause"
            className="flex h-7.5 w-[96px] items-center justify-center gap-2 rounded-full text-[13px] font-medium text-fg/90 transition-colors hover:bg-white/[.06]"
          >
            <span className="relative grid size-4 place-items-center">
              <AnimatePresence initial={false} mode="popLayout">
                <motion.span
                  key={paused ? "play" : "pause"}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  transition={{ duration: 0.15 }}
                  className="absolute"
                >
                  {paused ? <Play className="size-3.5 fill-current" /> : <Pause className="size-3.5 fill-current" />}
                </motion.span>
              </AnimatePresence>
            </span>
            {paused ? "Resume" : "Pause"}
          </button>
          <span className="mx-1 h-4 w-px bg-line" />
          <button className="flex h-7.5 items-center gap-2 rounded-full px-3 text-[13px] font-medium text-fg/90 transition-colors hover:bg-white/[.06]">
            <Wallet className="size-3.5" /> Fund / Withdraw
          </button>
          <span className="mx-1 h-4 w-px bg-line" />
          <button className="grid size-7.5 place-items-center rounded-full text-muted transition-colors hover:bg-white/[.06] hover:text-fg" aria-label="Export trades" title="Export trades">
            <FolderDown className="size-4" />
          </button>
          <button className="grid size-7.5 place-items-center rounded-full text-muted transition-colors hover:bg-white/[.06] hover:text-fg" aria-label="Share bot" title="Share bot">
            <Share2 className="size-4" />
          </button>
        </div>

        <div className="relative" ref={pop}>
          <button onClick={() => setLiveOpen((o) => !o)} className="btn-live h-9 pl-4 pr-3.5" data-tour="golive">
            Go Live <ArrowUpRight className="size-3.5" strokeWidth={2.25} />
          </button>
          <AnimatePresence>
            {liveOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                className="absolute right-0 top-11 z-40 w-[320px] rounded-lg border border-line bg-bg-3 p-4 shadow-pop"
              >
                <div className="flex items-start gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-warn/15 text-warn">
                    <ShieldAlert className="size-[18px]" />
                  </span>
                  <div>
                    <p className="text-[15px] font-medium">Readiness check</p>
                    <p className="mt-1 text-[13px] leading-relaxed text-muted">
                      Paper results so far: <span className={pnl.net >= 0 ? "text-green" : "text-red"}>{fmtPct(pnl.netPct)}</span> over{" "}
                      {pnl.roundTrips} round-trips. We suggest 20+ trades and a positive net before using real SOL.
                    </p>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <Progress label="Round-trips" value={pnl.roundTrips} goal={20} />
                  <Progress label="Win rate" value={+pnl.winRate.toFixed(1)} goal={40} suffix="%" />
                </div>
                <div className="mt-4 flex gap-2">
                  <button onClick={() => setLiveOpen(false)} className="btn-ghost h-9 flex-1 justify-center">
                    Keep testing
                  </button>
                  <button className="btn-live h-9 flex-1 justify-center">Go live anyway</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

function Progress({ label, value, goal, suffix = "" }: { label: string; value: number; goal: number; suffix?: string }) {
  const pct = Math.min(100, (value / goal) * 100);
  return (
    <div>
      <div className="flex justify-between text-[12px]">
        <span className="text-muted">{label}</span>
        <span className="tabular-nums">
          {value}
          {suffix} <span className="text-subtle">/ {goal}{suffix}</span>
        </span>
      </div>
      <div className="mt-1.5 h-[3px] overflow-hidden rounded-full bg-white/[.06]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="h-full rounded-full bg-warn"
        />
      </div>
    </div>
  );
}
