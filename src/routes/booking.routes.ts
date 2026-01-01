import { FastifyInstance } from "fastify";
import { isUserLoggedIn } from "../middlewares/auth.middleware";
import { 
    getSlotAllBookings, 
    getUserBookings, 
    createBooking, 
    cancelBookingByUser,
    getSlotUserBooking
} from "../controllers/booking.controller";


export default function bookingRoute (fastify: FastifyInstance) {
    fastify.get('/slot/:id', { preHandler: isUserLoggedIn } , getSlotAllBookings);

    fastify.post('/', { preHandler: isUserLoggedIn }, createBooking);
    
    fastify.get('/:id/cancel', { preHandler: isUserLoggedIn }, cancelBookingByUser);

    fastify.get('/my-bookings', { preHandler: isUserLoggedIn } , getUserBookings);
    
    fastify.get('/slot/:id/me', { preHandler: isUserLoggedIn }, getSlotUserBooking);
}