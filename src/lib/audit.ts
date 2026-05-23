export type UseCase = "coding" | "writing" | "data" | "research" | "mixed";

export type ToolId =
  | "cursor"
  | "copilot"
  | "claude"
  | "chatgpt"
  | "anthropic-api"
  | "openai-api"
  | "gemini"
  | "windsurf";

export type ToolInput = {
  toolId: ToolId;
  plan: string;
  monthlySpend: number;
  seats: number;
};

export type AuditInput = {
  tools: ToolInput[];
  teamSize: number;
  useCase: UseCase;
};

export type AuditRecommendation = {
  toolId: ToolId;
  toolName: string;
  currentPlan: string;
  currentSpend: number;
  recommendedAction: string;
  optimizedSpend: number;
  monthlySavings: number;
  reason: string;
  severity: "healthy" | "watch" | "overspend";
};

export type AuditResult = {
  id?: string;
  input: AuditInput;
  recommendations: AuditRecommendation[];
  totalCurrentSpend: number;
  totalOptimizedSpend: number;
  totalMonthlySavings: number;
  totalAnnualSavings: number;
  savingsTier: "efficient" | "moderate" | "high";
  summary: string;
  createdAt: string;
};

type PlanPrice = {
  monthly: number;
  seatBased: boolean;
  bestFor: string;
};

type ToolCatalogEntry = {
  name: string;
  plans: Record<string, PlanPrice>;
  useCases: UseCase[];
  creditEligible: boolean;
  source: string;
};

export const TOOL_CATALOG: Record<ToolId, ToolCatalogEntry> = {
  cursor: {
    name: "Cursor",
    useCases: ["coding", "mixed"],
    creditEligible: true,
    source: "https://docs.cursor.com/account/plans",
    plans: {
      Hobby: { monthly: 0, seatBased: true, bestFor: "trying Cursor" },
      Pro: { monthly: 20, seatBased: true, bestFor: "individual developers" },
      Business: { monthly: 40, seatBased: true, bestFor: "teams needing admin controls" },
      Enterprise: { monthly: 80, seatBased: true, bestFor: "large companies with custom security" },
    },
  },
  copilot: {
    name: "GitHub Copilot",
    useCases: ["coding", "mixed"],
    creditEligible: false,
    source: "https://github.com/features/copilot/plans",
    plans: {
      Individual: { monthly: 10, seatBased: true, bestFor: "single developers" },
      Business: { monthly: 19, seatBased: true, bestFor: "teams on GitHub" },
      Enterprise: { monthly: 39, seatBased: true, bestFor: "orgs needing enterprise policy" },
    },
  },
  claude: {
    name: "Claude",
    useCases: ["writing", "research", "coding", "mixed"],
    creditEligible: true,
    source: "https://docs.anthropic.com/en/docs/about-claude/pricing",
    plans: {
      Free: { monthly: 0, seatBased: true, bestFor: "occasional use" },
      Pro: { monthly: 20, seatBased: true, bestFor: "individual heavy users" },
      Max: { monthly: 100, seatBased: true, bestFor: "very high individual usage" },
      Team: { monthly: 30, seatBased: true, bestFor: "collaborating teams" },
      Enterprise: { monthly: 70, seatBased: true, bestFor: "large managed deployments" },
      "API direct": { monthly: 0, seatBased: false, bestFor: "usage-based product workloads" },
    },
  },
  chatgpt: {
    name: "ChatGPT",
    useCases: ["writing", "data", "research", "mixed", "coding"],
    creditEligible: true,
    source: "https://openai.com/chatgpt/pricing",
    plans: {
      Plus: { monthly: 20, seatBased: true, bestFor: "individual users" },
      Team: { monthly: 30, seatBased: true, bestFor: "small teams needing workspace features" },
      Enterprise: { monthly: 60, seatBased: true, bestFor: "large teams needing admin/security" },
      "API direct": { monthly: 0, seatBased: false, bestFor: "usage-based product workloads" },
    },
  },
  "anthropic-api": {
    name: "Anthropic API",
    useCases: ["coding", "writing", "research", "mixed"],
    creditEligible: true,
    source: "https://docs.anthropic.com/en/docs/about-claude/pricing",
    plans: {
      "API direct": { monthly: 0, seatBased: false, bestFor: "metered API workloads" },
    },
  },
  "openai-api": {
    name: "OpenAI API",
    useCases: ["coding", "writing", "data", "research", "mixed"],
    creditEligible: true,
    source: "https://openai.com/api/pricing/",
    plans: {
      "API direct": { monthly: 0, seatBased: false, bestFor: "metered API workloads" },
    },
  },
  gemini: {
    name: "Gemini",
    useCases: ["writing", "data", "research", "mixed"],
    creditEligible: true,
    source: "https://gemini.google/subscriptions/",
    plans: {
      Pro: { monthly: 20, seatBased: true, bestFor: "individual AI assistant usage" },
      Ultra: { monthly: 250, seatBased: true, bestFor: "top-tier individual usage" },
      API: { monthly: 0, seatBased: false, bestFor: "usage-based product workloads" },
    },
  },
  windsurf: {
    name: "Windsurf",
    useCases: ["coding", "mixed"],
    creditEligible: true,
    source: "https://docs.windsurf.com/windsurf/accounts/usage",
    plans: {
      Free: { monthly: 0, seatBased: true, bestFor: "light trials" },
      Pro: { monthly: 15, seatBased: true, bestFor: "individual developers" },
      Teams: { monthly: 30, seatBased: true, bestFor: "managed coding teams" },
      Enterprise: { monthly: 60, seatBased: true, bestFor: "large org controls" },
    },
  },
};

