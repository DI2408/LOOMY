import type { SupabaseClient } from "@supabase/supabase-js";
import type { CourierRow } from "./courierTypes";

export type CourierRepository = {
  listCouriers(): Promise<CourierRow[]>;
};

const TABLE = "loomy_couriers";

export function createSupabaseCourierRepository(
  supabase: SupabaseClient
): CourierRepository {
  return {
    async listCouriers(): Promise<CourierRow[]> {
      const { data, error } = await supabase
        .from(TABLE)
        .select("id, is_available, lat, lng, updated_at");

      if (error) throw error;
      const rows: CourierRow[] = [];
      for (const raw of data ?? []) {
        const r = raw as Record<string, unknown>;
        rows.push({
          id: r.id as string,
          isAvailable: Boolean(r.is_available),
          lat: typeof r.lat === "number" ? r.lat : null,
          lng: typeof r.lng === "number" ? r.lng : null,
          updatedAt: r.updated_at as string,
        });
      }
      return rows;
    },
  };
}
