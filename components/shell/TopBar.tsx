"use client";

import { ChevronsUpDown, HelpCircle, Search } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { BotAvatar } from "@/components/ui/primitives";

export function TopBar({ onTour }: { onTour: () => void }) {
  const [mode, setMode] = useState<"paper" | "live">("paper");
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-bg/80 px-4 backdrop-blur-xl md:px-6">
      {/* mode */}
      <div data-tour="mode" className="relative flex rounded-full bg-white/[.05] p-1">
        {(["paper", "live"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`relative z-10 rounded-full px-3.5 py-1.5 text-[13px] font-medium capitalize transition-colors ${
              mode === m ? "text-fg" : "text-muted hover:text-fg"
            }`}
          >
            {mode === m && (
              <motion.span
                layoutId="mode-pill"
                className="absolute inset-0 -z-10 rounded-full bg-white/[.09] shadow-[inset_0_1px_0_rgba(255,255,255,.06)]"
                transition={{ type: "spring", stiffness: 500, damping: 38 }}
              />
            )}
            {m}
          </button>
        ))}
      </div>

      {/* breadcrumb */}
      <nav className="hidden items-center gap-1 text-[14px] sm:flex">
        <button className="crumb">
          insane <ChevronsUpDown className="size-3.5 text-subtle" />
        </button>
        <span className="text-subtle">/</span>
        <button className="crumb text-fg">
          Dashboard <ChevronsUpDown className="size-3.5 text-subtle" />
        </button>
      </nav>

      <div className="flex-1" />

      <button className="hidden md:flex h-9 w-56 items-center gap-2 rounded-full bg-white/[.05] px-3 text-[13px] text-subtle hover:bg-white/[.07] transition-colors">
        <Search className="size-4" />
        Search tokens, trades
        <kbd className="ml-auto rounded-md bg-white/[.06] px-1.5 text-[11px] text-muted">⌘K</kbd>
      </button>

      <button onClick={onTour} className="icon-btn size-9" aria-label="Take the tour" data-tour="help">
        <HelpCircle className="size-[18px]" />
      </button>

      <button data-tour="ask" className="btn-primary group h-9 pl-1 pr-4">
        <span className="grid size-7 place-items-center rounded-full bg-bg transition-transform group-hover:-rotate-6">
          <BotAvatar size={22} />
        </span>
        Ask insane
      </button>
    </header>
  );
}
