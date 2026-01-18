import { NextRequest } from "next/server";
import { revalidateTag } from "next/cache";
import connectDB from "@/lib/db";
import { Banner, UserRole } from "@/models";
import { authenticate, authorize, apiResponse } from "@/lib/auth";
import { deleteFromCloudinary } from "@/lib/cloudinary";

interface RouteParams {
    params: Promise<{ id: string }>;
}

// PUT /api/v1/banners/[id] - Manager: Update banner
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        // Authenticate
        const { user, error: authError } = await authenticate(request);
        if (authError) return authError;
        if (!user) return apiResponse.unauthorized();

        // Authorize - Only MANAGER can update banners
        const roleError = authorize(user, [UserRole.MANAGER, UserRole.ADMIN]);
        if (roleError) return roleError;

        await connectDB();

        const { id } = await params;
        const body = await request.json();
        const { image, targetUrl, priority, displayLocation, title, isActive } = body;

        const banner = await Banner.findById(id);
        if (!banner) {
            return apiResponse.notFound("Banner not found");
        }

        // Update fields - delete old image from Cloudinary if new image provided
        if (image?.url && image?.public_id) {
            if (banner.image?.public_id && image.public_id !== banner.image.public_id) {
                await deleteFromCloudinary(banner.image.public_id);
            }
            banner.image = image;
        }
        if (targetUrl !== undefined) banner.targetUrl = targetUrl;
        if (priority !== undefined) banner.priority = priority;
        if (displayLocation) banner.displayLocation = displayLocation;
        if (title !== undefined) banner.title = title;
        if (isActive !== undefined) banner.isActive = isActive;

        await banner.save();

        // Invalidate banners cache so users see updated banner immediately
        revalidateTag("banners", "page");

        return apiResponse.success({ banner }, "Banner updated successfully");
    } catch (error) {
        console.error("Update banner error:", error);
        return apiResponse.serverError("Failed to update banner");
    }
}

// DELETE /api/v1/banners/[id] - Manager: Delete banner
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        // Authenticate
        const { user, error: authError } = await authenticate(request);
        if (authError) return authError;
        if (!user) return apiResponse.unauthorized();

        // Authorize - Only MANAGER can delete banners
        const roleError = authorize(user, [UserRole.MANAGER, UserRole.ADMIN]);
        if (roleError) return roleError;

        await connectDB();

        const { id } = await params;
        const banner = await Banner.findById(id);

        if (!banner) {
            return apiResponse.notFound("Banner not found");
        }

        // Delete banner image from Cloudinary
        if (banner.image?.public_id) {
            await deleteFromCloudinary(banner.image.public_id);
        }

        await Banner.findByIdAndDelete(id);

        // Invalidate banners cache so users no longer see deleted banner
        revalidateTag("banners", "page");

        return apiResponse.success(null, "Banner deleted successfully");
    } catch (error) {
        console.error("Delete banner error:", error);
        return apiResponse.serverError("Failed to delete banner");
    }
}
