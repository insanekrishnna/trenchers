import { Bell, Headphones, MessageCircle, SlidersHorizontal, Star, Wallet, ChevronDown, ListOrdered, FileText } from "lucide-react";
import { Sol } from "@/components/ui/primitives";

export function StatusBar() {
  return (
    <footer className="flex h-11 whitespace-nowrap shrink-0 items-center gap-2 border-t border-line bg-bg px-3 text-[13px]">
      <button className="flex h-7 items-center gap-1.5 rounded-lg bg-accent/15 px-2.5 font-medium text-accent-soft hover:bg-accent/20 transition-colors">
        <SlidersHorizontal className="size-3.5" /> <span className="hidden sm:inline">Preset 1</span>
      </button>
      <button className="flex h-7 items-center gap-1.5 rounded-lg bg-white/[.05] px-2.5 text-fg hover:bg-white/[.08] transition-colors">
        <Wallet className="size-3.5 text-muted" />
        <span className="tabular-nums">1</span>
        <span className="text-subtle">·</span>
        <Sol />
        <span className="tabular-nums">0.000</span>
        <ChevronDown className="size-3.5 text-muted" />
      </button>
      <span className="mx-1 h-4 w-px bg-line" />
      <button className="hidden sm:flex items-center gap-1.5 text-muted hover:text-fg transition-colors">
        <ListOrdered className="size-3.5" /> Open positions
      </button>
      <span className="mx-1 hidden h-4 w-px bg-line sm:block" />
      <span className="flex items-center gap-1.5 tabular-nums text-fg">
        <Sol /> $74.48
      </span>
      <div className="flex-1" />
      <div className="hidden items-center gap-0.5 text-muted md:flex">
        {[Star, Bell, XIcon, Headphones, FileText].map((I, i) => (
          <button key={i} className="icon-btn size-7">
            <I className="size-3.5" />
          </button>
        ))}
      </div>
      <button className="flex h-7 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg bg-white/[.06] px-3 text-fg hover:bg-white/[.09] transition-colors">
        <MessageCircle className="size-3.5" /> <span className="hidden sm:inline">Chat hub</span>
      </button>
    </footer>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-label="X">
      <path d="M17.8 3h3.1l-6.8 7.8L22 21h-6.2l-4.9-6.4L5.3 21H2.2l7.3-8.3L2 3h6.4l4.4 5.8L17.8 3zm-1.1 16.2h1.7L7.4 4.7H5.6l11.1 14.5z" />
    </svg>
  );
}
