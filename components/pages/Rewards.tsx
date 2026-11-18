"use client";

import { CheckIcon, CoinsIcon, FireIcon, MedalIcon, TrendUpIcon, TrophyIcon } from "@phosphor-icons/react";
import { motion } from "motion/react";
import { useState } from "react";
import { bot, closedTrades, fmtTime } from "@/lib/data";
import { rewards } from "@/lib/pageData";
import { Card, CountUp, TokenIcon } from "@/components/ui/primitives";
import { Page, SolidButton } from "./kit";

// How the 288 points break down — every closed trade earns, winners earn more, streak days add a bonus.
const PER_TRADE = 12;
const PER_WIN = 30;
const STREAK_DAYS = 4;
const PER_STREAK_DAY = 24;
const TIERS = [
  { name: "Bronze", at: 0 },
  { name: "Silver", at: 200 },
  { name: "Gold", at: 500 },
  { name: "Diamond", at: 1200 },
];

export function Rewards() {
  const [claimed, setClaimed] = useState(false);
  const claimable = claimed ? 0 : rewards.claimableSol;
  const canClaim = claimable >= rewards.minClaim;

  const wins = closedTrades.filter((t) => t.pnl > 0).length;
  const sources = [
    { icon: TrophyIcon, label: "Closed trades", detail: `${closedTrades.length} × ${PER_TRADE} pts`, pts: closedTrades.length * PER_TRADE, color: "#7cc4ff" },
    { icon: TrendUpIcon, label: "Profitable trades", detail: `${wins} × ${PER_WIN} pts`, pts: wins * PER_WIN, color: "#21c95e" },
    { icon: FireIcon, label: "Daily streak", detail: `${STREAK_DAYS} days × ${PER_STREAK_DAY} pts`, pts: STREAK_DAYS * PER_STREAK_DAY, color: "#ffc74f" },
  ];
  const tier = [...TIERS].reverse().find((t) => rewards.points >= t.at)!;
  const next = TIERS[TIERS.indexOf(tier) + 1];
  const toNext = next ? (rewards.points - tier.at) / (next.at - tier.at) : 1;

  return (
    <Page width="narrow">
      <div>
        <h1 className="text-[20px] font-medium tracking-tight">Rewards</h1>
        <p className="mt-1 text-[13px] text-subtle">SOL and points this agent has earned. Claiming pays this bot&apos;s SOL to your wallet.</p>
      </div>

      {/* balances + claim */}
      <Card className="overflow-hidden">
        <div className="grid divide-line md:grid-cols-2 md:divide-x">
          <div className="px-6 py-5">
            <p className="flex items-center gap-2 text-[12px] text-muted">
              <CoinsIcon className="size-4 text-accent" /> Claimable SOL
            </p>
            <p className="mt-3 flex items-baseline gap-2">
              <span className="text-[38px] font-light leading-none tracking-tight tabular-nums">
                <CountUp value={claimable} />
              </span>
              <span className="text-[13px] text-muted">SOL</span>
            </p>
            <p className="mt-2 text-[12.5px] tabular-nums text-subtle">
              {rewards.earnedSol.toFixed(4)} SOL earned · ≈ ${(rewards.earnedSol * bot.solUsd).toFixed(2)}
            </p>
          </div>
          <div className="border-t border-line px-6 py-5 md:border-t-0">
            <p className="flex items-center gap-2 text-[12px] text-muted">
              <MedalIcon className="size-4 text-[#7cc4ff]" /> Earned / claimable points
            </p>
            <p className="mt-3 text-[38px] font-light leading-none tracking-tight tabular-nums">
              <CountUp value={rewards.points} decimals={0} />
            </p>
            <p className="mt-2 text-[12.5px] text-subtle">Counts toward your rank &amp; leaderboard</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-6 py-3">
          <p className="text-[12.5px] text-subtle">
            {claimed ? "Claimed — on its way to your wallet." : `Earn at least ${rewards.minClaim.toFixed(4)} SOL of rewards to claim.`}
          </p>
          <SolidButton disabled={!canClaim} onClick={() => setClaimed(true)}>
            {claimed ? (
              <>
                <CheckIcon className="size-3.5" weight="bold" /> Claimed
              </>
            ) : (
              `Claim ${claimable.toFixed(4)} SOL`
            )}
          </SolidButton>
        </div>
      </Card>

      <div className="grid gap-5 md:grid-cols-2">
        {/* rank */}
        <Card className="flex flex-col px-5 py-4">
          <div className="flex items-baseline justify-between">
            <h3 className="text-[14px] font-medium">Rank</h3>
            <span className="text-[12px] tabular-nums text-subtle">#142 of 3,208</span>
          </div>
          <p className="mt-3 text-[26px] font-light tracking-tight">{tier.name}</p>
          <p className="text-[12.5px] tabular-nums text-subtle">
            {next ? `${next.at - rewards.points} pts to ${next.name}` : "Top tier"}
          </p>
          {/* tier track: one segment per tier, the current one fills */}
          <div className="mt-auto pt-5">
            <div className="flex gap-[3px]">
              {TIERS.slice(0, -1).map((t, i) => {
                const fill = i < TIERS.indexOf(tier) ? 1 : i === TIERS.indexOf(tier) ? toNext : 0;
                return (
                  <span key={t.name} className="relative h-[3px] flex-1 overflow-hidden rounded-full bg-white/[.08]">
                    <motion.span
                      className="absolute inset-y-0 left-0 rounded-full bg-accent"
                      initial={{ width: 0 }}
                      whileInView={{ width: `${fill * 100}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </span>
                );
              })}
            </div>
            <div className="mt-2 flex justify-between text-[11px] text-subtle">
              {TIERS.map((t) => (
                <span key={t.name} className={t.name === tier.name ? "text-fg" : ""}>
                  {t.name}
                </span>
              ))}
            </div>
          </div>
        </Card>

        {/* where the points came from */}
        <Card className="px-5 py-4">
          <div className="flex items-baseline justify-between">
            <h3 className="text-[14px] font-medium">How you earned them</h3>
            <span className="text-[12px] tabular-nums text-subtle">{rewards.points} pts</span>
          </div>
          <div className="mt-4 flex h-[3px] gap-[3px]">
            {sources.map((s) => (
              <span key={s.label} className="h-full rounded-full" style={{ width: `${(s.pts / rewards.points) * 100}%`, background: s.color }} />
            ))}
          </div>
          <ul className="mt-4 space-y-3">
            {sources.map((s) => (
              <li key={s.label} className="flex items-center gap-3 text-[13px]">
                <s.icon className="size-4 shrink-0" style={{ color: s.color }} />
                <span className="flex-1">
                  <span className="block">{s.label}</span>
                  <span className="block text-[11.5px] text-subtle">{s.detail}</span>
                </span>
                <span className="tabular-nums text-fg">+{s.pts}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* recent */}
      <Card className="overflow-hidden">
        <div className="flex items-baseline justify-between border-b border-line px-5 py-3">
          <h3 className="text-[14px] font-medium">Recent rewards</h3>
          <span className="text-[12px] text-subtle">today</span>
        </div>
        <ul className="divide-y divide-line">
          {closedTrades.map((t) => {
            const win = t.pnl > 0;
            return (
              <li key={t.id} className="flex items-center gap-3 px-5 py-2.5 transition-colors hover:bg-white/[.025]">
                <TokenIcon symbol={t.symbol} hue={t.hue} size={28} />
                <span className="ml-0.5 flex-1 text-[13px]">
                  {t.symbol} <span className="text-subtle">· {win ? "profitable close" : "closed"}</span>
                </span>
                <span className="text-[12px] tabular-nums text-subtle">{fmtTime(t.closedAt)}</span>
                <span className="w-14 text-right text-[13px] tabular-nums text-fg">+{PER_TRADE + (win ? PER_WIN : 0)} pts</span>
              </li>
            );
          })}
          <li className="flex items-center gap-3 px-5 py-2.5">
            <span className="grid size-7 place-items-center rounded-lg bg-warn/10">
              <FireIcon className="size-4 text-warn" />
            </span>
            <span className="ml-0.5 flex-1 text-[13px]">
              Daily streak <span className="text-subtle">· {STREAK_DAYS} days</span>
            </span>
            <span className="text-[12px] text-subtle">09:00</span>
            <span className="w-14 text-right text-[13px] tabular-nums text-fg">+{STREAK_DAYS * PER_STREAK_DAY} pts</span>
          </li>
        </ul>
      </Card>
    </Page>
  );
}
