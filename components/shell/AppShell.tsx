"use client";

import { usePathname } from "next/navigation";
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

  return (
    <div className="flex h-full flex-col">
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar onTour={() => setTour(true)} />
          {/* key on the route so each page starts at the top */}
          <main key={pathname} className="thin-scroll flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
      <StatusBar />
      <Tour open={tour} onClose={closeTour} />
    </div>
  );
}
