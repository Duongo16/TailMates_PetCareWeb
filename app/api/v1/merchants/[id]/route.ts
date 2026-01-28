import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Service from "@/models/Service";
import { apiResponse } from "@/lib/auth";

// GET /api/v1/merchants/[id] - Get merchant detail
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();

        const { id } = await params;

        const merchant = await User.findOne({
            _id: id,
            role: "MERCHANT",
            is_active: true,
        }).select("-password");

        if (!merchant) {
            return apiResponse.notFound("Merchant not found");
        }

        // Fetch merchant's services
        const services = await Service.find({
            merchant_id: id,
            is_active: true,
        }).sort({ created_at: -1 });

        return apiResponse.success({
            merchant,
            services,
        });
    } catch (error) {
        console.error("Get merchant detail error:", error);
        return apiResponse.serverError("Failed to get merchant detail");
    }
}
