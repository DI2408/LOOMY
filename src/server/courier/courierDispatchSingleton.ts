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

/** Shared OrderManager (notifyCourierSystem emits `order.ready_for_pickup`). */
export function getOrderManager(): OrderManager {
  if (orderManager) return orderManager;
  const repo = getOrdersRepo();
  const noop = createNoopOrderManagerAgents();
  orderManager = new OrderManager(repo, {
    ...noop,
    notifyCourierSystem: async (orderId) => {
      emitOrderReadyForPickup({ orderId });
    },
  });
  return orderManager;
}
