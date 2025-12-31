import { FastifyReply, FastifyRequest } from "fastify";
import { Slot } from "../services/slot.service";

export const getAllSlots = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
        const slots = await Slot.getAllSlots();
        if (!slots || slots.length === 0) {
            return reply.status(404).send({
                success: false,
                message: "Slots not found"
            });
        }

        return reply.status(200).send({
            success: true,
            message: "Slots found successfully",
            data: slots
        });
    } catch (err) {
        console.log("Error in getting all slots", err);
        return reply.status(500).send({
            success: false,
            message: "Server error in getting all slots"
        });
    }
}

export const getSlot = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
        const { id } = req.params as any;
        const slot = await Slot.getSlot(id);

        if (!slot) {
            return reply.status(404).send({
                success: false,
                message: "Slot not found"
            });
        }

        return reply.status(200).send({
            success: true,
            message: "Slot found successfully",
            data: slot
        });

    } catch (err) {
        console.log("Error in getting slot", err);
        return reply.status(500).send({
            success: false,
            message: "Server error in getting slot"
        });
    }
}

export const addSlot = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
        const { totalSeats } = req.body as any;
        
        if (totalSeats === 0 || totalSeats < 0) {
            return reply.status(400).send({
                success: false,
                message: "Valid totalSeats is required"
            });
        }

        const slot = await Slot.addSlot({ totalSeats });

        return reply.status(201).send({
            success: true,
            message: "Slot added successfully",
            data: slot
        });

    } catch (err) {
        console.log("Error in adding slot", err);
        return reply.status(500).send({
            success: false,
            message: "Server error in adding slot"
        });
    }
}

export const updateSlot = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
        const { id } = req.params as any;
        const { totalSeats } = req.body as any;

        if (totalSeats === 0 || totalSeats < 0) {
            return reply.status(400).send({
                success: false,
                message: "Valid totalSeats is required"
            });
        }

        try {
            const slot = await Slot.updateSlot(id, { totalSeats });
            return reply.status(200).send({
                success: true,
                message: "Slot updated successfully",
                data: slot
            });
        } catch (err: any) {
            if (err.code === 'P2025') {
                return reply.status(404).send({
                    success: false,
                    message: "Slot not found"
                });
            }
            throw err;
        }

    } catch (err) {
        console.log("Error in updating slot", err);
        return reply.status(500).send({
            success: false,
            message: "Server error in updating slot"
        });
    }
}

export const deleteSlot = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
        const { id } = req.params as any;

        try {
            await Slot.deleteSlot(id);
            return reply.status(200).send({
                success: true,
                message: "Slot deleted successfully"
            });
        } catch (err: any) {
            if (err.code === 'P2025') {
                return reply.status(404).send({
                    success: false,
                    message: "Slot not found"
                });
            }
            throw err;
        }

    } catch (err) {
        console.log("Error in deleting slot", err);
        return reply.status(500).send({
            success: false,
            message: "Server error in deleting slot"
        });
    }
}