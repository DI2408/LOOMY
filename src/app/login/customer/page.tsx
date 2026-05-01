"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Loader2, UserRound, Sparkles } from "lucide-react";
import { LumiHeader } from "@/components/lumi-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLumi } from "@/components/providers/lumi-provider";
import { getSupabaseClient } from "@/lib/supabase/client";

const customerDemos = [
  {
    name: "Emma Larsen",
    email: "emma@loomy.dk" as const,
    vibe: "Minimal · Tailored · Neutral",
    provider: "google" as const,
  },
  {
    name: "Noah Petersen",
    email: "noah@loomy.dk" as const,
    vibe: "Street · Monochrome · Utility",
    provider: "apple" as const,
  },
  {
    name: "Sofie Madsen",
    email: "sofie@loomy.dk" as const,
    vibe: "Occasion · Soft · Elegant",
    provider: "magic" as const,
  },
];

export default function CustomerLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") ?? "/customer";
  const { loginAsCustomer } = useLumi();
  const [busyEmail, setBusyEmail] = useState<string | null>(null);
  const [authError, setAuthError] = useState("");

  return (
    <div className="min-h-screen text-stone-900">
      <LumiHeader />
      <main className="mx-auto w-full max-w-2xl px-4 py-10 md:px-6">
        <Card className="border border-stone-200 bg-white/95 p-6 shadow-sm md:p-7">
          <div className="mb-4 flex items-center gap-2">
            <UserRound size={18} className="text-[#8b6914]" />
            <h1 className="font-serif text-2xl font-medium tracking-tight">Kundelogin</h1>
          </div>
          <p className="mb-4 text-sm text-stone-600">
            Med Supabase konfigureret oprettes en rigtig session til demo-profilerne (Emma, Noah, Sofie), så kurv og
            Stripe-checkout virker. Uden Supabase bruges kun demo-profil i appen (ingen betaling).
          </p>
          {authError ? (
            <p className="mb-4 rounded-xl border-[0.5px] border-rose-200/90 bg-rose-50 px-3 py-2 text-xs text-rose-900">
              {authError}
            </p>
          ) : null}
          <div className="space-y-3">
            {customerDemos.map((demo) => (
              <button
                key={demo.email}
                type="button"
                disabled={busyEmail !== null}
                onClick={() => {
                  void (async () => {
                    setAuthError("");
                    setBusyEmail(demo.email);
                    loginAsCustomer(demo.provider, demo.email);

                    try {
                      getSupabaseClient();
                    } catch {
                      setBusyEmail(null);
                      setAuthError("Supabase er ikke konfigureret. Sæt NEXT_PUBLIC_SUPABASE_URL og NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.");
                      return;
                    }

                    let res: Response;
                    try {
                      res = await fetch("/api/auth/demo-customer", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ email: demo.email }),
                      });
                    } catch {
                      setBusyEmail(null);
                      setAuthError("Netværksfejl ved login.");
                      return;
                    }

                    const data = (await res.json()) as {
                      access_token?: string;
                      refresh_token?: string;
                      error?: string;
                    };

                    if (!res.ok || !data.access_token || !data.refresh_token) {
                      setBusyEmail(null);
                      setAuthError(
                        data.error ??
                          "Demo-session kunne ikke oprettes. Tjek SUPABASE_SERVICE_ROLE_KEY og at brugeren findes i Auth.",
                      );
                      return;
                    }

                    const supabase = getSupabaseClient();
                    const { error: sessionErr } = await supabase.auth.setSession({
                      access_token: data.access_token,
                      refresh_token: data.refresh_token,
                    });
                    if (sessionErr) {
                      setBusyEmail(null);
                      setAuthError(sessionErr.message);
                      return;
                    }

                    router.refresh();
                    setBusyEmail(null);
                    router.push(nextPath);
                  })();
                }}
                className="w-full rounded-2xl border-[0.5px] border-stone-200 bg-white p-4 text-left transition hover:border-[#8b6914]/35 hover:bg-stone-50 disabled:opacity-60"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-stone-900">{demo.name}</p>
                    <p className="mt-1 text-xs text-stone-500">{demo.email}</p>
                    <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-[#6b4f0a]">
                      <Sparkles size={13} /> {demo.vibe}
                    </p>
                  </div>
                  {busyEmail === demo.email ? (
                    <Loader2 size={16} className="animate-spin text-stone-500" />
                  ) : (
                    <span className="rounded-full border-[0.5px] border-stone-200 px-2.5 py-1 text-[11px] text-stone-600">
                      Log ind
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>

          <div className="mt-5 space-y-3">
            <Button variant="secondary" fullWidth href="/shopping">
              Tilbage til shopping
            </Button>
            <p className="text-center text-[11px] text-stone-500">
              Produktion: sæt <span className="font-mono text-stone-600">LOOMY_ALLOW_DEMO_AUTH=true</span> hvis demo-login
              skal virke på Vercel.
            </p>
          </div>
        </Card>
      </main>
    </div>
  );
}
