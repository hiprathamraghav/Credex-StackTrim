import { describe, expect, it } from "vitest";
import { runAudit, type AuditInput } from "@/lib/audit";

describe("runAudit", () => {
  it("flags a small team overpaying for enterprise/team plans", () => {
    const input: AuditInput = {
      teamSize: 2,
      useCase: "coding",
      tools: [{ toolId: "cursor", plan: "Business", monthlySpend: 80, seats: 2 }],
    };

    const result = runAudit(input);

    expect(result.totalMonthlySavings).toBeGreaterThan(0);
    expect(result.recommendations[0].recommendedAction).toContain("Downgrade");
  });

  it("surfaces a Credex-style credit opportunity for high API spend", () => {
    const input: AuditInput = {
      teamSize: 8,
      useCase: "mixed",
      tools: [{ toolId: "openai-api", plan: "API direct", monthlySpend: 1200, seats: 1 }],
    };

    const result = runAudit(input);

    expect(result.totalMonthlySavings).toBeGreaterThanOrEqual(300);
    expect(result.recommendations[0].recommendedAction).toContain("credits");
  });

  it("does not manufacture savings for an already efficient stack", () => {
    const input: AuditInput = {
      teamSize: 1,
      useCase: "coding",
      tools: [{ toolId: "copilot", plan: "Individual", monthlySpend: 10, seats: 1 }],
    };

    const result = runAudit(input);

    expect(result.totalMonthlySavings).toBe(0);
    expect(result.savingsTier).toBe("efficient");
  });

  it("keeps coding alternatives relevant to developer tools", () => {
    const input: AuditInput = {
      teamSize: 5,
      useCase: "coding",
      tools: [{ toolId: "cursor", plan: "Enterprise", monthlySpend: 500, seats: 5 }],
    };

    const result = runAudit(input);

    expect(result.recommendations[0].recommendedAction).not.toContain("ChatGPT");
    expect(result.recommendations[0].recommendedAction).not.toContain("Gemini");
  });

  it("calculates annual savings from non-negative monthly savings", () => {
    const input: AuditInput = {
      teamSize: 6,
      useCase: "research",
      tools: [{ toolId: "claude", plan: "Team", monthlySpend: 180, seats: 6 }],
    };

    const result = runAudit(input);

    expect(result.totalMonthlySavings).toBeGreaterThanOrEqual(0);
    expect(result.totalAnnualSavings).toBe(result.totalMonthlySavings * 12);
  });
});
