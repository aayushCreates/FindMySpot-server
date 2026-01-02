import { PrismaClient } from "@prisma/client";
import razorpay from "../config/razorpay.config";

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
    amount: number
  ) {
    const slot = await prisma.slot.findUnique({
      where: {
        id: slotId,
      },
    });
    if (!slot) {
      throw new Error("Invalid slo");
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { user: true },
    });
    if (!booking || booking.state !== "LOCKED") {
      throw new Error("Invalid booking state");
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

    return {
      razorpayOrderId: newRazorPayOrder.id,
      amount: newRazorPayOrder.amount,
      currency: newRazorPayOrder.currency,
      key: process.env.RAZORPAY_KEY_ID,
      paymentId: newPayment.id,
    };
  }

  static async verifyPayment(body: any, signature: string) {
    const event = body.event;
    if (event === "payment.captured") {
      const payment = body.payload.payment.entity;

      await prisma.$transaction(async (tx) => {
        const dbPayment = await tx.payment.findFirst({
          where: { razorpayOrderId: payment.order_id },
        });
        if (!dbPayment) return;

        await tx.payment.update({
          where: { id: dbPayment.id },
          data: {
            status: "COMPLETED",
            razorpayPaymentId: payment.id,
            razorpaySignature: signature
          },
        });

        await tx.booking.update({
          where: { id: dbPayment.bookingId },
          data: { state: "CONFIRMED" },
        });
      });

      return true;
    }
  }
}
