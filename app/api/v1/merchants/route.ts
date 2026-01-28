import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { apiResponse } from "@/lib/auth";

// GET /api/v1/merchants - Public merchant listing
export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "12");
        const search = searchParams.get("search") || "";
        const category = searchParams.get("category") || "";

        const query: Record<string, any> = {
            role: "MERCHANT",
            is_active: true,
            "merchant_profile.shop_name": { $exists: true },
        };

        if (search) {
            query.$or = [
                { "merchant_profile.shop_name": { $regex: search, $options: "i" } },
                { "merchant_profile.address": { $regex: search, $options: "i" } },
            ];
        }

        if (category) {
            query["merchant_profile.categories"] = category;
        }

        const total = await User.countDocuments(query);
        const merchants = await User.find(query)
            .select("full_name avatar merchant_profile created_at")
            .sort({ "merchant_profile.rating": -1, created_at: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        return apiResponse.success({
            merchants,
            pagination: {
                total,
                page,
                limit,
                total_pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Get merchants error:", error);
        return apiResponse.serverError("Failed to get merchants");
    }
}
