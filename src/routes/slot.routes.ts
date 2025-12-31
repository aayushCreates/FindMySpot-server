import { FastifyInstance } from "fastify";
import { isUserLoggedIn } from "../middlewares/auth.middleware";
import { deleteSlot, getAllSlots, getSlot, updateSlot, addSlot } from "../controllers/slot.controller";


export default function slotRouter (fastify: FastifyInstance){
    fastify.get('/', { preHandler: isUserLoggedIn }, getAllSlots);
    fastify.post('/', { preHandler: isUserLoggedIn }, addSlot);
    fastify.get('/:id', { preHandler: isUserLoggedIn }, getSlot);
    fastify.put('/:id', { preHandler: isUserLoggedIn }, updateSlot);
    fastify.delete('/:id', { preHandler: isUserLoggedIn }, deleteSlot);
}


