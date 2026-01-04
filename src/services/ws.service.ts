import { WebSocket } from "@fastify/websocket";
import { PrismaClient } from "@prisma/client";
import { redisSub } from "../config/redis.config";

const prisma = new PrismaClient();
const socketMap = new Map<string, Set<WebSocket>>();

export class WebSocketService {
  static async subscribeToOrder(socket: WebSocket, bookingId: string) {
    const channel = `booking:${bookingId}`;

    console.log(`🔌 WS connected for booking: ${bookingId}`);

    const booking = await prisma.booking.findUnique({
      where: {
        id: bookingId,
      },
    });
    if(booking) {
        socket.send(JSON.stringify({ status: booking.state, ...booking }));
    }

    if(!socketMap.has(channel)){
        socketMap.set(channel, new Set());
        redisSub.subscribe(channel);
    }

    const sockets =  socketMap.get(channel)!;
    sockets.add(socket);

    socket.on("close", () => {
        console.log(`❌ WS closed for order: ${bookingId}`);
        sockets.delete(socket);
        if (sockets.size === 0) {
          redisSub.unsubscribe(channel);
          socketMap.delete(channel);
        }
      });
      
      socket.on("error", () => {
        sockets.delete(socket);
      });
  }
}
