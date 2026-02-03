import { getRedisClient, REDIS_KEYS, REDIS_TTL } from "./redis";

/**
 * OTP Service - Handles OTP generation, storage, and verification
 */

const MAX_OTP_ATTEMPTS = 5; // Maximum wrong OTP attempts per hour

/**
 * Generate a random 6-digit OTP
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Check if user can request a new OTP (rate limiting)
 * Returns: { allowed: boolean, waitSeconds: number }
 */
export async function checkOTPRateLimit(
  email: string
): Promise<{ allowed: boolean; waitSeconds: number }> {
  const redis = getRedisClient();
  const key = REDIS_KEYS.OTP_RATE_LIMIT(email);

  const ttl = await redis.ttl(key);

  if (ttl > 0) {
    return { allowed: false, waitSeconds: ttl };
  }

  return { allowed: true, waitSeconds: 0 };
}

/**
 * Store OTP in Redis with rate limiting
 */
export async function storeOTP(email: string, otp: string): Promise<void> {
  const redis = getRedisClient();
  
  // Store OTP with 5-minute TTL
  await redis.setex(REDIS_KEYS.OTP(email), REDIS_TTL.OTP, otp);
  
  // Set rate limit key (60 seconds cooldown)
  await redis.setex(REDIS_KEYS.OTP_RATE_LIMIT(email), REDIS_TTL.OTP_RATE_LIMIT, "1");
}

/**
 * Verify OTP and delete if correct
 * Returns: { valid: boolean, error?: string }
 */
export async function verifyOTP(
  email: string,
  inputOtp: string
): Promise<{ valid: boolean; error?: string }> {
  const redis = getRedisClient();
  
  // Check attempt count first
  const attemptsKey = REDIS_KEYS.OTP_ATTEMPTS(email);
  const attempts = parseInt((await redis.get(attemptsKey)) || "0", 10);
  
  if (attempts >= MAX_OTP_ATTEMPTS) {
    return { valid: false, error: "Too many failed attempts. Please request a new OTP." };
  }

  // Get stored OTP
  const otpKey = REDIS_KEYS.OTP(email);
  const storedOtp = await redis.get(otpKey);

  if (!storedOtp) {
    return { valid: false, error: "OTP expired or not found. Please request a new one." };
  }

  if (storedOtp !== inputOtp) {
    // Increment failed attempts
    await redis.incr(attemptsKey);
    await redis.expire(attemptsKey, REDIS_TTL.OTP_ATTEMPTS);
    
    const remainingAttempts = MAX_OTP_ATTEMPTS - attempts - 1;
    return { 
      valid: false, 
      error: `Invalid OTP. ${remainingAttempts} attempts remaining.` 
    };
  }

  // OTP is valid - clean up
  await redis.del(otpKey);
  await redis.del(attemptsKey);
  await redis.del(REDIS_KEYS.OTP_RATE_LIMIT(email));

  return { valid: true };
}

/**
 * Store pending registration data in Redis
 */
export async function storePendingRegistration(
  email: string,
  data: {
    full_name: string;
    password_hash: string;
    role: string;
    phone_number?: string;
    shop_name?: string;
    address?: string;
  }
): Promise<void> {
  const redis = getRedisClient();
  const key = REDIS_KEYS.PENDING_REGISTRATION(email);
  
  await redis.setex(key, REDIS_TTL.PENDING_REGISTRATION, JSON.stringify(data));
}

/**
 * Get pending registration data from Redis
 */
export async function getPendingRegistration(
  email: string
): Promise<{
  full_name: string;
  password_hash: string;
  role: string;
  phone_number?: string;
  shop_name?: string;
  address?: string;
} | null> {
  const redis = getRedisClient();
  const key = REDIS_KEYS.PENDING_REGISTRATION(email);
  
  const data = await redis.get(key);
  if (!data) return null;
  
  return JSON.parse(data);
}

/**
 * Delete pending registration data
 */
export async function deletePendingRegistration(email: string): Promise<void> {
  const redis = getRedisClient();
  await redis.del(REDIS_KEYS.PENDING_REGISTRATION(email));
}

/**
 * Clear all OTP-related data for an email
 */
export async function clearOTPData(email: string): Promise<void> {
  const redis = getRedisClient();
  
  await redis.del(REDIS_KEYS.OTP(email));
  await redis.del(REDIS_KEYS.OTP_RATE_LIMIT(email));
  await redis.del(REDIS_KEYS.OTP_ATTEMPTS(email));
}
