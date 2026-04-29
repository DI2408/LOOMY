"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UserRound, Sparkles } from "lucide-react";
import { LumiHeader } from "@/components/lumi-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLumi } from "@/components/providers/lumi-provider";

const customerDemos = [
  {
    name: "Emma Larsen",
    email: "emma@loomy.dk",
    vibe: "Minimal · Tailored · Neutral",
    provider: "google" as const,
  },
  {
    name: "Noah Petersen",
    email: "noah@loomy.dk",
    vibe: "Street · Monochrome · Utility",
    provider: "apple" as const,
  },
  {
    name: "Sofie Madsen",
    email: "sofie@loomy.dk",
    vibe: "Occasion · Soft · Elegant",
    provider: "magic" as const,
  },
];

export default function CustomerLoginPage() {
  const router = useRouter();
  const { loginAsCustomer } = useLumi();
  const [busyEmail, setBusyEmail] = useState<string | null>(null);

  return (
    <div className="min-h-screen text-stone-900">
      <LumiHeader />
      <main className="mx-auto w-full max-w-2xl px-4 py-10 md:px-6">
        <Card className="border border-stone-200 bg-white/95 p-6 shadow-sm md:p-7">
          <div className="mb-4 flex items-center gap-2">
            <UserRound size={18} className="text-[#8b6914]" />
            <h1 className="font-serif text-2xl font-medium tracking-tight">Kundelogin (demo)</h1>
          </div>
          <p className="mb-4 text-sm text-stone-600">
            Vælg en demo-kunde for at åbne et personligt LOOMY-område med ordrehistorik,
            profil og anbefalinger.
          </p>
          <div className="space-y-3">
            {customerDemos.map((demo) => (
              <button
                key={demo.email}
                type="button"
                disabled={busyEmail !== null}
                onClick={() => {
                  setBusyEmail(demo.email);
                  loginAsCustomer(demo.provider, demo.email);
                  window.setTimeout(() => {
                    setBusyEmail(null);
                    router.push("/customer");
                  }, 320);
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
                      Åbn profil
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>

          <div className="mt-5">
            <Button variant="secondary" fullWidth href="/shopping">
              Tilbage til shopping
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
}
