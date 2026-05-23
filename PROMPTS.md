# Prompts

## Audit Summary Prompt

```text
Write a concise, specific, finance-literate audit summary in about 100 words.

Use case: {useCase}
Team size: {teamSize}
Monthly savings: ${totalMonthlySavings}
Annual savings: ${totalAnnualSavings}
Recommendations: {recommendations}

Rules:
- Do not invent vendors, prices, or savings.
- Sound helpful and direct, not alarmist.
- Mention Credex only if monthly savings exceeds $500.
- Return plain text only: no Markdown, heading, bullets, bold, or labels.
```

## Why This Prompt

The audit math is deterministic, so the prompt only turns already-computed findings into a readable summary. It explicitly blocks invented vendors, prices, and savings because those would make the finance logic less trustworthy.

The app tries Gemini first when `GEMINI_API_KEY` is present because Google AI Studio is easier to access for this submission. It still supports Anthropic through `ANTHROPIC_API_KEY` because Anthropic was the preferred provider in the brief. If neither key exists, the app uses a deterministic fallback summary so the audit flow does not break.

## What Did Not Work

An earlier draft asked the model to “recommend optimizations.” That gave the model too much authority over pricing and could create recommendations unsupported by the pricing catalog, so the final version gives it only the computed facts.
