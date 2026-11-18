"use client";

import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { StatusBar } from "./StatusBar";
import { Tour } from "@/components/tour/Tour";

const TOUR_KEY = "trenchers.tour.seen";

/** The frame every page sits in: sidebar, top bar, scrolling content, status bar, tour. */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [tour, setTour] = useState(false);

  // first visit to the dashboard: offer the tour once
  useEffect(() => {
    if (pathname !== "/") return;
    let seen = false;
    try {
      seen = localStorage.getItem(TOUR_KEY) === "1" || new URLSearchParams(location.search).has("notour");
    } catch {}
    if (seen) return;
    const t = setTimeout(() => setTour(true), 1400);
    return () => clearTimeout(t);
  }, [pathname]);

  const closeTour = useCallback(() => {
    setTour(false);
    try {
      localStorage.setItem(TOUR_KEY, "1");
    } catch {}
  }, []);

  // phones & tablets: the sidebar opens as a drawer
  const [nav, setNav] = useState(false);
  const closeNav = useCallback(() => setNav(false), []);
  useEffect(() => {
    if (!nav) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && setNav(false);
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [nav]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar onTour={() => setTour(true)} onMenu={() => setNav(true)} />
          {/* key on the route so each page starts at the top */}
          <main key={pathname} className="thin-scroll flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
      <StatusBar />

      <AnimatePresence>
        {nav && (
          <motion.div className="fixed inset-0 z-50 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
            <button aria-label="Close menu" onClick={closeNav} className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Navigation"
              className="absolute inset-y-0 left-0"
              initial={{ x: -290 }}
              animate={{ x: 0 }}
              exit={{ x: -290 }}
              transition={{ type: "spring", stiffness: 420, damping: 40 }}
            >
              <Sidebar variant="drawer" onNavigate={closeNav} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Tour open={tour} onClose={closeTour} />
    </div>
  );
}
