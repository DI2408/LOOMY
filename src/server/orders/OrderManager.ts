import type { OrderManagerRepository } from "./orderManagerRepository";
import type {
  OrderManagerRow,
  OrderManagerStatus,
  RegisterPendingOrderInput,
} from "./orderManagerTypes";
import {
  ORDER_MANAGER_TRANSITIONS,
  OrderTransitionError,
} from "./orderManagerTypes";

export type OrderManagerAgentHooks = {
  sendCustomerConfirmation: (orderId: string) => Promise<void>;
  notifyStoreAgent: (orderId: string) => Promise<void>;
  notifyCourierSystem: (orderId: string) => Promise<void>;
  /** After store hands package to courier — enables live tracking. */
  onOutForDelivery: (orderId: string) => Promise<void>;
  onOrderDelivered: (orderId: string) => Promise<void>;
};

function assertTransition(
  from: OrderManagerStatus,
  to: OrderManagerStatus,
  orderId: string
): void {
  const allowed = ORDER_MANAGER_TRANSITIONS[from];
  if (!allowed.includes(to)) {
    throw new OrderTransitionError(
      `Ugyldig overgang fra "${from}" til "${to}".`,
      orderId,
      from,
      to
    );
  }
}

export class OrderManager {
  constructor(
    private readonly repo: OrderManagerRepository,
    private readonly agents: OrderManagerAgentHooks
  ) {}

  async registerPendingOrder(
    input: RegisterPendingOrderInput
  ): Promise<OrderManagerRow> {
    const existing = await this.repo.getById(input.orderId);
    if (existing) {
      return existing;
    }
    return this.repo.insertPending(input);
  }

  async transitionToPaid(orderId: string): Promise<OrderManagerRow> {
    const row = await this.requireCurrent(orderId, "pending_payment", "paid");
    assertTransition(row.status, "paid", orderId);

    const updated = await this.repo.updateStatus(orderId, "paid", "pending_payment");

    if (updated.status !== "paid") {
      throw new OrderTransitionError(
        "Betaling gemt med uventet status.",
        orderId,
        updated.status,
        "paid"
      );
    }

    await this.agents.sendCustomerConfirmation(orderId);
    await this.agents.notifyStoreAgent(orderId);

    return updated;
  }

  async transitionToReady(orderId: string): Promise<OrderManagerRow> {
    const row = await this.requireCurrent(orderId, "paid", "ready_for_pickup");
    assertTransition(row.status, "ready_for_pickup", orderId);

    const updated = await this.repo.updateStatus(
      orderId,
      "ready_for_pickup",
      "paid"
    );

    if (updated.status !== "ready_for_pickup") {
      throw new OrderTransitionError(
        "Klar-til-afhentning gemt med uventet status.",
        orderId,
        updated.status,
        "ready_for_pickup"
      );
    }

    await this.agents.notifyCourierSystem(orderId);

    return updated;
  }

  /**
   * Butik har overdraget pakken til bud — ordren er på vej (live tracking).
   */
  async transitionToOutForDelivery(orderId: string): Promise<OrderManagerRow> {
    const row = await this.requireCurrent(
      orderId,
      "dispatched",
      "out_for_delivery"
    );
    assertTransition(row.status, "out_for_delivery", orderId);

    const updated = await this.repo.updateStatus(
      orderId,
      "out_for_delivery",
      "dispatched"
    );

    if (updated.status !== "out_for_delivery") {
      throw new OrderTransitionError(
        "Status out_for_delivery kunne ikke sættes.",
        orderId,
        updated.status,
        "out_for_delivery"
      );
    }

    await this.agents.onOutForDelivery(orderId);

    return updated;
  }

  async transitionToDelivered(orderId: string): Promise<OrderManagerRow> {
    const row = await this.requireCurrent(orderId, "out_for_delivery", "delivered");
    assertTransition(row.status, "delivered", orderId);

    const updated = await this.repo.updateStatus(
      orderId,
      "delivered",
      "out_for_delivery"
    );

    if (updated.status !== "delivered") {
      throw new OrderTransitionError(
        "Levering gemt med uventet status.",
        orderId,
        updated.status,
        "delivered"
      );
    }

    await this.agents.onOrderDelivered(orderId);

    return updated;
  }

  private async requireCurrent(
    orderId: string,
    expected: OrderManagerStatus,
    transitionTarget: OrderManagerStatus
  ): Promise<OrderManagerRow> {
    const row = await this.repo.getById(orderId);
    if (!row) {
      throw new OrderTransitionError(
        `Ordre ${orderId} findes ikke.`,
        orderId,
        null,
        transitionTarget
      );
    }
    if (row.status !== expected) {
      throw new OrderTransitionError(
        `Ordre ${orderId} har status "${row.status}", forventede "${expected}" før skridt til "${transitionTarget}".`,
        orderId,
        row.status,
        transitionTarget
      );
    }
    return row;
  }
}

export function createNoopOrderManagerAgents(): OrderManagerAgentHooks {
  return {
    sendCustomerConfirmation: async () => {},
    notifyStoreAgent: async () => {},
    notifyCourierSystem: async () => {},
    onOutForDelivery: async () => {},
    onOrderDelivered: async () => {},
  };
}
