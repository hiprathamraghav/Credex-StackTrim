import { NextResponse } from "next/server";
import { runAudit, type AuditInput, type ToolId, type UseCase } from "@/lib/audit";
import { generateAuditSummary } from "@/lib/ai";
import { saveAudit } from "@/lib/store";

const toolIds: ToolId[] = ["cursor", "copilot", "claude", "chatgpt", "anthropic-api", "openai-api", "gemini", "windsurf"];
const useCases: UseCase[] = ["coding", "writing", "data", "research", "mixed"];

function isAuditInput(value: unknown): value is AuditInput {
  if (!value || typeof value !== "object") {
    return false;
  }
  const input = value as AuditInput;
  return (
    Array.isArray(input.tools) &&
    input.tools.length > 0 &&
    Number.isFinite(input.teamSize) &&
    input.teamSize > 0 &&
    useCases.includes(input.useCase) &&
    input.tools.every(
      (tool) =>
        toolIds.includes(tool.toolId) &&
        typeof tool.plan === "string" &&
        Number.isFinite(tool.monthlySpend) &&
        tool.monthlySpend >= 0 &&
        Number.isFinite(tool.seats) &&
        tool.seats >= 0,
    )
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as unknown;

  if (!isAuditInput(body)) {
    return NextResponse.json({ error: "Invalid audit input." }, { status: 400 });
  }

  const initial = runAudit(body);
  const summary = await generateAuditSummary(body, initial);
  const saved = await saveAudit(runAudit(body, summary));

  return NextResponse.json(saved);
}
