import { randomUUID } from "crypto";
import { redisConnection } from "../config/redis.config";

export const acquireLock = async (slotId: string, seatId: string, ttlSeconds = 300) => {
  const key = `lock:${slotId}:${seatId}`;
  const lockValue = randomUUID();

  const acquired = await redisConnection.set(
    key,
    lockValue,
    "NX",
    "EX",
    ttlSeconds
  );

  return acquired ? lockValue : null;
};

export const releaseLock = async (slotId: string, seatId: string, lockValue: string) => {
    const luaScript = `
    if redis.call("GET", KEYS[1]) == ARGV[1] then
        return redis.call("DEL", KEYS[1])
    else
      return 0
    end
    `

    await redisConnection.eval(luaScript, 1, `lock:${slotId}:${seatId}`, lockValue);

};