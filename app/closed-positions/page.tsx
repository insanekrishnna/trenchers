import type { Metadata } from "next";
import { ClosedPositions } from "@/components/pages/ClosedPositions";

export const metadata: Metadata = { title: "Closed Positions" };

export default function Page() {
  return <ClosedPositions />;
}
