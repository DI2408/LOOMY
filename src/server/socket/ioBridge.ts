import type { Server } from "socket.io";

declare global {
  // eslint-disable-next-line no-var
  var __loomySocketIo: Server | undefined;
}

export function setSocketIoServer(io: Server): void {
  globalThis.__loomySocketIo = io;
}

export function getSocketIoServer(): Server | null {
  return globalThis.__loomySocketIo ?? null;
}
