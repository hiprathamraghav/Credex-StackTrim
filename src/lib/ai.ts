import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import type { AuditInput, AuditResult } from "./audit";
import { fallbackSummary } from "./audit";

export async function generateAuditSummary(input: AuditInput, partial: Omit<AuditResult, "summary">) {
  const prompt = buildSummaryPrompt(input, partial);

  if (process.env.GEMINI_API_KEY) {
    const summary = await generateGeminiSummary(prompt);
    if (summary) {
      return cleanSummary(summary);
    }
  }

  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const { text } = await generateText({
        model: anthropic("claude-3-5-haiku-latest"),
        prompt,
      });

      return cleanSummary(text);
    } catch {
      return fallbackSummary(partial.totalMonthlySavings, input.tools.length, input.useCase);
    }
  }

  return fallbackSummary(partial.totalMonthlySavings, input.tools.length, input.useCase);
}

function buildSummaryPrompt(input: AuditInput, partial: Omit<AuditResult, "summary">) {
  return `Write a concise, specific, finance-literate audit summary in about 100 words.

Use case: ${input.useCase}
Team size: ${input.teamSize}
Monthly savings: $${partial.totalMonthlySavings}
Annual savings: $${partial.totalAnnualSavings}
Recommendations: ${partial.recommendations
    .map((item) => `${item.toolName}: ${item.recommendedAction} (${item.reason})`)
    .join("; ")}

Rules:
- Do not invent vendors, prices, or savings.
- Sound helpful and direct, not alarmist.
- Mention Credex only if monthly savings exceeds $500.
- Return plain text only: no Markdown, heading, bullets, bold, or labels.`;
}

async function generateGeminiSummary(prompt: string) {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 180 },
        }),
      },
    );

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };

    return data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim() || null;
  } catch {
    return null;
  }
}

function cleanSummary(text: string) {
  return text
    .replace(/\*\*/g, "")
    .replace(/^audit summary:\s*/i, "")
    .replace(/^summary:\s*/i, "")
    .trim();
}
