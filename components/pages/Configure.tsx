"use client";

import {
  ArrowCircleDownIcon,
  ArrowCircleUpIcon,
  ArrowsClockwiseIcon,
  CaretRightIcon,
  ChartBarIcon,
  ChartLineUpIcon,
  CheckIcon,
  DownloadSimpleIcon,
  HourglassMediumIcon,
  type Icon,
  InfoIcon,
  LightningIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  RocketLaunchIcon,
  ShareNetworkIcon,
  ShoppingCartSimpleIcon,
  SparkleIcon,
  StackIcon,
  TrendUpIcon,
  UploadSimpleIcon,
  UserCircleIcon,
  UsersThreeIcon,
  WalletIcon,
  XIcon,
} from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/primitives";
import { Page, Switch, Tabs } from "./kit";

type Section = "essentials" | "gates" | "exit" | "fees";

// Values as configured on TrenchersAI for this bot.
const INITIAL = {
  // essentials
  buyAt: "launch" as "launch" | "migration",
  ai: false,
  perTrade: 0.05,
  maxOpen: 0, // 0 = unlimited
  reentry: false,
  pump: true,
  // entry gates
  buyZone: true,
  curve: true,
  curveLo: 8,
  curveHi: 70,
  mcap: false,
  concentration: true,
  devHold: true,
  devHoldPct: 15,
  devBuy: true,
  devBuySol: 1.5,
  // exit strategy
  steps: [{ sell: 100, at: 3 }],
  stopOn: true,
  stopAt: 0.75,
  trailing: true,
  trailFrom: 2.5,
  trailKeep: 85,
  // fees & execution
  buySlip: 15,
  buySlipAuto: false,
  sellSlip: 5,
  sellSlipAuto: false,
  priority: 0.00001,
  priorityAuto: true,
  tip: 0.0002,
  tipAuto: true,
  buyRetries: 2,
  buyRetryOn: true,
  buyCeiling: 40,
  sellRetries: 3,
  sellRetryOn: true,
  sellCeiling: 50,
};
type State = typeof INITIAL;

