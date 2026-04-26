"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, KeyRound } from "lucide-react";
import { LumiHeader } from "@/components/lumi-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLumi } from "@/components/providers/lumi-provider";
import { getSupabaseClient } from "@/lib/supabase/client";
import { fetchPartnerProfileByEmail } from "@/lib/partner-profiles";

export default function StoreLoginPage() {
  const router = useRouter();
  const { loginAsPartner } = useLumi();
  const [storeId, setStoreId] = useState("");
  const [staffEmail, setStaffEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  return (
    <div className="min-h-screen text-slate-900">
      <LumiHeader />
      <main className="mx-auto w-full max-w-xl px-4 py-10 md:px-6">
        <Card className="border border-slate-200 bg-white text-slate-900 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Building2 size={18} className="text-[#d97745]" />
            <h1 className="text-xl font-bold">Store Partner Login</h1>
          </div>
          <p className="mb-4 text-sm text-slate-600">
            Sign in as store partner to accept orders, prepare pickup, and update catalog stock.
          </p>
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-xs text-amber-800">
            <p className="font-semibold">Demo credentials</p>
            <p className="mt-1">Store ID: <span className="font-mono">strom-boutique</span></p>
            <p>Email: <span className="font-mono">store.demo@loomy.dk</span></p>
            <p>Password: <span className="font-mono">Demo1234!</span></p>
          </div>
          <div className="space-y-3">
            <input
              value={storeId}
              onChange={(event) => setStoreId(event.target.value)}
              placeholder="Store ID"
              className="h-12 w-full rounded-xl border border-slate-300 px-3 text-sm"
            />
            <input
              value={staffEmail}
              onChange={(event) => setStaffEmail(event.target.value)}
              placeholder="Staff email"
              type="email"
              className="h-12 w-full rounded-xl border border-slate-300 px-3 text-sm"
            />
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              type="password"
              className="h-12 w-full rounded-xl border border-slate-300 px-3 text-sm"
            />
            <Button
              fullWidth
              onClick={async () => {
                setError("");
                if (!storeId.trim() || !staffEmail.trim() || !password.trim()) {
                  setError("Please fill all fields.");
                  return;
                }
                const normalizedEmail = staffEmail.trim().toLowerCase();
                const normalizedStoreId = storeId.trim();
                const isDemoMatch =
                  normalizedEmail === "store.demo@loomy.dk" &&
                  password === "Demo1234!" &&
                  normalizedStoreId === "strom-boutique";

                if (isDemoMatch) {
                  loginAsPartner({
                    role: "store",
                    storeId: "strom-boutique",
                    email: "store.demo@loomy.dk",
                  });
                  router.push("/store");
                  return;
                }
                try {
                  const supabase = getSupabaseClient();
                  const { error: authError } = await supabase.auth.signInWithPassword({
                    email: normalizedEmail,
                    password,
                  });
                  if (authError) {
                    setError(authError.message);
                    return;
                  }
                  const profile = await fetchPartnerProfileByEmail(normalizedEmail);
                  if (!profile || profile.role !== "store") {
                    setError("This account is not mapped to a store profile.");
                    return;
                  }
                  if (profile.storeId !== normalizedStoreId) {
                    setError("Store ID does not match this account.");
                    return;
                  }
                  loginAsPartner(profile);
                  router.push("/store");
                } catch {
                  setError("Supabase is not configured. Add .env.local values first.");
                }
              }}
            >
              <span className="inline-flex items-center gap-2">
                Continue to Store Dashboard
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
