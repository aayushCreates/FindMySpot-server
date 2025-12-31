import { FastifyReply, FastifyRequest } from "fastify";
import { AuthService } from "../services/auth.service";

export const register = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { name, email, phone, password } = req.body as any;
    if (!name || !email || !phone || !password) {
      return reply.status(400).send({ success: false, message: "Missing required fields" });
    }

    const { user, token } = await AuthService.registerUser({ name, email, phone, password });

    reply.status(201).send({
      success: true,
      message: "User registered successfully",
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone
      },
      token
    });
  } catch (err: any) {
    console.error("Register error:", err.message);
    return reply.status(500).send({ success: false, message: err.message || "Server error" });
  }
};

export const login = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { email, password } = req.body as any;
    if (!email || !password) {
      return reply.status(400).send({ success: false, message: "Missing required fields" });
    }

    const { user, token } = await AuthService.loginUser({ email, password });

    reply.status(200).send({
      success: true,
      message: "User logged in successfully",
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone
      },
      token
    });
  } catch (err: any) {
    console.error("Login error:", err.message);
    return reply.status(400).send({ success: false, message: err.message || "Invalid credentials" });
  }
};

export const logout = async (_req: FastifyRequest, reply: FastifyReply,) => {
  try {
    reply.status(200).send({ success: true, message: "User logged out successfully" });
  } catch (err: any) {
    console.error("Logout error:", err.message);
    return reply.status(500).send({ success: false, message: "Server error" });
  }
};