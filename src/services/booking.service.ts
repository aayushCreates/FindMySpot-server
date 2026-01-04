import { PrismaClient } from "@prisma/client";
import bookingQueue from "../queues/booking.queue";
import { getIdempotencyKey } from "../utils/keys.utils";
import { redisPub } from "../config/redis.config";

const prisma = new PrismaClient();

export class BookingService {
  static async getBookingsBySlotId(slotId: string) {
    return await prisma.booking.findMany({
      where: { slotId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  static async getUserBookings(userId: string) {
    return await prisma.booking.findMany({
      where: { userId },
      include: {
        slot: true,
        payment: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  static async createBooking(userId: string, slotId: string) {
    const slot = await prisma.slot.findFirst({
      where: { id: slotId },
    });
    if (!slot) {
      throw new Error("Slot not found");
    }

    const seat = await prisma.seat.findFirst({
      where: {
        slotId: slotId
      }
    });
    if(!seat) {
      throw new Error("Seat not found");
    }

    const key = getIdempotencyKey(slotId, userId);
    const newBooking = await prisma.booking.create({
      data: {
        state: "INIT",
        slotId: slotId,
        userId: userId,
        idempotencyKey: key as string,
        seatId: seat.id
      },
    });

    await redisPub.publish(
      `booking:${newBooking.id}`,
      JSON.stringify({
        userId: newBooking.userId,
        bookingId: newBooking.id,
        state: newBooking.state,
        slotId: newBooking.slotId,
        seatId: newBooking.seatId
      })
    );

    await bookingQueue.add(
      "booking_queue",
      {
        userId: userId,
        slotId: slot.id,
        bookingId: newBooking.id,
        totalSeats: slot.totalSeats,
        seatId: newBooking.seatId
      },
      {
        delay: 2000,
        backoff: {
          type: "exponential",
        },
      }
    );

    return newBooking;
  }

  static async cancelUserBooking(userId: string, bookingId: string, slotId: string, seatNumber: number) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking) {
      throw new Error("Booking not found");
    }

    if (booking.userId !== userId) {
      throw new Error("Unauthorized to cancel this booking");
    }

    if (booking.slotId !== slotId) {
      throw new Error("Booking not found");
    }

    const slot = await prisma.slot.findUnique({
      where: {
        id: slotId
      }
    });
    if (!slot) {
      throw new Error("Slot not found");
    }

    return await prisma.booking.update({
      where: {
        id: bookingId,
      },
      data: {
        state: "CANCELLED",
      },
    });
  }

  static async getBookingByUserAndSlot(userId: string, slotId: string) {
    return await prisma.booking.findFirst({
      where: {
        userId,
        slotId,
      },
      include: {
        payment: true,
        slot: true,
      },
    });
  }
}