export function Configure() {
  const [s, setS] = useState<State>(INITIAL);
  const [saved, setSaved] = useState<State>(INITIAL);
  const [section, setSection] = useState<Section>("essentials");
  const [q, setQ] = useState("");
  const [version, setVersion] = useState(2);
  const [flash, setFlash] = useState(false);
  const set = <K extends keyof State>(k: K, v: State[K]) => setS((p) => ({ ...p, [k]: v }));
  const dirty = JSON.stringify(s) !== JSON.stringify(saved);

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
  const m = (...labels: string[]) => !q || labels.some((l) => l.toLowerCase().includes(q.toLowerCase()));

  // 15 fixed safety checks + the switchable gates on this page
  const checks = 15 + [s.buyZone && s.curve, s.buyZone && s.mcap, s.concentration && s.devHold, s.concentration && s.devBuy].filter(Boolean).length;
  const last = s.steps[s.steps.length - 1];
  const fallPct = Math.round((1 - s.stopAt) * 100);

  return (
    <Page width="wide">
      {/* title row */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-medium tracking-tight">Configure</h1>
          <p className="mt-1 text-[13px] text-subtle">
            config v{version} · {dirty ? <span className="text-warn">unsaved changes</span> : flash ? <span className="text-green">saved just now</span> : "saved today"}
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
              { key: "gates", label: "Entry Gates" },
              { key: "exit", label: "Exit Strategy" },
              { key: "fees", label: "Fees & execution" },
            ]}
          />
        </div>
        <label className="mb-2 flex h-8 w-56 items-center gap-2 rounded-full border border-line px-3 focus-within:border-white/25">
          <MagnifyingGlassIcon className="size-3.5 text-subtle" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search parameters…" className="h-full flex-1 bg-transparent text-[12.5px] outline-none placeholder:text-subtle" />
        </label>
      </div>

      <div className="grid gap-6 xl:grid-cols-12">
        <section className="min-w-0 xl:col-span-7">
          <AnimatePresence mode="wait">
            <motion.div key={section} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} className="space-y-4">
              {/* ---------------- Essentials ---------------- */}
              {section === "essentials" && (
                <>
                  {m("Buy at", "AI optimizations") && (
                    <Card className="divide-y divide-line">
                      {m("Buy at") && (
                        <Row icon={UserCircleIcon} label="Buy at" hint="Buy right at launch, or once the coin migrates off the bonding curve">
                          <Segmented
                            value={s.buyAt}
                            onChange={(v) => set("buyAt", v)}
                            options={[
                              { key: "launch", label: "Launch", icon: RocketLaunchIcon },
                              { key: "migration", label: "Migration", icon: HourglassMediumIcon },
                            ]}
                          />
                        </Row>
                      )}
                      {m("AI optimizations") && (
                        <Row icon={SparkleIcon} label="AI optimizations" hint="Let AI review results and suggest config changes">
                          <Switch checked={s.ai} onChange={(v) => set("ai", v)} label="AI optimizations" />
                        </Row>
                      )}
                    </Card>
                  )}

                  {m("Per-trade size", "Max open positions") && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {m("Per-trade size") && (
                        <Card>
                          <Ruler
                            icon={WalletIcon}
                            label="Per-trade size"
                            hint="SOL spent on each buy"
                            display={s.perTrade.toFixed(3)}
                            unit="SOL"
                            t={Math.log(s.perTrade / 0.001) / Math.log(5 / 0.001)}
                            onT={(t) => set("perTrade", Math.round(0.001 * Math.pow(5000, t) * 1000) / 1000)}
                            min={["Min size", "0.001"]}
                            max={["Soft max", "5.000"]}
                          />
                        </Card>
                      )}
                      {m("Max open positions") && (
                        <Card>
                          <Ruler
                            icon={StackIcon}
                            label="Max open positions"
                            hint="How many coins the bot can hold at once"
                            display={s.maxOpen === 0 ? "∞" : String(s.maxOpen)}
                            unit={s.maxOpen === 0 ? "" : "at once"}
                            t={s.maxOpen / 10}
                            onT={(t) => set("maxOpen", Math.round(t * 10))}
                            min={["Unlimited", "∞"]}
                            max={["Soft max", "10"]}
                          />
                        </Card>
                      )}
                    </div>
                  )}

                  {m("Allow re-entry") && (
                    <Card>
                      <Row icon={ArrowsClockwiseIcon} label="Allow re-entry" hint="Buy the same coin again after selling it">
                        <Switch checked={s.reentry} onChange={(v) => set("reentry", v)} label="Allow re-entry" />
                      </Row>
                    </Card>
                  )}

                  {m("Launchpads") && (
                    <Card className="px-5 py-4">
                      <div className="flex items-center justify-between">
                        <Label icon={RocketLaunchIcon} label="Launchpads" hint="Where the bot looks for new coins">
                          <span className="ml-1 rounded border border-line px-1.5 text-[10px] uppercase tracking-wider text-subtle">new</span>
                        </Label>
                        <span className="text-[12px] tabular-nums text-subtle">{s.pump ? 1 : 0} of 1</span>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <button
                          onClick={() => set("pump", !s.pump)}
                          aria-pressed={s.pump}
                          className={`flex h-7 items-center gap-2 rounded-full border px-3 text-[12.5px] transition-colors ${s.pump ? "border-white/25 bg-white/[.04] text-fg" : "border-line text-subtle hover:text-fg"}`}
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

              {/* ---------------- Entry Gates ---------------- */}
              {section === "gates" && (
                <>
                  {m("Buy zone", "Curve progress", "Market cap") && (
                    <Section icon={ChartLineUpIcon} title="Buy zone" desc="The bot only buys a token at the right stage and size." on={s.buyZone} onToggle={(v) => set("buyZone", v)}>
                      <div className={`divide-y divide-line ${s.buyZone ? "" : "pointer-events-none opacity-40"}`}>
                        <div className="px-5 py-4">
                          <div className="flex items-center justify-between">
                            <Label icon={TrendUpIcon} label="Curve progress" hint="How full the bonding curve is, from launch to migration" />
                            <span className="flex items-center gap-3">
                              <span className="text-[12.5px] tabular-nums text-accent">
                                {s.curveLo}% – {s.curveHi}%
                              </span>
                              <Switch checked={s.curve} onChange={(v) => set("curve", v)} label="Curve progress" />
                            </span>
                          </div>
                          <CurveRange lo={s.curveLo} hi={s.curveHi} disabled={!s.curve} onChange={(lo, hi) => setS((p) => ({ ...p, curveLo: lo, curveHi: hi }))} />
                        </div>
                        <Row icon={ChartBarIcon} label="Market cap" hint="Only buy within a market-cap range">
                          <Switch checked={s.mcap} onChange={(v) => set("mcap", v)} label="Market cap" />
                        </Row>
                        <p className="px-5 py-3.5 text-[13px] text-muted">
                          {s.curve ? (
                            <>
                              The bot only buys while the curve is <span className="text-fg">{s.curveLo}%–{s.curveHi}%</span> full.
                            </>
                          ) : (
                            "Curve progress is not checked."
                          )}{" "}
                          {s.mcap ? "Market cap is checked." : "Market cap is not checked."}
                        </p>
                      </div>
                    </Section>
                  )}

                  {m("Concentration & dev", "Max dev holding", "Max dev buy") && (
                    <Section icon={UsersThreeIcon} title="Concentration & dev" desc="Reject launches where supply is too concentrated." on={s.concentration} onToggle={(v) => set("concentration", v)}>
                      <div className={`divide-y divide-line ${s.concentration ? "" : "pointer-events-none opacity-40"}`}>
                        <Sentence icon={UserCircleIcon} label="Max dev holding %" hint="How much of the supply the creator may still hold" on={s.devHold} onToggle={(v) => set("devHold", v)}>
                          Skip it when the dev still holds over <Num value={s.devHoldPct} suffix="%" onChange={(v) => set("devHoldPct", v)} /> of the supply.
                        </Sentence>
                        <Sentence icon={PlusIcon} label="Max dev buy" hint="How much SOL the creator spent buying their own token" on={s.devBuy} onToggle={(v) => set("devBuy", v)}>
                          Skip it when the dev bought over <Num value={s.devBuySol} suffix=" SOL" step={0.1} onChange={(v) => set("devBuySol", v)} /> of their own token.
                        </Sentence>
                      </div>
                    </Section>
                  )}
                </>
              )}

              {/* ---------------- Exit Strategy ---------------- */}
              {section === "exit" && (
                <>
                  {m("Take-profit & stops", "Step", "Stop") && (
                    <Section icon={StackIcon} title="Take-profit & stops" desc="Where the bot sells into a win, and where it cuts a loss.">
                      <div className="px-5 pb-1 pt-4">
                        <p className="text-[13.5px]">
                          {s.steps.length === 1 && last.sell === 100 ? `Sells everything at ${last.at}x.` : `Sells in ${s.steps.length} steps, the last at ${last.at}x.`}{" "}
                          {s.stopOn ? `Stop at ${s.stopAt}x.` : "No stop."}
                        </p>
                        <Ladder steps={s.steps} stopAt={s.stopOn ? s.stopAt : null} />
                      </div>
                      <div className="divide-y divide-line border-t border-line">
                        {s.steps.map((st, i) => (
                          <div key={i} className="flex items-center gap-3 px-5 py-3 text-[13px] text-muted">
                            <span className="flex-1">
                              <span className="font-medium text-fg">Step {i + 1}:</span> sell{" "}
                              <Num value={st.sell} suffix="%" onChange={(v) => set("steps", s.steps.map((x, k) => (k === i ? { ...x, sell: Math.max(1, Math.min(100, v)) } : x)))} /> of what&apos;s left when the price hits{" "}
                              <Num value={st.at} suffix="x" step={0.1} onChange={(v) => set("steps", s.steps.map((x, k) => (k === i ? { ...x, at: v } : x)))} />.
                            </span>
                            <Hint text="Each step sells a share of what is still held" />
                            {s.steps.length > 1 && (
                              <button onClick={() => set("steps", s.steps.filter((_, k) => k !== i))} className="icon-btn size-6" aria-label={`Remove step ${i + 1}`}>
                                <XIcon className="size-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          onClick={() => {
                            const prev = s.steps[s.steps.length - 1];
                            const steps = s.steps.map((x, k) => (k === s.steps.length - 1 && x.sell === 100 ? { ...x, sell: 50 } : x));
                            set("steps", [...steps, { sell: 100, at: Math.round((prev.at + 1) * 10) / 10 }]);
                          }}
                          className="flex w-full items-center gap-2 px-5 py-3 text-left text-[13px] text-muted transition-colors hover:bg-white/[.02] hover:text-fg"
                        >
                          <PlusIcon className="size-3.5" /> Add a step
                        </button>
                        <div className="flex items-center gap-3 px-5 py-3 text-[13px] text-muted">
                          <span className={`flex-1 ${s.stopOn ? "" : "opacity-50"}`}>
                            <span className="font-medium text-fg">Stop:</span> sell everything if the price falls to{" "}
                            <Num value={s.stopAt} suffix="x" step={0.05} onChange={(v) => set("stopAt", Math.max(0.05, Math.min(0.99, v)))} /> of what you paid.
                          </span>
                          <Hint text="Measured against your entry price" />
                          <Switch checked={s.stopOn} onChange={(v) => set("stopOn", v)} label="Stop loss" />
                        </div>
                      </div>
                    </Section>
                  )}

                  {m("Trailing stop") && (
                    <Section icon={ArrowCircleUpIcon} title="Trailing stop" desc="Ride a winner up, and sell when it gives back." on={s.trailing} onToggle={(v) => set("trailing", v)}>
                      <p className={`px-5 py-3.5 text-[13px] text-muted ${s.trailing ? "" : "opacity-40"}`}>
                        Once the price touches <Num value={s.trailFrom} suffix="x" step={0.1} onChange={(v) => set("trailFrom", v)} />, sell everything if it slips back to{" "}
                        <Num value={s.trailKeep} suffix="%" onChange={(v) => set("trailKeep", v)} /> of its peak.
                      </p>
                    </Section>
                  )}
                </>
              )}

              {/* ---------------- Fees & execution ---------------- */}
              {section === "fees" && (
                <Section icon={LightningIcon} title="Fees & execution">
                  {m("Buy slippage", "Sell slippage", "Slippage") && (
                    <Sub title="Slippage">
                      <FeeRow icon={UploadSimpleIcon} label="Buy slippage" desc="Maximum price movement on a buy.">
                        <Num value={s.buySlip} suffix="%" onChange={(v) => set("buySlip", v)} disabled={s.buySlipAuto} />
                        <Auto checked={s.buySlipAuto} onChange={(v) => set("buySlipAuto", v)} label="Buy slippage" />
                      </FeeRow>
                      <FeeRow icon={DownloadSimpleIcon} label="Sell slippage" desc="Default price limit for sells.">
                        <Num value={s.sellSlip} suffix="%" onChange={(v) => set("sellSlip", v)} disabled={s.sellSlipAuto} />
                        <Auto checked={s.sellSlipAuto} onChange={(v) => set("sellSlipAuto", v)} label="Sell slippage" />
                      </FeeRow>
                    </Sub>
                  )}
                  {m("Priority fee", "Landing tip", "Ultrafast landing") && (
                    <Sub title="Ultrafast landing">
                      <FeeRow icon={SparkleIcon} label="Priority fee" desc="Extra network fee to help your trade get processed.">
                        {s.priorityAuto ? <Approx value={s.priority} /> : <Num value={s.priority} suffix=" SOL" step={0.00001} onChange={(v) => set("priority", v)} />}
                        <Auto checked={s.priorityAuto} onChange={(v) => set("priorityAuto", v)} label="Priority fee" />
                      </FeeRow>
                      <FeeRow icon={LightningIcon} label="Landing tip" desc="Tip paid through a delivery service to help your trade land.">
                        {s.tipAuto ? <Approx value={s.tip} /> : <Num value={s.tip} suffix=" SOL" step={0.0001} onChange={(v) => set("tip", v)} />}
                        <Auto checked={s.tipAuto} onChange={(v) => set("tipAuto", v)} label="Landing tip" />
                      </FeeRow>
                    </Sub>
                  )}
                  {m("Buy retries", "Sell retries", "Retries", "slippage ceiling") && (
                    <Sub title="Retries">
                      <RetryRow
                        label="Buy retries"
                        desc="Retry a buy that misses on price."
                        on={s.buyRetryOn}
                        onToggle={(v) => set("buyRetryOn", v)}
                        count={s.buyRetries}
                        onCount={(v) => set("buyRetries", v)}
                        ceilingLabel="Buy slippage ceiling"
                        ceiling={s.buyCeiling}
                        onCeiling={(v) => set("buyCeiling", v)}
                      />
                      <RetryRow
                        label="Sell retries"
                        desc="Retry a sell that misses on price."
                        on={s.sellRetryOn}
                        onToggle={(v) => set("sellRetryOn", v)}
                        count={s.sellRetries}
                        onCount={(v) => set("sellRetries", v)}
                        ceilingLabel="Sell slippage ceiling"
                        ceiling={s.sellCeiling}
                        onCeiling={(v) => set("sellCeiling", v)}
                      />
                    </Sub>
                  )}
                </Section>
              )}
            </motion.div>
          </AnimatePresence>
        </section>

        {/* Your bot */}
        <aside className="xl:col-span-5">
          <Card className="overflow-hidden xl:sticky xl:top-6">
            <p className="border-b border-line px-5 py-3 text-[12px] text-muted">Your bot</p>
            <ul className="divide-y divide-line">
              <Summary icon={ShoppingCartSimpleIcon} color="#7cc4ff" title="Buys" onClick={() => setSection("essentials")}>
                <b className="font-medium text-fg">{s.perTrade.toFixed(2)} SOL</b> of each new coin that passes your <b className="font-medium text-fg">{checks} checks</b>.
                <span className="mt-1 block text-[12px] text-subtle">{s.maxOpen === 0 ? "No limit on how many at once." : `Up to ${s.maxOpen} at once.`}</span>
              </Summary>
              <Summary icon={ArrowCircleUpIcon} color="#21c95e" title="Takes profit" onClick={() => setSection("exit")}>
                {s.steps.length === 1 && last.sell === 100 ? (
                  <>
                    Sells everything at <b className="font-medium text-fg">{last.at}x</b>.
                  </>
                ) : (
                  <>
                    Sells in <b className="font-medium text-fg">{s.steps.length} steps</b>, the last at <b className="font-medium text-fg">{last.at}x</b>.
                  </>
                )}
              </Summary>
              <Summary icon={ArrowCircleDownIcon} color="#ff622e" title="Cuts the loss" onClick={() => setSection("exit")}>
                {s.stopOn ? (
                  <>
                    Sells everything if it falls <b className="font-medium text-fg">{fallPct}%</b>.
                  </>
                ) : (
                  "No stop loss."
                )}
                <span className="mt-1 block text-[12px] leading-relaxed text-subtle">It also sells early if the price slips from its peak, the coin goes quiet, buyers walk away, or the dev sells.</span>
              </Summary>
            </ul>
          </Card>
        </aside>
      </div>
    </Page>
  );
}

/* ---------------- building blocks ---------------- */

function Hint({ text }: { text: string }) {
  return (
    <span className="group/hint relative inline-flex">
      <InfoIcon className="size-3.5 text-subtle transition-colors group-hover/hint:text-fg" />
      <span className="pointer-events-none absolute bottom-6 left-1/2 z-20 w-56 -translate-x-1/2 rounded-md border border-line bg-bg-3 px-2.5 py-1.5 text-[12px] font-normal leading-relaxed text-muted opacity-0 shadow-pop transition-opacity group-hover/hint:opacity-100">
        {text}
      </span>
    </span>
  );
}

function Label({ icon: I, label, hint, children }: { icon: Icon; label: string; hint: string; children?: React.ReactNode }) {
  return (
    <span className="flex items-center gap-2 text-[13.5px]">
      <I className="size-4 text-subtle" />
      {label}
      <Hint text={hint} />
      {children}
    </span>
  );
}

function Row({ icon, label, hint, children }: { icon: Icon; label: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-[52px] items-center justify-between gap-4 px-5 py-2 transition-colors hover:bg-white/[.02]">
      <Label icon={icon} label={label} hint={hint} />
      {children}
    </div>
  );
}

/** A titled block (Buy zone, Trailing stop, …) with an optional master switch. */
function Section({ icon: I, title, desc, on, onToggle, children }: { icon: Icon; title: string; desc?: string; on?: boolean; onToggle?: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-3.5">
        <div>
          <p className="flex items-center gap-2 text-[14px] font-medium">
            <I className="size-4 text-accent" /> {title}
          </p>
          {desc && <p className="mt-0.5 text-[12.5px] text-subtle">{desc}</p>}
        </div>
        {onToggle && <Switch checked={!!on} onChange={onToggle} label={title} />}
      </div>
      {children}
    </Card>
  );
}

function Sub({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-line last:border-0">
      <p className="px-5 pb-1 pt-3.5 text-[11px] uppercase tracking-[0.08em] text-subtle">{title}</p>
      <div className="divide-y divide-line">{children}</div>
    </div>
  );
}

/** A gate written as a sentence with inline values, plus its switch. */
function Sentence({ icon, label, hint, on, onToggle, children }: { icon: Icon; label: string; hint: string; on: boolean; onToggle: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <div className="px-5 py-3.5">
      <div className="flex items-center justify-between">
        <Label icon={icon} label={label} hint={hint} />
        <Switch checked={on} onChange={onToggle} label={label} />
      </div>
      <p className={`mt-2 text-[13px] leading-8 text-muted ${on ? "" : "opacity-40"}`}>{children}</p>
    </div>
  );
}

function FeeRow({ icon, label, desc, children }: { icon: Icon; label: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3">
      <div className="min-w-0">
        <Label icon={icon} label={label} hint={desc} />
        <p className="ml-6 mt-0.5 text-[12px] text-subtle">{desc}</p>
      </div>
      <div className="flex shrink-0 items-center gap-3">{children}</div>
    </div>
  );
}

function RetryRow(p: {
  label: string;
  desc: string;
  on: boolean;
  onToggle: (v: boolean) => void;
  count: number;
  onCount: (v: number) => void;
  ceilingLabel: string;
  ceiling: number;
  onCeiling: (v: number) => void;
}) {
  return (
    <div className="px-5 py-3">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <Label icon={ArrowsClockwiseIcon} label={p.label} hint={p.desc} />
          <p className="ml-6 mt-0.5 text-[12px] text-subtle">{p.desc}</p>
        </div>
        <div className="flex items-center gap-3">
          <Num value={p.count} onChange={p.onCount} disabled={!p.on} />
          <Switch checked={p.on} onChange={p.onToggle} label={p.label} />
        </div>
      </div>
      <div className={`mt-2.5 flex items-center justify-between gap-4 pl-6 ${p.on ? "" : "opacity-40"}`}>
        <span className="flex items-center gap-1.5 text-[13px] text-muted">
          {p.ceilingLabel} <Hint text="Highest slippage a retry may use" />
        </span>
        <span className="mr-[44px]">
          <Num value={p.ceiling} suffix="%" onChange={p.onCeiling} disabled={!p.on} />
        </span>
      </div>
    </div>
  );
}

function Auto({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <span className="flex flex-col items-center gap-0.5">
      <Switch checked={checked} onChange={onChange} label={`${label} auto`} />
      <span className="text-[10.5px] text-subtle">Auto</span>
    </span>
  );
}

function Approx({ value }: { value: number }) {
  return <span className="w-[86px] text-right text-[12.5px] tabular-nums text-muted">≈ {value} SOL</span>;
}

/** Inline editable value, sized to its content. */
function Num({ value, onChange, suffix = "", step = 1, disabled }: { value: number; onChange: (v: number) => void; suffix?: string; step?: number; disabled?: boolean }) {
  const text = String(value);
  return (
    <label
      className={`inline-flex h-7 items-center rounded-md border border-line bg-white/[.04] px-2 align-middle text-[12.5px] font-medium tabular-nums text-fg transition-colors focus-within:border-white/30 hover:border-white/15 ${disabled ? "opacity-40" : ""}`}
    >
      <input
        type="number"
        value={value}
        step={step}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: `${Math.max(1, text.length) + 0.5}ch` }}
        className="bg-transparent text-right outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      {suffix && <span className="ml-px whitespace-pre text-muted">{suffix}</span>}
    </label>
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

/* big number, thin slider, a tick ruler, and the min / soft-max labels */
function Ruler({ icon, label, hint, display, unit, t, onT, min, max }: { icon: Icon; label: string; hint: string; display: string; unit: string; t: number; onT: (t: number) => void; min: [string, string]; max: [string, string] }) {
  const c = Math.max(0, Math.min(1, t));
  return (
    <div className="px-5 py-4">
      <Label icon={icon} label={label} hint={hint} />
      <p className="mt-4 text-center tabular-nums">
        <span className="text-[30px] font-light tracking-tight">{display}</span>
        {unit && <span className="ml-1.5 text-[12px] text-subtle">{unit}</span>}
      </p>
      <input
        type="range"
        aria-label={label}
        className="thin-range mt-3"
        min={0}
        max={1000}
        value={Math.round(c * 1000)}
        onChange={(e) => onT(Number(e.target.value) / 1000)}
        style={{ "--fill": `${c * 100}%` } as React.CSSProperties}
      />
      <div className="relative mt-1 h-2">
        {Array.from({ length: 21 }).map((_, i) => (
          <span key={i} className={`absolute top-0 w-px ${i % 5 === 0 ? "h-2 bg-white/25" : "h-1 bg-white/10"}`} style={{ left: `${(i / 20) * 100}%` }} />
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[11px] tabular-nums">
        <span>
          <span className="block uppercase tracking-wider text-subtle">{min[0]}</span>
          <span className="text-muted">{min[1]}</span>
        </span>
        <span className="text-right">
          <span className="block uppercase tracking-wider text-subtle">{max[0]}</span>
          <span className="text-muted">{max[1]}</span>
        </span>
      </div>
    </div>
  );
}

/* the bonding curve with a draggable buy band */
function CurveRange({ lo, hi, disabled, onChange }: { lo: number; hi: number; disabled: boolean; onChange: (lo: number, hi: number) => void }) {
  const W = 400;
  const H = 64;
  // an exponential-looking bonding curve, flat at launch and steep near migration
  const pts = Array.from({ length: 41 }, (_, i) => {
    const x = i / 40;
    return `${(x * W).toFixed(1)},${(H - 4 - (Math.pow(x, 2.6) * (H - 10))).toFixed(1)}`;
  }).join(" ");
  return (
    <div className={`mt-3 ${disabled ? "opacity-40" : ""}`}>
      <div className="flex justify-between text-[11px] tabular-nums text-accent">
        <span style={{ marginLeft: `calc(${lo}% - 8px)` }}>{lo}%</span>
        <span style={{ marginRight: `calc(${100 - hi}% - 10px)` }}>{hi}%</span>
      </div>
      <div className="relative mt-1 h-16 overflow-hidden rounded-md border border-line">
        <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 size-full" preserveAspectRatio="none" aria-hidden>
          <polyline points={pts} fill="none" stroke="rgba(247,247,247,.35)" strokeWidth="1.25" vectorEffect="non-scaling-stroke" />
        </svg>
        {/* quarter guides */}
        {[25, 50, 75].map((g) => (
          <span key={g} className="absolute inset-y-0 w-px bg-white/[.05]" style={{ left: `${g}%` }} />
        ))}
        {/* buy band */}
        <span className="absolute inset-y-0 border-x-2 border-accent bg-accent/[.10]" style={{ left: `${lo}%`, width: `${hi - lo}%` }}>
          <span className="absolute inset-x-0 bottom-1.5 text-center text-[11px] text-accent">buys here</span>
        </span>
        <input type="range" min={0} max={100} value={lo} disabled={disabled} aria-label="Curve progress from" className="dual-range" onChange={(e) => onChange(Math.min(Number(e.target.value), hi - 2), hi)} />
        <input type="range" min={0} max={100} value={hi} disabled={disabled} aria-label="Curve progress to" className="dual-range" onChange={(e) => onChange(lo, Math.max(Number(e.target.value), lo + 2))} />
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] text-subtle">
        <span>Launch</span>
        <span>50%</span>
        <span>Migration</span>
      </div>
      <div className="mt-2.5 flex justify-between">
        <button onClick={() => onChange(0, hi)} className="h-7 rounded-full border border-line px-3 text-[12px] text-muted transition-colors hover:border-white/20 hover:text-fg">
          From launch
        </button>
        <button onClick={() => onChange(lo, 100)} className="h-7 rounded-full border border-line px-3 text-[12px] text-muted transition-colors hover:border-white/20 hover:text-fg">
          To migration
        </button>
      </div>
    </div>
  );
}

/* price ladder: stop on the left, entry at 1x, each take-profit step to the right (axis 0.5x–4x) */
function Ladder({ steps, stopAt }: { steps: { sell: number; at: number }[]; stopAt: number | null }) {
  const MIN = 0.5;
  const MAX = Math.max(4, steps[steps.length - 1].at + 0.5);
  const pos = (v: number) => `${((v - MIN) / (MAX - MIN)) * 100}%`;
  const bounds = [1, ...steps.map((st) => st.at)];
  return (
    <div className="mt-4 pb-6">
      <div className="relative h-5 text-[11px] tabular-nums">
        <span className="absolute -translate-x-1/2 text-muted" style={{ left: pos(1) }}>
          1x you buy
        </span>
        {steps.map((st, i) => (
          <span key={i} className="absolute -translate-x-1/2 text-accent" style={{ left: pos(st.at) }}>
            {st.at}x
          </span>
        ))}
      </div>
      <div className="relative h-24 overflow-hidden rounded-md border border-line">
        {/* below the stop: hatched */}
        {stopAt !== null && (
          <span
            className="absolute inset-y-0 left-0"
            style={{ width: pos(stopAt), backgroundImage: "repeating-linear-gradient(135deg, rgba(255,98,46,.16) 0 1px, transparent 1px 7px)" }}
          />
        )}
        {/* holding zone: stop → first target */}
        <span className="absolute inset-y-0 bg-white/[.03]" style={{ left: pos(stopAt ?? MIN), width: `calc(${pos(bounds[1])} - ${pos(stopAt ?? MIN)})` }} />
        {/* each step's band, shaded by how much is still held */}
        {steps.map((st, i) => {
          const from = bounds[i];
          const to = st.at;
          const held = steps.slice(0, i).reduce((h, x) => h * (1 - x.sell / 100), 1);
          return (
            <span key={i} className="absolute bottom-0 border-t border-accent/60 bg-accent/[.08]" style={{ left: pos(from), width: `calc(${pos(to)} - ${pos(from)})`, height: `${Math.max(18, held * 70)}%` }}>
              <span className="absolute inset-x-0 top-1.5 text-center text-[10.5px] tabular-nums text-accent/90">{Math.round(held * 100)}%</span>
            </span>
          );
        })}
        {/* entry */}
        <span className="absolute inset-y-0 w-px border-l border-dashed border-white/30" style={{ left: pos(1) }} />
        {/* targets */}
        {steps.map((st, i) => (
          <span key={i} className="absolute inset-y-0 w-[2px] bg-accent" style={{ left: pos(st.at) }} />
        ))}
        {/* stop */}
        {stopAt !== null && <span className="absolute inset-y-0 w-[2px] bg-fg" style={{ left: pos(stopAt) }} />}
      </div>
      <div className="relative mt-1.5 h-4 text-[11px] tabular-nums">
        {stopAt !== null && (
          <span className="absolute -translate-x-1/2 text-fg" style={{ left: pos(stopAt) }}>
            {stopAt}x stop
          </span>
        )}
        <span className="absolute right-0 text-subtle">{MAX}x</span>
      </div>
    </div>
  );
}

function Summary({ icon: I, color, title, onClick, children }: { icon: Icon; color: string; title: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <li>
      <button onClick={onClick} className="group flex w-full items-start gap-3 px-5 py-4 text-left transition-colors hover:bg-white/[.025]">
        <I className="mt-0.5 size-[18px] shrink-0" style={{ color }} />
        <span className="min-w-0 flex-1">
          <span className="block text-[12px] text-subtle">{title}</span>
          <span className="mt-0.5 block text-[13.5px] leading-relaxed text-muted">{children}</span>
        </span>
        <CaretRightIcon className="mt-1 size-3.5 text-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-fg" />
      </button>
    </li>
  );
}
