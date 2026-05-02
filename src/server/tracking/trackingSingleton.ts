import { createServiceSupabase } from "@/lib/supabase/service";
import { createSupabaseOrderManagerRepository } from "@/server/orders/orderManagerRepository";
import { LocationTrackingService } from "./LocationTrackingService";

let svc: LocationTrackingService | null = null;

export function getLocationTrackingService(): LocationTrackingService {
  if (!svc) {
    const supabase = createServiceSupabase();
    svc = new LocationTrackingService({
      orders: createSupabaseOrderManagerRepository(supabase),
    });
  }
  return svc;
}
