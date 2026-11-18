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
import { useEffect, useRef, useState } from "react";
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

type Live = FeedToken & { readyAt?: number };

const p = (s: string) => s.split("").map((c) => c === "1");

// fresh launches that keep arriving in "Just spotted"
const INCOMING: Omit<FeedToken, "id">[] = [
  { symbol: "BLINK", name: "Blink Dog", hue: 55, ageSec: 0, mc: 1980, vol: 420, passed: p("110100100") },
  { symbol: "NOOK", name: "Nook", hue: 175, ageSec: 0, mc: 2610, vol: 760, passed: p("111010100") },
  { symbol: "RIVET", name: "Rivet", hue: 25, ageSec: 0, mc: 1420, vol: 230, passed: p("110010000") },
  { symbol: "PLUM", name: "Plum Season", hue: 290, ageSec: 0, mc: 3050, vol: 1180, passed: p("111101010") },
];
// coins that graduate into "Near entry" when one there becomes ready
const CLIMBERS: Omit<FeedToken, "id">[] = [
  { symbol: "FERN", name: "Fern & Co", hue: 135, ageSec: 240, mc: 5120, vol: 9100, passed: p("111101100") },
  { symbol: "QUILL", name: "Quill", hue: 45, ageSec: 420, mc: 6340, vol: 12800, passed: p("110111100") },
  { symbol: "TIDE", name: "Low Tide", hue: 195, ageSec: 180, mc: 4780, vol: 7300, passed: p("111110010") },
];

const usd = (v: number) => (v >= 1000 ? `$${(v / 1000).toFixed(v >= 100000 ? 1 : 2)}k` : `$${v.toFixed(0)}`);
const age = (s: number) => (s < 60 ? `${s}s` : s < 3600 ? `${Math.floor(s / 60)}m` : `${Math.floor(s / 3600)}h`);
const count = (t: FeedToken) => t.passed.filter(Boolean).length;

export function WatchFeed() {
  const [spotted, setSpotted] = useState<Live[]>(justSpotted);
  const [near, setNear] = useState<Live[]>(nearEntry);
  const [paused, setPaused] = useState({ spotted: false, near: false });
  const [seen, setSeen] = useState(feedCounts.spotted);
  const climb = useRef(0);

  // ages tick every second
  useEffect(() => {
    const id = setInterval(() => {
      if (!paused.spotted) setSpotted((xs) => xs.map((t) => ({ ...t, ageSec: t.ageSec + 1 })));
      if (!paused.near) setNear((xs) => xs.map((t) => ({ ...t, ageSec: t.ageSec + 1 })));
    }, 1000);
    return () => clearInterval(id);
  }, [paused]);

  // new launches slide into "Just spotted"
  useEffect(() => {
    if (paused.spotted) return;
    let n = 0;
    const id = setInterval(() => {
      const next = INCOMING[n++ % INCOMING.length];
      setSpotted((xs) => [{ ...next, id: `in-${Date.now()}`, ageSec: 1 }, ...xs].slice(0, 6));
      setSeen((c) => c + 1);
    }, 8000);
    return () => clearInterval(id);
  }, [paused.spotted]);

  // near-entry coins keep clearing gates — the track fills as they do
  useEffect(() => {
    if (paused.near) return;
    const id = setInterval(() => {
      setNear((xs) => {
        const now = Date.now();
        // a coin that has been "Entry ready" for a moment hands over to a new climber
        let out = xs.map((t) => {
          if (t.readyAt && now - t.readyAt > 3500) {
            const c = CLIMBERS[climb.current++ % CLIMBERS.length];
            return { ...c, id: `cl-${now}-${t.id}` } as Live;
          }
          return t;
        });
        const candidates = out.filter((t) => !t.readyAt && count(t) < GATES.length);
        if (candidates.length) {
          const pick = candidates[Math.floor(Math.random() * candidates.length)];
          const idx = pick.passed.findIndex((v) => !v);
          out = out.map((t) => {
            if (t.id !== pick.id) return t;
            const passed = t.passed.map((v, i) => (i === idx ? true : v));
            return { ...t, passed, readyAt: passed.every(Boolean) ? now : undefined };
          });
        }
        return out;
      });
    }, 2600);
    return () => clearInterval(id);
  }, [paused.near]);

  return (
    <Page width="wide">
      <div className="grid gap-6 lg:grid-cols-2">
        <Column
          icon={MegaphoneSimpleIcon}
          title="Just spotted"
          meta={`newest first · ${seen}`}
          paused={paused.spotted}
          onPause={() => setPaused((s) => ({ ...s, spotted: !s.spotted }))}
          tokens={spotted}
        />
        <Column
          icon={HourglassMediumIcon}
          title="Near entry"
          meta={`fewest gates left · ${feedCounts.near}`}
          paused={paused.near}
          onPause={() => setPaused((s) => ({ ...s, near: !s.near }))}
          tokens={[...near].sort((a, b) => count(b) - count(a))}
        />
      </div>
    </Page>
  );
}

