"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "motion/react";
import { Sidebar } from "@/components/shell/Sidebar";
import { TopBar } from "@/components/shell/TopBar";
import { StatusBar } from "@/components/shell/StatusBar";
import { BotHeader } from "@/components/dashboard/BotHeader";
import { PnlHero } from "@/components/dashboard/PnlHero";
import { AiInsights } from "@/components/dashboard/AiInsights";
import { PnlBreakdown, PerfTiles } from "@/components/dashboard/Stats";
import { ClosedPositions, OpenPositions } from "@/components/dashboard/Positions";
import { ConfigSummary, ExitReasons, TopBlockers, WinLoss } from "@/components/dashboard/Diagnostics";
import { Tour } from "@/components/tour/Tour";

const TOUR_KEY = "trenchers.tour.seen";

const rise = (d: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay: d, ease: [0.22, 1, 0.36, 1] as const },
});

export function Dashboard() {
  const [tour, setTour] = useState(false);

  // first visit: offer the tour once
  useEffect(() => {
    let seen = false;
    try {
      seen = localStorage.getItem(TOUR_KEY) === "1" || new URLSearchParams(location.search).has("notour");
    } catch {}
    if (seen) return;
    const t = setTimeout(() => setTour(true), 1400);
    return () => clearTimeout(t);
  }, []);

  const closeTour = useCallback(() => {
    setTour(false);
    try {
      localStorage.setItem(TOUR_KEY, "1");
    } catch {}
  }, []);

  return (
    <div className="flex h-full flex-col">
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar onTour={() => setTour(true)} />
          <main className="thin-scroll flex-1 overflow-y-auto">
            <div className="mx-auto max-w-[1440px] space-y-5 px-4 pb-5 pt-6 md:px-8">
              <motion.div {...rise(0)}>
                <BotHeader />
              </motion.div>

              <div className="grid gap-5 xl:grid-cols-12">
                <motion.div {...rise(0.06)} className="min-w-0 xl:col-span-8">
                  <PnlHero />
                </motion.div>
                <motion.div {...rise(0.12)} className="min-w-0 xl:col-span-4">
                  <AiInsights />
                </motion.div>
              </div>

              <div className="grid gap-5 xl:grid-cols-12">
                <motion.div {...rise(0.18)} className="min-w-0 h-full xl:col-span-4">
                  <PnlBreakdown />
                </motion.div>
                <motion.div {...rise(0.22)} className="min-w-0 h-full xl:col-span-8">
                  <PerfTiles />
                </motion.div>
              </div>

              {/* the strategy as a pipeline: rules → entry → exit → outcome */}
              <section className="space-y-4">
                <ConfigSummary />
                <div className="grid gap-4 lg:grid-cols-3">
                  <TopBlockers />
                  <ExitReasons />
                  <WinLoss />
                </div>
              </section>

              <ClosedPositions />
              <OpenPositions />
            </div>
          </main>
        </div>
      </div>
      <StatusBar />
      <Tour open={tour} onClose={closeTour} />
    </div>
  );
}
