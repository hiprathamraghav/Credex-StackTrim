import { NextResponse } from "next/server";
import { captureLead } from "@/lib/store";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body?.auditId || !body?.email || typeof body.email !== "string") {
    return NextResponse.json({ error: "Audit id and email are required." }, { status: 400 });
  }

  try {
    const result = await captureLead({
      auditId: body.auditId,
      email: body.email,
      company: body.company,
      role: body.role,
      teamSize: body.teamSize,
      honeypot: body.website,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not capture lead." },
      { status: 429 },
    );
  }
}
