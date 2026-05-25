# Tests

Run all tests:

```bash
npm test
```

## Automated Tests

- `src/test/audit.test.ts`: flags a small team overpaying for enterprise/team plans.
- `src/test/audit.test.ts`: surfaces a Credex-style credit opportunity for high API spend.
- `src/test/audit.test.ts`: does not manufacture savings for an already efficient stack.
- `src/test/audit.test.ts`: keeps coding alternatives relevant to developer tools.
- `src/test/audit.test.ts`: calculates annual savings from non-negative monthly savings.

## Manual Checks

- Landing page loads as a calculator-first product page.
- Form input persists after page reload.
- Audit can run without login.
- Public `/audit/[id]` excludes email, company, and role.
- Missing or failing LLM key still returns a templated summary.
- Lead capture stores the lead and sends email when Supabase and Resend env vars are configured.

## Production Verification

Verified on 2026-05-26 against `https://credex-stacktrim.vercel.app`:

- Production homepage returned 200.
- Production audit API returned 200 and created a public audit id.
- Public audit URL returned 200.
- Gemini summary returned as plain text.
- Supabase audit storage was connected.
- Resend lead capture returned 200 in production.
