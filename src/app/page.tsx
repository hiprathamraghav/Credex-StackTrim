"use client";

import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Copy,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  TOOL_CATALOG,
  createDemoInput,
  getPlanNames,
  type AuditInput,
  type AuditResult,
  type ToolId,
  type ToolInput,
  type UseCase,
} from "@/lib/audit";

const toolIds = Object.keys(TOOL_CATALOG) as ToolId[];
const toolLogos: Record<ToolId, string> = {
  cursor: "https://www.google.com/s2/favicons?sz=64&domain=cursor.com",
  copilot: "https://www.google.com/s2/favicons?sz=64&domain=github.com",
  claude: "https://www.google.com/s2/favicons?sz=64&domain=anthropic.com",
  chatgpt: "https://www.google.com/s2/favicons?sz=64&domain=openai.com",
  "anthropic-api": "https://www.google.com/s2/favicons?sz=64&domain=anthropic.com",
  "openai-api": "https://www.google.com/s2/favicons?sz=64&domain=openai.com",
  gemini: "https://www.google.com/s2/favicons?sz=64&domain=gemini.google.com",
  windsurf: "https://www.google.com/s2/favicons?sz=64&domain=windsurf.com",
};
const useCases: { value: UseCase; label: string }[] = [
  { value: "coding", label: "Coding" },
  { value: "writing", label: "Writing" },
  { value: "data", label: "Data" },
  { value: "research", label: "Research" },
  { value: "mixed", label: "Mixed" },
];

const emptyInput: AuditInput = {
  tools: [
    { toolId: "cursor", plan: "Pro", monthlySpend: 20, seats: 1 },
    { toolId: "chatgpt", plan: "Plus", monthlySpend: 20, seats: 1 },
  ],
  teamSize: 4,
  useCase: "coding",
};

