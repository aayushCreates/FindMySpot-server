import { Worker } from "bullmq";
import { BookingState, PrismaClient } from "@prisma/client";
import { acquireLock, releaseLock } from "../utils/locking.utils";

const prisma = new PrismaClient();

export const queueWoker = new Worker("PROCESS_BOOKING", async (job) => {
    const { bookingId, slotId } = job.data;
  
    let lockValue: string | null = null;
  
    try {
      await prisma.booking.update({
        where: { id: bookingId },
        data: { state: "QUEUED" }
      });
  
      lockValue = await acquireLock(slotId);
      if (!lockValue) throw new Error("LOCK_BUSY");
  
      await prisma.booking.update({
        where: { id: bookingId },
        data: { state: "ADMITTED" }
      });
  
      const count = await prisma.booking.count({
        where: {
          slotId,
          state: {
            in: ["LOCKED", "PAYMENT_PENDING", "CONFIRMED"]
          }
        }
      });
  
      const slot = await prisma.slot.findUnique({ where: { id: slotId } });
  
      if (!slot || count >= slot.totalSeats) {
        throw new Error("SLOT_FULL");
      }
  
      await prisma.booking.update({
        where: { id: bookingId },
        data: { state: "LOCKED" }
      });
  
      await prisma.booking.update({
        where: { id: bookingId },
        data: { state: "PAYMENT_PENDING" }
      });
  
    } catch (err) {
      await prisma.booking.update({
        where: { id: bookingId },
        data: { state: "FAILED" }
      });
    } finally {
      if (lockValue) {
        await releaseLock(slotId, lockValue);
      }
    }
  });
  