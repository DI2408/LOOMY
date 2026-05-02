import type { OrderData, OrderStatus } from "@/components/providers/lumi-provider";

const PAY_LABEL_DA: Record<string, string> = {
  requires_payment: "Afventer betaling",
  processing: "Betaling igang…",
  succeeded: "Betaling gennemført",
  failed: "Betaling fejlede",
  cancelled: "Annulleret",
  canceled: "Annulleret",
};

export function paymentStatusLabelDa(status: string | null | undefined): string | null {
  if (!status) return null;
  return PAY_LABEL_DA[status] ?? status.replaceAll("_", " ");
}

const TRACK_STEPS: { status: OrderStatus; label: string }[] = [
  { status: "order_placed", label: "Ordre modtaget" },
  { status: "store_packing", label: "Butik pakker" },
  { status: "courier_pickup", label: "Bud henter" },
  { status: "on_the_way", label: "På vej til dig" },
  { status: "delivered", label: "Leveret" },
];

const ORDER_IDX: Partial<Record<OrderStatus, number>> = Object.fromEntries(
  TRACK_STEPS.map((s, i) => [s.status, i]),
) as Partial<Record<OrderStatus, number>>;

export function orderTrackingSteps(order: OrderData): {
  steps: typeof TRACK_STEPS;
  activeIndex: number;
  paidAwaitingFulfillment: boolean;
} {
  const idx = ORDER_IDX[order.status];
  const activeIndex = idx ?? 0;
  const pay = order.paymentStatus;
  const paidAwaitingFulfillment =
    order.status === "order_placed" &&
    (pay === "succeeded" || pay === "processing");

  return { steps: TRACK_STEPS, activeIndex, paidAwaitingFulfillment };
}
