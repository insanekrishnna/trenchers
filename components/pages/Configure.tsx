"use client";

import {
  ArrowCircleDownIcon,
  ArrowCircleUpIcon,
  CaretRightIcon,
  CheckIcon,
  DownloadSimpleIcon,
  FunnelSimpleIcon,
  type Icon,
  InfoIcon,
  LightningIcon,
  MagnifyingGlassIcon,
  RocketLaunchIcon,
  ShareNetworkIcon,
  ShoppingCartSimpleIcon,
  SignOutIcon,
  SlidersHorizontalIcon,
  SwapIcon,
  UploadSimpleIcon,
} from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { config } from "@/lib/data";
import { Card } from "@/components/ui/primitives";
import { Page, Switch } from "./kit";

type Section = "essentials" | "gates" | "exit" | "fees";

const SECTIONS: { key: Section; label: string; icon: Icon }[] = [
  { key: "essentials", label: "Essentials", icon: SlidersHorizontalIcon },
  { key: "gates", label: "Entry Gates", icon: FunnelSimpleIcon },
  { key: "exit", label: "Exit Strategy", icon: SignOutIcon },
  { key: "fees", label: "Fees & execution", icon: LightningIcon },
];

interface Gate {
  id: string;
  label: string;
  hint: string;
  on: boolean;
  value: number;
  unit: string;
  cmp: "≥" | "≤";
}

const INITIAL = {
  buyAt: "launch" as "launch" | "migration",
  ai: false,
  perTrade: config.perTrade,
  maxOpen: 0, // 0 = unlimited
  reentry: false,
  pump: true,
  gates: [
    { id: "volume", label: "Volume", hint: "Minimum traded volume before entry", on: true, value: 1500, unit: "$", cmp: "≥" },
    { id: "ratio", label: "Buy/sell ratio", hint: "More buys than sells, by at least", on: true, value: 1.4, unit: "×", cmp: "≥" },
    { id: "spread", label: "Buy spread", hint: "Bid/ask gap allowed at entry", on: true, value: 3, unit: "%", cmp: "≤" },
    { id: "holders", label: "Holder count", hint: "Unique wallets holding the coin", on: true, value: 40, unit: "", cmp: "≥" },
    { id: "top", label: "Top holder share", hint: "Largest single wallet, as % of supply", on: true, value: 12, unit: "%", cmp: "≤" },
    { id: "buyers", label: "Unique buyers", hint: "Distinct buyers in the last 5 minutes", on: true, value: 25, unit: "", cmp: "≥" },
    { id: "dev", label: "Dev history", hint: "Dev's previous coins that rugged", on: true, value: 0, unit: "", cmp: "≤" },
    { id: "bundles", label: "Bundled buys", hint: "Share of supply bought in the launch block", on: true, value: 15, unit: "%", cmp: "≤" },
    { id: "snipers", label: "Snipers", hint: "Wallets that bought in the first second", on: true, value: 5, unit: "", cmp: "≤" },
  ] as Gate[],
  tiers: [
    { at: 1.4, sell: 40 },
    { at: 2, sell: 30 },
    { at: 3, sell: 30 },
  ],
  stopLoss: 30, // % fall from entry
  stale: 45,
  trailing: true,
  trailPct: 20,
  devSells: true,
  buyersLeave: true,
  priority: 0.0002,
  slippage: 15,
  jito: 0.0001,
  autoFees: true,
};

type State = typeof INITIAL;

