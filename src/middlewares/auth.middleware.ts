import { validateToken } from "../utils/auth.utils";
import { PrismaClient } from "@prisma/client";
import { FastifyReply, FastifyRequest } from "fastify";

const prisma = new PrismaClient();

export const isUserLoggedIn = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];
    if (!token) {
      return reply.status(401).send({
        success: false,
        message: "Invalid Token, please login",
      });
    }

    const validToken = await validateToken(token);
    if (!validToken) {
      return reply.status(401).send({
        success: false,
        message: "Session Expired, please login",
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: validToken.email },
    });

    if (!user) {
      if (!user) {
        return reply.status(401).send({ success: false, message: "Unauthorized" });
      }
    }

    req.user = user;
  } catch (err) {
    console.error(err);
    return reply.status(401).send({ success: false, message: "Unauthorized" });
  }
};