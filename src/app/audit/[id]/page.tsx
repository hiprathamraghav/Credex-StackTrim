import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAudit } from "@/lib/store";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const audit = await getAudit(id);
  if (!audit) {
    return { title: "Audit not found | StackTrim" };
  }

  const title =
    audit.totalMonthlySavings > 0
      ? `$${audit.totalAnnualSavings.toLocaleString()}/yr AI savings found`
      : "AI stack audit: spending efficiently";

  return {
    title,
    description: audit.summary,
    openGraph: {
      title,
      description: audit.summary,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: audit.summary,
    },
  };
}

export default async function PublicAuditPage({ params }: PageProps) {
  const { id } = await params;
  const audit = await getAudit(id);

  if (!audit) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#090909] text-white">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-8 md:px-10">
        <nav className="flex items-center justify-between">
          <Link href="/" className="text-sm font-semibold text-white">
            StackTrim
          </Link>
          <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/60">Public audit</span>
        </nav>

        <div className="rounded-[8px] border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/30 md:p-8">
          <p className="text-sm uppercase tracking-[0.24em] text-emerald-300">AI Spend Audit</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-normal md:text-6xl">
            ${audit.totalAnnualSavings.toLocaleString()} annual savings opportunity
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-white/68">{audit.summary}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Metric label="Current monthly spend" value={`$${audit.totalCurrentSpend.toLocaleString()}`} />
          <Metric label="Optimized monthly spend" value={`$${audit.totalOptimizedSpend.toLocaleString()}`} />
          <Metric label="Monthly savings" value={`$${audit.totalMonthlySavings.toLocaleString()}`} accent />
        </div>

        <section className="grid gap-4 md:grid-cols-2">
          {audit.recommendations.map((item) => (
            <article key={item.toolId} className="rounded-[8px] border border-white/10 bg-[#111] p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold">{item.toolName}</h2>
                  <p className="mt-1 text-sm text-white/52">{item.currentPlan}</p>
                </div>
                <span className="rounded-full bg-emerald-400/12 px-3 py-1 text-sm text-emerald-200">
                  ${item.monthlySavings}/mo
                </span>
              </div>
              <p className="mt-5 text-sm font-medium text-white">{item.recommendedAction}</p>
              <p className="mt-2 text-sm leading-6 text-white/62">{item.reason}</p>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}

function Metric({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-[8px] border border-white/10 bg-[#101010] p-5">
      <p className="text-sm text-white/52">{label}</p>
      <p className={accent ? "mt-2 text-3xl font-semibold text-emerald-300" : "mt-2 text-3xl font-semibold text-white"}>
        {value}
      </p>
    </div>
  );
}