export function Configure() {
  const [s, setS] = useState<State>(INITIAL);
  const [section, setSection] = useState<Section>("essentials");
  const [q, setQ] = useState("");
  const [version, setVersion] = useState(2);
  const [saved, setSaved] = useState<State>(INITIAL);
  const [justSaved, setJustSaved] = useState(false);
  const dirty = JSON.stringify(s) !== JSON.stringify(saved);
  const set = <K extends keyof State>(k: K, v: State[K]) => setS((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    if (!justSaved) return;
    const t = setTimeout(() => setJustSaved(false), 1800);
    return () => clearTimeout(t);
  }, [justSaved]);

  const save = () => {
    setSaved(s);
    setVersion((v) => v + 1);
    setJustSaved(true);
  };

  const match = (label: string) => !q || label.toLowerCase().includes(q.toLowerCase());
  const activeGates = 25 + s.gates.filter((g) => g.on).length; // 25 always-on safety checks + the tunable ones

  return (
    <Page>
      <div className="grid gap-5 xl:grid-cols-12">
        {/* section rail */}
        <nav className="xl:col-span-2">
          <ul className="flex gap-1 overflow-x-auto xl:flex-col">
            {SECTIONS.map((x) => {
              const on = x.key === section;
              return (
                <li key={x.key}>
                  <button
                    onClick={() => setSection(x.key)}
                    className={`group flex w-full items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-left text-[13px] transition-colors ${
                      on ? "bg-white/[.07] text-fg" : "text-muted hover:bg-white/[.045] hover:text-fg"
                    }`}
                  >
                    <x.icon className={`size-4 ${on ? "text-accent" : "text-subtle group-hover:text-fg"}`} weight={on ? "fill" : "regular"} />
                    {x.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* settings */}
        <section className="min-w-0 space-y-4 xl:col-span-6">
          <div className="flex items-center gap-2">
            <label className="flex h-9 flex-1 items-center gap-2 rounded-full border border-line px-3.5 focus-within:border-white/20">
              <MagnifyingGlassIcon className="size-4 text-subtle" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search parameters…" className="h-full flex-1 bg-transparent text-[13px] outline-none placeholder:text-subtle" />
            </label>
            {[
              { i: UploadSimpleIcon, t: "Import config" },
              { i: DownloadSimpleIcon, t: "Export config" },
              { i: ShareNetworkIcon, t: "Share config" },
            ].map(({ i: I, t }) => (
              <button key={t} className="icon-btn size-9" aria-label={t} title={t}>
                <I className="size-4" />
              </button>
            ))}
            <button onClick={save} disabled={!dirty && !justSaved} className="btn-live h-9 px-4 text-[13px] disabled:cursor-default disabled:opacity-40">
              {justSaved ? (
                <>
                  <CheckIcon className="size-3.5" weight="bold" /> Saved v{version}
                </>
              ) : (
                "Save"
              )}
            </button>
          </div>
          {dirty && <p className="-mt-2 px-1 text-[12px] text-warn">Unsaved changes · config v{version}</p>}

          <AnimatePresence mode="wait">
            <motion.div key={section} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} className="space-y-4">
              {section === "essentials" && (
                <>
                  <Rows>
                    {match("Buy at") && (
                      <Row label="Buy at" hint="Enter right at launch, or wait until the coin migrates off the bonding curve">
                        <Segmented
                          value={s.buyAt}
                          onChange={(v) => set("buyAt", v)}
                          options={[
                            { key: "launch", label: "Launch", icon: RocketLaunchIcon },
                            { key: "migration", label: "Migration", icon: SwapIcon },
                          ]}
                        />
                      </Row>
                    )}
                    {match("AI optimizations") && (
                      <Row label="AI optimizations" hint="Let AI review results and suggest config changes">
                        <Switch checked={s.ai} onChange={(v) => set("ai", v)} label="AI optimizations" />
                      </Row>
                    )}
                    {match("Allow re-entry") && (
                      <Row label="Allow re-entry" hint="Buy the same coin again after selling it">
                        <Switch checked={s.reentry} onChange={(v) => set("reentry", v)} label="Allow re-entry" />
                      </Row>
                    )}
                  </Rows>

                  {(match("Per-trade size") || match("Max open positions")) && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {match("Per-trade size") && (
                        <Gauge
                          label="Per-trade size"
                          hint="SOL spent on each buy"
                          value={s.perTrade}
                          min={0.001}
                          max={5}
                          step={0.001}
                          display={s.perTrade.toFixed(3)}
                          unit="SOL"
                          minLabel="Min size"
                          maxLabel="Soft max"
                          minText="0.001"
                          maxText="5.000"
                          onChange={(v) => set("perTrade", v)}
                          log
                        />
                      )}
                      {match("Max open positions") && (
                        <Gauge
                          label="Max open positions"
                          hint="How many coins the bot can hold at once. 0 = no limit"
                          value={s.maxOpen}
                          min={0}
                          max={10}
                          step={1}
                          display={s.maxOpen === 0 ? "∞" : String(s.maxOpen)}
                          unit={s.maxOpen === 0 ? "" : "open"}
                          minLabel="Unlimited"
                          maxLabel="Soft max"
                          minText="∞"
                          maxText="10"
                          onChange={(v) => set("maxOpen", v)}
                        />
                      )}
                    </div>
                  )}

                  {match("Launchpads") && (
                    <Card className="px-5 py-4">
                      <div className="flex items-center justify-between">
                        <Label label="Launchpads" hint="Where the bot looks for new coins">
                          <span className="ml-2 rounded-full border border-line px-1.5 text-[10.5px] uppercase tracking-wider text-subtle">new</span>
                        </Label>
                        <span className="text-[12px] tabular-nums text-subtle">{s.pump ? 1 : 0} of 1</span>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <button
                          onClick={() => set("pump", !s.pump)}
                          className={`flex h-8 items-center gap-2 rounded-full border px-3 text-[12.5px] transition-colors ${
                            s.pump ? "border-white/25 text-fg" : "border-line text-subtle hover:text-fg"
                          }`}
                        >
                          <span className={`size-1.5 rounded-full ${s.pump ? "bg-green" : "bg-subtle"}`} /> Pump.fun
                        </button>
                        <button onClick={() => set("pump", true)} className="btn-link">
                          Select all
                        </button>
                      </div>
                    </Card>
                  )}
                </>
              )}

              {section === "gates" && (
                <Rows title={`${activeGates} active gates`} meta="25 safety checks always run · tune the rest">
                  {s.gates
                    .filter((g) => match(g.label))
                    .map((g, i) => (
                      <Row key={g.id} label={g.label} hint={g.hint} dim={!g.on}>
                        <div className="flex items-center gap-3">
                          <NumberField
                            value={g.value}
                            prefix={`${g.cmp} ${g.unit === "$" ? "$" : ""}`}
                            suffix={g.unit !== "$" ? g.unit : ""}
                            disabled={!g.on}
                            onChange={(v) => set("gates", s.gates.map((x, k) => (k === i ? { ...x, value: v } : x)))}
                          />
                          <Switch checked={g.on} onChange={(v) => set("gates", s.gates.map((x, k) => (k === i ? { ...x, on: v } : x)))} label={g.label} />
                        </div>
                      </Row>
                    ))}
                </Rows>
              )}

              {section === "exit" && (
                <>
                  {match("Take-profit ladder") && (
                    <Card className="px-5 py-4">
                      <Label label="Take-profit ladder" hint="Sell part of the position at each target" />
                      <div className="mt-4 space-y-3">
                        {s.tiers.map((t, i) => (
                          <div key={i} className="grid grid-cols-[48px_1fr_auto] items-center gap-3 text-[13px]">
                            <span className="text-subtle">Tier {i + 1}</span>
                            <span className="relative h-[3px] rounded-full bg-white/[.07]">
                              <span className="absolute inset-y-0 left-0 rounded-full bg-green" style={{ width: `${(t.at / 3.2) * 100}%` }} />
                            </span>
                            <span className="tabular-nums">
                              sell <span className="text-fg">{t.sell}%</span> <span className="text-subtle">at</span> <span className="text-green">{t.at}×</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}
                  {match("Stop loss") && (
                    <Card className="px-5 py-4">
                      <div className="flex items-baseline justify-between">
                        <Label label="Stop loss" hint="Sell everything if the price falls this far below entry" />
                        <span className="text-[14px] tabular-nums">
                          <span className="text-red">−{s.stopLoss}%</span> <span className="text-subtle">· {(1 - s.stopLoss / 100).toFixed(2)}×</span>
                        </span>
                      </div>
                      <Slider value={s.stopLoss} min={5} max={60} step={1} onChange={(v) => set("stopLoss", v)} />
                    </Card>
                  )}
                  <Rows>
                    {match("Stale exit") && (
                      <Row label="Stale exit" hint="Sell if the price goes quiet for this long">
                        <Segmented
                          value={String(s.stale) as "15" | "30" | "45" | "60"}
                          onChange={(v) => set("stale", Number(v))}
                          options={["15", "30", "45", "60"].map((m) => ({ key: m as "15" | "30" | "45" | "60", label: `${m}m` }))}
                        />
                      </Row>
                    )}
                    {match("Trailing stop") && (
                      <Row label="Trailing stop" hint={`Sell if the price slips ${s.trailPct}% from its peak`}>
                        <Switch checked={s.trailing} onChange={(v) => set("trailing", v)} label="Trailing stop" />
                      </Row>
                    )}
                    {match("Sell if the dev sells") && (
                      <Row label="Sell if the dev sells" hint="Exit when the creator's wallet sells">
                        <Switch checked={s.devSells} onChange={(v) => set("devSells", v)} label="Sell if the dev sells" />
                      </Row>
                    )}
                    {match("Sell if buyers walk away") && (
                      <Row label="Sell if buyers walk away" hint="Exit when buy pressure dries up">
                        <Switch checked={s.buyersLeave} onChange={(v) => set("buyersLeave", v)} label="Sell if buyers walk away" />
                      </Row>
                    )}
                  </Rows>
                </>
              )}

              {section === "fees" && (
                <Rows>
                  {match("Auto fees") && (
                    <Row label="Auto fees" hint="Pick priority fee and tip from current network load">
                      <Switch checked={s.autoFees} onChange={(v) => set("autoFees", v)} label="Auto fees" />
                    </Row>
                  )}
                  {match("Priority fee") && (
                    <Row label="Priority fee" hint="Extra SOL paid so the transaction lands faster" dim={s.autoFees}>
                      <NumberField value={s.priority} suffix="SOL" step={0.0001} disabled={s.autoFees} onChange={(v) => set("priority", v)} />
                    </Row>
                  )}
                  {match("Jito tip") && (
                    <Row label="Jito tip" hint="Tip to validators for bundle priority" dim={s.autoFees}>
                      <NumberField value={s.jito} suffix="SOL" step={0.0001} disabled={s.autoFees} onChange={(v) => set("jito", v)} />
                    </Row>
                  )}
                  {match("Slippage") && (
                    <Row label="Slippage" hint="Most the price may move between sending and filling">
                      <NumberField value={s.slippage} suffix="%" onChange={(v) => set("slippage", v)} />
                    </Row>
                  )}
                </Rows>
              )}
            </motion.div>
          </AnimatePresence>
        </section>

        {/* plain-English summary */}
        <aside className="xl:col-span-4">
          <Card className="overflow-hidden">
            <p className="px-5 pb-1 pt-4 text-[12px] text-muted">Your bot</p>
            <ul className="divide-y divide-line">
              <Summary icon={ShoppingCartSimpleIcon} color="#7cc4ff" title="Buys" onClick={() => setSection("essentials")}>
                <b className="font-medium text-fg">{s.perTrade.toFixed(2)} SOL</b> of each new coin that passes your <b className="font-medium text-fg">{activeGates} checks</b>.
                <span className="mt-1 block text-[12px] text-subtle">{s.maxOpen === 0 ? "No limit on how many at once." : `Up to ${s.maxOpen} at once.`}</span>
              </Summary>
              <Summary icon={ArrowCircleUpIcon} color="#21c95e" title="Takes profit" onClick={() => setSection("exit")}>
                Sells in <b className="font-medium text-fg">{s.tiers.length} steps</b>: {s.tiers.map((t) => `${t.sell}% at ${t.at}×`).join(", ")}.
              </Summary>
              <Summary icon={ArrowCircleDownIcon} color="#ff622e" title="Cuts the loss" onClick={() => setSection("exit")}>
                Sells everything if it falls <b className="font-medium text-fg">{s.stopLoss}%</b>.
                <span className="mt-1 block text-[12px] leading-relaxed text-subtle">
                  It also sells early if {[s.trailing && `the price slips ${s.trailPct}% from its peak`, `the coin goes quiet for ${s.stale}m`, s.buyersLeave && "buyers walk away", s.devSells && "the dev sells"].filter(Boolean).join(", ")}.
                </span>
              </Summary>
            </ul>
          </Card>
        </aside>
      </div>
    </Page>
  );
}

/* ---------------- building blocks ---------------- */

function Label({ label, hint, children }: { label: string; hint: string; children?: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1.5 text-[13.5px]">
      {label}
      <span title={hint} className="text-subtle transition-colors hover:text-fg">
        <InfoIcon className="size-3.5" />
      </span>
      {children}
    </span>
  );
}

function Rows({ title, meta, children }: { title?: string; meta?: string; children: React.ReactNode }) {
  return (
    <Card className="overflow-hidden">
      {title && (
        <div className="flex items-baseline justify-between border-b border-line px-5 py-3">
          <span className="text-[13.5px] font-medium">{title}</span>
          <span className="text-[12px] text-subtle">{meta}</span>
        </div>
      )}
      <div className="divide-y divide-line">{children}</div>
    </Card>
  );
}

function Row({ label, hint, dim, children }: { label: string; hint: string; dim?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex min-h-[52px] items-center justify-between gap-4 px-5 py-2.5 transition-colors hover:bg-white/[.02]">
      <div className={`min-w-0 ${dim ? "opacity-50" : ""}`}>
        <Label label={label} hint={hint} />
        <p className="mt-0.5 truncate text-[11.5px] text-subtle">{hint}</p>
      </div>
      {children}
    </div>
  );
}

function Segmented<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { key: T; label: string; icon?: Icon }[] }) {
  return (
    <div className="flex shrink-0 rounded-full border border-line p-0.5">
      {options.map((o) => {
        const on = o.key === value;
        return (
          <button
            key={o.key}
            onClick={() => onChange(o.key)}
            className={`relative flex items-center gap-1.5 rounded-full px-3 py-1 text-[12.5px] transition-colors ${on ? "text-fg" : "text-subtle hover:text-fg"}`}
          >
            {on && <motion.span layoutId={`seg-${options.map((x) => x.key).join("")}`} className="absolute inset-0 rounded-full bg-white/[.09]" />}
            {o.icon && <o.icon className="relative size-3.5" />}
            <span className="relative">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function NumberField({
  value,
  onChange,
  prefix = "",
  suffix = "",
  step = 1,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  prefix?: string;
  suffix?: string;
  step?: number;
  disabled?: boolean;
}) {
  return (
    <label className={`flex h-8 items-center gap-1 rounded-full border border-line px-3 text-[12.5px] tabular-nums transition-colors focus-within:border-white/25 hover:border-white/15 ${disabled ? "opacity-40" : ""}`}>
      {prefix && <span className="text-subtle">{prefix}</span>}
      <input
        type="number"
        value={value}
        step={step}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-16 bg-transparent text-right outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      {suffix && <span className="text-subtle">{suffix}</span>}
    </label>
  );
}

function Slider({ value, min, max, step, onChange }: { value: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
  const fill = ((value - min) / (max - min)) * 100;
  return (
    <input
      type="range"
      className="thin-range mt-3"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      style={{ "--fill": `${fill}%` } as React.CSSProperties}
    />
  );
}

/* a thin dial of ticks plus a slider underneath */
function Gauge(p: {
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  unit: string;
  minLabel: string;
  maxLabel: string;
  minText: string;
  maxText: string;
  onChange: (v: number) => void;
  log?: boolean;
}) {
  // log scale for SOL size so small sizes are easy to dial in
  const toT = (v: number) => (p.log ? Math.log(v / p.min) / Math.log(p.max / p.min) : (v - p.min) / (p.max - p.min));
  const fromT = (t: number) => (p.log ? p.min * Math.pow(p.max / p.min, t) : p.min + t * (p.max - p.min));
  const t = Math.max(0, Math.min(1, toT(p.value)));
  // a half-circle of ticks over the number
  const N = 31;
  const R = 74;
  const cx = 100;
  const cy = 88;
  // round so server and browser render identical attributes (no hydration drift)
  const r2 = (n: number) => Math.round(n * 100) / 100;
  return (
    <Card className="px-5 py-4">
      <Label label={p.label} hint={p.hint} />
      <div className="relative mx-auto mt-3 h-[96px] w-[200px]">
        <svg viewBox="0 0 200 96" className="absolute inset-0">
          {Array.from({ length: N }).map((_, i) => {
            const a = Math.PI + (i / (N - 1)) * Math.PI;
            const on = i / (N - 1) <= t + 1e-6;
            const inner = i % 5 === 0 ? R - 12 : R - 8;
            return (
              <line
                key={i}
                x1={r2(cx + Math.cos(a) * inner)}
                y1={r2(cy + Math.sin(a) * inner)}
                x2={r2(cx + Math.cos(a) * R)}
                y2={r2(cy + Math.sin(a) * R)}
                stroke={on ? "#f7f7f7" : "rgba(247,247,247,.12)"}
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            );
          })}
        </svg>
        <p className="absolute inset-x-0 top-[52px] text-center">
          <span className="text-[24px] font-light tabular-nums tracking-tight">{p.display}</span>
          {p.unit && <span className="ml-1 text-[11px] text-muted">{p.unit}</span>}
        </p>
      </div>
      <input
        type="range"
        className="thin-range"
        min={0}
        max={1000}
        value={Math.round(t * 1000)}
        onChange={(e) => {
          const raw = fromT(Number(e.target.value) / 1000);
          p.onChange(Math.round(raw / p.step) * p.step);
        }}
        style={{ "--fill": `${t * 100}%` } as React.CSSProperties}
        aria-label={p.label}
      />
      <div className="mt-2 flex justify-between text-[11px] tabular-nums">
        <span>
          <span className="block uppercase tracking-wider text-subtle">{p.minLabel}</span>
          <span className="text-muted">{p.minText}</span>
        </span>
        <span className="text-right">
          <span className="block uppercase tracking-wider text-subtle">{p.maxLabel}</span>
          <span className="text-muted">{p.maxText}</span>
        </span>
      </div>
    </Card>
  );
}

function Summary({ icon: I, color, title, onClick, children }: { icon: Icon; color: string; title: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <li>
      <button onClick={onClick} className="group flex w-full items-start gap-3 px-5 py-4 text-left transition-colors hover:bg-white/[.025]">
        <I className="mt-0.5 size-5 shrink-0" style={{ color }} />
        <span className="min-w-0 flex-1">
          <span className="block text-[12px] text-subtle">{title}</span>
          <span className="mt-0.5 block text-[13.5px] leading-relaxed text-muted">{children}</span>
        </span>
        <CaretRightIcon className="mt-1 size-3.5 text-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-fg" />
      </button>
    </li>
  );
}