const sameUseCaseAlternatives: Record<UseCase, ToolId[]> = {
  coding: ["cursor", "copilot", "windsurf"],
  writing: ["chatgpt", "claude", "gemini"],
  data: ["chatgpt", "openai-api", "gemini"],
  research: ["claude", "chatgpt", "gemini"],
  mixed: ["chatgpt", "claude", "gemini", "cursor"],
};

export function getPlanNames(toolId: ToolId) {
  return Object.keys(TOOL_CATALOG[toolId].plans);
}

function seatAdjustedPlanCost(tool: ToolId, plan: string, seats: number, spend: number) {
  const price = TOOL_CATALOG[tool].plans[plan];
  if (!price || price.monthly === 0) {
    return Math.max(0, spend);
  }
  return price.seatBased ? price.monthly * Math.max(1, seats) : Math.max(0, spend);
}

function planDowngrade(tool: ToolId, plan: string, seats: number, teamSize: number) {
  const plans = TOOL_CATALOG[tool].plans;
  if ((plan === "Enterprise" || plan === "Business" || plan === "Team" || plan === "Teams") && teamSize <= 3) {
    const preferred = tool === "copilot" ? "Individual" : tool === "windsurf" ? "Pro" : "Pro";
    if (plans[preferred]) {
      return {
        plan: preferred,
        spend: plans[preferred].monthly * Math.max(1, seats),
        reason: `${plans[plan]?.bestFor ?? plan} is difficult to justify for a ${teamSize}-person team.`,
      };
    }
  }
  if ((plan === "Max" || plan === "Ultra") && teamSize <= 2) {
    const preferred = tool === "gemini" ? "Pro" : "Pro";
    return {
      plan: preferred,
      spend: plans[preferred].monthly * Math.max(1, seats),
      reason: `${plan} pricing is premium individual capacity; most small teams should prove utilization before paying for it.`,
    };
  }
  return null;
}

function cheaperAlternative(input: ToolInput, useCase: UseCase) {
  if (input.toolId === "openai-api" || input.toolId === "anthropic-api") {
    return null;
  }

  const alternatives = sameUseCaseAlternatives[useCase].filter((id) => id !== input.toolId);
  let best: { toolId: ToolId; plan: string; spend: number } | null = null;

  for (const toolId of alternatives) {
    const plans = TOOL_CATALOG[toolId].plans;
    const plan = plans.Pro ? "Pro" : plans.Individual ? "Individual" : Object.keys(plans)[0];
    const spend = plans[plan].monthly * Math.max(1, input.seats || 1);
    if (spend > 0 && spend < input.monthlySpend * 0.7 && (!best || spend < best.spend)) {
      best = { toolId, plan, spend };
    }
  }

  return best;
}

