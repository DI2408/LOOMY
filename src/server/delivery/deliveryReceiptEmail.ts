import type { StoreOrderDetailsJson } from "@/server/events/orderPaidEvents";

/**
 * Stub: connect to Resend, SendGrid, or Supabase Edge Function.
 * Called automatically after order → `delivered`.
 */
export async function sendThankYouReceiptEmail(input: {
  to: string;
  orderId: string;
  receiptText: string;
}): Promise<void> {
  void input;
}

export function buildDeliveryReceiptText(
  orderId: string,
  details: StoreOrderDetailsJson
): string {
  const lines = [
    "Tak for dit køb hos LOOMY!",
    "",
    `Ordre: ${orderId}`,
    `Butik: ${String(details.storeName ?? details.storeId ?? "—")}`,
    "",
    "Her er din kvittering for den afsluttede levering.",
    "",
    new Date().toISOString(),
  ];
  return lines.join("\n");
}
