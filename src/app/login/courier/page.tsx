"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bike, KeyRound, Loader2 } from "lucide-react";
import { LumiHeader } from "@/components/lumi-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLumi, type PartnerProfile } from "@/components/providers/lumi-provider";
import { getSupabaseClient } from "@/lib/supabase/client";
import { fetchPartnerProfileByEmail } from "@/lib/partner-profiles";

const DEMO: { courierId: string; email: string } = {
  courierId: "mikkel",
  email: "courier.mikkel@loomy.dk",
};

export default function CourierLoginPage() {
  const router = useRouter();
  const { loginAsPartner } = useLumi();
  const [courierId, setCourierId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <div className="min-h-screen text-stone-900">
      <LumiHeader />
      <main className="mx-auto w-full max-w-xl px-4 py-10 md:px-6">
        <Card className="border border-stone-200 bg-white text-stone-900 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Bike size={18} className="text-[#8b6914]" />
            <h1 className="text-xl font-bold">Budlogin (demo)</h1>
          </div>
          <p className="mb-4 text-sm text-stone-600">
            Log ind som bud for at se ture, adresser og slide-handlinger. Når Supabase kører,
            læser serveren <span className="font-medium">courier_id → e-mail</span> (RLS
            blokerer ikke-loggerede) og logger dig derefter ind.
          </p>
          <div className="space-y-3">
            <input
              value={courierId}
              onChange={(event) => setCourierId(event.target.value)}
              placeholder="Bud-ID (fx mikkel)"
              className="h-12 w-full rounded-xl border border-stone-300 px-3 text-sm"
            />
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Adgangskode"
              type="password"
              className="h-12 w-full rounded-xl border border-stone-300 px-3 text-sm"
            />
            <Button
              fullWidth
              disabled={busy}
              onClick={async () => {
                setError("");
                setBusy(true);
                const normalizedCourierId = courierId.trim().toLowerCase();
                if (!normalizedCourierId || !password.trim()) {
                  setError("Udfyld bud-ID og adgangskode.");
                  setBusy(false);
                  return;
                }

                const isDemoMikkel =
                  normalizedCourierId === DEMO.courierId && password === "Demo1234!";

                const goDemoOffline = (profile: PartnerProfile) => {
                  loginAsPartner(profile);
                  router.push("/courier");
                };

                const resolveEmail = async (): Promise<string | null> => {
                  const res = await fetch("/api/partner/courier-email", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ courierId: normalizedCourierId }),
                  });
                  const data = (await res.json()) as { email?: string; error?: string };
                  if (res.ok && data.email) return data.email;
                  if (isDemoMikkel) return DEMO.email;
                  return null;
                };

                let emailForAuth: string | null = null;
                try {
                  emailForAuth = await resolveEmail();
                } catch {
                  emailForAuth = isDemoMikkel ? DEMO.email : null;
                }

                if (!emailForAuth) {
                  if (isDemoMikkel) {
                    goDemoOffline({
                      role: "courier",
                      courierId: DEMO.courierId,
                      email: DEMO.email,
                    });
                    setBusy(false);
                    return;
                  }
                  setError(
                    "Bud findes ikke i databasen. Tjek at partner_profiles er kørt og bud-ID stemmer, eller sæt SUPABASE_SERVICE_ROLE_KEY så e-mail-opslag virker.",
                  );
                  setBusy(false);
                  return;
                }

                try {
                  const supabase = getSupabaseClient();
                  const { error: authError } = await supabase.auth.signInWithPassword({
                    email: emailForAuth,
                    password,
                  });
                  if (authError) {
                    if (isDemoMikkel) {
                      goDemoOffline({
                        role: "courier",
                        courierId: normalizedCourierId,
                        email: emailForAuth!,
                      });
                    } else {
                      setError(authError.message);
                    }
                    setBusy(false);
                    return;
                  }
                  const profile = await fetchPartnerProfileByEmail(emailForAuth);
                  if (!profile || profile.role !== "courier") {
                    if (isDemoMikkel) {
                      goDemoOffline({
                        role: "courier",
                        courierId: normalizedCourierId,
                        email: emailForAuth,
                      });
                    } else {
                      setError("Kontoen er ikke sat op som bud i LOOMY.");
                    }
                    setBusy(false);
                    return;
                  }
                  if (profile.courierId?.toLowerCase() !== normalizedCourierId) {
                    setError("Bud-ID matcher ikke denne konto.");
                    setBusy(false);
                    return;
                  }
                  loginAsPartner(profile);
                  router.push("/courier");
                } catch (e) {
                  if (isDemoMikkel) {
                    goDemoOffline({
                      role: "courier",
                      courierId: normalizedCourierId,
                      email: emailForAuth!,
                    });
                  } else {
                    setError(
                      e instanceof Error
                        ? e.message
                        : "Supabase er ikke konfigureret (mangler env i Vercel).",
                    );
                  }
                } finally {
                  setBusy(false);
                }
              }}
            >
              <span className="inline-flex items-center justify-center gap-2">
                {busy ? <Loader2 size={16} className="animate-spin" /> : null}
                Fortsæt til bud
                {!busy ? <KeyRound size={14} /> : null}
              </span>
            </Button>
            {error ? <p className="text-xs text-rose-600">{error}</p> : null}
          </div>
        </Card>
      </main>
    </div>
  );
}
