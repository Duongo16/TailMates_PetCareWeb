import Redis from "ioredis";

// Redis client singleton
let redisClient: Redis | null = null;

/**
 * Get Redis client singleton
 */
export function getRedisClient(): Redis {
  if (!redisClient) {
    const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
    
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    redisClient.on("error", (error) => {
      console.error("Redis connection error:", error);
    });

    redisClient.on("connect", () => {
      console.log("Redis connected successfully");
    });
  }

  return redisClient;
}

/**
 * Redis key prefixes for different purposes
 */
export const REDIS_KEYS = {
  OTP: (email: string) => `otp:${email.toLowerCase()}`,
  OTP_RATE_LIMIT: (email: string) => `otp_rate:${email.toLowerCase()}`,
  OTP_ATTEMPTS: (email: string) => `otp_attempts:${email.toLowerCase()}`,
  PENDING_REGISTRATION: (email: string) => `pending_reg:${email.toLowerCase()}`,
};

/**
 * Redis TTL values (in seconds)
 */
export const REDIS_TTL = {
  OTP: 5 * 60, // 5 minutes
  OTP_RATE_LIMIT: 60, // 60 seconds between OTP requests
  OTP_ATTEMPTS: 60 * 60, // 1 hour for max attempts tracking
  PENDING_REGISTRATION: 10 * 60, // 10 minutes for pending registration data
};

/**
 * Close Redis connection (for graceful shutdown)
 */
export async function closeRedisConnection(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}
