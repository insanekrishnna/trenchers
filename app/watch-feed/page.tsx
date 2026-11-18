import type { Metadata } from "next";
import { WatchFeed } from "@/components/pages/WatchFeed";

export const metadata: Metadata = { title: "Watch Feed" };

export default function Page() {
  return <WatchFeed />;
}