function Column({ icon: I, title, meta, paused, onPause, tokens }: { icon: Icon; title: string; meta: string; paused: boolean; onPause: () => void; tokens: Live[] }) {
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
        <div className="flex items-center gap-1.5">
          <span className="text-[12px] tabular-nums text-subtle">{meta}</span>
          <button onClick={onPause} className="icon-btn size-7" aria-label={paused ? `Resume ${title}` : `Pause ${title}`} title={paused ? "Resume" : "Pause"}>
            {paused ? <PlayIcon className="size-3.5" weight="fill" /> : <PauseIcon className="size-3.5" weight="fill" />}
          </button>
        </div>
      </div>

      <div className="space-y-2.5">
        <AnimatePresence initial={false} mode="popLayout">
          {tokens.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
            >
              <FeedCard t={t} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}

function FeedCard({ t }: { t: Live }) {
  const [checking, setChecking] = useState(false);
  const passed = count(t);
  const ready = passed === GATES.length;

  return (
    <Card className={`overflow-hidden transition-colors ${ready ? "border-accent/40" : ""}`}>
      <div className="flex items-center gap-3 px-4 pb-2.5 pt-3">
        <TokenIcon symbol={t.symbol} hue={t.hue} size={38} badge />
        <div className="ml-1 min-w-0 flex-1">
          <p className="flex items-baseline gap-2">
            <span className="text-[13.5px] font-medium">{t.symbol}</span>
            <span className="truncate text-[12px] text-subtle">{t.name}</span>
          </p>
          <p className="mt-0.5 flex items-center gap-2 text-[12px] tabular-nums">
            <span className={t.ageSec < 60 ? "text-green" : "text-muted"}>{age(t.ageSec)}</span>
            <span className="text-subtle">·</span>
            <span className="text-subtle">
              MC <span className="text-muted">{usd(t.mc)}</span>
            </span>
            <span className="text-subtle">
              V <span className="text-muted">{usd(t.vol)}</span>
            </span>
          </p>
        </div>
        {ready ? (
          <span className="flex h-7 items-center gap-1.5 rounded-full bg-accent px-3 text-[12px] font-medium text-bg">
            <CheckIcon className="size-3.5" weight="bold" /> Entry ready
          </span>
        ) : (
          <div className="flex gap-1.5">
            <button className="h-7 rounded-full border border-line px-3 text-[12px] text-muted transition-colors hover:border-white/20 hover:text-fg active:scale-[.97]">Buy</button>
            <button
              onClick={() => setChecking((c) => !c)}
              aria-expanded={checking}
              className={`h-7 rounded-full px-3 text-[12px] transition-colors active:scale-[.97] ${checking ? "bg-fg text-bg" : "bg-white/[.07] text-fg hover:bg-white/[.12]"}`}
            >
              Entry check
            </button>
          </div>
        )}
      </div>

      {/* gate track: icons sit on a pill that fills as gates pass */}
      <div className="flex items-center gap-2 px-4 pb-3">
        <div className="relative flex h-8 flex-1 items-center justify-between overflow-hidden rounded-full border border-line px-2.5">
          <motion.span
            className="absolute inset-y-0 left-0 rounded-full border-r border-green/50 bg-gradient-to-r from-green/[.05] to-green/[.16]"
            initial={false}
            animate={{ width: `${(passed / GATES.length) * 100}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 22 }}
          />
          {GATES.map((g, i) => {
            const I = GATE_ICON[g.key];
            const ok = t.passed[i];
            return (
              <span key={g.key} title={`${g.label}: ${ok ? "passed" : "not yet"}`} className="relative z-10 grid size-6 place-items-center">
                <motion.span initial={false} animate={{ scale: ok ? 1 : 0.92 }} transition={{ type: "spring", stiffness: 500, damping: 20 }}>
                  <I className={`size-[15px] transition-colors duration-500 ${ok ? "text-fg" : "text-subtle/70"}`} weight={ok ? "fill" : "regular"} />
                </motion.span>
              </span>
            );
          })}
        </div>
        <span className="w-8 text-right text-[11.5px] tabular-nums text-subtle">
          {passed}/{GATES.length}
        </span>
        <button className="icon-btn size-7" aria-label={`Never buy ${t.symbol}`} title="Never buy this token">
          <ProhibitIcon className="size-4" />
        </button>
      </div>

      <AnimatePresence initial={false}>
        {checking && !ready && (
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
              {GATES.length - passed} gate{GATES.length - passed === 1 ? "" : "s"} left before the bot buys.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
