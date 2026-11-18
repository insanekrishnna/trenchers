import type { Metadata } from "next";
import { Rewards } from "@/components/pages/Rewards";

export const metadata: Metadata = { title: "Rewards" };

export default function Page() {
  return <Rewards />;
}
