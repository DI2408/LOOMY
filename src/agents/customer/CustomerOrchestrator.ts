/**
 * LOOMY — Customer journey orchestration (non-AI).
 *
 * Single place for customer-side phase transitions and guards before you
 * plug in an LLM/tool-calling agent: keep deterministic rules here, let the
 * agent propose events or call server actions that dispatch events.
 */

export type CustomerPhase =
  | "idle"
  | "browsing"
  | "cart"
  | "checkout"
  | "payment"
  | "order_tracking"
  | "support";

export type CustomerOrchestratorState = {
  phase: CustomerPhase;
  /** Active order when in payment or tracking. */
  orderId: string | null;
  lastError: string | null;
};

export type CustomerOrchestratorEvent =
  | { type: "RESET" }
  | { type: "ENTER_STORE" }
  | { type: "VIEW_CART" }
  | { type: "START_CHECKOUT" }
  | { type: "PAYMENT_STARTED"; orderId: string }
  | { type: "PAYMENT_SUCCEEDED" }
  | { type: "PAYMENT_FAILED"; message: string }
  | { type: "VIEW_ORDER"; orderId: string }
  | { type: "OPEN_SUPPORT" }
  | { type: "RETURN_HOME" };

export const initialCustomerOrchestratorState: CustomerOrchestratorState = {
  phase: "idle",
  orderId: null,
  lastError: null,
};

/**
 * Pure reducer: same event + same state → same next state (testable, replayable).
 */
export function reduceCustomerOrchestrator(
  state: CustomerOrchestratorState,
  event: CustomerOrchestratorEvent
): CustomerOrchestratorState {
  switch (event.type) {
    case "RESET":
      return { ...initialCustomerOrchestratorState };

    case "ENTER_STORE":
      return { ...state, phase: "browsing", lastError: null };

    case "VIEW_CART":
      return { ...state, phase: "cart", lastError: null };

    case "START_CHECKOUT":
      if (state.phase !== "cart" && state.phase !== "browsing") {
        return state;
      }
      return { ...state, phase: "checkout", lastError: null };

    case "PAYMENT_STARTED":
      if (state.phase !== "checkout") {
        return state;
      }
      return {
        ...state,
        phase: "payment",
        orderId: event.orderId,
        lastError: null,
      };

    case "PAYMENT_SUCCEEDED":
      if (state.phase !== "payment") {
        return state;
      }
      return { ...state, phase: "order_tracking", lastError: null };

    case "PAYMENT_FAILED":
      return {
        ...state,
        phase: "checkout",
        lastError: event.message,
      };

    case "VIEW_ORDER":
      return {
        ...state,
        phase: "order_tracking",
        orderId: event.orderId,
        lastError: null,
      };

    case "OPEN_SUPPORT":
      return { ...state, phase: "support", lastError: null };

    case "RETURN_HOME":
      return {
        ...state,
        phase: "idle",
        orderId: null,
        lastError: null,
      };

    default: {
      const _exhaustive: never = event;
      return _exhaustive;
    }
  }
}

export type CheckoutReadiness = {
  cartItemCount: number;
  hasDeliveryAddress: boolean;
  stockOk: boolean;
};

/**
 * Guards for checkout — replace booleans with Supabase / server checks in your agent flow.
 */
export function isReadyForCheckout(
  state: CustomerOrchestratorState,
  readiness: CheckoutReadiness
): boolean {
  return (
    (state.phase === "cart" || state.phase === "browsing") &&
    readiness.cartItemCount > 0 &&
    readiness.hasDeliveryAddress &&
    readiness.stockOk
  );
}

/**
 * Mutable wrapper when you do not need time-travel; UI or an agent loop can call `dispatch`.
 */
export class CustomerOrchestrator {
  private state: CustomerOrchestratorState = {
    ...initialCustomerOrchestratorState,
  };

  getState(): Readonly<CustomerOrchestratorState> {
    return this.state;
  }

  dispatch(event: CustomerOrchestratorEvent): CustomerOrchestratorState {
    this.state = reduceCustomerOrchestrator(this.state, event);
    return this.getState();
  }

  replaceState(next: CustomerOrchestratorState): void {
    this.state = { ...next };
  }
}
