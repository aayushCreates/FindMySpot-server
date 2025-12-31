import { FastifyInstance } from "fastify";
import { register, login, logout } from "../controllers/auth.controller";


export default function authRouter(fastify: FastifyInstance) {
    fastify.post('/login', login);
    fastify.post('/register', register);
    fastify.post('logout', logout);
} 



