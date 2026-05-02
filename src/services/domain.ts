/**
 * Delte domæne-interfaces for LOOMY-agenter (løs koblet til DB-rækker).
 */

import type { StoreOrderDetailsJson } from "@/server/events/orderPaidEvents";

export interface Order {
  id: string;
  storeId: string;
  courierId: string | null;
  status: string;
  orderDetails: StoreOrderDetailsJson;
  updatedAt: string;
}

export interface Store {
  id: string;
  name?: string;
}

export interface Courier {
  id: string;
  isAvailable: boolean;
}
