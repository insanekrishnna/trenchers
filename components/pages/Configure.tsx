"use client";

import {
  ArrowCircleDownIcon,
  ArrowCircleUpIcon,
  ArrowRightIcon,
  CheckIcon,
  DownloadSimpleIcon,
  type Icon,
  InfoIcon,
  MagnifyingGlassIcon,
  RocketLaunchIcon,
  ShareNetworkIcon,
  ShoppingCartSimpleIcon,
  SwapIcon,
  UploadSimpleIcon,
} from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { config } from "@/lib/data";
import { Card } from "@/components/ui/primitives";
import { Page, Switch, Tabs } from "./kit";

type Section = "essentials" | "gates" | "exit" | "fees";

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
  stopLoss: 30,
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

/** Human-readable list of what changed since the last save. */
function diff(a: State, b: State) {
  const out: { label: string; from: string; to: string }[] = [];
  const add = (label: string, x: unknown, y: unknown, f: (v: never) => string = (v) => String(v)) => {
    if (JSON.stringify(x) !== JSON.stringify(y)) out.push({ label, from: f(x as never), to: f(y as never) });
  };
  const onoff = (v: boolean) => (v ? "On" : "Off");
  add("Buy at", a.buyAt, b.buyAt, (v: string) => (v === "launch" ? "Launch" : "Migration"));
  add("AI optimizations", a.ai, b.ai, onoff);
  add("Per-trade size", a.perTrade, b.perTrade, (v: number) => `${v.toFixed(3)} SOL`);
  add("Max open", a.maxOpen, b.maxOpen, (v: number) => (v === 0 ? "Unlimited" : String(v)));
  add("Re-entry", a.reentry, b.reentry, onoff);
  add("Pump.fun", a.pump, b.pump, onoff);
  a.gates.forEach((g, i) => {
    const h = b.gates[i];
    if (g.on !== h.on) out.push({ label: g.label, from: onoff(g.on), to: onoff(h.on) });
    else if (g.value !== h.value) out.push({ label: g.label, from: `${g.cmp} ${g.value}${g.unit === "$" ? "" : g.unit}`, to: `${h.cmp} ${h.value}${h.unit === "$" ? "" : h.unit}` });
  });
  add("Stop loss", a.stopLoss, b.stopLoss, (v: number) => `−${v}%`);
  add("Stale exit", a.stale, b.stale, (v: number) => `${v}m`);
  add("Trailing stop", a.trailing, b.trailing, onoff);
  add("Sell if dev sells", a.devSells, b.devSells, onoff);
  add("Sell if buyers leave", a.buyersLeave, b.buyersLeave, onoff);
  add("Auto fees", a.autoFees, b.autoFees, onoff);
  add("Priority fee", a.priority, b.priority, (v: number) => `${v} SOL`);
  add("Jito tip", a.jito, b.jito, (v: number) => `${v} SOL`);
  add("Slippage", a.slippage, b.slippage, (v: number) => `${v}%`);
  return out;
}

