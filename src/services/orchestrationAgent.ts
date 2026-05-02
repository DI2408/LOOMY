/**
 * Wires all LOOMY agents to the central event bus (call once on server boot).
 */

import { registerCourierDispatchAgent } from "./courierDispatchAgent";
import { registerCustomerTrackingAgent } from "./customerTrackingAgent";
import { registerStoreNotificationAgent } from "./storeNotificationAgent";

let started = false;

export function registerAllLoomyAgents(): void {
  if (started) return;
  started = true;
  console.info("[LOOMY orchestration] registering agents on event bus…");
  registerStoreNotificationAgent();
  registerCourierDispatchAgent();
  registerCustomerTrackingAgent();
  console.info("[LOOMY orchestration] agents ready.");
}
