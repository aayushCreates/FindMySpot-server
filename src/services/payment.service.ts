import { PrismaClient } from "@prisma/client";
import razorpay from "../config/razorpay.config";
import { redisPub } from "../config/redis.config";
import { releaseLock } from "../utils/locking.utils";

const prisma = new PrismaClient();
export class Payment {
  static async getSlotPayments(slotId: string) {
    return await prisma.payment.findMany({
      where: {
        booking: {
          slotId: slotId,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  static async getUserPayment(userId: string) {
    return await prisma.payment.findMany({
      where: {
        userId: userId,
      },
      include: {
        booking: {
          include: {
            slot: true,
          },
        },
      },
    });
  }

  static async createPayment(
    bookingId: string,
    slotId: string,
    amount: number,
    userId: string,
  ) {
    const slot = await prisma.slot.findUnique({
      where: {
        id: slotId,
      },
    });
    if (!slot) {
      throw new Error("Invalid Slot");
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { user: true, seat: true },
    });
    if (!booking || booking.state !== "LOCKED") {
      throw new Error("Invalid booking state");
    }

    const existing = await prisma.payment.findFirst({
      where: { bookingId, status: "PENDING" }
    });

    if (existing) {
      return {
        razorpayOrderId: existing.razorpayOrderId as string,
        amount: existing.amount,
        currency: "INR", // Assuming INR
        key: process.env.RAZORPAY_KEY_ID,
        paymentId: existing.id,
      };
    }

    const newRazorPayOrder = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: booking.id,
    });

    const newPayment = await prisma.payment.create({
      data: {
        bookingId: booking.id,
        userId: booking.userId,
        amount,
        status: "PENDING",
        razorpayOrderId: newRazorPayOrder.id,
      },
    });

    await prisma.booking.update({
      where: { id: bookingId },
      data: { state: "PAYMENT_PENDING" },
    });

    await redisPub.publish(
      `booking:${bookingId}`,
      JSON.stringify({
        userId: userId,
        bookingId: bookingId,
        state: "PAYMENT_PENDING",
        slotId: slotId,
        seatNumber: booking.seat.seatNumber
      })
    );

    return {
      razorpayOrderId: newRazorPayOrder.id,
      amount: newRazorPayOrder.amount,
      currency: newRazorPayOrder.currency,
      key: process.env.RAZORPAY_KEY_ID,
      paymentId: newPayment.id,
    };
  }

  static async verifyPayment(
    body: any,
    signature: string
  ) {
    const event = body.event;
    if (event === "payment.captured") {
      const payment = body.payload.payment.entity;

      const dbPayment = await prisma.payment.findFirst({
        where: { razorpayOrderId: payment.order_id },
        include: { booking: {
          include: {
            seat: true
          }
        } }
      });

      if (!dbPayment || dbPayment.status === "COMPLETED") return;

      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: dbPayment.id },
          data: {
            status: "COMPLETED",
            razorpayPaymentId: payment.id,
            razorpaySignature: signature,
          },
        });

        const updated = await tx.booking.updateMany({
          where: {
            id: dbPayment.bookingId,
            state: "PAYMENT_PENDING",
          },
          data: { state: "CONFIRMED" },
        });
        
        if (updated.count !== 1) {
            throw new Error("Booking update failed or already updated");
        }

        await releaseLock(
          dbPayment.booking.slotId,
          dbPayment.booking.seatId,
          dbPayment.booking.lockValue as string
        );
      });

      await redisPub.publish(
        `booking:${dbPayment.bookingId}`,
        JSON.stringify({
          userId: dbPayment.userId,
          bookingId: dbPayment.bookingId,
          state: "CONFIRMED",
          slotId: dbPayment.booking.slotId,
          amount: dbPayment.amount,
          seatNumber: dbPayment.booking.seat.seatNumber
        })
      );

      return true;
    }
    if (event === "payment.failed") {
      const payment = body.payload.payment.entity;
      const dbPayment = await prisma.payment.findFirst({
        where: { razorpayOrderId: payment.order_id },
        include: { booking: {
          include: {
            seat: true
          }
        } }
      });

      if (!dbPayment || dbPayment.status === "COMPLETED") return;

      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: dbPayment.id },
          data: { status: "FAILED" }
        });

        await tx.booking.update({
          where: {
            id: dbPayment.bookingId
          },
          data: {
            state: "FAILED"
          }
        });

        await releaseLock(
          dbPayment.booking.slotId,
          dbPayment.booking.seatId,
          dbPayment.booking.lockValue as string
        );
      });

      await redisPub.publish(
        `booking:${dbPayment.bookingId}`,
        JSON.stringify({
          userId: dbPayment.userId,
          bookingId: dbPayment.bookingId,
          state: "FAILED",
          slotId: dbPayment.booking.slotId,
          amount: dbPayment.amount,
          seatNumber: dbPayment.booking.seat.seatNumber
        })
      );

      return false;
    }
  }
}
