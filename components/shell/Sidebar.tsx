"use client";

import {
  ArchiveIcon,
  ArrowsLeftRightIcon,
  BinocularsIcon,
  BoatIcon,
  CaretDownIcon,
  CaretLeftIcon,
  CoinsIcon,
  FadersIcon,
  FlagBannerIcon,
  FlaskIcon,
  type Icon,
  SidebarSimpleIcon,
  SquaresFourIcon,
  StackIcon,
  WalletIcon,
} from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BotAvatar, LiveDot } from "@/components/ui/primitives";
import { bot, closedTrades, openTrades, pnl } from "@/lib/data";
import { AGENT_PAGES } from "@/lib/nav";

type Item = { icon: Icon; label: string; href?: string; count?: number; live?: boolean; dot?: boolean };

const global: Item[] = [
  { icon: FlagBannerIcon, label: "Arena" },
  { icon: BoatIcon, label: "Fleet" },
  { icon: StackIcon, label: "Open Positions" },
  { icon: ArchiveIcon, label: "Closed Positions" },
  { icon: ArrowsLeftRightIcon, label: "Transactions" },
];

const ICONS: Record<string, Icon> = {
  "/": SquaresFourIcon,
  "/watch-feed": BinocularsIcon,
  "/open-positions": StackIcon,
  "/closed-positions": ArchiveIcon,
  "/ai-optimizations": FlaskIcon,
  "/configure": FadersIcon,
  "/rewards": CoinsIcon,
};
const EXTRA: Record<string, Partial<Item>> = {
  "/watch-feed": { live: true },
  "/open-positions": { count: openTrades.length },
  "/closed-positions": { count: closedTrades.length },
  "/ai-optimizations": { dot: true },
};

const agent: Item[] = AGENT_PAGES.map((p) => ({ icon: ICONS[p.href], label: p.label, href: p.href, ...EXTRA[p.href] }));

export function Sidebar() {
  const [open, setOpen] = useState(true);
  const pathname = usePathname();
  return (
    <aside data-tour="sidebar" className="hidden h-full w-[232px] shrink-0 flex-col border-r border-line bg-bg lg:flex">
      {/* brand */}
      <div className="flex h-16 shrink-0 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 rounded-md transition-opacity hover:opacity-80">
          <Logo />
          <span className="text-[15px] font-medium tracking-tight">TrenchersAI</span>
        </Link>
        <button className="icon-btn size-7" aria-label="Collapse sidebar" title="Collapse sidebar">
          <SidebarSimpleIcon className="size-4" />
        </button>
      </div>

      <nav className="no-scrollbar flex-1 overflow-y-auto px-3 pb-3">
        <Section label="All agents">
          {global.map((i) => (
            <NavRow key={i.label} item={i} />
          ))}
        </Section>

        <Section label="Agent">
          {/* the agent itself, as a collapsible group */}
          <button
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="group flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-white/[.045]"
          >
            <BotAvatar size={24} />
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-medium leading-tight">insane</span>
              <span className="flex items-center gap-1.5 text-[11.5px] leading-tight text-subtle">
                <LiveDot size={5} /> Running · Paper
              </span>
            </span>
            <CaretDownIcon className={`size-3.5 text-subtle transition-transform duration-200 group-hover:text-fg ${open ? "" : "-rotate-90"}`} />
          </button>

          <AnimatePresence initial={false}>
            {open && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <div className="mt-0.5 space-y-px">
                  {agent.map((i) => (
                    <NavRow key={i.label} item={i} active={i.href === pathname} />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Section>
      </nav>

      {/* footer */}
      <div className="shrink-0 space-y-px border-t border-line px-3 py-2.5">
        <a href="#" className="group flex items-center gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-white/[.045]">
          <WalletIcon className="size-4 text-subtle transition-colors group-hover:text-fg" />
          <span className="flex-1 text-[13px] text-muted transition-colors group-hover:text-fg">Paper wallet</span>
          <span className="text-right leading-tight">
            <span className="block text-[13px] tabular-nums text-fg">{pnl.balance.toFixed(3)}</span>
            <span className="block text-[11px] tabular-nums text-subtle">${(pnl.balance * bot.solUsd).toFixed(2)}</span>
          </span>
        </a>
        <a href="#" className="group flex items-center gap-2.5 rounded-lg px-2 py-2 text-[13px] text-muted transition-colors hover:bg-white/[.045] hover:text-fg">
          <CaretLeftIcon className="size-4 text-subtle transition-transform group-hover:-translate-x-0.5 group-hover:text-fg" />
          Manual trading
        </a>
      </div>
    </aside>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-2.5 first:mt-0">
      <p className="px-2 pb-1 pt-1.5 text-[11px] uppercase tracking-[0.08em] text-subtle">{label}</p>
      <div className="space-y-px">{children}</div>
    </div>
  );
}

function NavRow({ item: i, active = false }: { item: Item; active?: boolean }) {
  return (
    <Link
      href={i.href ?? "#"}
      aria-current={active ? "page" : undefined}
      className={`group relative flex h-[30px] items-center gap-2.5 rounded-lg px-2 text-[13px] transition-colors ${
        active ? "bg-white/[.07] text-fg" : "text-muted hover:bg-white/[.045] hover:text-fg"
      }`}
    >
      <i.icon
        weight={active ? "fill" : "regular"}
        className={`size-4 shrink-0 transition-colors ${active ? "text-accent" : "text-subtle group-hover:text-fg"}`}
      />
      <span className="flex-1 truncate">{i.label}</span>
      {i.live && (
        <span className="flex items-center gap-1.5 text-[11px] text-subtle group-hover:text-muted">
          <LiveDot size={5} /> live
        </span>
      )}
      {typeof i.count === "number" && (
        <span className="min-w-5 rounded-full px-1.5 text-center text-[11px] tabular-nums text-subtle transition-colors group-hover:bg-white/[.06] group-hover:text-fg">
          {i.count}
        </span>
      )}
      {i.dot && <span className="size-1.5 rounded-full bg-accent" title="New suggestions" />}
    </Link>
  );
}

function Logo() {
  return (
    <svg viewBox="0 0 28 28" className="size-6" aria-hidden>
      <path d="M3 7c6-4 15-4 22 0-5 0-8 2-10 5 4-1 7 0 9 2-5-1-9 1-11 5l-2 6-2-6C8 15 6 12 3 7z" fill="#84ff01" />
    </svg>
  );
}
