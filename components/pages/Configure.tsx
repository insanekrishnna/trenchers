"use client";

import {
  AirplaneLandingIcon,
  ArrowsCounterClockwiseIcon,
  AtomIcon,
  BasketIcon,
  BezierCurveIcon,
  CardsIcon,
  CaretRightIcon,
  ChartPieSliceIcon,
  CheckIcon,
  ClockClockwiseIcon,
  CoinVerticalIcon,
  CrosshairIcon,
  DetectiveIcon,
  DoorOpenIcon,
  DownloadSimpleIcon,
  DropHalfIcon,
  DropIcon,
  FadersIcon,
  FingerprintIcon,
  FlagCheckeredIcon,
  FootprintsIcon,
  GasPumpIcon,
  GaugeIcon,
  HandCoinsIcon,
  type Icon,
  InfoIcon,
  LadderIcon,
  MagnifyingGlassIcon,
  PlanetIcon,
  PlusIcon,
  RocketLaunchIcon,
  ScissorsIcon,
  ShareNetworkIcon,
  ShootingStarIcon,
  SignOutIcon,
  SwapIcon,
  UploadSimpleIcon,
  VaultIcon,
  XIcon,
} from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/primitives";
import { Page, Switch, Tabs } from "./kit";

type Section = "essentials" | "gates" | "exit" | "fees";

