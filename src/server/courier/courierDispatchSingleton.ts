import { createServiceSupabase } from "@/lib/supabase/service";
import { LoomyEvents, emitLoomyEvent, orderRowToSnapshot } from "@/lib/events";
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
    onOrderPaid: async (orderId) => {
      const row = await repo.getById(orderId);
      if (!row) return;
      emitLoomyEvent(LoomyEvents.ORDER_PAID, { order: orderRowToSnapshot(row) });
      console.info(`[LOOMY OrderManager] relay ORDER_PAID order=${orderId}`);
    },
    notifyCourierSystem: async (orderId) => {
      emitLoomyEvent(LoomyEvents.ORDER_READY, { orderId });
      console.info(`[ORDER MANAGER]: relay ORDER_READY order=${orderId}`);
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
      emitLoomyEvent(LoomyEvents.ORDER_DELIVERED, { orderId });
      console.info(`[ORDER MANAGER]: relay ORDER_DELIVERED order=${orderId}`);
    },
  });
  return orderManager;
}
