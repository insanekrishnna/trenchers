"use client";

import { motion } from "motion/react";
import { useId } from "react";

/* Shared building blocks for the agent pages — same look as the dashboard. */

const WIDTH = { full: "max-w-[1440px] min-[1920px]:max-w-[1680px]", wide: "max-w-[1180px]", narrow: "max-w-[920px]" } as const;

export function Page({ children, className = "", width = "full" }: { children: React.ReactNode; className?: string; width?: keyof typeof WIDTH }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={`mx-auto ${WIDTH[width]} space-y-5 px-4 pb-6 pt-6 md:px-8 ${className}`}
    >
      {children}
    </motion.div>
  );
}

export function PageTitle({ title, desc, right }: { title: string; desc?: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[20px] font-medium tracking-tight">{title}</h1>
        {desc && <p className="mt-1 text-[13px] text-muted">{desc}</p>}
      </div>
      {right}
    </div>
  );
}

/** Outlined segmented control with a sliding fill, e.g. All 6 · Winners 4 · Losers 2 */
export function Pills<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { key: T; label: string; count?: number }[];
  value: T;
  onChange: (k: T) => void;
}) {
  const id = useId();
  return (
    // never wraps a label; on a narrow screen the row scrolls sideways instead
    <div className="no-scrollbar flex w-fit max-w-full overflow-x-auto rounded-full border border-line p-0.5">
      {options.map((o) => {
        const on = o.key === value;
        return (
          <button
            key={o.key}
            onClick={() => onChange(o.key)}
            className={`relative shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-[12.5px] transition-colors ${on ? "text-fg" : "text-subtle hover:text-fg"}`}
          >
            {on && <motion.span layoutId={`pill-${id}`} className="absolute inset-0 rounded-full bg-white/[.08]" transition={{ type: "spring", stiffness: 500, damping: 40 }} />}
            <span className="relative">
              {o.label}
              {typeof o.count === "number" && <span className="ml-1.5 tabular-nums text-subtle">{o.count}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Thin underline tabs, like the AI Insights card */
export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { key: T; label: string; icon?: React.ComponentType<{ className?: string; weight?: "regular" | "fill" }> }[];
  value: T;
  onChange: (k: T) => void;
}) {
  const id = useId();
  return (
    <div className="no-scrollbar flex gap-5 overflow-x-auto border-b border-line">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`group relative flex shrink-0 items-center gap-1.5 whitespace-nowrap pb-2.5 text-[12.5px] transition-colors ${value === t.key ? "text-fg" : "text-subtle hover:text-muted"}`}
        >
          {t.icon && <t.icon className={`size-3.5 ${value === t.key ? "text-accent" : ""}`} weight={value === t.key ? "fill" : "regular"} />}
          {t.label}
          {value === t.key && <motion.span layoutId={`tab-${id}`} className="absolute inset-x-0 bottom-0 h-px bg-accent" />}
        </button>
      ))}
    </div>
  );
}

/** Small lime switch */
export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-[18px] w-8 shrink-0 rounded-full transition-colors ${checked ? "bg-accent" : "bg-white/[.12] hover:bg-white/[.18]"}`}
    >
      <motion.span
        className={`absolute top-[2px] size-[14px] rounded-full ${checked ? "bg-bg" : "bg-fg"}`}
        animate={{ left: checked ? 16 : 2 }}
        transition={{ type: "spring", stiffness: 600, damping: 35 }}
      />
    </button>
  );
}

/** Label + value pair used inside cards */
export function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <p className="text-[11.5px] text-subtle">{label}</p>
      <div className="mt-1 text-[14px] tabular-nums">{children}</div>
    </div>
  );
}

/** Quiet outlined pill button */
export function GhostButton({ children, onClick, className = "" }: { children: React.ReactNode; onClick?: () => void; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex h-8 items-center gap-1.5 rounded-full border border-line px-3 text-[12.5px] text-muted transition-colors hover:border-white/20 hover:bg-white/[.04] hover:text-fg active:scale-[.97] ${className}`}
    >
      {children}
    </button>
  );
}

/** Solid white pill — the primary action on every page (matches Go Live) */
export function SolidButton({ children, onClick, disabled, className = "" }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; className?: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn-live h-8 px-3.5 text-[13px] ${className}`}
    >
      {children}
    </button>
  );
}
