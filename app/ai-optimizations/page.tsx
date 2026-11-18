import type { Metadata } from "next";
import { AiOptimizations } from "@/components/pages/AiOptimizations";

export const metadata: Metadata = { title: "AI optimizations" };

export default function Page() {
  return <AiOptimizations />;
}
