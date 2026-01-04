import fastify from 'fastify';
import dotenv from 'dotenv';
import authRouter from './routes/auth.routes';
import bookingRouter from './routes/booking.routes';
import { paymentRouter } from './routes/payment.routes';
import websocket from "@fastify/websocket";

const app = fastify({
    logger: true
});

dotenv.config();

app.register(websocket);

app.register(authRouter, { prefix: "/api/auth" });
app.register(bookingRouter, { prefix: "/api/bookings" });
app.register(paymentRouter, { prefix: "/api/payments" });

const port = Number(process.env.PORT) || 8080;
app.listen({ port }, (err, address)=> {
    if (err) {
        app.log.error(err);
        process.exit(1);
      }
      console.log(`🚀 Server running at ${address}`);
})
