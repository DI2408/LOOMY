import type { StoreOrderDetailsJson } from "@/server/events/orderPaidEvents";
import type { OrderManager } from "@/server/orders/OrderManager";
import type { OrderManagerRepository } from "@/server/orders/orderManagerRepository";
import { OrderTransitionError } from "@/server/orders/orderManagerTypes";
import {
  DEFAULT_DELIVERY_GEOFENCE_RADIUS_M,
  distanceMeters,
  isWithinDeliveryGeofence,
} from "./deliveryGeofence";
import {
  buildDeliveryReceiptText,
  sendThankYouReceiptEmail,
} from "./deliveryReceiptEmail";
import type { CompleteDeliveryInput } from "./deliveryCompletionTypes";
import { DeliveryCompletionError } from "./deliveryCompletionTypes";
import { readCustomerLocationFromOrderDetails } from "@/server/tracking/orderDetailsCoords";

function readGeofenceRadiusM(details: StoreOrderDetailsJson): number {
  const raw =
    details.deliveryGeofenceRadiusMeters ??
    details.geofenceRadiusMeters ??
    details.deliveryRadiusM;
  const n = typeof raw === "number" ? raw : Number(raw);
  if (Number.isFinite(n) && n >= 40 && n <= 120) {
    return n;
  }
  return DEFAULT_DELIVERY_GEOFENCE_RADIUS_M;
}

function normalizeHandoffCode(code: string): string {
  return code.replace(/\s+/g, "").trim();
}

function readExpectedHandoffCode(details: StoreOrderDetailsJson): string | null {
  const raw =
    details.handoffCode ??
    details.customerHandoffCode ??
    details.deliveryPin;
  if (raw == null) return null;
  const s = String(raw).trim();
  if (/^\d{4}$/.test(s)) return s;
  return null;
}

function readCustomerEmail(details: StoreOrderDetailsJson): string | null {
  const raw = details.customerEmail ?? details.email;
  if (raw == null || typeof raw !== "string") return null;
  const e = raw.trim();
  return e.length > 3 ? e : null;
}

export type DeliveryCompletionFlowDeps = {
  orders: OrderManagerRepository;
  orderManager: OrderManager;
};

/**
 * Bud-agent: geofence + bekræftelse (personlig kode eller dørbillede) → `delivered` + tak-mail.
 */
export class DeliveryCompletionFlow {
  constructor(private readonly deps: DeliveryCompletionFlowDeps) {}

  /**
   * Whether the courier may show/enable the deliver CTA (inside geofence, correct status).
   */
  async canConfirmDelivery(
    orderId: string,
    courierId: string,
    courierLat: number,
    courierLng: number
  ): Promise<{
    allowed: boolean;
    distanceMeters: number | null;
    radiusMeters: number;
    reason?: string;
  }> {
    if (!Number.isFinite(courierLat) || !Number.isFinite(courierLng)) {
      return {
        allowed: false,
        distanceMeters: null,
        radiusMeters: DEFAULT_DELIVERY_GEOFENCE_RADIUS_M,
        reason: "invalid_coordinates",
      };
    }

    const row = await this.deps.orders.getById(orderId);
    if (!row) {
      return {
        allowed: false,
        distanceMeters: null,
        radiusMeters: DEFAULT_DELIVERY_GEOFENCE_RADIUS_M,
        reason: "order_not_found",
      };
    }
    if (row.courierId !== courierId) {
      return {
        allowed: false,
        distanceMeters: null,
        radiusMeters: readGeofenceRadiusM(row.orderDetails),
        reason: "forbidden",
      };
    }
    if (row.status !== "out_for_delivery") {
      return {
        allowed: false,
        distanceMeters: null,
        radiusMeters: readGeofenceRadiusM(row.orderDetails),
        reason: "invalid_status",
      };
    }

    const customer = readCustomerLocationFromOrderDetails(
      row.orderDetails as StoreOrderDetailsJson
    );
    const radius = readGeofenceRadiusM(row.orderDetails);
    if (!customer) {
      return {
        allowed: false,
        distanceMeters: null,
        radiusMeters: radius,
        reason: "missing_customer_location",
      };
    }

    const courier = { lat: courierLat, lng: courierLng };
    const inside = isWithinDeliveryGeofence(courier, customer, radius);
    const distM = distanceMeters(courier, customer);

    return {
      allowed: inside,
      distanceMeters: distM,
      radiusMeters: radius,
      reason: inside ? undefined : "outside_geofence",
    };
  }

