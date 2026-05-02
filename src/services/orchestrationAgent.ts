/**
 * Registrerer alle LOOMY-agenter på nervesystemet (én gang ved server-start).
 */

import { registerCourierAgent } from "./CourierAgent";
import { registerCustomerTrackingAgent } from "./customerTrackingAgent";
import { registerPayoutService } from "./PayoutService";
import { registerStoreAgent } from "./StoreAgent";

let started = false;

export function registerAllLoomyAgents(): void {
  if (started) return;
  started = true;
  console.log("[NERVESYSTEM]: Registrerer agenter (Store, Courier, Customer, Payout)…");
  registerStoreAgent();
  registerCourierAgent();
  registerCustomerTrackingAgent();
  registerPayoutService();
  console.log("[NERVESYSTEM]: Agenter klar.");
}
