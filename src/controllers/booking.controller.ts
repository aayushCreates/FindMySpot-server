import { FastifyReply, FastifyRequest } from "fastify";
import { BookingService } from "../services/booking.service";

export const getSlotAllBookings = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
        const { id } = req.params as any;

        if (!id) {
            return reply.status(400).send({
                success: false,
                message: "Slot ID is required"
            });
        }

        const bookings = await BookingService.getBookingsBySlotId(id);

        if (!bookings || bookings.length === 0) {
            return reply.status(404).send({
                success: false,
                message: "No bookings found for this slot"
            });
        }

        return reply.status(200).send({
            success: true,
            message: "Bookings fetched successfully",
            data: bookings
        });

    } catch (err) {
        console.log("Error in getting all bookings of slot", err);
        return reply.status(500).send({
            success: false,
            message: "Server error in getting all bookings of the slot"
        });
    }
}

export const getUserBookings = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
             return reply.status(401).send({
                success: false,
                message: "Unauthorized"
            });
        }

        const bookings = await BookingService.getUserBookings(userId);

        if (!bookings || bookings.length === 0) {
            return reply.status(404).send({
                success: false,
                message: "No bookings found for this user"
            });
        }

        return reply.status(200).send({
            success: true,
            message: "User bookings fetched successfully",
            data: bookings
        });

    } catch (err) {
        console.log("Error in getting all bookings of user", err);
        return reply.status(500).send({
            success: false,
            message: "Server error in getting all bookings of the user"
        });
    }
}

export const createBooking = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
        const userId = req.user?.id;
        const { slotId } = req.body as any;

        if (!userId) {
            return reply.status(401).send({
                success: false,
                message: "Unauthorized"
            });
        }

        if (!slotId) {
            return reply.status(400).send({
                success: false,
                message: "Slot ID is required"
            });
        }

        try {
            const booking = await BookingService.createBooking(userId, slotId);
            return reply.status(201).send({
                success: true,
                message: "Booking created successfully",
                data: booking
            });
        } catch (e: any) {
            if (e.message === "Slot not found") {
                return reply.status(404).send({
                    success: false,
                    message: "Slot not found"
                });
            }
            if (e.message === "Slot is full") {
                return reply.status(400).send({
                    success: false,
                    message: "Slot is full"
                });
            }
            throw e;
        }

    } catch (err) {
        console.log("Error in creating booking", err);
        return reply.status(500).send({
            success: false,
            message: "Server error in creating booking"
        });
    }
}

export const cancelBookingByUser = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params as any;   // bookingId

        if (!userId) {
            return reply.status(401).send({
                success: false,
                message: "Unauthorized"
            });
        }

        if (!id) {
            return reply.status(400).send({
                success: false,
                message: "Booking ID is required"
            });
        }

        try {
            await BookingService.cancelUserBooking(userId, id);
            return reply.status(200).send({
                success: true,
                message: "Booking cancelled successfully"
            });
        } catch (e: any) {
             if (e.message === "Booking not found") {
                return reply.status(404).send({
                    success: false,
                    message: "Booking not found"
                });
            }
            if (e.message === "Unauthorized to cancel this booking") {
                return reply.status(403).send({
                    success: false,
                    message: "You are not authorized to cancel this booking"
                });
            }
            throw e;
        }

    } catch (err) {
        console.log("Error in cancelling booking", err);
        return reply.status(500).send({
            success: false,
            message: "Server error in cancelling booking"
        });
    }
}

export const getSlotUserBooking = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
        const { id } = req.params; // slotId
        const userId = req.user?.id;

        if (!userId) {
             return reply.status(401).send({
                success: false,
                message: "Unauthorized"
            });
        }

        const booking = await BookingService.getBookingByUserAndSlot(userId, id);

        if (!booking) {
            return reply.status(404).send({
                success: false,
                message: "Booking not found"
            });
        }

        return reply.status(200).send({
            success: true,
            message: "Booking fetched successfully",
            data: booking
        });

    } catch (err) {
        console.log("Error in getting slot user booking", err);
        return reply.status(500).send({
            success: false,
            message: "Server error in getting slot user booking"
        });
    }
}
