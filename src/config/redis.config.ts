import { Redis } from "ioredis";

const redisHost = process.env.REDIS_HOST
const redisPort = Number(process.env.REDIS_PORT)

export const redisConnection = new Redis({
    host: redisHost,
    port: redisPort
});

export const redisPub = new Redis({
    host: redisHost,
    port: redisPort
});

export const redisSub = new Redis({
    host: redisHost,
    port: redisPort
});

