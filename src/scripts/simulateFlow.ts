/**
 * LOOMY nervesystem — end-to-end simulation med pauser så logs kan læses.
 *
 * Kør fra repo-roden (anbefalet):
 *   npx tsx src/scripts/simulateFlow.ts
 *   npm run simulate:flow
 *
 * CJS ts-node + path-alias:
 *   npm run simulate:flow:ts-node
 *
 * ESM ts-node (kræver --import af path-register — ellers fejler @/):
 *   npm run simulate:flow:esm
 *   node --import ./register-tsconfig-paths.mjs --loader ts-node/esm src/scripts/simulateFlow.ts
 *
 * Kræver: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { createServiceSupabase } from "@/lib/supabase/service";
import { LoomyEvents, subscribeLoomyEvent } from "@/lib/events";
import { getOrderManager } from "@/server/courier/courierDispatchSingleton";
import { getDeliveryCompletionFlow } from "@/server/delivery/deliveryCompletionSingleton";
import { registerAllLoomyAgents } from "@/services/orchestrationAgent";
import { markAsReady } from "@/services/StoreAgent";
import { acceptOrder } from "@/services/CourierAgent";
import { computeDefaultPercentSplit } from "@/server/payout/defaultOrderSplit";

const ORDER_ID = "001";
const STORE_ID = "strom-boutique";
const COURIER_ID = "bud_mads_01";
const DELAY_MS = 900;

const CUSTOMER = { lat: 55.6761, lng: 12.5683 };
const STORE = { lat: 55.6812, lng: 12.5755 };

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function log(phase: string, msg: string): void {
  console.log(`\n────────── ${phase} ──────────\n${msg}\n`);
}

async function ensureTestCourier(): Promise<void> {
  const supabase = createServiceSupabase();
  const { error } = await supabase.from("loomy_couriers").upsert(
    {
      id: COURIER_ID,
      is_available: true,
      lat: CUSTOMER.lat,
      lng: CUSTOMER.lng,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );
  if (error) {
    console.warn("[SIM] Kunne ikke upsert bud (fortsætter):", error.message);
  } else {
    console.log(`[SIM] Bud-række klar: ${COURIER_ID}`);
  }
}

type BusFlags = {
  orderPaid: boolean;
  orderReady: boolean;
  courierClaimed: boolean;
  orderDelivered: boolean;
};

function wireVerification(flags: BusFlags): () => void {
  const unsubs: Array<() => void> = [];

  unsubs.push(
    subscribeLoomyEvent(LoomyEvents.ORDER_PAID, () => {
      flags.orderPaid = true;
      console.log(
        "[SIM VERIFY] ORDER_PAID set på bussen (StoreAgent bør også logge [STORE AGENT])"
      );
    })
  );
  unsubs.push(
    subscribeLoomyEvent(LoomyEvents.ORDER_READY, () => {
      flags.orderReady = true;
      console.log(
        "[SIM VERIFY] ORDER_READY set på bussen (CourierAgent bør logge [COURIER AGENT])"
      );
    })
  );
  unsubs.push(
    subscribeLoomyEvent(LoomyEvents.COURIER_CLAIMED, () => {
      flags.courierClaimed = true;
      console.log("[SIM VERIFY] COURIER_CLAIMED set på bussen");
    })
  );
  unsubs.push(
    subscribeLoomyEvent(LoomyEvents.ORDER_DELIVERED, () => {
      flags.orderDelivered = true;
      console.log(
        "[SIM VERIFY] ORDER_DELIVERED set på bussen (PayoutService bør logge [PAYOUT SERVICE])"
      );
    })
  );

  return () => {
    for (const u of unsubs) u();
  };
}

async function simulateCustomerPayment(): Promise<void> {
  const om = getOrderManager();
  const details = {
    currency: "dkk",
    totalMinorUnits: 100_000,
    customerLat: CUSTOMER.lat,
    customerLng: CUSTOMER.lng,
    storeLat: STORE.lat,
    storeLng: STORE.lng,
    handoffCode: "4242",
    customerEmail: "kunde-001@loomy.test",
  };

  log("KUNDE", `Simulerer gennemført betaling for Ordre #${ORDER_ID}`);
  await om.registerPendingOrder({
    orderId: ORDER_ID,
    storeId: STORE_ID,
    orderDetails: details,
  });
  await om.transitionToPaid(ORDER_ID);
  console.log("[SIM] transitionToPaid(001) færdig");
}

async function simulateDelivery(): Promise<void> {
  const om = getOrderManager();
  const delivery = getDeliveryCompletionFlow();

  log("LEVERING", "out_for_delivery → completeDelivery (personlig, kode 4242)");
  await om.transitionToOutForDelivery(ORDER_ID);
  await delivery.completeDelivery({
    orderId: ORDER_ID,
    courierId: COURIER_ID,
    courierLat: CUSTOMER.lat,
    courierLng: CUSTOMER.lng,
    mode: "handed_to_customer",
    customerHandoffCode: "4242",
  });
  console.log("[SIM] Levering registreret");
}

async function main(): Promise<void> {
  console.log("\n╔════════════════════════════════════════════╗");
  console.log("║  LOOMY simulateFlow — nervesystem test     ║");
  console.log("╚════════════════════════════════════════════╝\n");

  const flags: BusFlags = {
    orderPaid: false,
    orderReady: false,
    courierClaimed: false,
    orderDelivered: false,
  };

  const unwireVerify = wireVerification(flags);

  console.log("[SIM] Registrerer agenter på bussen…");
  registerAllLoomyAgents();
  await delay(400);

  await ensureTestCourier();
  await delay(DELAY_MS);

  await simulateCustomerPayment();
  await delay(DELAY_MS);

  if (!flags.orderPaid) {
    throw new Error("[SIM FAIL] ORDER_PAID blev ikke observeret på bussen.");
  }
  log("EVENT-TJEK", "ORDER_PAID OK (StoreAgent skulle have logget modtagelse)");

  await delay(DELAY_MS);

  log("BUTIK", `markAsReady('${ORDER_ID}')`);
  await markAsReady(ORDER_ID);
  await delay(DELAY_MS);

  if (!flags.orderReady) {
    throw new Error("[SIM FAIL] ORDER_READY blev ikke observeret.");
  }
  log(
    "EVENT-TJEK",
    "ORDER_READY OK (CourierAgent skulle have broadcastet til ledige bude)"
  );

  await delay(DELAY_MS);

  log("BUD", `acceptOrder('${COURIER_ID}', '${ORDER_ID}')`);
  await acceptOrder(COURIER_ID, ORDER_ID);
  await delay(DELAY_MS);

  if (!flags.courierClaimed) {
    throw new Error("[SIM FAIL] COURIER_CLAIMED blev ikke observeret.");
  }
  log("EVENT-TJEK", "COURIER_CLAIMED OK");

  await delay(DELAY_MS);

  const expected = computeDefaultPercentSplit(100_000);
  log(
    "FORVENTET SPLIT (80/15/5)",
    `butik=${expected.storeNetMinorUnits} øre | bud=${expected.courierHonorariumMinorUnits} | LOOMY=${expected.loomyCommissionMinorUnits} (total 100_000)`
  );

  await simulateDelivery();
  await delay(DELAY_MS * 2);

  if (!flags.orderDelivered) {
    throw new Error("[SIM FAIL] ORDER_DELIVERED blev ikke observeret.");
  }
  log(
    "AFSLUTNING",
    "ORDER_DELIVERED OK — se [PAYOUT SERVICE]-linjer ovenfor for Stripe/split (samme 80/15/5 som forventet)."
  );

  unwireVerify();
  console.log("\n[SIM] Flow færdig.\n");
}

void main().catch((err) => {
  console.error("\n[SIM FAIL]", err);
  process.exitCode = 1;
});
