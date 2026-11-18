"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, ArrowUp, Check, Radar, RotateCw, ShieldAlert, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { briefing, pnl } from "@/lib/data";
import { BotAvatar, Card } from "@/components/ui/primitives";

type Phase = "idle" | "working" | "ready";
type Tab = "intel" | "risk" | "exec";

const TABS: { key: Tab; label: string; icon: typeof Radar; blurb: string; color: string }[] = [
  { key: "intel", label: "Market Intel", icon: Radar, blurb: "What's working and how reliable it is", color: "#7cc4ff" },
  { key: "risk", label: "Risk Alerts", icon: ShieldAlert, blurb: "Where risk is building up", color: "#ff622e" },
  { key: "exec", label: "Execution Notes", icon: Zap, blurb: "Fees, fills and exit timing", color: "#ffc74f" },
];

export function AiInsights() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [step, setStep] = useState(0);
  const [tab, setTab] = useState<Tab>("intel");

  useEffect(() => {
    if (phase !== "working") return;
    if (step >= briefing.steps.length) {
      const t = setTimeout(() => setPhase("ready"), 300);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setStep((s) => s + 1), 1000);
    return () => clearTimeout(t);
  }, [phase, step]);

  const start = () => {
    setStep(0);
    setPhase("working");
  };

  return (
    <Card data-tour="ai" className="flex h-full flex-col overflow-hidden">
      {/* header */}
      <div className="flex items-center justify-between px-5 pb-3 pt-4">
        <div className="flex items-center gap-2.5">
          <BotAvatar size={22} />
          <h3 className="text-[14px] font-medium">AI Insights</h3>
        </div>
        {phase === "ready" ? (
          <button onClick={start} className="flex items-center gap-1.5 text-[12px] text-subtle transition-colors hover:text-fg">
            <RotateCw className="size-3" /> Refresh
          </button>
        ) : (
          <span className="text-[12px] text-subtle">{pnl.roundTrips} trades to read</span>
        )}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {/* ---------------- idle ---------------- */}
        {phase === "idle" && (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-1 flex-col px-5 pb-5">
            <p className="text-[13px] leading-relaxed text-muted">
              A short read on the last {pnl.roundTrips} trades, in three parts:
            </p>
            <ul className="mt-3 divide-y divide-line border-y border-line">
              {TABS.map((t) => (
                <li key={t.key} className="flex items-center gap-3 py-3">
                  <t.icon className="size-4 shrink-0" style={{ color: t.color }} strokeWidth={1.75} />
                  <div className="min-w-0">
                    <p className="text-[13px] text-fg">{t.label}</p>
                    <p className="text-[12px] text-subtle">{t.blurb}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="flex-1" />
            <div className="mt-5 flex items-center justify-between">
              <span className="text-[12px] text-subtle">Takes about 5 seconds</span>
              <button
                onClick={start}
                className="flex h-8 items-center gap-1.5 rounded-full bg-fg pl-3.5 pr-3 text-[13px] font-medium text-bg transition-opacity hover:opacity-90 active:scale-[.98]"
              >
                Generate briefing <ArrowRight className="size-3.5" />
              </button>
            </div>
          </motion.div>
        )}

        {/* ---------------- working ---------------- */}
        {phase === "working" && (
          <motion.ol key="working" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 px-5 pb-5 pt-1">
            {briefing.steps.map((s, i) => {
              const state = i < step ? "done" : i === step ? "active" : "todo";
              return (
                <li key={s.title} className="relative flex gap-3 pb-4 last:pb-0">
                  {i < briefing.steps.length - 1 && (
                    <span className="absolute left-[7px] top-5 h-[calc(100%-16px)] w-px bg-line">
                      <motion.span
                        className="block w-px bg-accent"
                        initial={{ height: 0 }}
                        animate={{ height: state === "done" ? "100%" : 0 }}
                        transition={{ duration: 0.35 }}
                      />
                    </span>
                  )}
                  <StepIcon state={state} />
                  <div className={state === "todo" ? "opacity-40" : ""}>
                    <p className={`text-[13px] ${state === "active" ? "text-fg" : "text-muted"}`}>{s.title}</p>
                    <p className="mt-0.5 text-[12px] leading-relaxed text-subtle">{s.body}</p>
                  </div>
                </li>
              );
            })}
          </motion.ol>
        )}

        {/* ---------------- ready ---------------- */}
        {phase === "ready" && (
          <motion.div key="ready" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-1 flex-col">
            {/* underline tabs */}
            <div className="flex gap-5 border-b border-line px-5">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`relative pb-2.5 text-[12.5px] transition-colors ${tab === t.key ? "text-fg" : "text-subtle hover:text-muted"}`}
                >
                  {t.label}
                  {tab === t.key && (
                    <motion.span layoutId="ai-underline" className="absolute inset-x-0 -bottom-px h-px bg-accent" transition={{ type: "spring", stiffness: 500, damping: 40 }} />
                  )}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.ul
                key={tab}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="divide-y divide-line px-5"
              >
                {briefing.tabs[tab].map((b, i) => (
                  <li key={b.k} className="grid grid-cols-[22px_1fr_auto] items-baseline gap-x-2 py-3.5">
                    <span className="text-[11px] tabular-nums text-subtle">{String(i + 1).padStart(2, "0")}</span>
                    <p className="text-[13px] text-fg">{b.k}</p>
                    <span className="text-[15px] font-light tabular-nums" style={{ color: TABS.find((t) => t.key === tab)!.color }}>
                      {b.s}
                    </span>
                    <p className="col-start-2 col-end-4 mt-1 text-[12.5px] leading-relaxed text-muted">{b.v}</p>
                  </li>
                ))}
              </motion.ul>
            </AnimatePresence>

            <div className="flex-1" />

            {/* one suggestion */}
            <div className="mx-5 mt-2 rounded-lg border border-line p-3.5">
              <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.08em] text-subtle">
                <span className="size-1.5 rounded-full bg-accent" /> Worth testing
              </p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-fg">{briefing.suggestion}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[12px] text-subtle">Paper only · easy to undo</span>
                <button className="flex h-7 items-center gap-1.5 rounded-full bg-fg pl-3 pr-2.5 text-[12.5px] font-medium text-bg transition-opacity hover:opacity-90">
                  Apply <ArrowRight className="size-3.5" />
                </button>
              </div>
            </div>
            <label className="m-5 mt-3 flex h-9 items-center gap-2 rounded-full border border-line pl-3.5 pr-1 focus-within:border-white/20">
              <input placeholder="Ask a follow-up…" className="h-full flex-1 bg-transparent text-[13px] outline-none placeholder:text-subtle" />
              <button className="grid size-7 place-items-center rounded-full bg-fg text-bg transition-opacity hover:opacity-90" aria-label="Send">
                <ArrowUp className="size-3.5" />
              </button>
            </label>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

function StepIcon({ state }: { state: "done" | "active" | "todo" }) {
  if (state === "done")
    return (
      <span className="relative z-10 mt-0.5 grid size-[15px] shrink-0 place-items-center rounded-full bg-accent text-bg">
        <Check className="size-2.5" strokeWidth={3.5} />
      </span>
    );
  if (state === "active")
    return (
      <span className="relative z-10 mt-0.5 size-[15px] shrink-0 animate-spin rounded-full border-[1.5px] border-white/15 border-t-accent" />
    );
  return <span className="relative z-10 mt-0.5 size-[15px] shrink-0 rounded-full border-[1.5px] border-line" />;
}
