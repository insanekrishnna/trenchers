"use client";

import { CaretUpDownIcon, ListIcon, MagnifyingGlassIcon, QuestionIcon } from "@phosphor-icons/react";
import { usePathname } from "next/navigation";
import { pageLabel } from "@/lib/nav";
import { motion } from "motion/react";
import { useState } from "react";
import { BotAvatar } from "@/components/ui/primitives";

export function TopBar({ onTour, onMenu }: { onTour: () => void; onMenu: () => void }) {
  const [mode, setMode] = useState<"paper" | "live">("paper");
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-line bg-bg/80 px-3 backdrop-blur-xl sm:h-16 sm:gap-3 sm:px-4 md:px-6">
      {/* menu: phones and tablets, where the sidebar is a drawer */}
      {/* wrapper does the hiding: .icon-btn sets display itself and would override lg:hidden */}
      <span className="-ml-1 lg:hidden">
      <button onClick={onMenu} className="icon-btn size-9" aria-label="Open menu" title="Menu">
        <ListIcon className="size-5" />
      </button>
      </span>

      {/* mode */}
      <div data-tour="mode" className="relative flex rounded-full bg-white/[.05] p-1">
        {(["paper", "live"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`relative z-10 rounded-full px-3 py-1.5 text-[13px] font-medium capitalize transition-colors sm:px-3.5 ${
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
          insane <CaretUpDownIcon className="size-3.5 text-subtle" />
        </button>
        <span className="text-subtle">/</span>
        <button className="crumb text-fg">
          {pageLabel(pathname)} <CaretUpDownIcon className="size-3.5 text-subtle" />
        </button>
      </nav>

      <div className="flex-1" />

      <button className="hidden h-9 w-56 shrink-0 items-center gap-2 whitespace-nowrap rounded-full bg-white/[.05] px-3 text-[13px] text-subtle transition-colors hover:bg-white/[.07] xl:flex">
        <MagnifyingGlassIcon className="size-4" />
        Search tokens, trades
        <kbd className="ml-auto rounded-md bg-white/[.06] px-1.5 text-[11px] text-muted">⌘K</kbd>
      </button>

      <button onClick={onTour} className="icon-btn size-9" aria-label="Take the tour" data-tour="help">
        <QuestionIcon className="size-[18px]" />
      </button>

      <button data-tour="ask" className="btn-primary group h-9 shrink-0 whitespace-nowrap pl-1 pr-1 sm:pr-4" aria-label="Ask insane">
        <span className="grid size-7 place-items-center rounded-full bg-bg transition-transform group-hover:-rotate-6">
          <BotAvatar size={22} />
        </span>
        <span className="hidden sm:inline">Ask insane</span>
      </button>
    </header>
  );
}
