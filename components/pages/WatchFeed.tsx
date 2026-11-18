"use client";

import {
  ChartBarIcon,
  ChefHatIcon,
  CheckIcon,
  CrosshairIcon,
  HourglassMediumIcon,
  type Icon,
  MegaphoneSimpleIcon,
  PauseIcon,
  PillIcon,
  PlayIcon,
  ProhibitIcon,
  RecycleIcon,
  RocketLaunchIcon,
  UserIcon,
  UsersIcon,
  UsersThreeIcon,
  XIcon,
} from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { feedCounts, type FeedToken, GATES, justSpotted, nearEntry } from "@/lib/pageData";
import { Card, LiveDot, TokenIcon } from "@/components/ui/primitives";
import { Page } from "./kit";

const GATE_ICON: Record<(typeof GATES)[number]["key"], Icon> = {
  launch: RocketLaunchIcon,
  pump: PillIcon,
  volume: ChartBarIcon,
  holders: UsersIcon,
  dev: ChefHatIcon,
  bundles: RecycleIcon,
  snipers: CrosshairIcon,
  top: UserIcon,
  buyers: UsersThreeIcon,
};

// fresh launches that keep arriving while the feed is live
const INCOMING: Omit<FeedToken, "id">[] = [
  { symbol: "BLINK", name: "Blink Dog", hue: 55, ageSec: 0, mc: 1980, vol: 420, passed: [true, true, false, true, false, true, false, false, false] },
  { symbol: "NOOK", name: "Nook", hue: 175, ageSec: 0, mc: 2610, vol: 760, passed: [true, true, true, false, true, false, true, false, false] },
  { symbol: "RIVET", name: "Rivet", hue: 25, ageSec: 0, mc: 1420, vol: 230, passed: [true, true, false, false, true, false, false, false, false] },
  { symbol: "PLUM", name: "Plum Season", hue: 290, ageSec: 0, mc: 3050, vol: 1180, passed: [true, true, true, true, false, true, false, true, false] },
];

const usd = (v: number) => (v >= 1000 ? `$${(v / 1000).toFixed(v >= 100000 ? 1 : 2)}k` : `$${v.toFixed(0)}`);
const age = (s: number) => (s < 60 ? `${s}s` : s < 3600 ? `${Math.floor(s / 60)}m` : `${Math.floor(s / 3600)}h`);

export function WatchFeed() {
  const [spotted, setSpotted] = useState(justSpotted);
  const [near, setNear] = useState(nearEntry);
  const [paused, setPaused] = useState({ spotted: false, near: false });
  const [count, setCount] = useState(feedCounts.spotted);

  // ages tick every second
  useEffect(() => {
    const id = setInterval(() => {
      setSpotted((xs) => (paused.spotted ? xs : xs.map((t) => ({ ...t, ageSec: t.ageSec + 1 }))));
      setNear((xs) => (paused.near ? xs : xs.map((t) => ({ ...t, ageSec: t.ageSec + 1 }))));
    }, 1000);
    return () => clearInterval(id);
  }, [paused]);

  // a new launch slides in every few seconds
  useEffect(() => {
    if (paused.spotted) return;
    let n = 0;
    const id = setInterval(() => {
      const next = INCOMING[n % INCOMING.length];
      n += 1;
      setSpotted((xs) => [{ ...next, id: `in-${Date.now()}`, ageSec: 1 }, ...xs].slice(0, 6));
      setCount((c) => c + 1);
    }, 7000);
    return () => clearInterval(id);
  }, [paused.spotted]);

  return (
    <Page>
      <div className="grid gap-5 lg:grid-cols-2">
        <Column
          icon={MegaphoneSimpleIcon}
          title="Just spotted"
          meta={`newest first · ${count}`}
          paused={paused.spotted}
          onPause={() => setPaused((p) => ({ ...p, spotted: !p.spotted }))}
          tokens={spotted}
        />
        <Column
          icon={HourglassMediumIcon}
          title="Near entry"
          meta={`fewest gates left · ${feedCounts.near}`}
          paused={paused.near}
          onPause={() => setPaused((p) => ({ ...p, near: !p.near }))}
          tokens={[...near].sort((a, b) => b.passed.filter(Boolean).length - a.passed.filter(Boolean).length)}
        />
      </div>
    </Page>
  );
}