export function Configure() {
  const [s, setS] = useState<State>(INITIAL);
  const [saved, setSaved] = useState<State>(INITIAL);
  const [section, setSection] = useState<Section>("essentials");
  const [q, setQ] = useState("");
  const [version, setVersion] = useState(2);
  const [flash, setFlash] = useState(false);
  const set = <K extends keyof State>(k: K, v: State[K]) => setS((p) => ({ ...p, [k]: v }));
  const changes = diff(saved, s);
  const dirty = changes.length > 0;

  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(false), 1800);
    return () => clearTimeout(t);
  }, [flash]);

  const save = () => {
    setSaved(s);
    setVersion((v) => v + 1);
    setFlash(true);
  };

  const m = (label: string) => !q || label.toLowerCase().includes(q.toLowerCase());
  const activeGates = 25 + s.gates.filter((g) => g.on).length;

  return (
    <Page width="wide">
      {/* title row */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-medium tracking-tight">Configure</h1>
          <p className="mt-1 text-[13px] text-subtle">
            config v{version} ·{" "}
            {dirty ? <span className="text-warn">{changes.length} unsaved change{changes.length === 1 ? "" : "s"}</span> : flash ? <span className="text-green">saved just now</span> : "saved today"}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {[
            { i: UploadSimpleIcon, t: "Import config" },
            { i: DownloadSimpleIcon, t: "Export config" },
            { i: ShareNetworkIcon, t: "Share config" },
          ].map(({ i: I, t }) => (
            <button key={t} className="icon-btn size-9" aria-label={t} title={t}>
              <I className="size-4" />
            </button>
          ))}
          <button onClick={save} disabled={!dirty} className="btn-live ml-2 h-9 px-4 text-[13px] disabled:cursor-default disabled:opacity-35">
            {flash ? (
              <>
                <CheckIcon className="size-3.5" weight="bold" /> Saved
              </>
            ) : (
              "Save"
            )}
          </button>
        </div>
      </div>

      {/* tabs + search */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line">
        <div className="-mb-px">
          <Tabs<Section>
            value={section}
            onChange={setSection}
            tabs={[
              { key: "essentials", label: "Essentials" },
              { key: "gates", label: `Entry gates · ${activeGates}` },
              { key: "exit", label: "Exit strategy" },
              { key: "fees", label: "Fees & execution" },
            ]}
          />
        </div>
        <label className="mb-2 flex h-8 w-56 items-center gap-2 rounded-full border border-line px-3 focus-within:border-white/25">
          <MagnifyingGlassIcon className="size-3.5 text-subtle" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search parameters" className="h-full flex-1 bg-transparent text-[12.5px] outline-none placeholder:text-subtle" />
        </label>
      </div>

      <div className="grid gap-6 xl:grid-cols-12">
        {/* settings */}
        <section className="min-w-0 xl:col-span-7">
          <AnimatePresence mode="wait">
            <motion.div key={section} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} className="space-y-6">
              {section === "essentials" && (
                <>
                  <Group label="Buying">
                    {m("Buy at") && (
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
                    {m("Allow re-entry") && (
                      <Row label="Allow re-entry" hint="Buy the same coin again after selling it">
                        <Switch checked={s.reentry} onChange={(v) => set("reentry", v)} label="Allow re-entry" />
                      </Row>
                    )}
                    {m("AI optimizations") && (
                      <Row label="AI optimizations" hint="Let AI review results and suggest config changes">
                        <Switch checked={s.ai} onChange={(v) => set("ai", v)} label="AI optimizations" />
                      </Row>
                    )}
                  </Group>

                  {(m("Per-trade size") || m("Max open positions")) && (
                    <Group label="Position size">
                      {m("Per-trade size") && (
                        <Ruler
                          label="Per-trade size"
                          hint="SOL spent on each buy"
                          display={s.perTrade.toFixed(3)}
                          unit="SOL"
                          t={Math.log(s.perTrade / 0.001) / Math.log(5 / 0.001)}
                          onT={(t) => set("perTrade", Math.round(0.001 * Math.pow(5000, t) * 1000) / 1000)}
                          marks={["0.001", "0.01", "0.1", "1", "5"]}
                        />
                      )}
                      {m("Max open positions") && (
                        <Ruler
                          label="Max open positions"
                          hint="How many coins the bot can hold at once"
                          display={s.maxOpen === 0 ? "∞" : String(s.maxOpen)}
                          unit={s.maxOpen === 0 ? "no limit" : "at once"}
                          t={s.maxOpen / 10}
                          onT={(t) => set("maxOpen", Math.round(t * 10))}
                          marks={["∞", "2", "4", "6", "8", "10"]}
                        />
                      )}
                    </Group>
                  )}

                  {m("Launchpads") && (
                    <Group label="Sources">
                      <Row label="Launchpads" hint="Where the bot looks for new coins">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => set("pump", !s.pump)}
                            className={`flex h-7 items-center gap-2 rounded-full border px-3 text-[12.5px] transition-colors ${s.pump ? "border-white/25 text-fg" : "border-line text-subtle hover:text-fg"}`}
                          >
                            <span className={`size-1.5 rounded-full ${s.pump ? "bg-green" : "bg-subtle"}`} /> Pump.fun
                          </button>
                          <span className="text-[12px] tabular-nums text-subtle">{s.pump ? 1 : 0}/1</span>
                        </div>
                      </Row>
                    </Group>
                  )}
                </>
              )}

              {section === "gates" && (
                <Group label={`${activeGates} active · 25 safety checks always run`}>
                  {s.gates
                    .map((g, i) => ({ g, i }))
                    .filter(({ g }) => m(g.label))
                    .map(({ g, i }) => (
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
                </Group>
              )}

              {section === "exit" && (
                <>
                  {m("Take-profit ladder") && (
                    <Group label="Take profit">
                      <div className="px-5 py-4">
                        {/* one shared 1×–3.2× axis, a tick per tier */}
                        <div className="relative h-8">
                          <span className="absolute inset-x-0 top-[15px] h-px bg-white/[.08]" />
                          <span className="absolute left-0 top-[15px] h-px bg-green" style={{ width: `${((3 - 1) / 2.2) * 100}%` }} />
                          {s.tiers.map((t, i) => {
                            const left = ((t.at - 1) / 2.2) * 100;
                            return (
                              <span key={i} className="absolute top-0 -translate-x-1/2 text-center" style={{ left: `${left}%` }}>
                                <span className="block text-[11px] tabular-nums text-green">{t.at}×</span>
                                <span className="mx-auto mt-0.5 block size-2 rounded-full border-2 border-bg-2 bg-green" />
                              </span>
                            );
                          })}
                          <span className="absolute left-0 top-[11px] text-[11px] text-subtle">1×</span>
                        </div>
                        <div className="mt-3 grid grid-cols-3 gap-2 text-[12.5px]">
                          {s.tiers.map((t, i) => (
                            <div key={i} className="rounded-md border border-line px-3 py-2">
                              <p className="text-[11px] text-subtle">Tier {i + 1}</p>
                              <p className="tabular-nums">
                                sell <span className="text-fg">{t.sell}%</span> <span className="text-subtle">at</span> <span className="text-green">{t.at}×</span>
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </Group>
                  )}

                  {m("Stop loss") && (
                    <Group label="Stop loss">
                      <Ruler
                        label="Sell everything if it falls"
                        hint="Measured from your entry price"
                        display={`−${s.stopLoss}%`}
                        unit={`${(1 - s.stopLoss / 100).toFixed(2)}×`}
                        tone="text-red"
                        t={(s.stopLoss - 5) / 55}
                        onT={(t) => set("stopLoss", Math.round(5 + t * 55))}
                        marks={["5%", "20%", "35%", "50%", "60%"]}
                      />
                    </Group>
                  )}

                  <Group label="Early exits">
                    {m("Stale exit") && (
                      <Row label="Stale exit" hint="Sell if the price goes quiet for this long">
                        <Segmented
                          value={String(s.stale) as "15" | "30" | "45" | "60"}
                          onChange={(v) => set("stale", Number(v))}
                          options={(["15", "30", "45", "60"] as const).map((x) => ({ key: x, label: `${x}m` }))}
                        />
                      </Row>
                    )}
                    {m("Trailing stop") && (
                      <Row label="Trailing stop" hint={`Sell if the price slips ${s.trailPct}% from its peak`}>
                        <Switch checked={s.trailing} onChange={(v) => set("trailing", v)} label="Trailing stop" />
                      </Row>
                    )}
                    {m("Sell if the dev sells") && (
                      <Row label="Sell if the dev sells" hint="Exit when the creator's wallet sells">
                        <Switch checked={s.devSells} onChange={(v) => set("devSells", v)} label="Sell if the dev sells" />
                      </Row>
                    )}
                    {m("Sell if buyers walk away") && (
                      <Row label="Sell if buyers walk away" hint="Exit when buy pressure dries up">
                        <Switch checked={s.buyersLeave} onChange={(v) => set("buyersLeave", v)} label="Sell if buyers walk away" />
                      </Row>
                    )}
                  </Group>
                </>
              )}

              {section === "fees" && (
                <Group label="Transaction fees">
                  {m("Auto fees") && (
                    <Row label="Auto fees" hint="Pick priority fee and tip from current network load">
                      <Switch checked={s.autoFees} onChange={(v) => set("autoFees", v)} label="Auto fees" />
                    </Row>
                  )}
                  {m("Priority fee") && (
                    <Row label="Priority fee" hint="Extra SOL paid so the transaction lands faster" dim={s.autoFees}>
                      <NumberField value={s.priority} suffix="SOL" step={0.0001} disabled={s.autoFees} onChange={(v) => set("priority", v)} />
                    </Row>
                  )}
                  {m("Jito tip") && (
                    <Row label="Jito tip" hint="Tip to validators for bundle priority" dim={s.autoFees}>
                      <NumberField value={s.jito} suffix="SOL" step={0.0001} disabled={s.autoFees} onChange={(v) => set("jito", v)} />
                    </Row>
                  )}
                  {m("Slippage") && (
                    <Row label="Slippage" hint="Most the price may move between sending and filling">
                      <NumberField value={s.slippage} suffix="%" onChange={(v) => set("slippage", v)} />
                    </Row>
                  )}
                </Group>
              )}
            </motion.div>
          </AnimatePresence>
        </section>

        {/* summary + pending changes */}
        <aside className="space-y-4 xl:col-span-5">
          <Card className="overflow-hidden xl:sticky xl:top-6">
            <p className="border-b border-line px-5 py-3 text-[12px] text-muted">Your bot, in plain English</p>
            <ul className="divide-y divide-line">
              <Summary icon={ShoppingCartSimpleIcon} color="#7cc4ff" title="Buys">
                <b className="font-medium text-fg">{s.perTrade.toFixed(2)} SOL</b> of each new coin {s.buyAt === "launch" ? "at launch" : "after migration"} that passes your{" "}
                <b className="font-medium text-fg">{activeGates} checks</b>. {s.maxOpen === 0 ? "No limit on how many at once." : `Up to ${s.maxOpen} at once.`}
              </Summary>
              <Summary icon={ArrowCircleUpIcon} color="#21c95e" title="Takes profit">
                In <b className="font-medium text-fg">{s.tiers.length} steps</b> — {s.tiers.map((t) => `${t.sell}% at ${t.at}×`).join(", ")}.
              </Summary>
              <Summary icon={ArrowCircleDownIcon} color="#ff622e" title="Cuts the loss">
                Sells everything if it falls <b className="font-medium text-fg">{s.stopLoss}%</b>, or early if{" "}
                {[s.trailing && `it slips ${s.trailPct}% from its peak`, `it goes quiet for ${s.stale}m`, s.buyersLeave && "buyers walk away", s.devSells && "the dev sells"].filter(Boolean).join(", ")}.
              </Summary>
            </ul>

            <AnimatePresence initial={false}>
              {dirty && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-line">
                  <div className="px-5 py-3.5">
                    <p className="text-[12px] text-warn">Unsaved changes</p>
                    <ul className="mt-2 space-y-1.5">
                      {changes.map((c) => (
                        <li key={c.label} className="flex items-center gap-2 text-[12.5px]">
                          <span className="flex-1 truncate text-muted">{c.label}</span>
                          <span className="tabular-nums text-subtle line-through decoration-white/20">{c.from}</span>
                          <ArrowRightIcon className="size-3 text-subtle" />
                          <span className="tabular-nums text-fg">{c.to}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3.5 flex justify-end gap-2">
                      <button onClick={() => setS(saved)} className="h-8 rounded-full px-3 text-[12.5px] text-muted transition-colors hover:bg-white/[.05] hover:text-fg">
                        Discard
                      </button>
                      <button onClick={save} className="btn-live h-8 px-3.5 text-[13px]">
                        Save as v{version + 1}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </aside>
      </div>
    </Page>
  );
}

/* ---------------- building blocks ---------------- */

function Hint({ text }: { text: string }) {
  return (
    <span className="group/hint relative">
      <InfoIcon className="size-3.5 text-subtle transition-colors group-hover/hint:text-fg" />
      <span className="pointer-events-none absolute bottom-6 left-1/2 z-20 w-56 -translate-x-1/2 rounded-md border border-line bg-bg-3 px-2.5 py-1.5 text-[12px] leading-relaxed text-muted opacity-0 shadow-pop transition-opacity group-hover/hint:opacity-100">
        {text}
      </span>
    </span>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 px-1 text-[11px] uppercase tracking-[0.08em] text-subtle">{label}</p>
      <Card className="divide-y divide-line">{children}</Card>
    </div>
  );
}

function Row({ label, hint, dim, children }: { label: string; hint: string; dim?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex h-12 items-center justify-between gap-4 px-5 transition-colors hover:bg-white/[.02]">
      <span className={`flex items-center gap-1.5 text-[13.5px] ${dim ? "text-subtle" : ""}`}>
        {label} <Hint text={hint} />
      </span>
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

function NumberField({ value, onChange, prefix = "", suffix = "", step = 1, disabled }: { value: number; onChange: (v: number) => void; prefix?: string; suffix?: string; step?: number; disabled?: boolean }) {
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

/* big number, thin slider and a tick ruler underneath */
function Ruler({
  label,
  hint,
  display,
  unit,
  t,
  onT,
  marks,
  tone = "text-fg",
}: {
  label: string;
  hint: string;
  display: string;
  unit: string;
  t: number;
  onT: (t: number) => void;
  marks: string[];
  tone?: string;
}) {
  const clamped = Math.max(0, Math.min(1, t));
  return (
    <div className="px-5 py-4">
      <div className="flex items-baseline justify-between">
        <span className="flex items-center gap-1.5 text-[13.5px]">
          {label} <Hint text={hint} />
        </span>
        <span className="tabular-nums">
          <span className={`text-[22px] font-light tracking-tight ${tone}`}>{display}</span>
          <span className="ml-1.5 text-[12px] text-subtle">{unit}</span>
        </span>
      </div>
      <input
        type="range"
        aria-label={label}
        className="thin-range mt-3"
        min={0}
        max={1000}
        value={Math.round(clamped * 1000)}
        onChange={(e) => onT(Number(e.target.value) / 1000)}
        style={{ "--fill": `${clamped * 100}%` } as React.CSSProperties}
      />
      {/* ruler: minor ticks, major ticks carry the labels */}
      <div className="relative mt-1 h-5">
        {Array.from({ length: 41 }).map((_, i) => (
          <span key={i} className={`absolute top-0 w-px ${i % 10 === 0 ? "h-2 bg-white/25" : "h-1 bg-white/10"}`} style={{ left: `${(i / 40) * 100}%` }} />
        ))}
        {marks.map((mk, i) => (
          <span
            key={mk}
            className="absolute top-2.5 text-[10.5px] tabular-nums text-subtle"
            style={{ left: `${(i / (marks.length - 1)) * 100}%`, transform: i === 0 ? "none" : i === marks.length - 1 ? "translateX(-100%)" : "translateX(-50%)" }}
          >
            {mk}
          </span>
        ))}
      </div>
    </div>
  );
}

function Summary({ icon: I, color, title, children }: { icon: Icon; color: string; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3 px-5 py-4">
      <I className="mt-0.5 size-[18px] shrink-0" style={{ color }} />
      <div className="min-w-0">
        <p className="text-[12px] text-subtle">{title}</p>
        <p className="mt-0.5 text-[13.5px] leading-relaxed text-muted">{children}</p>
      </div>
    </li>
  );
}