// Values as configured on TrenchersAI for this bot.
const INITIAL = {
  buyAt: "launch" as "launch" | "migration",
  ai: false,
  perTrade: 0.05,
  maxOpen: 0, // 0 = unlimited
  reentry: false,
  pump: true,
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
  steps: [{ sell: 100, at: 3 }],
  stopOn: true,
  stopAt: 0.75,
  trailing: true,
  trailFrom: 2.5,
  trailKeep: 85,
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

const r2 = (n: number) => Math.round(n * 100) / 100; // identical server/client attributes

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
              { key: "essentials", label: "Essentials", icon: FadersIcon },
              { key: "gates", label: "Entry Gates", icon: DoorOpenIcon },
              { key: "exit", label: "Exit Strategy", icon: SignOutIcon },
              { key: "fees", label: "Fees & execution", icon: GasPumpIcon },
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
                        <Row icon={ShootingStarIcon} label="Buy at" hint="Buy right at launch, or once the coin migrates off the bonding curve">
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
                      {m("AI optimizations") && (
                        <Row icon={AtomIcon} label="AI optimizations" hint="Let AI review results and suggest config changes">
                          <Switch checked={s.ai} onChange={(v) => set("ai", v)} label="AI optimizations" />
                        </Row>
                      )}
                    </Card>
                  )}

                  {m("Per-trade size", "Max open positions") && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {m("Per-trade size") && (
                        <Card className="px-5 pb-4 pt-4">
                          <Label icon={CoinVerticalIcon} label="Per-trade size" hint="SOL spent on each buy — drag the dial or use the arrow keys" />
                          <Dial
                            label="Per-trade size"
                            t={Math.log(s.perTrade / 0.001) / Math.log(5 / 0.001)}
                            onT={(t) => set("perTrade", Math.round(0.001 * Math.pow(5000, t) * 1000) / 1000)}
                            display={s.perTrade.toFixed(3)}
                            unit="SOL"
                            valueText={`${s.perTrade.toFixed(3)} SOL`}
                            min={["Min size", "0.001"]}
                            max={["Soft max", "5.000"]}
                          />
                        </Card>
                      )}
                      {m("Max open positions") && (
                        <Card className="px-5 pb-4 pt-4">
                          <Label icon={CardsIcon} label="Max open positions" hint="How many coins the bot can hold at once — the far left is no limit" />
                          <Dial
                            label="Max open positions"
                            t={s.maxOpen / 10}
                            snap={10}
                            onT={(t) => set("maxOpen", Math.round(t * 10))}
                            display={s.maxOpen === 0 ? "∞" : String(s.maxOpen)}
                            unit={s.maxOpen === 0 ? "" : "open"}
                            valueText={s.maxOpen === 0 ? "Unlimited" : `${s.maxOpen} at once`}
                            min={["Unlimited", "∞"]}
                            max={["Soft max", "10"]}
                          />
                        </Card>
                      )}
                    </div>
                  )}

                  {m("Allow re-entry") && (
                    <Card>
                      <Row icon={ArrowsCounterClockwiseIcon} label="Allow re-entry" hint="Buy the same coin again after selling it">
                        <Switch checked={s.reentry} onChange={(v) => set("reentry", v)} label="Allow re-entry" />
                      </Row>
                    </Card>
                  )}

                  {m("Launchpads") && (
                    <Card className="px-5 py-4">
                      <div className="flex items-center justify-between">
                        <Label icon={PlanetIcon} label="Launchpads" hint="Where the bot looks for new coins">
                          <span className="ml-1 rounded border border-accent/30 px-1.5 text-[10px] uppercase tracking-wider text-accent">new</span>
                        </Label>
                        <span className="text-[12px] tabular-nums text-subtle">{s.pump ? 1 : 0} of 1</span>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <button
                          onClick={() => set("pump", !s.pump)}
                          aria-pressed={s.pump}
                          className={`group flex h-8 items-center gap-2 rounded-full border pl-1 pr-3.5 text-[12.5px] transition-all active:scale-[.97] ${
                            s.pump ? "border-green/40 bg-green/[.07] text-fg" : "border-line text-subtle hover:border-white/20 hover:text-fg"
                          }`}
                        >
                          <span className={`grid size-6 place-items-center rounded-full transition-colors ${s.pump ? "bg-green text-bg" : "bg-white/[.06]"}`}>
                            {s.pump ? <CheckIcon className="size-3" weight="bold" /> : <PlusIcon className="size-3" />}
                          </span>
                          Pump.fun
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
                    <Section icon={CrosshairIcon} title="Buy zone" desc="The bot only buys a token at the right stage and size." on={s.buyZone} onToggle={(v) => set("buyZone", v)}>
                      <div className={`divide-y divide-line ${s.buyZone ? "" : "pointer-events-none opacity-40"}`}>
                        <div className="px-5 py-4">
                          <div className="flex items-center justify-between">
                            <Label icon={BezierCurveIcon} label="Curve progress" hint="How full the bonding curve is, from launch to migration. Drag either handle." />
                            <span className="flex items-center gap-3">
                              <span className="rounded-full border border-accent/30 bg-accent/[.08] px-2 py-0.5 text-[12px] tabular-nums text-accent">
                                {s.curveLo}% – {s.curveHi}%
                              </span>
                              <Switch checked={s.curve} onChange={(v) => set("curve", v)} label="Curve progress" />
                            </span>
                          </div>
                          <CurveChart lo={s.curveLo} hi={s.curveHi} disabled={!s.curve} onChange={(lo, hi) => setS((p) => ({ ...p, curveLo: lo, curveHi: hi }))} />
                        </div>
                        <Row icon={ChartPieSliceIcon} label="Market cap" hint="Only buy within a market-cap range">
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
                    <Section icon={DetectiveIcon} title="Concentration & dev" desc="Reject launches where supply is too concentrated." on={s.concentration} onToggle={(v) => set("concentration", v)}>
                      <div className={`divide-y divide-line ${s.concentration ? "" : "pointer-events-none opacity-40"}`}>
                        <Sentence icon={VaultIcon} label="Max dev holding %" hint="How much of the supply the creator may still hold" on={s.devHold} onToggle={(v) => set("devHold", v)}>
                          Skip it when the dev still holds over <Num value={s.devHoldPct} suffix="%" onChange={(v) => set("devHoldPct", v)} /> of the supply.
                        </Sentence>
                        <Sentence icon={FingerprintIcon} label="Max dev buy" hint="How much SOL the creator spent buying their own token" on={s.devBuy} onToggle={(v) => set("devBuy", v)}>
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
                    <Section icon={LadderIcon} title="Take-profit & stops" desc="Where the bot sells into a win, and where it cuts a loss.">
                      <div className="px-5 pb-2 pt-4">
                        <p className="text-[13.5px]">
                          {s.steps.length === 1 && last.sell === 100 ? `Sells everything at ${last.at}x.` : `Sells in ${s.steps.length} steps, the last at ${last.at}x.`}{" "}
                          <span className="text-muted">{s.stopOn ? `Stop at ${s.stopAt}x.` : "No stop."}</span>
                        </p>
                        <PriceTrack steps={s.steps} stopAt={s.stopOn ? s.stopAt : null} />
                      </div>
                      <div className="divide-y divide-line border-t border-line">
                        {s.steps.map((st, i) => (
                          <div key={i} className="flex items-center gap-3 px-5 py-3 text-[13px] text-muted">
                            <span className="grid size-5 shrink-0 place-items-center rounded-full bg-accent/15 text-[10.5px] font-medium tabular-nums text-accent">{i + 1}</span>
                            <span className="flex-1 leading-8">
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
                          className="group flex w-full items-center gap-3 px-5 py-3 text-left text-[13px] text-muted transition-colors hover:bg-white/[.02] hover:text-fg"
                        >
                          <span className="grid size-5 place-items-center rounded-full border border-dashed border-white/25 transition-colors group-hover:border-accent group-hover:text-accent">
                            <PlusIcon className="size-3" />
                          </span>
                          Add a step
                        </button>
                        <div className="flex items-center gap-3 px-5 py-3 text-[13px] text-muted">
                          <span className="grid size-5 shrink-0 place-items-center rounded-full bg-red/15 text-red">
                            <ScissorsIcon className="size-3" />
                          </span>
                          <span className={`flex-1 leading-8 ${s.stopOn ? "" : "opacity-50"}`}>
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
                    <Section icon={FootprintsIcon} title="Trailing stop" desc="Ride a winner up, and sell when it gives back." on={s.trailing} onToggle={(v) => set("trailing", v)}>
                      <p className={`px-5 py-3.5 text-[13px] leading-8 text-muted ${s.trailing ? "" : "opacity-40"}`}>
                        Once the price touches <Num value={s.trailFrom} suffix="x" step={0.1} onChange={(v) => set("trailFrom", v)} />, sell everything if it slips back to{" "}
                        <Num value={s.trailKeep} suffix="%" onChange={(v) => set("trailKeep", v)} /> of its peak.
                      </p>
                    </Section>
                  )}
                </>
              )}

              {/* ---------------- Fees & execution ---------------- */}
              {section === "fees" && (
                <Section icon={GasPumpIcon} title="Fees & execution">
                  {m("Buy slippage", "Sell slippage", "Slippage") && (
                    <Sub title="Slippage">
                      <FeeRow icon={DropIcon} label="Buy slippage" desc="Maximum price movement on a buy.">
                        <Num value={s.buySlip} suffix="%" onChange={(v) => set("buySlip", v)} disabled={s.buySlipAuto} />
                        <Auto checked={s.buySlipAuto} onChange={(v) => set("buySlipAuto", v)} label="Buy slippage" />
                      </FeeRow>
                      <FeeRow icon={DropHalfIcon} label="Sell slippage" desc="Default price limit for sells.">
                        <Num value={s.sellSlip} suffix="%" onChange={(v) => set("sellSlip", v)} disabled={s.sellSlipAuto} />
                        <Auto checked={s.sellSlipAuto} onChange={(v) => set("sellSlipAuto", v)} label="Sell slippage" />
                      </FeeRow>
                    </Sub>
                  )}
                  {m("Priority fee", "Landing tip", "Ultrafast landing") && (
                    <Sub title="Ultrafast landing">
                      <FeeRow icon={GaugeIcon} label="Priority fee" desc="Extra network fee to help your trade get processed.">
                        {s.priorityAuto ? <Approx value={s.priority} /> : <Num value={s.priority} suffix=" SOL" step={0.00001} onChange={(v) => set("priority", v)} />}
                        <Auto checked={s.priorityAuto} onChange={(v) => set("priorityAuto", v)} label="Priority fee" />
                      </FeeRow>
                      <FeeRow icon={AirplaneLandingIcon} label="Landing tip" desc="Tip paid through a delivery service to help your trade land.">
                        {s.tipAuto ? <Approx value={s.tip} /> : <Num value={s.tip} suffix=" SOL" step={0.0001} onChange={(v) => set("tip", v)} />}
                        <Auto checked={s.tipAuto} onChange={(v) => set("tipAuto", v)} label="Landing tip" />
                      </FeeRow>
                    </Sub>
                  )}
                  {m("Buy retries", "Sell retries", "Retries", "slippage ceiling") && (
                    <Sub title="Retries">
                      <RetryRow label="Buy retries" desc="Retry a buy that misses on price." on={s.buyRetryOn} onToggle={(v) => set("buyRetryOn", v)} count={s.buyRetries} onCount={(v) => set("buyRetries", v)} ceilingLabel="Buy slippage ceiling" ceiling={s.buyCeiling} onCeiling={(v) => set("buyCeiling", v)} />
                      <RetryRow label="Sell retries" desc="Retry a sell that misses on price." on={s.sellRetryOn} onToggle={(v) => set("sellRetryOn", v)} count={s.sellRetries} onCount={(v) => set("sellRetries", v)} ceilingLabel="Sell slippage ceiling" ceiling={s.sellCeiling} onCeiling={(v) => set("sellCeiling", v)} />
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
              <Summary icon={BasketIcon} color="#7cc4ff" title="Buys" onClick={() => setSection("essentials")}>
                <b className="font-medium text-fg">{s.perTrade.toFixed(2)} SOL</b> of each new coin that passes your <b className="font-medium text-fg">{checks} checks</b>.
                <span className="mt-1 block text-[12px] text-subtle">{s.maxOpen === 0 ? "No limit on how many at once." : `Up to ${s.maxOpen} at once.`}</span>
              </Summary>
              <Summary icon={HandCoinsIcon} color="#21c95e" title="Takes profit" onClick={() => setSection("exit")}>
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
              <Summary icon={ScissorsIcon} color="#ff622e" title="Cuts the loss" onClick={() => setSection("exit")}>
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

/* ================= building blocks ================= */

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

/** Icon in a small soft tile + label + hint. */
function Label({ icon: I, label, hint, children }: { icon: Icon; label: string; hint: string; children?: React.ReactNode }) {
  return (
    <span className="flex items-center gap-2.5 text-[13.5px]">
      <span className="grid size-7 shrink-0 place-items-center rounded-md border border-line bg-white/[.03]">
        <I className="size-4 text-muted" />
      </span>
      {label}
      <Hint text={hint} />
      {children}
    </span>
  );
}

function Row({ icon, label, hint, children }: { icon: Icon; label: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-[56px] items-center justify-between gap-4 px-5 py-2.5 transition-colors hover:bg-white/[.02]">
      <Label icon={icon} label={label} hint={hint} />
      {children}
    </div>
  );
}

/** A titled block (Buy zone, Trailing stop, …) with an optional master switch. */
function Section({ icon: I, title, desc, on, onToggle, children }: { icon: Icon; title: string; desc?: string; on?: boolean; onToggle?: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-3.5">
        <div className="flex items-center gap-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-accent/[.10]">
            <I className="size-[18px] text-accent" weight="duotone" />
          </span>
          <div>
            <p className="text-[14px] font-medium">{title}</p>
            {desc && <p className="text-[12.5px] text-subtle">{desc}</p>}
          </div>
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

function Sentence({ icon, label, hint, on, onToggle, children }: { icon: Icon; label: string; hint: string; on: boolean; onToggle: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <div className="px-5 py-3.5">
      <div className="flex items-center justify-between">
        <Label icon={icon} label={label} hint={hint} />
        <Switch checked={on} onChange={onToggle} label={label} />
      </div>
      <p className={`ml-[38px] mt-1.5 text-[13px] leading-8 text-muted ${on ? "" : "opacity-40"}`}>{children}</p>
    </div>
  );
}

function FeeRow({ icon, label, desc, children }: { icon: Icon; label: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3">
      <div className="min-w-0">
        <Label icon={icon} label={label} hint={desc} />
        <p className="ml-[38px] text-[12px] text-subtle">{desc}</p>
      </div>
      <div className="flex shrink-0 items-center gap-3">{children}</div>
    </div>
  );
}

function RetryRow(p: { label: string; desc: string; on: boolean; onToggle: (v: boolean) => void; count: number; onCount: (v: number) => void; ceilingLabel: string; ceiling: number; onCeiling: (v: number) => void }) {
  return (
    <div className="px-5 py-3">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <Label icon={ClockClockwiseIcon} label={p.label} hint={p.desc} />
          <p className="ml-[38px] text-[12px] text-subtle">{p.desc}</p>
        </div>
        <div className="flex items-center gap-3">
          <Num value={p.count} onChange={p.onCount} disabled={!p.on} />
          <Switch checked={p.on} onChange={p.onToggle} label={p.label} />
        </div>
      </div>
      <div className={`mt-2 flex items-center justify-between gap-4 pl-[38px] ${p.on ? "" : "opacity-40"}`}>
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
      <span className={`text-[10.5px] ${checked ? "text-accent" : "text-subtle"}`}>Auto</span>
    </span>
  );
}

function Approx({ value }: { value: number }) {
  return <span className="w-[90px] text-right text-[12.5px] tabular-nums text-muted">≈ {value} SOL</span>;
}

/** Inline editable value, sized to its content. */
function Num({ value, onChange, suffix = "", step = 1, disabled }: { value: number; onChange: (v: number) => void; suffix?: string; step?: number; disabled?: boolean }) {
  const text = String(value);
  return (
    <label
      className={`inline-flex h-7 items-center rounded-md border border-line bg-white/[.04] px-2 align-middle text-[12.5px] font-medium tabular-nums text-fg transition-colors focus-within:border-accent/50 hover:border-white/20 ${disabled ? "opacity-40" : ""}`}
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
    <div className="flex shrink-0 rounded-full border border-line bg-white/[.02] p-0.5">
      {options.map((o) => {
        const on = o.key === value;
        return (
          <button
            key={o.key}
            onClick={() => onChange(o.key)}
            className={`relative flex items-center gap-1.5 rounded-full px-3 py-1 text-[12.5px] transition-colors ${on ? "text-bg" : "text-subtle hover:text-fg"}`}
          >
            {on && <motion.span layoutId={`seg-${options.map((x) => x.key).join("")}`} className="absolute inset-0 rounded-full bg-fg" transition={{ type: "spring", stiffness: 500, damping: 38 }} />}
            {o.icon && <o.icon className="relative size-3.5" weight={on ? "fill" : "regular"} />}
            <span className="relative">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Dial: a semicircle of ticks you can drag around ---------- */
function Dial({
  label,
  t,
  onT,
  display,
  unit,
  valueText,
  min,
  max,
  snap,
}: {
  label: string;
  t: number;
  onT: (t: number) => void;
  display: string;
  unit: string;
  valueText: string;
  min: [string, string];
  max: [string, string];
  snap?: number;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const drag = useRef(false);
  const W = 220;
  const cx = 110;
  const cy = 112;
  const R = 92;
  const N = 41;
  const c = Math.max(0, Math.min(1, t));
  const shown = snap ? Math.round(c * snap) / snap : c;

  const fromPointer = (e: React.PointerEvent) => {
    const box = ref.current!.getBoundingClientRect();
    const x = ((e.clientX - box.left) / box.width) * W;
    const y = ((e.clientY - box.top) / box.height) * 124;
    if (y > cy) return onT(x < cx ? 0 : 1);
    let a = Math.atan2(y - cy, x - cx); // -π (left) … 0 (right)
    if (a > 0) a = x < cx ? -Math.PI : 0;
    onT(Math.max(0, Math.min(1, (a + Math.PI) / Math.PI)));
  };
  const ka = Math.PI + shown * Math.PI;
  const kx = r2(cx + Math.cos(ka) * (R - 18));
  const ky = r2(cy + Math.sin(ka) * (R - 18));
  const nudge = snap ? 1 / snap : 0.02;

  return (
    <div className="mt-2">
      <svg
        ref={ref}
        viewBox={`0 0 ${W} 124`}
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(shown * 100)}
        aria-valuetext={valueText}
        className="mx-auto block w-full max-w-[240px] cursor-grab touch-none select-none outline-none active:cursor-grabbing"
        onPointerDown={(e) => {
          drag.current = true;
          (e.target as Element).setPointerCapture?.(e.pointerId);
          fromPointer(e);
        }}
        onPointerMove={(e) => drag.current && fromPointer(e)}
        onPointerUp={() => (drag.current = false)}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight" || e.key === "ArrowUp") onT(Math.min(1, c + nudge));
          if (e.key === "ArrowLeft" || e.key === "ArrowDown") onT(Math.max(0, c - nudge));
        }}
      >
        {Array.from({ length: N }).map((_, i) => {
          const f = i / (N - 1);
          const a = Math.PI + f * Math.PI;
          const on = f <= shown + 1e-6;
          const major = i % 10 === 0;
          const inner = major ? R - 14 : R - 9;
          return (
            <line
              key={i}
              x1={r2(cx + Math.cos(a) * inner)}
              y1={r2(cy + Math.sin(a) * inner)}
              x2={r2(cx + Math.cos(a) * R)}
              y2={r2(cy + Math.sin(a) * R)}
              stroke={on ? "#f7f7f7" : "rgba(247,247,247,.12)"}
              strokeOpacity={on ? 0.35 + 0.65 * (f / Math.max(shown, 0.01)) : 1}
              strokeWidth={major ? 2 : 1.5}
              strokeLinecap="round"
            />
          );
        })}
        {/* knob on the inner track */}
        <circle cx={kx} cy={ky} r="9" fill="rgba(132,255,1,.15)" />
        <circle cx={kx} cy={ky} r="4.5" fill="#84ff01" />
        <text x={cx} y={cy - 14} textAnchor="middle" className="fill-fg text-[30px] font-light tabular-nums">
          {display}
        </text>
        {unit && (
          <text x={cx} y={cy + 4} textAnchor="middle" className="fill-subtle text-[11px] uppercase tracking-wider">
            {unit}
          </text>
        )}
      </svg>
      <div className="mt-1 flex justify-between text-[11px] tabular-nums">
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

/* ---------- Curve progress: the bonding curve with a draggable buy band ---------- */
function CurveChart({ lo, hi, disabled, onChange }: { lo: number; hi: number; disabled: boolean; onChange: (lo: number, hi: number) => void }) {
  const ref = useRef<SVGSVGElement>(null);
  const drag = useRef<"lo" | "hi" | null>(null);
  const W = 600;
  const H = 150;
  const P = { l: 6, r: 6, t: 26, b: 22 };
  const iw = W - P.l - P.r;
  const ih = H - P.t - P.b;
  const xOf = (pct: number) => r2(P.l + (pct / 100) * iw);
  const yOf = (pct: number) => r2(P.t + ih - Math.pow(pct / 100, 2.4) * ih * 0.92);
  const path = (from: number, to: number) => {
    let d = "";
    for (let p = from; p <= to + 0.001; p += 1) d += `${d ? "L" : "M"}${xOf(p)},${yOf(p)}`;
    return d;
  };
  const area = (from: number, to: number) => `${path(from, to)} L${xOf(to)},${P.t + ih} L${xOf(from)},${P.t + ih} Z`;

  const pctFrom = (e: React.PointerEvent) => {
    const box = ref.current!.getBoundingClientRect();
    const x = ((e.clientX - box.left) / box.width) * W;
    return Math.max(0, Math.min(100, Math.round(((x - P.l) / iw) * 100)));
  };
  const move = (pct: number) => {
    if (drag.current === "lo") onChange(Math.min(pct, hi - 2), hi);
    if (drag.current === "hi") onChange(lo, Math.max(pct, lo + 2));
  };

  return (
    <div className={`mt-3 ${disabled ? "pointer-events-none opacity-40" : ""}`}>
      <svg
        ref={ref}
        viewBox={`0 0 ${W} ${H}`}
        className="block w-full touch-none select-none overflow-visible"
        onPointerDown={(e) => {
          const pct = pctFrom(e);
          drag.current = Math.abs(pct - lo) <= Math.abs(pct - hi) ? "lo" : "hi";
          (e.target as Element).setPointerCapture?.(e.pointerId);
          move(pct);
        }}
        onPointerMove={(e) => drag.current && move(pctFrom(e))}
        onPointerUp={() => (drag.current = null)}
      >
        <defs>
          <linearGradient id="curve-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#84ff01" stopOpacity=".22" />
            <stop offset="1" stopColor="#84ff01" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* quarter guides */}
        {[0, 25, 50, 75, 100].map((g) => (
          <g key={g}>
            <line x1={xOf(g)} x2={xOf(g)} y1={P.t} y2={P.t + ih} stroke="rgba(247,247,247,.05)" />
            <text x={xOf(g)} y={H - 6} textAnchor={g === 0 ? "start" : g === 100 ? "end" : "middle"} className="fill-subtle text-[11px] tabular-nums">
              {g}%
            </text>
          </g>
        ))}
        <line x1={P.l} x2={W - P.r} y1={P.t + ih} y2={P.t + ih} stroke="rgba(247,247,247,.12)" />
        {/* the whole curve, quiet */}
        <path d={path(0, 100)} fill="none" stroke="rgba(247,247,247,.28)" strokeWidth="1.5" />
        {/* the buy zone: filled under the curve, curve drawn in lime */}
        <path d={area(lo, hi)} fill="url(#curve-fill)" />
        <path d={path(lo, hi)} fill="none" stroke="#84ff01" strokeWidth="2.25" strokeLinecap="round" />
        {/* label sits in the open sky above the band, clear of the curve */}
        <text x={xOf((lo + hi) / 2)} y={P.t + 22} textAnchor="middle" className="fill-accent text-[11px] tracking-wide">
          buys here
        </text>
        {/* handles */}
        {(
          [
            ["lo", lo],
            ["hi", hi],
          ] as const
        ).map(([k, v]) => (
          <g key={k} className="cursor-ew-resize">
            <line x1={xOf(v)} x2={xOf(v)} y1={P.t - 4} y2={P.t + ih} stroke="#84ff01" strokeWidth="1.25" strokeDasharray="3 3" />
            <rect x={xOf(v) - 20} y={2} width="40" height="18" rx="9" fill="#84ff01" />
            <text x={xOf(v)} y={14.5} textAnchor="middle" className="fill-bg text-[11px] font-medium tabular-nums">
              {v}%
            </text>
            <circle cx={xOf(v)} cy={yOf(v)} r="6" fill="#0d0c17" stroke="#84ff01" strokeWidth="2" />
          </g>
        ))}
      </svg>
      <div className="mt-3 flex items-center justify-between">
        <button
          onClick={() => onChange(0, hi)}
          className="group flex h-8 items-center gap-2 rounded-full border border-line pl-1 pr-3 text-[12px] text-muted transition-all hover:border-white/20 hover:text-fg active:scale-[.97]"
        >
          <span className="grid size-6 place-items-center rounded-full bg-white/[.06] transition-colors group-hover:bg-accent group-hover:text-bg">
            <RocketLaunchIcon className="size-3.5" />
          </span>
          From launch
        </button>
        <button
          onClick={() => onChange(lo, 100)}
          className="group flex h-8 items-center gap-2 rounded-full border border-line pl-3 pr-1 text-[12px] text-muted transition-all hover:border-white/20 hover:text-fg active:scale-[.97]"
        >
          To migration
          <span className="grid size-6 place-items-center rounded-full bg-white/[.06] transition-colors group-hover:bg-accent group-hover:text-bg">
            <FlagCheckeredIcon className="size-3.5" />
          </span>
        </button>
      </div>
    </div>
  );
}

/* ---------- Take-profit & stops: a price track from 0.5x to 4x ---------- */
function PriceTrack({ steps, stopAt }: { steps: { sell: number; at: number }[]; stopAt: number | null }) {
  const MIN = 0.5;
  const MAX = Math.max(4, Math.ceil(steps[steps.length - 1].at + 0.5));
  const pct = (v: number) => ((v - MIN) / (MAX - MIN)) * 100;
  const ticks: number[] = [];
  for (let v = MIN; v <= MAX + 1e-9; v += 0.5) ticks.push(Math.round(v * 10) / 10);
  const first = steps[0].at;
  return (
    <div className="mt-5 select-none">
      {/* pins above the track */}
      <div className="relative h-11">
        {stopAt !== null && <Pin left={pct(stopAt)} tone="red" title={`${stopAt}x`} sub="stop" />}
        <Pin left={pct(1)} tone="white" title="1x" sub="you buy" />
        {steps.map((st, i) => (
          <Pin key={i} left={pct(st.at)} tone="lime" title={`${st.at}x`} sub={`sell ${st.sell}%`} />
        ))}
      </div>
      {/* the track */}
      <div className="relative h-3 overflow-hidden rounded-full bg-white/[.04]">
        {stopAt !== null && (
          <span
            className="absolute inset-y-0 left-0"
            style={{ width: `${pct(stopAt)}%`, backgroundImage: "repeating-linear-gradient(135deg, rgba(255,98,46,.45) 0 1.5px, transparent 1.5px 6px)" }}
          />
        )}
        <span className="absolute inset-y-0 bg-white/[.10]" style={{ left: `${pct(stopAt ?? MIN)}%`, width: `${pct(1) - pct(stopAt ?? MIN)}%` }} />
        <motion.span
          className="absolute inset-y-0 rounded-r-full bg-gradient-to-r from-green/40 to-accent"
          style={{ left: `${pct(1)}%` }}
          initial={false}
          animate={{ width: `${pct(first) - pct(1)}%` }}
          transition={{ type: "spring", stiffness: 160, damping: 24 }}
        />
        {steps.slice(1).map((st, i) => (
          <span key={i} className="absolute inset-y-0 bg-accent/50" style={{ left: `${pct(steps[i].at)}%`, width: `${pct(st.at) - pct(steps[i].at)}%` }} />
        ))}
      </div>
      {/* axis */}
      <div className="relative mt-1.5 h-4">
        {ticks.map((v) => (
          <span key={v} className="absolute -translate-x-1/2 text-[10.5px] tabular-nums text-subtle" style={{ left: `${pct(v)}%` }}>
            {Number.isInteger(v) ? `${v}x` : "·"}
          </span>
        ))}
      </div>
    </div>
  );
}

function Pin({ left, tone, title, sub }: { left: number; tone: "red" | "white" | "lime"; title: string; sub: string }) {
  const color = tone === "red" ? "text-red" : tone === "lime" ? "text-accent" : "text-fg";
  const line = tone === "red" ? "bg-red" : tone === "lime" ? "bg-accent" : "bg-white/60";
  return (
    <span className="absolute bottom-0 flex -translate-x-1/2 flex-col items-center" style={{ left: `${left}%` }}>
      <span className={`text-[12px] font-medium tabular-nums leading-none ${color}`}>{title}</span>
      <span className="mt-0.5 whitespace-nowrap text-[10.5px] leading-none text-subtle">{sub}</span>
      <span className={`mt-1 h-2.5 w-px ${line}`} />
    </span>
  );
}

function Summary({ icon: I, color, title, onClick, children }: { icon: Icon; color: string; title: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <li>
      <button onClick={onClick} className="group flex w-full items-start gap-3 px-5 py-4 text-left transition-colors hover:bg-white/[.025]">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg" style={{ background: `${color}1a` }}>
          <I className="size-[18px]" style={{ color }} weight="duotone" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[12px] text-subtle">{title}</span>
          <span className="mt-0.5 block text-[13.5px] leading-relaxed text-muted">{children}</span>
        </span>
        <CaretRightIcon className="mt-1 size-3.5 text-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-fg" />
      </button>
    </li>
  );
}
