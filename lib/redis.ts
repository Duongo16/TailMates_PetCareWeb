import Redis from "ioredis";

// Redis client singleton
const globalForRedis = global as unknown as { 
  redisClient: any;
  mockRedisStore: Map<string, { value: string; expires: number }>;
};

if (!globalForRedis.mockRedisStore) {
  globalForRedis.mockRedisStore = new Map();
}

/**
 * In-memory Mock Redis for development when real Redis is not available
 */
class MockRedis {
  private get store() {
    return globalForRedis.mockRedisStore;
  }

  async get(key: string): Promise<string | null> {
    const item = this.store.get(key);
    if (!item) return null;
    if (Date.now() > item.expires) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  async setex(key: string, seconds: number, value: string): Promise<string> {
    this.store.set(key, { value, expires: Date.now() + seconds * 1000 });
    return "OK";
  }

  async del(key: string): Promise<number> {
    return this.store.delete(key) ? 1 : 0;
  }

  async ttl(key: string): Promise<number> {
    const item = this.store.get(key);
    if (!item) return -2;
    const remaining = Math.floor((item.expires - Date.now()) / 1000);
    return remaining > 0 ? remaining : -2;
  }

  async incr(key: string): Promise<number> {
    const val = await this.get(key);
    const newVal = (parseInt(val || "0", 10) + 1).toString();
    const ttl = await this.ttl(key);
    await this.setex(key, ttl > 0 ? ttl : 3600, newVal);
    return parseInt(newVal, 10);
  }

  async expire(key: string, seconds: number): Promise<number> {
    const item = this.store.get(key);
    if (!item) return 0;
    item.expires = Date.now() + seconds * 1000;
    return 1;
  }

  on(event: string, handler: any) {
    // Mock on for basic events
    return this;
  }
}

/**
 * Get Redis client singleton
 */
export function getRedisClient(): Redis | MockRedis {
    if (!globalForRedis.redisClient) {
    const redisUrl = process.env.REDIS_URL;
    
    if (!redisUrl || redisUrl.includes("localhost") || redisUrl.includes("127.0.0.1")) {
      // Check if we should use fallback
      console.log("Using Mock Redis (In-memory) for development");
      return (globalForRedis.redisClient = new MockRedis() as any);
    }

    try {
      globalForRedis.redisClient = new Redis(redisUrl, {
        maxRetriesPerRequest: 1, // Fail fast in dev if connection is broken
        lazyConnect: true,
        connectTimeout: 5000,
      });

      globalForRedis.redisClient.on("error", (error: any) => {
        console.warn("Redis connection error, falling back to Mock Redis:", error.message);
        // Force fallback if error occurs
        globalForRedis.redisClient = new MockRedis() as any;
      });

      globalForRedis.redisClient.on("connect", () => {
        console.log("Redis connected successfully");
      });
    } catch (err) {
      console.warn("Failed to initialize Redis, using Mock Redis fallback");
      globalForRedis.redisClient = new MockRedis() as any;
    }
  }

  return globalForRedis.redisClient;
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
  if (globalForRedis.redisClient) {
    await globalForRedis.redisClient.quit();
    globalForRedis.redisClient = null;
  }
}
