export type DeliveryCompletionMode = "handed_to_customer" | "left_at_door";

export type CompleteDeliveryInput = {
  orderId: string;
  courierId: string;
  courierLat: number;
  courierLng: number;
  mode: DeliveryCompletionMode;
  /** Required when mode is `handed_to_customer` — must match `order_details.handoffCode`. */
  customerHandoffCode?: string;
  /** Required when mode is `left_at_door` — base64 image (data URL or raw base64). */
  proofImageBase64?: string;
};

export type DeliveryCompletionResult = {
  ok: true;
  orderId: string;
  status: "delivered";
};

export class DeliveryCompletionError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "ORDER_NOT_FOUND"
      | "FORBIDDEN"
      | "INVALID_STATUS"
      | "OUTSIDE_GEOFENCE"
      | "MISSING_CUSTOMER_LOCATION"
      | "INVALID_HANDOFF_CODE"
      | "MISSING_PROOF_IMAGE"
      | "INVALID_COORDINATES"
  ) {
    super(message);
    this.name = "DeliveryCompletionError";
  }
}
