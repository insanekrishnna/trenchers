"use client";

import {
  Flag,
  LayoutGrid,
  ListOrdered,
  History,
  ArrowLeftRight,
  Home,
  Radio,
  Sparkles,
  SlidersHorizontal,
  Gift,
  ChevronLeft,
  ChevronDown,
  PanelLeft,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import { BotAvatar, LiveDot } from "@/components/ui/primitives";
import { bot, pnl } from "@/lib/data";

const global = [
  { icon: Flag, label: "Arena" },
  { icon: LayoutGrid, label: "Fleet" },
  { icon: ListOrdered, label: "Open Positions" },
  { icon: History, label: "Closed Positions" },
  { icon: ArrowLeftRight, label: "Transactions" },
];

const agent = [
  { icon: Home, label: "Dashboard", active: true },
  { icon: Radio, label: "Watch Feed", badge: "live" },
  { icon: ListOrdered, label: "Open Positions", count: 1 },
  { icon: History, label: "Closed Positions", count: 6 },
  { icon: Sparkles, label: "AI optimizations", dot: true },
  { icon: SlidersHorizontal, label: "Configure" },
  { icon: Gift, label: "Rewards" },
];

export function Sidebar() {
  const [open, setOpen] = useState(true);
  return (
    <aside
      data-tour="sidebar"
      className="hidden lg:flex h-full w-[248px] shrink-0 flex-col border-r border-line bg-bg px-3 pb-3"
    >
      {/* brand */}
      <div className="flex h-16 items-center justify-between px-2">
        <div className="flex items-center gap-2.5">
          <Logo />
          <span className="text-[17px] font-medium tracking-tight">TrenchersAI</span>
        </div>
        <button className="icon-btn size-8" aria-label="Collapse sidebar">
          <PanelLeft className="size-4" />
        </button>
      </div>

      <nav className="mt-2 flex-1 overflow-y-auto no-scrollbar">
        <p className="nav-label">All agents</p>
        <ul className="space-y-0.5">
          {global.map((i) => (
            <li key={i.label}>
              <a className="nav-item" href="#">
                <i.icon className="size-[18px]" strokeWidth={1.75} />
                {i.label}
              </a>
            </li>
          ))}
        </ul>

        <p className="nav-label mt-6">Per-agent activity</p>
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left hover:bg-white/[.04] transition-colors"
        >
          <BotAvatar size={28} />
          <span className="flex-1">
            <span className="block text-[14px] font-medium leading-tight">insane</span>
            <span className="block text-[12px] text-muted leading-tight">v1 · Paper</span>
          </span>
          <ChevronDown className={`size-4 text-muted transition-transform ${open ? "" : "-rotate-90"}`} />
        </button>
        {open && (
          <ul className="relative mt-1 ml-[22px] space-y-0.5 border-l border-line pl-2">
            {agent.map((i) => (
              <li key={i.label}>
                <a className={`nav-item ${i.active ? "nav-item-active" : ""}`} href="#">
                  <i.icon className="size-4" strokeWidth={1.75} />
                  <span className="flex-1">{i.label}</span>
                  {i.badge && (
                    <span className="flex items-center gap-1 text-[11px] text-green">
                      <LiveDot size={6} />
                      {i.badge}
                    </span>
                  )}
                  {typeof i.count === "number" && (
                    <span className="tabular-nums text-[12px] text-subtle">{i.count}</span>
                  )}
                  {i.dot && <span className="size-1.5 rounded-full bg-accent" />}
                </a>
              </li>
            ))}
          </ul>
        )}
      </nav>

      {/* footer */}
      <div className="space-y-2 pt-3">
        <div className="rounded-lg border border-line bg-bg-2 p-3">
          <div className="flex items-center gap-2 text-[12px] text-muted">
            <Wallet className="size-3.5" /> Paper wallet
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="tabular-nums text-[15px] font-medium">{pnl.balance.toFixed(3)} SOL</span>
            <span className="tabular-nums text-[12px] text-subtle">≈ ${(pnl.balance * bot.solUsd).toFixed(2)}</span>
          </div>
        </div>
        <a className="nav-item text-muted" href="#">
          <ChevronLeft className="size-4" /> Manual trading
        </a>
      </div>
    </aside>
  );
}

function Logo() {
  return (
    <svg viewBox="0 0 28 28" className="size-7" aria-hidden>
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#b8ff6a" />
          <stop offset="1" stopColor="#84ff01" />
        </linearGradient>
      </defs>
      <path d="M3 7c6-4 15-4 22 0-5 0-8 2-10 5 4-1 7 0 9 2-5-1-9 1-11 5l-2 6-2-6C8 15 6 12 3 7z" fill="url(#lg)" />
    </svg>
  );
}
