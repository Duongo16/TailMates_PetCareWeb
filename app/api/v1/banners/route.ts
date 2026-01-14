import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import { Banner, BannerLocation, UserRole } from "@/models";
import { authenticate, authorize, apiResponse } from "@/lib/auth";

// GET /api/v1/banners - Public: Get active banners by location
export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);
        const location = searchParams.get("location")?.toUpperCase() || "ALL";

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
            .select("-createdBy -__v");

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

        return apiResponse.created({ banner }, "Banner created successfully");
    } catch (error) {
        console.error("Create banner error:", error);
        return apiResponse.serverError("Failed to create banner");
    }
}
