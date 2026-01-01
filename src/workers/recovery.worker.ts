import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

setInterval(async () => {
    await prisma.booking.updateMany({
      where: {
        state: "PAYMENT_PENDING",
        updatedAt: {
          lt: new Date(Date.now() - 5 * 60 * 1000)
        }
      },
      data: {
        state: "EXPIRED"
      }
    });
  }, 50000);