import type { Metadata } from "next";
import { OpenPositions } from "@/components/pages/OpenPositions";

export const metadata: Metadata = { title: "Open Positions" };

export default function Page() {
  return <OpenPositions />;
}
