"use client";

import { CheckIcon, CoinsIcon, MedalIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { bot } from "@/lib/data";
import { rewards } from "@/lib/pageData";
import { Card, CountUp } from "@/components/ui/primitives";
import { Page, PageTitle, SolidButton } from "./kit";

export function Rewards() {
  const [claimed, setClaimed] = useState(false);
  const claimable = claimed ? 0 : rewards.claimableSol;
  const canClaim = claimable >= rewards.minClaim;

  return (
    <Page>
      <PageTitle title="Rewards" desc="SOL and points this agent has earned. Claiming pays this bot's SOL to your wallet." />

      <Card className="overflow-hidden">
        <div className="grid divide-line md:grid-cols-2 md:divide-x">
          {/* claimable SOL */}
          <div className="px-6 py-5">
            <p className="flex items-center gap-2 text-[12px] text-muted">
              <CoinsIcon className="size-4 text-accent" /> Claimable SOL
            </p>
            <p className="mt-3 flex items-baseline gap-2">
              <span className="text-[36px] font-light leading-none tracking-tight tabular-nums">
                <CountUp value={claimable} />
              </span>
              <span className="text-[13px] text-muted">SOL</span>
            </p>
            <p className="mt-2 text-[12.5px] tabular-nums text-subtle">
              {rewards.earnedSol.toFixed(4)} SOL earned · ≈ ${(rewards.earnedSol * bot.solUsd).toFixed(2)}
            </p>
          </div>

          {/* points */}
          <div className="border-t border-line px-6 py-5 md:border-t-0">
            <p className="flex items-center gap-2 text-[12px] text-muted">
              <MedalIcon className="size-4 text-[#7cc4ff]" /> Earned / claimable points
            </p>
            <p className="mt-3 text-[36px] font-light leading-none tracking-tight tabular-nums">
              <CountUp value={rewards.points} decimals={0} />
            </p>
            <p className="mt-2 text-[12.5px] text-subtle">Counts toward your rank &amp; leaderboard</p>
          </div>
        </div>

        {/* claim bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-6 py-3.5">
          <p className="text-[12.5px] text-subtle">
            {claimed ? "Claimed — sent to your wallet." : `Earn at least ${rewards.minClaim.toFixed(4)} SOL of rewards to claim.`}
          </p>
          <SolidButton disabled={!canClaim} onClick={() => setClaimed(true)}>
            {claimed ? (
              <>
                <CheckIcon className="size-3.5" weight="bold" /> Claimed
              </>
            ) : (
              "Claim"
            )}
          </SolidButton>
        </div>
      </Card>
    </Page>
  );
}
