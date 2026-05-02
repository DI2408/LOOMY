/**
 * Kunde-agent — spejler COURIER_CLAIMED og COURIER_POSITION_UPDATE til Live Map (Socket.io).
 */

import { LoomyEvents, subscribeLoomyEvent } from "@/lib/events";

let unsubs: Array<() => void> = [];

export function registerCustomerTrackingAgent(): void {
  if (unsubs.length) return;

  unsubs.push(
    subscribeLoomyEvent(LoomyEvents.COURIER_CLAIMED, async (payload) => {
      console.log(
        `[CUSTOMER AGENT]: COURIER_CLAIMED order=${payload.orderId} bud=${payload.courierId}`
      );
      const ioMod = await import("@/server/socket/ioBridge");
      const io = ioMod.getSocketIoServer();
      io?.to(`order:${payload.orderId}`).emit("courier_assigned", {
        orderId: payload.orderId,
        courierId: payload.courierId,
        status: payload.status,
        ts: new Date().toISOString(),
      });
    })
  );

  unsubs.push(
    subscribeLoomyEvent(LoomyEvents.COURIER_POSITION_UPDATE, async (payload) => {
      const ioMod = await import("@/server/socket/ioBridge");
      const io = ioMod.getSocketIoServer();
      io?.to(`order:${payload.orderId}`).emit("location_update", {
        courierId: payload.courierId,
        lat: payload.lat,
        lng: payload.lng,
        ts: payload.ts,
        etaPhrase: payload.etaPhrase,
      });
    })
  );

  unsubs.push(
    subscribeLoomyEvent(LoomyEvents.ORDER_DELIVERED, async (payload) => {
      console.log(
        `[CUSTOMER AGENT]: ORDER_DELIVERED order=${payload.orderId} → socket`
      );
      const ioMod = await import("@/server/socket/ioBridge");
      const io = ioMod.getSocketIoServer();
      io?.to(`order:${payload.orderId}`).emit("order_delivered", {
        orderId: payload.orderId,
        ts: new Date().toISOString(),
      });
    })
  );

  unsubs.push(
    subscribeLoomyEvent(LoomyEvents.ORDER_DISPATCH_FAILED, async (payload) => {
      console.warn(
        `[CUSTOMER AGENT]: ORDER_DISPATCH_FAILED order=${payload.orderId} reason=${payload.reason} eligible=${payload.eligibleCourierCount}`
      );
      const ioMod = await import("@/server/socket/ioBridge");
      const io = ioMod.getSocketIoServer();
      io?.to(`order:${payload.orderId}`).emit("order_dispatch_failed", {
        orderId: payload.orderId,
        reason: payload.reason,
        eligibleCourierCount: payload.eligibleCourierCount,
        ts: new Date().toISOString(),
      });
    })
  );

  console.log(
    "[CUSTOMER AGENT]: Lytter på COURIER_CLAIMED, COURIER_POSITION_UPDATE, ORDER_DELIVERED, ORDER_DISPATCH_FAILED"
  );
}
