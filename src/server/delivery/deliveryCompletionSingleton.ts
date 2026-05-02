import { createServiceSupabase } from "@/lib/supabase/service";
import {
  createSupabaseOrderManagerRepository,
  type OrderManagerRepository,
} from "@/server/orders/orderManagerRepository";
import { getOrderManager } from "@/server/courier/courierDispatchSingleton";
import { DeliveryCompletionFlow } from "./DeliveryCompletionFlow";

let flow: DeliveryCompletionFlow | null = null;
let repo: OrderManagerRepository | null = null;

function getOrdersRepo(): OrderManagerRepository {
  if (!repo) {
    repo = createSupabaseOrderManagerRepository(createServiceSupabase());
  }
  return repo;
}

export function getDeliveryCompletionFlow(): DeliveryCompletionFlow {
  if (!flow) {
    flow = new DeliveryCompletionFlow({
      orders: getOrdersRepo(),
      orderManager: getOrderManager(),
    });
  }
  return flow;
}
