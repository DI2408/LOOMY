import { LoomyEvents, emitLoomyEvent } from "@/lib/events";
import type { StoreOrderDetailsJson } from "@/server/events/orderPaidEvents";
import type { OrderManagerRepository } from "@/server/orders/orderManagerRepository";
import type { OrderManagerRow } from "@/server/orders/orderManagerTypes";
import { OrderClaimError } from "@/server/orders/orderManagerTypes";
import type { CourierRepository } from "./courierRepository";
import { filterCouriersForOrder } from "./courierDispatchFilters";
import { publishCourierOrderEvent } from "./courierOrderSseHub";

export type CourierDispatchSystemDeps = {
  orders: OrderManagerRepository;
  couriers: CourierRepository;
  maxRadiusKm?: number;
};

export class CourierDispatchSystem {
  private readonly orders: OrderManagerRepository;
  private readonly couriers: CourierRepository;
  private readonly maxRadiusKm: number;

  constructor(deps: CourierDispatchSystemDeps) {
    this.orders = deps.orders;
    this.couriers = deps.couriers;
    this.maxRadiusKm = deps.maxRadiusKm ?? 15;
  }

  /** @deprecated Brug `registerCourierDispatchAgent` + LOOMY bus. */
  listen(): void {}

  stop(): void {}

  async broadcastOrderToCouriers(orderId: string): Promise<{
    order: OrderManagerRow;
    targetCourierIds: string[];
  }> {
    const order = await this.orders.getById(orderId);
    if (!order) {
      throw new Error(`Ordre ${orderId} findes ikke.`);
    }
    if (order.status !== "ready_for_pickup") {
      throw new Error(
        `Ordre ${orderId} er ikke klar til afhentning (status: ${order.status}).`
      );
    }

    const all = await this.couriers.listCouriers();
    const eligible = filterCouriersForOrder(
      all,
      order.orderDetails as StoreOrderDetailsJson,
      this.maxRadiusKm
    );

    if (eligible.length === 0) {
      emitLoomyEvent(LoomyEvents.ORDER_DISPATCH_FAILED, {
        orderId,
        reason: "no_eligible_couriers",
        eligibleCourierCount: 0,
      });
      console.warn(
        `[LOOMY courier] ORDER_DISPATCH_FAILED order=${orderId} (0 eligible couriers)`
      );
    }

    const payload = {
      orderId: order.id,
      storeId: order.storeId,
      status: order.status,
      orderDetails: order.orderDetails,
      updatedAt: order.updatedAt,
    };

    for (const c of eligible) {
      publishCourierOrderEvent(c.id, "order.available", payload);
    }

    console.info(
      `[loomy] broadcastOrderToCouriers ${orderId} → ${eligible.length} bud (SSE)`
    );

    return { order, targetCourierIds: eligible.map((c) => c.id) };
  }

  async acceptOrder(courierId: string, orderId: string): Promise<OrderManagerRow> {
    const courierRows = await this.couriers.listCouriers();
    const me = courierRows.find((c) => c.id === courierId);
    if (!me?.isAvailable) {
      throw new OrderClaimError(
        "Buddet er ikke tilgængeligt til nye opgaver.",
        orderId,
        courierId
      );
    }

    const order = await this.orders.getById(orderId);
    if (!order) {
      throw new OrderClaimError("Ordren findes ikke.", orderId, courierId);
    }
    if (order.status !== "ready_for_pickup" || order.courierId != null) {
      throw new OrderClaimError(
        "Ordren er ikke længere ledig.",
        orderId,
        courierId
      );
    }

    const eligible = filterCouriersForOrder(
      courierRows,
      order.orderDetails as StoreOrderDetailsJson,
      this.maxRadiusKm
    );
    if (!eligible.some((c) => c.id === courierId)) {
      throw new OrderClaimError(
        "Buddet matcher ikke ordrens område/filter.",
        orderId,
        courierId
      );
    }

    const claimed = await this.orders.claimOrderForCourier(orderId, courierId);
    if (!claimed) {
      throw new OrderClaimError(
        "Ordren blev allerede taget af et andet bud.",
        orderId,
        courierId
      );
    }

    publishCourierOrderEvent(courierId, "order.assigned", {
      orderId: claimed.id,
      courierId,
      status: claimed.status,
    });

    emitLoomyEvent(LoomyEvents.COURIER_CLAIMED, {
      orderId: claimed.id,
      courierId,
      status: claimed.status,
    });
    console.info(
      `[COURIER DISPATCH]: COURIER_CLAIMED order=${claimed.id} courier=${courierId}`
    );

    return claimed;
  }
}
