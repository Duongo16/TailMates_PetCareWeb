import connectDB from "@/lib/db";
import Package from "@/models/Package";
import { IUser } from "@/models/User";

// ==================== Types ====================
type FeatureKey =
  | "pawmate_connect"
  | "blog_posting"
  | "ai_personality"
  | "ai_recommendations"
  | "priority_support"
  | "unlimited_products"
  | "qr_scanning"
  | "advanced_analytics";

type QuantityKey = "max_pets" | "ai_limit_per_day";

interface AccessResult {
  allowed: boolean;
  reason?: string;
}

// ==================== Helpers ====================

/**
 * Check if user's subscription is currently active (not expired)
 */
function isSubscriptionActive(user: IUser): boolean {
  const sub = user.subscription;
  if (!sub?.package_id || !sub?.expired_at) return false;
  return new Date(sub.expired_at) > new Date();
}

/**
 * Load the Package document from user's active subscription
 */
async function loadUserPackage(user: IUser) {
  const sub = user.subscription;
  if (!sub?.package_id) return null;

  await connectDB();
  const pkg = await Package.findById(sub.package_id).lean();
  return pkg;
}

// ==================== Main Functions ====================

/**
 * Check if user has access to a boolean feature based on their subscription package.
 *
 * @param user - The authenticated user document (with subscription populated)
 * @param featureKey - The feature key to check in features_config
 * @returns { allowed, reason? }
 *
 * Usage in API route:
 * ```
 * const check = await checkFeatureAccess(user, "blog_posting");
 * if (!check.allowed) return apiResponse.forbidden(check.reason);
 * ```
 */
export async function checkFeatureAccess(
  user: IUser,
  featureKey: FeatureKey
): Promise<AccessResult> {
  // Check if subscription exists and is active
  if (!isSubscriptionActive(user)) {
    return {
      allowed: false,
      reason:
        "Bạn cần đăng ký gói dịch vụ để sử dụng tính năng này. Vui lòng nâng cấp tài khoản.",
    };
  }

  // Load the package to get features_config
  const pkg = await loadUserPackage(user);
  if (!pkg) {
    return {
      allowed: false,
      reason: "Không tìm thấy gói đăng ký. Vui lòng liên hệ hỗ trợ.",
    };
  }

  // Check if feature is enabled in this package
  const featuresConfig = pkg.features_config as any;
  if (!featuresConfig || featuresConfig[featureKey] !== true) {
    return {
      allowed: false,
      reason: `Gói "${pkg.name}" của bạn không bao gồm tính năng này. Vui lòng nâng cấp gói để sử dụng.`,
    };
  }

  return { allowed: true };
}

/**
 * Check if user can add more items based on a quantity limit in their subscription.
 *
 * @param user - The authenticated user document
 * @param limitKey - The quantity key in features_config (e.g., "max_pets")
 * @param currentCount - Current count of items the user already has
 * @returns { allowed, reason? }
 *
 * Usage in API route:
 * ```
 * const petCount = await Pet.countDocuments({ owner_id: user._id });
 * const check = await checkQuantityLimit(user, "max_pets", petCount);
 * if (!check.allowed) return apiResponse.forbidden(check.reason);
 * ```
 */
export async function checkQuantityLimit(
  user: IUser,
  limitKey: QuantityKey,
  currentCount: number
): Promise<AccessResult> {
  // Check if subscription exists and is active
  if (!isSubscriptionActive(user)) {
    return {
      allowed: false,
      reason:
        "Bạn cần đăng ký gói dịch vụ để sử dụng tính năng này. Vui lòng nâng cấp tài khoản.",
    };
  }

  // Load the package to get features_config
  const pkg = await loadUserPackage(user);
  if (!pkg) {
    return {
      allowed: false,
      reason: "Không tìm thấy gói đăng ký. Vui lòng liên hệ hỗ trợ.",
    };
  }

  const featuresConfig = pkg.features_config as any;
  const maxAllowed = featuresConfig?.[limitKey] ?? 0;

  if (currentCount >= maxAllowed) {
    const labelMap: Record<QuantityKey, string> = {
      max_pets: "thú cưng",
      ai_limit_per_day: "lượt AI",
    };
    const label = labelMap[limitKey] || limitKey;

    return {
      allowed: false,
      reason: `Gói "${pkg.name}" cho phép tối đa ${maxAllowed} ${label}. Bạn đã đạt giới hạn. Vui lòng nâng cấp gói để thêm.`,
    };
  }

  return { allowed: true };
}