  async completeDelivery(input: CompleteDeliveryInput): Promise<void> {
    const {
      orderId,
      courierId,
      courierLat,
      courierLng,
      mode,
      customerHandoffCode,
      proofImageBase64,
    } = input;

    if (!Number.isFinite(courierLat) || !Number.isFinite(courierLng)) {
      throw new DeliveryCompletionError(
        "Ugyldige GPS-koordinater.",
        "INVALID_COORDINATES"
      );
    }

    const row = await this.deps.orders.getById(orderId);
    if (!row) {
      throw new DeliveryCompletionError("Ordren findes ikke.", "ORDER_NOT_FOUND");
    }
    if (row.courierId !== courierId) {
      throw new DeliveryCompletionError(
        "Du er ikke tildelt denne ordre.",
        "FORBIDDEN"
      );
    }
    if (row.status !== "out_for_delivery") {
      throw new DeliveryCompletionError(
        `Ordren kan ikke leveres i status "${row.status}".`,
        "INVALID_STATUS"
      );
    }

    const details = row.orderDetails as StoreOrderDetailsJson;
    const customer = readCustomerLocationFromOrderDetails(details);
    if (!customer) {
      throw new DeliveryCompletionError(
        "Manglende kundekoordinater på ordren.",
        "MISSING_CUSTOMER_LOCATION"
      );
    }

    const radius = readGeofenceRadiusM(details);
    if (
      !isWithinDeliveryGeofence(
        { lat: courierLat, lng: courierLng },
        customer,
        radius
      )
    ) {
      throw new DeliveryCompletionError(
        `Du skal være inden for ca. ${radius} m af kundens adresse for at afslutte.`,
        "OUTSIDE_GEOFENCE"
      );
    }

    if (mode === "handed_to_customer") {
      const expected = readExpectedHandoffCode(details);
      if (!expected) {
        throw new DeliveryCompletionError(
          "Ordren mangler en 4-cifret afleveringskode (handoffCode) i systemet.",
          "INVALID_HANDOFF_CODE"
        );
      }
      const provided = customerHandoffCode
        ? normalizeHandoffCode(customerHandoffCode)
        : "";
      if (provided !== expected) {
        throw new DeliveryCompletionError(
          "Forkert afleveringskode fra kunden.",
          "INVALID_HANDOFF_CODE"
        );
      }
    } else if (mode === "left_at_door") {
      const proof = proofImageBase64?.trim() ?? "";
      if (proof.length < 80) {
        throw new DeliveryCompletionError(
          "Tag et billede af pakken ved døren (påkrævet).",
          "MISSING_PROOF_IMAGE"
        );
      }
    } else {
      throw new DeliveryCompletionError("Ukendt leveringstype.", "INVALID_STATUS");
    }

    try {
      await this.deps.orderManager.transitionToDelivered(orderId);
    } catch (e) {
      if (e instanceof OrderTransitionError) {
        throw new DeliveryCompletionError(e.message, "INVALID_STATUS");
      }
      throw e;
    }

    const email = readCustomerEmail(details);
    if (email) {
      const receipt = buildDeliveryReceiptText(orderId, details);
      await sendThankYouReceiptEmail({
        to: email,
        orderId,
        receiptText: receipt,
      });
    }
  }
}
