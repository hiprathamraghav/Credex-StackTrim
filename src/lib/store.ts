import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import type { AuditResult } from "./audit";

type LeadInput = {
  auditId: string;
  email: string;
  company?: string;
  role?: string;
  teamSize?: number;
  honeypot?: string;
};

let supabaseClient: SupabaseClient | null = null;
let resendClient: Resend | null = null;
const recentLeadKeys = new Map<string, number>();

declare global {
  var __stacktrimAudits: Map<string, AuditResult> | undefined;
}

function getMemoryAudits() {
  globalThis.__stacktrimAudits ??= new Map<string, AuditResult>();
  return globalThis.__stacktrimAudits;
}

function getSupabase() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }
  if (!supabaseClient) {
    supabaseClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  }
  return supabaseClient;
}

function getResend() {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

export function newAuditId() {
  return `audit_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

export async function saveAudit(result: AuditResult) {
  const id = result.id ?? newAuditId();
  const stored = { ...result, id };
  const supabase = getSupabase();

  if (!supabase) {
    getMemoryAudits().set(id, stored);
    return stored;
  }

  const { error } = await supabase.from("audits").insert({
    id,
    input: stored.input,
    result: stored,
    created_at: stored.createdAt,
  });

  if (error) {
    throw new Error(error.message);
  }

  return stored;
}

export async function getAudit(id: string) {
  const supabase = getSupabase();
  if (!supabase) {
    return getMemoryAudits().get(id) ?? null;
  }

  const { data, error } = await supabase.from("audits").select("result").eq("id", id).single();
  if (error || !data) {
    return null;
  }

  return data.result as AuditResult;
}

export async function captureLead(input: LeadInput) {
  if (input.honeypot) {
    return { ok: true, skipped: true };
  }

  const key = `${input.email}:${input.auditId}`;
  const now = Date.now();
  const recent = recentLeadKeys.get(key);
  if (recent && now - recent < 60_000) {
    throw new Error("Please wait a minute before requesting this report again.");
  }
  recentLeadKeys.set(key, now);

  const audit = await getAudit(input.auditId);
  const highSavings = (audit?.totalMonthlySavings ?? 0) > 500;
  const supabase = getSupabase();

  if (supabase) {
    const { error } = await supabase.from("leads").insert({
      audit_id: input.auditId,
      email: input.email,
      company: input.company || null,
      role: input.role || null,
      team_size: input.teamSize || audit?.input.teamSize || null,
      high_savings: highSavings,
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  const resend = getResend();
  if (resend) {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? "Credex Audit <onboarding@resend.dev>",
      to: input.email,
      subject: highSavings ? "Your AI spend audit is ready" : "Your AI spend snapshot is ready",
      text: `Your audit found $${audit?.totalMonthlySavings ?? 0}/mo in potential savings. Public report: ${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/audit/${input.auditId}`,
    });
  }

  return { ok: true, highSavings };
}
