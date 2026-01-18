import { NextRequest } from "next/server";
import { unstable_cache, revalidateTag } from "next/cache";
import connectDB from "@/lib/db";
import { Banner, BannerLocation, UserRole } from "@/models";
import { authenticate, authorize, apiResponse } from "@/lib/auth";

// Cache duration: 1 hour
export const revalidate = 3600;

// Cached banner fetching function
const getCachedBanners = unstable_cache(
    async (location: string) => {
        await connectDB();

        // Build query - get active banners for the specified location or ALL
        const query: Record<string, unknown> = { isActive: true };

        if (location !== "ALL") {
            query.$or = [
                { displayLocation: location },
                { displayLocation: BannerLocation.ALL }
            ];
        }

        const banners = await Banner.find(query)
            .sort({ priority: 1, created_at: -1 })
            .select("-createdBy -__v")
            .lean(); // Use lean() for better performance

        return banners;
    },
    ["banners"], // Cache key prefix
    { revalidate: 3600, tags: ["banners"] } // 1 hour cache with tag for invalidation
);

// GET /api/v1/banners - Public: Get active banners by location (CACHED)
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const location = searchParams.get("location")?.toUpperCase() || "ALL";

        const banners = await getCachedBanners(location);

        return apiResponse.success({ banners });
    } catch (error) {
        console.error("Get banners error:", error);
        return apiResponse.serverError("Failed to get banners");
    }
}

// POST /api/v1/banners - Manager: Create new banner
export async function POST(request: NextRequest) {
    try {
        // Authenticate
        const { user, error: authError } = await authenticate(request);
        if (authError) return authError;
        if (!user) return apiResponse.unauthorized();

        // Authorize - Only MANAGER can create banners
        const roleError = authorize(user, [UserRole.MANAGER, UserRole.ADMIN]);
        if (roleError) return roleError;

        await connectDB();

        const body = await request.json();
        const { image, targetUrl, priority, displayLocation, title, isActive } = body;

        // Validate required fields
        if (!image?.url || !image?.public_id) {
            return apiResponse.error("Banner image is required");
        }

        const banner = await Banner.create({
            image,
            targetUrl,
            priority: priority || 0,
            displayLocation: displayLocation || BannerLocation.ALL,
            title,
            isActive: isActive !== undefined ? isActive : true,
            createdBy: user._id,
        });

        // Invalidate banners cache so users see new banner immediately
        revalidateTag("banners", "page");

        return apiResponse.created({ banner }, "Banner created successfully");
    } catch (error) {
        console.error("Create banner error:", error);
        return apiResponse.serverError("Failed to create banner");
    }
}
