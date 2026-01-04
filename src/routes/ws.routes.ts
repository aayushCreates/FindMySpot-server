import { FastifyInstance } from "fastify";
import { bookingDetails } from "../controllers/ws.controller";



export default function wsRouter(fastify: FastifyInstance) {
    fastify.get('/:bookingId', { websocket: true }, bookingDetails);
}

