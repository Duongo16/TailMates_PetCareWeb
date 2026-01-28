import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { authenticate, apiResponse } from "@/lib/auth";
import { deleteFromCloudinary } from "@/lib/cloudinary";

// GET /api/v1/users/me - Get current user profile
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await authenticate(request);
    if (error) return error;

    return apiResponse.success({
      id: user!._id,
      email: user!.email,
      full_name: user!.full_name,
      phone_number: user!.phone_number,
      role: user!.role,
      avatar: user!.avatar,
      subscription: user!.subscription,
      merchant_profile: user!.merchant_profile,
      is_active: user!.is_active,
      created_at: user!.created_at,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    return apiResponse.serverError("Failed to get profile");
  }
}

// PUT /api/v1/users/me - Update current user profile
export async function PUT(request: NextRequest) {
  try {
    const { user, error } = await authenticate(request);
    if (error) return error;

    await connectDB();

    const body = await request.json();
    const { full_name, phone_number, avatar, current_password, new_password } =
      body;

    // Build update object
    const updateData: Record<string, unknown> = {};

    if (full_name) updateData.full_name = full_name;
    if (phone_number) updateData.phone_number = phone_number;

    // Handle avatar update - delete old avatar from Cloudinary
    if (avatar !== undefined) {
      if (avatar === null) {
        if (user!.avatar?.public_id) {
          await deleteFromCloudinary(user!.avatar.public_id);
        }
        updateData.avatar = null;
      } else if (typeof avatar === 'object' && avatar.url && avatar.public_id) {
        const oldAvatarPublicId = user!.avatar?.public_id;
        if (oldAvatarPublicId && avatar.public_id !== oldAvatarPublicId) {
          await deleteFromCloudinary(oldAvatarPublicId);
        }
        updateData.avatar = {
          url: avatar.url,
          public_id: avatar.public_id
        };
      } else {
        console.error('Invalid avatar format:', avatar);
      }
    }

    // Update merchant profile if applicable
    if (user!.role === "MERCHANT" && body.merchant_profile) {
      const mp = body.merchant_profile;
      updateData.merchant_profile = {
        shop_name: mp.shop_name || user!.merchant_profile?.shop_name,
        address: mp.address || user!.merchant_profile?.address,
        description: mp.description || user!.merchant_profile?.description,
        rating: user!.merchant_profile?.rating || 0,
        revenue_stats: user!.merchant_profile?.revenue_stats || 0,
        website: mp.website || user!.merchant_profile?.website,
        banners: mp.banners || user!.merchant_profile?.banners,
        categories: mp.categories || user!.merchant_profile?.categories,
        working_hours: mp.working_hours || user!.merchant_profile?.working_hours,
        social_links: mp.social_links || user!.merchant_profile?.social_links,
      };
    }

    // Password change
    if (current_password && new_password) {
      // Need to fetch user with password
      const userWithPassword = await User.findById(user!._id);
      if (!userWithPassword) {
        return apiResponse.notFound("User not found");
      }

      const isValidPassword = await bcrypt.compare(
        current_password,
        userWithPassword.password
      );
      if (!isValidPassword) {
        return apiResponse.error("Current password is incorrect");
      }

      if (new_password.length < 6) {
        return apiResponse.error(
          "New password must be at least 6 characters"
        );
      }

      updateData.password = await bcrypt.hash(new_password, 10);
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      user!._id,
      { $set: updateData },
      { new: true }
    ).select("-password");

    return apiResponse.success(
      {
        id: updatedUser!._id,
        email: updatedUser!.email,
        full_name: updatedUser!.full_name,
        phone_number: updatedUser!.phone_number,
        role: updatedUser!.role,
        avatar: updatedUser!.avatar,
        subscription: updatedUser!.subscription,
        merchant_profile: updatedUser!.merchant_profile,
      },
      "Profile updated successfully"
    );
  } catch (error) {
    console.error("Update profile error:", error);
    return apiResponse.serverError("Failed to update profile");
  }
}
