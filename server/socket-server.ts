/**
 * Custom Next + Socket.io entry (dev: `npm run dev:socket`).
 * Serves Next from `server/socket-server.ts` and attaches Socket.io for live tracking.
 */

import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";
import { setSocketIoServer } from "../src/server/socket/ioBridge";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME ?? "localhost";
const port = Number(process.env.PORT ?? 3000);

async function main(): Promise<void> {
  const app = next({ dev, hostname, port });
  const handle = app.getRequestHandler();

  await app.prepare();

  const httpServer = createServer((req, res) => {
    void handle(req, res);
  });

  const io = new Server(httpServer, {
    path: "/socket.io",
    cors: { origin: true, methods: ["GET", "POST"] },
  });

  setSocketIoServer(io);

  io.on("connection", (socket) => {
    socket.on("join_order", (orderId: unknown) => {
      if (typeof orderId === "string" && orderId.length > 0) {
        void socket.join(`order:${orderId}`);
      }
    });

    socket.on(
      "courier:location",
      async (payload: { courierId?: string; lat?: number; lng?: number }) => {
        const courierId = payload?.courierId;
        if (typeof courierId !== "string" || !courierId) return;
        const lat = payload.lat;
        const lng = payload.lng;
        try {
          const { getLocationTrackingService } = await import(
            "../src/server/tracking/trackingSingleton"
          );
          await getLocationTrackingService().updateCourierLocation(
            courierId,
            lat ?? NaN,
            lng ?? NaN
          );
        } catch (e) {
          console.error("[loomy] courier:location", e);
        }
      }
    );
  });

  httpServer.listen(port, () => {
    console.info(`[loomy] Ready on http://${hostname}:${port} (Socket.io /socket.io)`);
  });
}

void main();
