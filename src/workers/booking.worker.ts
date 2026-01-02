import { Worker } from "bullmq";
import { PrismaClient } from "@prisma/client";
import { acquireLock, releaseLock } from "../utils/locking.utils";
import { redisConnection } from "../config/redis.config";

const prisma = new PrismaClient();

export const queueWoker = new Worker(
  "PROCESS_BOOKING",
  async (job) => {
    const { bookingId, slotId, totalSeats } = job.data;

    let lockValue: string | null = null;

    try {
      await prisma.booking.update({
        where: { id: bookingId },
        data: { state: "QUEUED" },
      });

      lockValue = await acquireLock(slotId);
      if (!lockValue) throw new Error("LOCK_BUSY");

      await prisma.booking.update({
        where: { id: bookingId },
        data: { state: "ADMITTED" },
      });

      const count = await prisma.booking.count({
        where: {
          slotId,
          state: {
            in: ["LOCKED", "PAYMENT_PENDING", "CONFIRMED"],
          },
        },
      });

      if (count >= totalSeats) {
        throw new Error("SLOT_FULL");
      }

      await prisma.booking.update({
        where: { id: bookingId },
        data: { state: "LOCKED" },
      });
    } catch (err) {
      await prisma.booking.update({
        where: { id: bookingId },
        data: { state: "FAILED" },
      });
    } finally {
      if (lockValue) {
        await releaseLock(slotId, lockValue);
      }
    }
  },
  {
    connection: redisConnection,
  }
);
