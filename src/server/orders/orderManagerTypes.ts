import type { StoreOrderDetailsJson } from "@/server/events/orderPaidEvents";

export type OrderManagerStatus =
  | "pending_payment"
  | "paid"
  | "ready_for_pickup"
  | "dispatched"
  | "out_for_delivery"
  | "delivered";

export const ORDER_MANAGER_TRANSITIONS: Record<
  OrderManagerStatus,
  readonly OrderManagerStatus[]
> = {
  pending_payment: ["paid"],
  paid: ["ready_for_pickup"],
  ready_for_pickup: ["dispatched"],
  dispatched: ["out_for_delivery"],
  out_for_delivery: ["delivered"],
  delivered: [],
};

export type OrderManagerRow = {
  id: string;
  storeId: string;
  courierId: string | null;
  status: OrderManagerStatus;
  orderDetails: StoreOrderDetailsJson;
  offlinePushQueued: boolean;
  updatedAt: string;
};

export type RegisterPendingOrderInput = {
  orderId: string;
  storeId: string;
  orderDetails?: StoreOrderDetailsJson;
};

export class OrderTransitionError extends Error {
  constructor(
    message: string,
    public readonly orderId: string,
    public readonly currentStatus: OrderManagerStatus | null,
    public readonly attemptedTarget: OrderManagerStatus
  ) {
    super(message);
    this.name = "OrderTransitionError";
  }
}

export class OrderClaimError extends Error {
  constructor(
    message: string,
    public readonly orderId: string,
    public readonly courierId: string
  ) {
    super(message);
    this.name = "OrderClaimError";
  }
}
