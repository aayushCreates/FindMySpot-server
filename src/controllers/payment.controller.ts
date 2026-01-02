import { FastifyReply, FastifyRequest } from "fastify";
import { Payment } from "../services/payment.service";
import { verifySignature } from "../utils/razorpay.utils";

export const createPayment = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const user = req.user;
    const { slotId, amount, method, bookingId } = req.body as any;
    if (!slotId || !amount || !method || !bookingId) {
      return reply.status(400).send({
        success: false,
        message: "Required fields are missing",
      });
    }

    const newPayment = await Payment.createPayment(bookingId, slotId, amount);

    reply.status(200).send({
      success: true,
      message: "Payment initiated",
      data: newPayment,
    });
  } catch (err) {
    console.log("Error in creating payment for slot", err);
    reply.status(500).send({ success: false, message: "Internal Server Error" });
  }
};

export const verifyPayment = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const signature = req.headers["x-razorpay-signature"] as string;
    const body = req.body as any;

    if (!signature) {
        return reply.status(400).send({ success: false, message: "Missing signature" });
    }

    const isValidSignature = verifySignature(body, signature);
    if (!isValidSignature) {
      throw new Error("Invalid signature");
    }

    await Payment.verifyPayment(body, signature);

    reply.status(200).send({
        success: true,
        message: "Payment verified successfully"
    });
  } catch (err) {
    console.log("Error in verifying payment", err);
    reply.status(500).send({ success: false, message: "Internal Server Error" });
  }
};

export const slotPayments = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const { slotId } = req.params as any;
    const payments = await Payment.getSlotPayments(slotId);
    reply.status(200).send({
        success: true,
        data: payments
    });
  } catch (err) {
    console.log("Error in getting slot payments", err);
    reply.status(500).send({ success: false, message: "Internal Server Error" });
  }
};

export const userPayment = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = req.user;
    const payments = await Payment.getUserPayment(user.id);
    reply.status(200).send({
        success: true,
        data: payments
    });
  } catch (err) {
    console.log("Error in getting slot payment of user", err);
    reply.status(500).send({ success: false, message: "Internal Server Error" });
  }
};
