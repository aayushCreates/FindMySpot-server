import { WebSocket } from "@fastify/websocket";
import { redisSub } from "../config/redis.config";

const socketMap = new Map<string, Set<WebSocket>>

export function initRedisBookingListener() {
  redisSub.on("message", (channel, message) => {
    const sockets = socketMap.get(channel);
    if (!sockets) return;

    for (const socket of sockets) {
      if (socket.readyState === socket.OPEN) {
        socket.send(message);
      }
    }
  });
}
