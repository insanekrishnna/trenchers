// The agent's pages, in sidebar order. Shared by the sidebar and the top-bar breadcrumb.
export const AGENT_PAGES = [
  { href: "/", label: "Dashboard" },
  { href: "/watch-feed", label: "Watch Feed" },
  { href: "/open-positions", label: "Open Positions" },
  { href: "/closed-positions", label: "Closed Positions" },
  { href: "/ai-optimizations", label: "AI optimizations" },
  { href: "/configure", label: "Configure" },
  { href: "/rewards", label: "Rewards" },
] as const;

export type AgentHref = (typeof AGENT_PAGES)[number]["href"];

export function pageLabel(pathname: string) {
  return AGENT_PAGES.find((p) => p.href === pathname)?.label ?? "Dashboard";
}
