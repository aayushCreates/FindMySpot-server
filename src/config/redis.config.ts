import { Redis } from "ioredis";

const redisHost = process.env.REDIS_HOST
const redisPort = Number(process.env.REDIS_PORT)

export const redisConnection = new Redis({
    host: redisHost,
    port: redisPort
});



