import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { getSupabaseServiceRoleClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const DEMO_EMAILS = ["emma@loomy.dk", "noah@loomy.dk", "sofie@loomy.dk"] as const;

const bodySchema = z.object({
  email: z.enum(DEMO_EMAILS),
});

function demoAuthAllowed(): boolean {
  if (process.env.LOOMY_ALLOW_DEMO_AUTH === "true") return true;
  return process.env.NODE_ENV !== "production";
}

/**
 * Exchange whitelisted demo email for a real Supabase session (magic link OTP via Admin API).
 * Gated by LOOMY_ALLOW_DEMO_AUTH or non-production NODE_ENV.
 */
export async function POST(request: Request) {
  if (!demoAuthAllowed()) {
    return NextResponse.json(
      { error: "Demo-login er slået fra. Sæt LOOMY_ALLOW_DEMO_AUTH=true i miljøet." },
      { status: 403 },
    );
  }

  const admin = getSupabaseServiceRoleClient();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!admin || !url || !anonKey) {
    return NextResponse.json({ error: "Supabase er ikke konfigureret på serveren." }, { status: 500 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ukendt demo-e-mail." }, { status: 400 });
  }

  const email = parsed.data.email;

  const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: {
      data: { demo_customer: true },
    },
  });

  if (linkErr || !linkData?.properties?.email_otp) {
    const msg = linkErr?.message ?? "Kunne ikke oprette demo-session.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  const otp = linkData.properties.email_otp;

  const anon = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  const { data: sessionData, error: verifyErr } = await anon.auth.verifyOtp({
    email,
    token: otp,
    type: "magiclink",
  });

  if (verifyErr || !sessionData.session) {
    const fallback = await anon.auth.verifyOtp({
      email,
      token: otp,
      type: "email",
    });
    if (fallback.error || !fallback.data.session) {
      const msg = verifyErr?.message ?? fallback.error?.message ?? "Kunne ikke bekræfte demo-session.";
      return NextResponse.json({ error: msg }, { status: 502 });
    }
    const s = fallback.data.session;
    return NextResponse.json({
      access_token: s.access_token,
      refresh_token: s.refresh_token,
      expires_in: s.expires_in,
      expires_at: s.expires_at,
      token_type: s.token_type,
    });
  }

  const s = sessionData.session;
  return NextResponse.json({
    access_token: s.access_token,
    refresh_token: s.refresh_token,
    expires_in: s.expires_in,
    expires_at: s.expires_at,
    token_type: s.token_type,
  });
}
