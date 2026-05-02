#!/usr/bin/env npx tsx
/**
 * Simulates: pending → paid → ready → courier claim → out_for_delivery → delivered.
 * Logs every LOOMY bus event via listeners on `loomyEvents`.
 *
 * Prerequisites:
 *   - NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 *   - DB: loomy_orders + loomy_couriers (seed courier e.g. `mikkel`)
 *
 * Run from repo root:
 *   npx tsx scripts/simulate-order-lifecycle.mts
 *
 * Optional env:
 *   SIM_ORDER_ID=sim-xxx  SIM_STORE_ID=strom-boutique  SIM_COURIER_ID=mikkel
 */

import { EventEmitter } from "node:events";
import { LoomyEvents, loomyEvents } from "../src/lib/events";
import { registerAllLoomyAgents } from "../src/services/orchestrationAgent";
import {
  getCourierDispatchSystem,
  getOrderManager,
} from "../src/server/courier/courierDispatchSingleton";
import { getDeliveryCompletionFlow } from "../src/server/delivery/deliveryCompletionSingleton";

const ORDER_ID =
  process.env.SIM_ORDER_ID ?? `sim-${Date.now().toString(36)}`;
const STORE_ID = process.env.SIM_STORE_ID ?? "strom-boutique";
const COURIER_ID = process.env.SIM_COURIER_ID ?? "mikkel";

/** Copenhagen-ish coords — bud-filter og geofence accepterer samme punkt som kunde. */
const CUSTOMER = { lat: 55.6761, lng: 12.5683 };
const STORE = { lat: 55.6812, lng: 12.5755 };

function wireEventLogger(): () => void {
  const names = Object.values(LoomyEvents) as string[];
  const fns: Array<{ ev: string; fn: (...a: unknown[]) => void }> = [];
  for (const ev of names) {
    const fn = (payload: unknown) => {
      console.log(
        `\n── EVENT: ${ev}\n${JSON.stringify(payload, null, 2)}\n`
      );
    };
    (loomyEvents as EventEmitter).on(ev, fn);
    fns.push({ ev, fn });
  }
  return () => {
    for (const { ev, fn } of fns) {
      (loomyEvents as EventEmitter).off(ev, fn);
    }
  };
}

async function main(): Promise<void> {
  console.log("LOOMY lifecycle simulation\n");
  console.log("Order:", ORDER_ID, "| Store:", STORE_ID, "| Courier:", COURIER_ID);

  const unwire = wireEventLogger();
  registerAllLoomyAgents();

  const orderDetails = {
    currency: "dkk",
    totalMinorUnits: 100_000,
    customerLat: CUSTOMER.lat,
    customerLng: CUSTOMER.lng,
    storeLat: STORE.lat,
    storeLng: STORE.lng,
    handoffCode: "4242",
    customerEmail: "sim-customer@loomy.test",
    storeStripeAccountId: process.env.SIM_STORE_STRIPE_ACCT ?? undefined,
    courierStripeAccountId: process.env.SIM_COURIER_STRIPE_ACCT ?? undefined,
  };

  const om = getOrderManager();
  const dispatch = getCourierDispatchSystem();
  const delivery = getDeliveryCompletionFlow();

  console.log("\n▶ registerPendingOrder\n");
  await om.registerPendingOrder({
    orderId: ORDER_ID,
    storeId: STORE_ID,
    orderDetails,
  });

  console.log("\n▶ transitionToPaid (emits ORDER_PAID)\n");
  await om.transitionToPaid(ORDER_ID);

  console.log("\n▶ transitionToReady (emits ORDER_READY_FOR_PICKUP → broadcast)\n");
  await om.transitionToReady(ORDER_ID);

  console.log("\n▶ acceptOrder (emits COURIER_ASSIGNED)\n");
  await dispatch.acceptOrder(COURIER_ID, ORDER_ID);

  console.log("\n▶ transitionToOutForDelivery\n");
  await om.transitionToOutForDelivery(ORDER_ID);

  console.log("\n▶ completeDelivery (geofence + handoff → delivered + ORDER_DELIVERED)\n");
  await delivery.completeDelivery({
    orderId: ORDER_ID,
    courierId: COURIER_ID,
    courierLat: CUSTOMER.lat,
    courierLng: CUSTOMER.lng,
    mode: "handed_to_customer",
    customerHandoffCode: "4242",
  });

  console.log("\n✓ Simulation finished.\n");
  unwire();
}

void main().catch((err) => {
  console.error("\n✗ Simulation failed:", err);
  process.exitCode = 1;
});
