import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { authenticate } from "@/lib/auth";
import User from "@/models/User";
import Pet from "@/models/Pet";
import Notification, { NotificationType } from "@/models/Notification";

/**
 * POST /api/v1/notifications/check-profile
 * Check for incomplete profile/pet data and create reminder notifications
 */
export async function POST(request: NextRequest) {
    try {
        const { user: authUser, error } = await authenticate(request);
        if (error || !authUser) {
            return (
                error ||
                NextResponse.json(
                    { success: false, message: "Unauthorized" },
                    { status: 401 }
                )
            );
        }

        await connectDB();

        const userId = authUser._id.toString();
        const notifications: {
            type: string;
            title: string;
            message: string;
            redirectUrl: string;
        }[] = [];

        // === Check User Profile Completeness ===
        const user = await User.findById(userId).lean();
        if (user) {
            const missingUserFields: string[] = [];
            if (!user.avatar?.url) missingUserFields.push("ảnh đại diện");
            if (!user.phone_number) missingUserFields.push("số điện thoại");

            if (missingUserFields.length > 0) {
                // Check if a similar notification already exists (within last 24 hours)
                const existingUserNotif = await Notification.findOne({
                    user_id: userId,
                    type: NotificationType.SYSTEM,
                    title: { $regex: /Cập nhật thông tin tài khoản/i },
                    created_at: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
                });

                if (!existingUserNotif) {
                    notifications.push({
                        type: "user",
                        title: "Cập nhật thông tin tài khoản",
                        message: `Hãy bổ sung ${missingUserFields.join(", ")} để hoàn thiện hồ sơ của bạn!`,
                        redirectUrl: "/dashboard/settings",
                    });
                }
            }
        }

        // === Check Pet Profile Completeness ===
        const pets = await Pet.find({ owner_id: userId }).lean();
        for (const pet of pets) {
            const missingPetFields: string[] = [];
            if (!pet.image?.url) missingPetFields.push("ảnh");
            if (!pet.breed) missingPetFields.push("giống");
            if (!pet.weight_kg) missingPetFields.push("cân nặng");
            if (!pet.color) missingPetFields.push("màu lông");

            if (missingPetFields.length > 0) {
                // Check if a similar notification already exists (within last 24 hours)
                const existingPetNotif = await Notification.findOne({
                    user_id: userId,
                    type: NotificationType.SYSTEM,
                    reference_id: pet._id,
                    created_at: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
                });

                if (!existingPetNotif) {
                    notifications.push({
                        type: "pet",
                        title: `Cập nhật thông tin ${pet.name}`,
                        message: `Bé ${pet.name} còn thiếu ${missingPetFields.join(", ")}. Hãy cập nhật để quản lý sức khỏe tốt hơn!`,
                        redirectUrl: "/dashboard/pets",
                    });
                    break; // Only 1 pet notification to avoid spam
                }
            }
        }

        // === Create Notifications ===
        const created = [];
        for (const notif of notifications) {
            const newNotification = await Notification.create({
                user_id: userId,
                type: NotificationType.SYSTEM,
                title: notif.title,
                message: notif.message,
                redirect_url: notif.redirectUrl,
                is_read: false,
            });
            created.push(newNotification);
        }

        return NextResponse.json({
            success: true,
            data: {
                notificationsCreated: created.length,
                notifications: created.map((n) => ({
                    title: n.title,
                    message: n.message,
                })),
            },
        });
    } catch (error) {
        console.error("Check profile notifications error:", error);
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 }
        );
    }
}
