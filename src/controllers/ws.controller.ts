import { WebSocket } from "@fastify/websocket";
import { FastifyRequest } from "fastify";
import { WebSocketService } from "../services/ws.service";


export const bookingDetails = async (socket: WebSocket, req: FastifyRequest)=> {
    try {
        const { bookingId } = req.params as any;
        if (!bookingId) {
            socket.close();
            return;
          }

        await WebSocketService.subscribeToOrder(socket, bookingId);
    }catch (err){
        console.error("Server error in websocket controller", err);
    socket.close();
    }
}


