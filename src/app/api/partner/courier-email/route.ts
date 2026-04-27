import { NextResponse } from "next/server";
import { getSupabaseServiceRoleClient } from "@/lib/supabase/admin";

const DEMO_COURIER_EMAIL: Record<string, string> = {
  mikkel: "courier.mikkel@loomy.dk",
  sara: "courier.sara@loomy.dk",
  jonas: "courier.jonas@loomy.dk",
};

function isValidCourierId(value: string): boolean {
  return /^[a-z0-9_-]{1,64}$/.test(value);
}

/**
 * Resolves a courier public ID to the email stored in `partner_profiles`.
 * Uses service role (server-only) so unauthenticated logins are not blocked by RLS.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const rawId =
    body && typeof body === "object" && "courierId" in body
      ? String((body as { courierId: unknown }).courierId ?? "")
      : "";
  const courierId = rawId.trim().toLowerCase();

  if (!isValidCourierId(courierId)) {
    return NextResponse.json({ error: "Ugyldigt bud-ID" }, { status: 400 });
  }

  const admin = getSupabaseServiceRoleClient();
  if (admin) {
    const { data, error } = await admin
      .from("partner_profiles")
      .select("email, role, courier_id")
      .eq("role", "courier")
      .eq("courier_id", courierId)
      .maybeSingle();

    if (error) {
      console.error("[courier-email]", error.message);
      return NextResponse.json({ error: "Opslag fejlede" }, { status: 500 });
    }
    if (data?.email) {
      return NextResponse.json({ email: (data.email as string).toLowerCase() });
    }
  }

  if (process.env.LOOMY_COURIER_DEMO_MAP === "1" && DEMO_COURIER_EMAIL[courierId]) {
    return NextResponse.json({ email: DEMO_COURIER_EMAIL[courierId] });
  }

  return NextResponse.json(
    {
      error:
        "Budprofil findes ikke. Sørg for at køre SQL-seed i Supabase og sæt SUPABASE_SERVICE_ROLE_KEY for server-opslag, eller brug præcis demoen (mikkel + Demo1234! i demo-feltet).",
    },
    { status: 404 },
  );
}
