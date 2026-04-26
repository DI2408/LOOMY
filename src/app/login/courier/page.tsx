"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bike, KeyRound } from "lucide-react";
import { LumiHeader } from "@/components/lumi-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLumi } from "@/components/providers/lumi-provider";
import { getSupabaseClient } from "@/lib/supabase/client";
import { fetchCourierProfileByCourierId } from "@/lib/partner-profiles";

export default function CourierLoginPage() {
  const router = useRouter();
  const { loginAsPartner } = useLumi();
  const [courierId, setCourierId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  return (
    <div className="min-h-screen text-stone-900">
      <LumiHeader />
      <main className="mx-auto w-full max-w-xl px-4 py-10 md:px-6">
        <Card className="border border-stone-200 bg-white text-stone-900 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Bike size={18} className="text-[#8b6914]" />
            <h1 className="text-xl font-bold">Courier Login</h1>
          </div>
          <p className="mb-4 text-sm text-stone-600">
            Sign in as courier to see nearby tasks, customer address, and slide each order to next step.
          </p>
          <div className="space-y-3">
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-xs text-amber-800">
              <p className="font-semibold">Demo credentials</p>
              <p className="mt-1">Courier ID: <span className="font-mono">mikkel</span></p>
              <p>Password: <span className="font-mono">Demo1234!</span></p>
            </div>
            <input
              value={courierId}
              onChange={(event) => setCourierId(event.target.value)}
              placeholder="Courier ID"
              className="h-12 w-full rounded-xl border border-stone-300 px-3 text-sm"
            />
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              type="password"
              className="h-12 w-full rounded-xl border border-stone-300 px-3 text-sm"
            />
            <Button
              fullWidth
              onClick={async () => {
                setError("");
                const normalizedCourierId = courierId.trim().toLowerCase();
                if (!normalizedCourierId || !password.trim()) {
                  setError("Please fill courier ID and password.");
                  return;
                }

                try {
                  const profile = await fetchCourierProfileByCourierId(normalizedCourierId);
                  if (!profile || profile.role !== "courier" || !profile.email) {
                    setError("Courier ID is not linked to a valid courier account.");
                    return;
                  }

                  const supabase = getSupabaseClient();
                  const { error: authError } = await supabase.auth.signInWithPassword({
                    email: profile.email,
                    password,
                  });
                  if (authError) {
                    setError(authError.message);
                    return;
                  }
                  if (profile.courierId?.toLowerCase() !== normalizedCourierId) {
                    setError("Courier ID does not match this account mapping.");
                    return;
                  }
                  loginAsPartner(profile);
                  router.push("/courier");
                } catch {
                  setError("Supabase is not configured. Add .env.local values first.");
                }
              }}
            >
              <span className="inline-flex items-center gap-2">
                Continue to Courier Hub
                <KeyRound size={14} />
              </span>
            </Button>
            {error ? <p className="text-xs text-rose-600">{error}</p> : null}
          </div>
        </Card>
      </main>
    </div>
  );
}
