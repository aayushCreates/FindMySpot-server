import { FastifyInstance } from "fastify";
import { isUserLoggedIn } from "../middlewares/auth.middleware";
import { createPayment, slotPayments, userPayment, verifyPayment } from "../controllers/payment.controller";


export function paymentRouter (fastify: FastifyInstance){
    fastify.get('/slots/:slotId', { preHandler: isUserLoggedIn }, slotPayments);
    fastify.post('/create', { preHandler: isUserLoggedIn }, createPayment);
    fastify.post('/webhooks/razorpay', verifyPayment);
    fastify.get('/my-payments', { preHandler: isUserLoggedIn }, userPayment);
}

