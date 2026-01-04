import { Worker } from "bullmq";
import { PrismaClient } from "@prisma/client";
import { acquireLock, releaseLock } from "../utils/locking.utils";
import { redisConnection, redisPub } from "../config/redis.config";

const prisma = new PrismaClient();

export const queueWorker = new Worker(
  "PROCESS_BOOKING",
  async (job) => {
    const { bookingId, userId, slotId } = job.data;

    try {
      await prisma.booking.update({
        where: { id: bookingId, state: "INIT" },
        data: { state: "QUEUED" },
      });
      await redisPub.publish(
        `booking:${bookingId}`,
        JSON.stringify({
          userId: userId,
          bookingId: bookingId,
          state: "QUEUED",
          slotId: slotId,
        })
      );

      await prisma.booking.update({
        where: { id: bookingId },
        data: { state: "ADMITTED" },
      });

      await redisPub.publish(
        `booking:${bookingId}`,
        JSON.stringify({
          userId: userId,
          bookingId: bookingId,
          state: "ADMITTED",
          slotId: slotId,
        })
      );

      const seats = await prisma.seat.findMany({
        where: { slotId },
        orderBy: { seatNumber: "asc" },
      });
      if(!seats || seats.length === 0) {
        throw new Error("Seats are not found")
      }

      let allocatedSeat = null;
      let lockValue = null;
      for (const seat of seats) {
        const lock = await acquireLock(slotId, seat.id, bookingId);
        if (lock) {
          allocatedSeat = seat;
          lockValue = lock;
          break;
        }
      }

      if (!lockValue) throw new Error("LOCK_BUSY");

      const updated = await prisma.booking.updateMany({
        where: {
          id: bookingId,
          state: "ADMITTED",
        },
        data: {
          state: "LOCKED",
          seatId: allocatedSeat.id,
          lockValue
        },
      });
      
      if (updated.count !== 1) {
        await releaseLock(slotId, allocatedSeat.id, lockValue);
        return;
      }

      await redisPub.publish(
        `booking:${bookingId}`,
        JSON.stringify({
          bookingId,
          state: "LOCKED",
          seatNumber: allocatedSeat.seatNumber,
          slotId,
        })
      );
    } catch (err) {
      await prisma.booking.update({
        where: { id: bookingId },
        data: { state: "FAILED" },
      });
    } finally {
      if (lockValue) {
        await releaseLock(slotId, allocatedSeat.id, lockValue);
      }
    }
  },
  {
    connection: redisConnection,
  }
);
