import { Queue } from "bullmq"
import { redisConnection } from "../config/redis.config"


const bookingQueue = new Queue('PROCESS_BOOKING', {
    connection: redisConnection
});

export default bookingQueue;

