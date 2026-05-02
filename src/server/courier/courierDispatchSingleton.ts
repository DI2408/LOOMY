import { createServiceSupabase } from "@/lib/supabase/service";
import { emitOrderReadyForPickup } from "@/server/events/orderReadyEvents";
import { OrderManager, createNoopOrderManagerAgents } from "@/server/orders/OrderManager";
import {
  createSupabaseOrderManagerRepository,
  type OrderManagerRepository,
} from "@/server/orders/orderManagerRepository";
import { createSupabaseCourierRepository } from "./courierRepository";
import { CourierDispatchSystem } from "./CourierDispatchSystem";

let supabaseSingleton: ReturnType<typeof createServiceSupabase> | null = null;
let ordersRepo: OrderManagerRepository | null = null;
let dispatch: CourierDispatchSystem | null = null;
let orderManager: OrderManager | null = null;

function getServiceSupabase() {
  if (!supabaseSingleton) {
    supabaseSingleton = createServiceSupabase();
  }
  return supabaseSingleton;
}

function getOrdersRepo(): OrderManagerRepository {
  if (!ordersRepo) {
    ordersRepo = createSupabaseOrderManagerRepository(getServiceSupabase());
  }
  return ordersRepo;
}

export function getCourierDispatchSystem(): CourierDispatchSystem {
  if (!dispatch) {
    const supabase = getServiceSupabase();
    dispatch = new CourierDispatchSystem({
      orders: createSupabaseOrderManagerRepository(supabase),
      couriers: createSupabaseCourierRepository(supabase),
    });
  }
  return dispatch;
}

export function getOrderManager(): OrderManager {
  if (orderManager) return orderManager;
  const repo = getOrdersRepo();
  const noop = createNoopOrderManagerAgents();
  orderManager = new OrderManager(repo, {
    ...noop,
    notifyCourierSystem: async (orderId) => {
      emitOrderReadyForPickup({ orderId });
    },
    onOutForDelivery: async (orderId) => {
      const ioMod = await import("@/server/socket/ioBridge");
      const io = ioMod.getSocketIoServer();
      if (io) {
        io.to(`order:${orderId}`).emit("tracking_started", {
          orderId,
          ts: new Date().toISOString(),
        });
      }
    },
    onOrderDelivered: async (orderId) => {
      const row = await repo.getById(orderId);
      if (!row) return;
      try {
        const { getPayoutOrchestrator } = await import("@/server/payout/payoutSingleton");
        const result = await getPayoutOrchestrator().onOrderDelivered(row);
        console.info(
          `[loomy] payout ${orderId}: store=${result.breakdown.storeNetMinorUnits} courier=${result.breakdown.courierHonorariumMinorUnits} loomy=${result.breakdown.loomyCommissionMinorUnits} stripe=${result.stripe.storeTransferId ?? "—"}/${result.stripe.courierTransferId ?? "—"}`
        );
      } catch (e) {
        console.error("[loomy] payout orchestration failed", orderId, e);
      }
    },
  });
  return orderManager;
}
