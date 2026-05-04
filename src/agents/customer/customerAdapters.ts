/**
 * LOOMY — Customer agent boundaries (replace stubs with Supabase / Stripe / Realtime).
 */

import { sendEmailNotification } from "./customerEmail";
import type { InventoryLine, OrderDetails, ReceiptPayload } from "./types";

export type GetStoreInventory = (
  storeId: string
) => Promise<readonly InventoryLine[]>;

export type PaymentGatewayCharge = (input: {
  orderId: string;
  storeId: string;
  customerEmail: string;
  totalMinorUnits: number;
  currency: string;
}) => Promise<import("./types").PaymentResult>;

export type NotifyStore = (orderId: string) => Promise<void>;

export type BroadcastToCouriers = (orderDetails: OrderDetails) => Promise<void>;

export type SendEmailNotification = (
  customerEmail: string,
  receipt: ReceiptPayload
) => Promise<void>;

export type CustomerAgentAdapters = {
  getStoreInventory: GetStoreInventory;
  paymentGateway: { charge: PaymentGatewayCharge };
  notifyStore: NotifyStore;
  broadcastToCouriers: BroadcastToCouriers;
  sendEmailNotification: SendEmailNotification;
};

/** No-op / log-only defaults for local development and tests. */
export function createStubCustomerAdapters(
  overrides: Partial<CustomerAgentAdapters> = {}
): CustomerAgentAdapters {
  return {
    getStoreInventory: async () => [],
    paymentGateway: {
      charge: async () => ({
        status: "success",
        paymentIntentId: "pi_stub_loomy",
      }),
    },
    notifyStore: async (orderId) => {
      void orderId;
    },
    broadcastToCouriers: async () => {},
    sendEmailNotification,
    ...overrides,
  };
}
