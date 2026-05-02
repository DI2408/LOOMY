import { createNoopStripeConnectPayoutGateway, createStripeConnectPayoutGateway } from "./stripeConnectPayoutGateway";
import { PayoutOrchestrator } from "./PayoutOrchestrator";

let orchestrator: PayoutOrchestrator | null = null;

export function getPayoutOrchestrator(): PayoutOrchestrator {
  if (!orchestrator) {
    const useStripe = Boolean(process.env.STRIPE_SECRET_KEY);
    orchestrator = new PayoutOrchestrator({
      stripeGateway: useStripe
        ? createStripeConnectPayoutGateway()
        : createNoopStripeConnectPayoutGateway(),
    });
  }
  return orchestrator;
}
