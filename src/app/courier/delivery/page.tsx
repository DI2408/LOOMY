import { DeliveryAction } from "@/components/courier/DeliveryAction";

type Search = { orderId?: string; courierId?: string; secret?: string };

export default async function CourierDeliveryPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const { orderId, courierId, secret } = await searchParams;
  const expected = process.env.COURIER_DISPATCH_SECRET;

  if (!expected || secret !== expected || !orderId?.trim() || !courierId?.trim()) {
    return (
      <main className="px-4 py-16 text-center text-sm text-slate-600">
        Angiv <code className="font-mono">orderId</code>,{" "}
        <code className="font-mono">courierId</code> og{" "}
        <code className="font-mono">secret</code> i URL.
      </main>
    );
  }

  return (
    <DeliveryAction
      orderId={orderId.trim()}
      courierId={courierId.trim()}
      secret={secret}
    />
  );
}