export default function Home() {
  const [input, setInput] = useState<AuditInput>(() => {
    if (typeof window === "undefined") {
      return emptyInput;
    }
    const saved = window.localStorage.getItem("stacktrim-input");
    return saved ? (JSON.parse(saved) as AuditInput) : emptyInput;
  });
  const [result, setResult] = useState<AuditResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [leadStatus, setLeadStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.localStorage.setItem("stacktrim-input", JSON.stringify(input));
  }, [input]);

  const selectedToolIds = useMemo(() => new Set(input.tools.map((tool) => tool.toolId)), [input.tools]);

  async function runAudit() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/audits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = (await response.json()) as AuditResult | { error: string };
      if (!response.ok || "error" in data) {
        throw new Error("error" in data ? data.error : "Could not run audit.");
      }
      setResult(data);
      window.setTimeout(() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth" }), 80);
    } catch (auditError) {
      setError(auditError instanceof Error ? auditError.message : "Could not run audit.");
    } finally {
      setLoading(false);
    }
  }

  async function captureLead(formData: FormData) {
    if (!result?.id) {
      return;
    }
    setLeadStatus("Saving your report...");
    const response = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        auditId: result.id,
        email: formData.get("email"),
        company: formData.get("company"),
        role: formData.get("role"),
        website: formData.get("website"),
        teamSize: input.teamSize,
      }),
    });
    setLeadStatus(response.ok ? "Report captured. Check your inbox for the confirmation." : "Could not save this lead yet.");
  }

  function toggleTool(toolId: ToolId) {
    const exists = selectedToolIds.has(toolId);
    setInput((current) => {
      if (exists) {
        return { ...current, tools: current.tools.filter((tool) => tool.toolId !== toolId) };
      }
      const firstPlan = getPlanNames(toolId)[0];
      return {
        ...current,
        tools: [...current.tools, { toolId, plan: firstPlan, monthlySpend: TOOL_CATALOG[toolId].plans[firstPlan].monthly, seats: 1 }],
      };
    });
  }

  function updateTool(index: number, patch: Partial<ToolInput>) {
    setInput((current) => ({
      ...current,
      tools: current.tools.map((tool, toolIndex) => (toolIndex === index ? { ...tool, ...patch } : tool)),
    }));
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#090909] text-white">
      <section className="relative mx-auto grid min-h-screen w-full max-w-7xl gap-8 px-5 py-6 md:grid-cols-[0.9fr_1.1fr] md:px-10 lg:px-12">
        <div className="absolute inset-x-0 top-0 h-48 bg-[linear-gradient(90deg,rgba(16,185,129,0.18),rgba(245,158,11,0.12),rgba(255,255,255,0))]" />
        <div className="relative z-10 flex flex-col justify-between gap-10 py-6 md:py-10">
          <nav className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-[8px] bg-emerald-300 text-black">
              <BarChart3 size={18} />
            </div>
            <span className="text-sm font-semibold tracking-wide">StackTrim</span>
          </nav>

          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/70">
              <Sparkles size={14} className="text-emerald-300" />
              Free AI spend audit for startup teams
            </div>
            <h1 className="mt-6 max-w-2xl text-5xl font-semibold leading-[1.02] tracking-normal md:text-7xl">
              Find the AI spend hiding in your stack
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-white/64 md:text-lg">
              Audit Cursor, Claude, ChatGPT, Copilot, Gemini, and API bills in under two minutes. See where to downgrade,
              switch, or buy smarter through Credex credits.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={runAudit}
                className="inline-flex h-12 items-center gap-2 rounded-[8px] bg-emerald-300 px-5 text-sm font-semibold text-black transition hover:bg-emerald-200"
              >
                Run my audit <ArrowRight size={16} />
              </button>
              <button
                onClick={() => setInput(createDemoInput())}
                className="inline-flex h-12 items-center gap-2 rounded-[8px] border border-white/10 px-5 text-sm font-semibold text-white/82 transition hover:bg-white/[0.06]"
              >
                Load sample stack
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-sm text-white/58">
            <Proof icon={<ShieldCheck size={16} />} label="No login" />
            <Proof icon={<LockKeyhole size={16} />} label="Email after value" />
            <Proof icon={<CheckCircle2 size={16} />} label="Shareable report" />
          </div>
        </div>

        <section className="relative z-10 self-center rounded-[8px] border border-white/10 bg-[#101010]/95 p-4 shadow-2xl shadow-black/50 md:p-5">
          <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <p className="text-sm text-white/54">Interactive calculator</p>
              <h2 className="mt-1 text-2xl font-semibold">AI spend inputs</h2>
            </div>
            <span className="rounded-full bg-amber-300/12 px-3 py-1 text-xs font-medium text-amber-200">Live estimate</span>
          </div>

          <div className="mt-5">
            <p className="text-sm font-medium text-white/74">Select paid tools</p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {toolIds.map((toolId) => (
                <button
                  key={toolId}
                  onClick={() => toggleTool(toolId)}
                  className={
                    selectedToolIds.has(toolId)
                      ? "rounded-[8px] border border-emerald-300/70 bg-emerald-300/12 px-3 py-3 text-left text-sm font-medium text-emerald-100"
                      : "rounded-[8px] border border-white/10 bg-white/[0.03] px-3 py-3 text-left text-sm font-medium text-white/62 hover:bg-white/[0.06]"
                  }
                >
                  <span className="flex items-center gap-2">
                    <ToolLogo toolId={toolId} />
                    {TOOL_CATALOG[toolId].name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 max-h-[44vh] space-y-3 overflow-auto pr-1">
            {input.tools.map((tool, index) => (
              <div key={`${tool.toolId}-${index}`} className="rounded-[8px] border border-white/10 bg-black/24 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="flex items-center gap-2 font-medium">
                    <ToolLogo toolId={tool.toolId} />
                    {TOOL_CATALOG[tool.toolId].name}
                  </p>
                  <button
                    aria-label={`Remove ${TOOL_CATALOG[tool.toolId].name}`}
                    onClick={() => setInput((current) => ({ ...current, tools: current.tools.filter((_, itemIndex) => itemIndex !== index) }))}
                    className="grid h-8 w-8 place-items-center rounded-[8px] text-white/42 hover:bg-white/[0.06] hover:text-white"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  <label className="text-xs text-white/48">
                    Plan
                    <select
                      value={tool.plan}
                      onChange={(event) => updateTool(index, { plan: event.target.value })}
                      className="mt-1 h-10 w-full rounded-[8px] border border-white/10 bg-[#151515] px-3 text-sm text-white outline-none"
                    >
                      {getPlanNames(tool.toolId).map((plan) => (
                        <option key={plan}>{plan}</option>
                      ))}
                    </select>
                  </label>
                  <NumberField label="Monthly spend" value={tool.monthlySpend} onChange={(value) => updateTool(index, { monthlySpend: value })} />
                  <NumberField label="Seats" value={tool.seats} onChange={(value) => updateTool(index, { seats: value })} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 grid gap-4 border-t border-white/10 pt-5 md:grid-cols-[1fr_1fr]">
            <label className="text-sm text-white/62">
              Team size: <span className="font-semibold text-white">{input.teamSize}</span>
              <input
                type="range"
                min="1"
                max="100"
                value={input.teamSize}
                onChange={(event) => setInput((current) => ({ ...current, teamSize: Number(event.target.value) }))}
                className="mt-3 w-full accent-emerald-300"
              />
            </label>
            <div>
              <p className="text-sm text-white/62">Primary use case</p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {useCases.map((useCase) => (
                  <button
                    key={useCase.value}
                    onClick={() => setInput((current) => ({ ...current, useCase: useCase.value }))}
                    className={
                      input.useCase === useCase.value
                        ? "rounded-[8px] bg-white px-3 py-2 text-xs font-semibold text-black"
                        : "rounded-[8px] border border-white/10 px-3 py-2 text-xs font-semibold text-white/58"
                    }
                  >
                    {useCase.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error ? <p className="mt-4 rounded-[8px] bg-red-400/12 px-3 py-2 text-sm text-red-100">{error}</p> : null}
          <button
            onClick={runAudit}
            disabled={loading || input.tools.length === 0}
            className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-[8px] bg-emerald-300 text-sm font-semibold text-black transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Auditing stack..." : "Generate instant audit"} <ArrowRight size={16} />
          </button>
        </section>
      </section>

      {result ? (
        <section id="results" className="mx-auto w-full max-w-7xl px-5 py-12 md:px-10 lg:px-12">
          <div className="rounded-[8px] border border-white/10 bg-[#101010] p-5 md:p-8">
            <p className="text-sm uppercase tracking-[0.24em] text-emerald-300">Instant Audit</p>
            <div className="mt-4 grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
              <div>
                <h2 className="text-4xl font-semibold tracking-normal md:text-6xl">
                  {result.totalMonthlySavings < 100 ? "You are spending well" : `Save $${result.totalAnnualSavings.toLocaleString()}/yr`}
                </h2>
                <p className="mt-4 max-w-2xl text-base leading-7 text-white/62">{result.summary}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Metric label="Current monthly" value={`$${result.totalCurrentSpend.toLocaleString()}`} />
                <Metric label="Optimized monthly" value={`$${result.totalOptimizedSpend.toLocaleString()}`} />
                <Metric label="Monthly savings" value={`$${result.totalMonthlySavings.toLocaleString()}`} accent />
                <Metric label="Annual savings" value={`$${result.totalAnnualSavings.toLocaleString()}`} accent />
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-[8px] border border-red-300/15 bg-red-300/[0.04] p-5">
              <h3 className="text-lg font-semibold">Current stack</h3>
              <div className="mt-4 space-y-3">
                {result.recommendations.map((item) => (
                  <div key={item.toolId} className="flex items-center justify-between gap-3 rounded-[8px] bg-black/22 p-3">
                    <span className="text-sm text-white/72">{item.toolName}</span>
                    <span className="font-mono text-sm text-red-100">${item.currentSpend}/mo</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-[8px] border border-emerald-300/20 bg-emerald-300/[0.05] p-5">
              <h3 className="text-lg font-semibold">Optimized stack</h3>
              <div className="mt-4 space-y-3">
                {result.recommendations.map((item) => (
                  <div key={item.toolId} className="rounded-[8px] bg-black/22 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2 text-sm font-medium text-white">
                        <ToolLogo toolId={item.toolId} />
                        {item.recommendedAction}
                      </span>
                      <span className="font-mono text-sm text-emerald-200">${item.optimizedSpend}/mo</span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-white/58">{item.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {result.recommendations.map((item) => (
              <article key={item.toolId} className="rounded-[8px] border border-white/10 bg-[#101010] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="flex items-center gap-2 font-semibold">
                      <ToolLogo toolId={item.toolId} />
                      {item.toolName}
                    </h4>
                    <p className="mt-1 text-xs text-white/48">{item.currentPlan}</p>
                  </div>
                  <span className="rounded-full bg-emerald-300/12 px-2 py-1 text-xs text-emerald-200">${item.monthlySavings}/mo</span>
                </div>
                <p className="mt-4 text-sm font-medium text-white/84">{item.recommendedAction}</p>
                <p className="mt-2 text-sm leading-6 text-white/56">{item.reason}</p>
              </article>
            ))}
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_0.8fr]">
            <form action={captureLead} className="rounded-[8px] border border-white/10 bg-white/[0.04] p-5">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-[8px] bg-emerald-300 text-black">
                  <Mail size={18} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">
                    {result.totalMonthlySavings > 500 ? "Lock in these savings" : "Get optimization alerts"}
                  </h3>
                  <p className="text-sm text-white/56">Capture the report after seeing the audit. No login needed.</p>
                </div>
              </div>
              <input name="website" className="hidden" tabIndex={-1} autoComplete="off" />
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <input name="email" required type="email" placeholder="work@email.com" className="h-11 rounded-[8px] border border-white/10 bg-[#121212] px-3 text-sm outline-none" />
                <input name="company" placeholder="Company (optional)" className="h-11 rounded-[8px] border border-white/10 bg-[#121212] px-3 text-sm outline-none" />
                <input name="role" placeholder="Role (optional)" className="h-11 rounded-[8px] border border-white/10 bg-[#121212] px-3 text-sm outline-none" />
                <button className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] bg-white px-4 text-sm font-semibold text-black">
                  Send report <ArrowRight size={15} />
                </button>
              </div>
              {leadStatus ? <p className="mt-3 text-sm text-emerald-200">{leadStatus}</p> : null}
            </form>

            <div className="rounded-[8px] border border-white/10 bg-[#101010] p-5">
              {result.totalMonthlySavings > 500 ? (
                <>
                  <div className="flex items-center gap-3">
                    <CalendarDays className="text-emerald-300" size={20} />
                    <h3 className="font-semibold">Credex consultation</h3>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-white/58">
                    Your audit crosses the high-savings threshold. Book a procurement review to see how much retail spend can move to discounted credits.
                  </p>
                  <button className="mt-5 h-11 w-full rounded-[8px] border border-emerald-300/40 bg-emerald-300/10 text-sm font-semibold text-emerald-100">
                    Book Credex review
                  </button>
                </>
              ) : (
                <>
                  <h3 className="font-semibold">Share this audit</h3>
                  <p className="mt-3 text-sm leading-6 text-white/58">Public links are anonymized and include only stack, recommendations, and savings numbers.</p>
                </>
              )}
              {result.id ? <ShareLink id={result.id} /> : null}
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="text-xs text-white/48">
      {label}
      <input
        type="number"
        min="0"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-1 h-10 w-full rounded-[8px] border border-white/10 bg-[#151515] px-3 text-sm text-white outline-none"
      />
    </label>
  );
}

function ToolLogo({ toolId }: { toolId: ToolId }) {
  return (
    <span
      aria-hidden="true"
      className="h-5 w-5 shrink-0 rounded-[4px] bg-cover bg-center"
      style={{ backgroundImage: `url(${toolLogos[toolId]})` }}
    />
  );
}

function Proof({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="rounded-[8px] border border-white/10 bg-white/[0.03] p-3">
      <div className="text-emerald-300">{icon}</div>
      <p className="mt-2">{label}</p>
    </div>
  );
}

function Metric({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-[8px] border border-white/10 bg-black/20 p-4">
      <p className="text-xs text-white/48">{label}</p>
      <p className={accent ? "mt-2 text-2xl font-semibold text-emerald-300" : "mt-2 text-2xl font-semibold text-white"}>{value}</p>
    </div>
  );
}

function ShareLink({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);
  const href = typeof window === "undefined" ? `/audit/${id}` : `${window.location.origin}/audit/${id}`;

  return (
    <div className="mt-5 flex gap-2">
      <input readOnly value={href} className="h-10 min-w-0 flex-1 rounded-[8px] border border-white/10 bg-black/20 px-3 text-sm text-white/58" />
      <button
        onClick={() => {
          navigator.clipboard.writeText(href);
          setCopied(true);
        }}
        className="grid h-10 w-10 place-items-center rounded-[8px] bg-white text-black"
        aria-label="Copy share link"
      >
        {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
      </button>
    </div>
  );
}
