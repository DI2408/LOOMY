"use client";

import type { PartnerProfile } from "@/types/lumi";
import { getSupabaseClient } from "@/lib/supabase/client";

type PartnerProfileRow = {
  role: "store" | "courier";
  store_id: string | null;
  courier_id: string | null;
  email: string;
};

function toPartnerProfile(row: PartnerProfileRow): PartnerProfile {
  return {
    role: row.role,
    storeId: row.store_id ?? undefined,
    courierId: row.courier_id ?? undefined,
    email: row.email,
  };
}

export async function fetchPartnerProfileByEmail(
  email: string,
): Promise<PartnerProfile | null> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("partner_profiles")
    .select("role, store_id, courier_id, email")
    .eq("email", normalized)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) return null;
  return toPartnerProfile(data as PartnerProfileRow);
}

export async function fetchCourierProfileByCourierId(
  courierId: string,
): Promise<PartnerProfile | null> {
  const normalized = courierId.trim().toLowerCase();
  if (!normalized) return null;

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("partner_profiles")
    .select("role, store_id, courier_id, email")
    .eq("role", "courier")
    .eq("courier_id", normalized)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) return null;
  return toPartnerProfile(data as PartnerProfileRow);
}
