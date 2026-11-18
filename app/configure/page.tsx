import type { Metadata } from "next";
import { Configure } from "@/components/pages/Configure";

export const metadata: Metadata = { title: "Configure" };

export default function Page() {
  return <Configure />;
}