export function runAudit(input: AuditInput, summary = ""): AuditResult {
  const recommendations = input.tools.map((toolInput) => {
    const catalog = TOOL_CATALOG[toolInput.toolId];
    const currentSpend = Math.max(
      toolInput.monthlySpend,
      seatAdjustedPlanCost(toolInput.toolId, toolInput.plan, toolInput.seats, toolInput.monthlySpend),
    );
    const downgrade = planDowngrade(toolInput.toolId, toolInput.plan, toolInput.seats, input.teamSize);
    const alternative = cheaperAlternative(toolInput, input.useCase);
    const creditSpend = catalog.creditEligible && currentSpend >= 300 ? currentSpend * 0.72 : currentSpend;

    let optimizedSpend = currentSpend;
    let recommendedAction = "Keep current setup";
    let reason = "Spend appears aligned with plan fit and team size.";

    if (downgrade && downgrade.spend < optimizedSpend) {
      optimizedSpend = downgrade.spend;
      recommendedAction = `Downgrade to ${catalog.name} ${downgrade.plan}`;
      reason = downgrade.reason;
    }

    if (!downgrade && alternative && alternative.spend < optimizedSpend) {
      optimizedSpend = alternative.spend;
      recommendedAction = `Compare against ${TOOL_CATALOG[alternative.toolId].name} ${alternative.plan}`;
      reason = `${TOOL_CATALOG[alternative.toolId].name} covers ${input.useCase} workflows at materially lower seat cost.`;
    }

    if (creditSpend < optimizedSpend) {
      optimizedSpend = creditSpend;
      recommendedAction = "Route eligible spend through discounted credits";
      reason = "The tool is credit-eligible and monthly retail spend is high enough for procurement savings to matter.";
    }

    const monthlySavings = Math.max(0, Math.round(currentSpend - optimizedSpend));

    return {
      toolId: toolInput.toolId,
      toolName: catalog.name,
      currentPlan: toolInput.plan,
      currentSpend: Math.round(currentSpend),
      recommendedAction,
      optimizedSpend: Math.round(optimizedSpend),
      monthlySavings,
      reason,
      severity: monthlySavings > 100 ? "overspend" : monthlySavings > 0 ? "watch" : "healthy",
    } satisfies AuditRecommendation;
  });

  const totalCurrentSpend = recommendations.reduce((sum, item) => sum + item.currentSpend, 0);
  const totalOptimizedSpend = recommendations.reduce((sum, item) => sum + item.optimizedSpend, 0);
  const totalMonthlySavings = Math.max(0, totalCurrentSpend - totalOptimizedSpend);
  const totalAnnualSavings = totalMonthlySavings * 12;

  return {
    input,
    recommendations,
    totalCurrentSpend,
    totalOptimizedSpend,
    totalMonthlySavings,
    totalAnnualSavings,
    savingsTier: totalMonthlySavings > 500 ? "high" : totalMonthlySavings < 100 ? "efficient" : "moderate",
    summary: summary || fallbackSummary(totalMonthlySavings, input.tools.length, input.useCase),
    createdAt: new Date().toISOString(),
  };
}

export function fallbackSummary(savings: number, toolCount: number, useCase: UseCase) {
  if (savings < 100) {
    return `Your ${toolCount}-tool AI stack looks disciplined for a ${useCase} workflow. The audit did not find a major savings gap, so the best next step is to monitor usage and revisit plan fit as your team grows.`;
  }

  return `Your ${toolCount}-tool AI stack has a credible savings opportunity of about $${savings.toLocaleString()} per month. The largest improvements come from matching plan tiers to actual team size, comparing equivalent tools for ${useCase} work, and routing eligible retail spend through discounted credits.`;
}

export function createDemoInput(): AuditInput {
  return {
    teamSize: 6,
    useCase: "coding",
    tools: [
      { toolId: "cursor", plan: "Business", monthlySpend: 240, seats: 6 },
      { toolId: "chatgpt", plan: "Team", monthlySpend: 180, seats: 6 },
      { toolId: "openai-api", plan: "API direct", monthlySpend: 900, seats: 1 },
    ],
  };
}
