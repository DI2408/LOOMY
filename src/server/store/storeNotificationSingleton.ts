import { getOrderRepository } from "@/server/orders/orderManagerSingleton";
import { StoreNotificationService } from "./StoreNotificationService";

let instance: StoreNotificationService | null = null;

export function getStoreNotificationService(): StoreNotificationService {
  if (!instance) {
    instance = new StoreNotificationService({
      repo: getOrderRepository(),
    });
  }
  return instance;
}
