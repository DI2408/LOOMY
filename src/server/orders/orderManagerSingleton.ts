import { createServiceSupabase } from "@/lib/supabase/service";
import { emitOrderPaid } from "@/server/events/orderPaidEvents";
import { OrderManager, createNoopOrderManagerAgents } from "./OrderManager";
import {
  createSupabaseOrderManagerRepository,
  type OrderManagerRepository,
} from "./orderManagerRepository";

let repo: OrderManagerRepository | null = null;
let orderManager: OrderManager | null = null;

export function getOrderRepository(): OrderManagerRepository {
  if (!repo) {
    const supabase = createServiceSupabase();
    repo = createSupabaseOrderManagerRepository(supabase);
  }
  return repo;
}

export function getOrderManager(): OrderManager {
  if (orderManager) return orderManager;
  const r = getOrderRepository();
  const noop = createNoopOrderManagerAgents();
  orderManager = new OrderManager(r, {
    ...noop,
    notifyStoreAgent: async (orderId) => {
      const row = await r.getById(orderId);
      if (!row) return;
      emitOrderPaid({
        orderId: row.id,
        storeId: row.storeId,
        orderDetails: row.orderDetails,
      });
    },
  });
  return orderManager;
}
