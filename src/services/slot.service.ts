import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class Slot {
    static async getAllSlots() {
        return await prisma.slot.findMany({
            orderBy: {
                createdAt: 'desc'
            }
        });
    }

    static async getSlot(id: string) {
        return await prisma.slot.findUnique({
            where: { id }
        });
    }

    static async addSlot(data: { totalSeats: number }) {
        return await prisma.slot.create({
            data: {
                totalSeats: data.totalSeats
            }
        });
    }

    static async updateSlot(id: string, data: { totalSeats: number }) {
        return await prisma.slot.update({
            where: { id },
            data: {
                totalSeats: data.totalSeats
            }
        });
    }

    static async deleteSlot(id: string) {
        return await prisma.slot.delete({
            where: { id }
        });
    }
}