function Column({
  icon: I,
  title,
  meta,
  paused,
  onPause,
  tokens,
}: {
  icon: Icon;
  title: string;
  meta: string;
  paused: boolean;
  onPause: () => void;
  tokens: FeedToken[];
}) {
  return (
    <section className="min-w-0">
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-2.5">
          <I className="size-4 text-muted" />
          <h2 className="text-[14px] font-medium">{title}</h2>
          {paused ? (
            <span className="text-[11.5px] text-warn">paused</span>
          ) : (
            <span className="flex items-center gap-1.5 text-[11.5px] text-subtle">
              <LiveDot size={5} /> live
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[12px] tabular-nums text-subtle">{meta}</span>
          <button onClick={onPause} className="icon-btn size-7" aria-label={paused ? `Resume ${title}` : `Pause ${title}`} title={paused ? "Resume" : "Pause"}>
            {paused ? <PlayIcon className="size-3.5" weight="fill" /> : <PauseIcon className="size-3.5" weight="fill" />}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <AnimatePresence initial={false}>
          {tokens.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <FeedCard t={t} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}

function FeedCard({ t }: { t: FeedToken }) {
  const [checking, setChecking] = useState(false);
  const passed = t.passed.filter(Boolean).length;
  const fresh = t.ageSec < 60;

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-3.5 px-4 py-3.5">
        <TokenIcon symbol={t.symbol} hue={t.hue} size={42} badge />
        <div className="ml-1 min-w-0 flex-1">
          <p className="flex items-baseline gap-2 truncate">
            <span className="text-[14px] font-medium">{t.symbol}</span>
            <span className="truncate text-[12px] text-subtle">{t.name}</span>
          </p>
          <p className={`mt-0.5 text-[12px] tabular-nums ${fresh ? "text-green" : "text-muted"}`}>{age(t.ageSec)}</p>
        </div>
        <div className="hidden text-right sm:block">
          <p className="text-[12px] tabular-nums">
            <span className="text-subtle">MC </span>
            <span className="text-fg">{usd(t.mc)}</span>
            <span className="ml-2.5 text-subtle">V </span>
            <span className="text-fg">{usd(t.vol)}</span>
          </p>
          <div className="mt-1.5 flex justify-end gap-1.5">
            <button className="h-7 rounded-full border border-line px-3 text-[12px] text-muted transition-colors hover:border-white/20 hover:text-fg active:scale-[.97]">
              Buy
            </button>
            <button
              onClick={() => setChecking((c) => !c)}
              className={`h-7 rounded-full px-3 text-[12px] transition-colors active:scale-[.97] ${
                checking ? "bg-fg text-bg" : "bg-white/[.07] text-fg hover:bg-white/[.12]"
              }`}
            >
              Entry check
            </button>
          </div>
        </div>
      </div>

      {/* gate strip: one icon per entry gate, thin line under each shows pass / fail */}
      <div className="flex items-center gap-3 border-t border-line px-4 py-2.5">
        <div className="flex flex-1 items-center justify-between">
          {GATES.map((g, i) => {
            const I = GATE_ICON[g.key];
            const ok = t.passed[i];
            return (
              <span key={g.key} title={`${g.label}: ${ok ? "passed" : "not yet"}`} className="group flex flex-col items-center gap-1.5">
                <I className={`size-4 transition-colors ${ok ? "text-fg" : "text-subtle/70 group-hover:text-muted"}`} weight={ok ? "regular" : "light"} />
                <span className={`h-[2px] w-4 rounded-full ${ok ? "bg-green" : "bg-white/[.08]"}`} />
              </span>
            );
          })}
        </div>
        <span className="w-10 text-right text-[11.5px] tabular-nums text-subtle">
          {passed}/{GATES.length}
        </span>
        <button className="icon-btn size-7" aria-label={`Never buy ${t.symbol}`} title="Never buy this token">
          <ProhibitIcon className="size-4" />
        </button>
      </div>

      <AnimatePresence initial={false}>
        {checking && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <ul className="grid grid-cols-1 gap-x-6 gap-y-1.5 border-t border-line px-4 py-3 sm:grid-cols-2">
              {GATES.map((g, i) => (
                <li key={g.key} className="flex items-center gap-2 text-[12.5px]">
                  {t.passed[i] ? <CheckIcon className="size-3.5 text-green" weight="bold" /> : <XIcon className="size-3.5 text-red" weight="bold" />}
                  <span className={t.passed[i] ? "text-muted" : "text-fg"}>{g.label}</span>
                </li>
              ))}
            </ul>
            <p className="px-4 pb-3 text-[12px] text-subtle">
              {GATES.length - passed === 0 ? "Passes every gate — the bot will buy on the next tick." : `${GATES.length - passed} gate${GATES.length - passed === 1 ? "" : "s"} left before the bot buys.`}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
