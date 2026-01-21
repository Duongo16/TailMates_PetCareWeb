import { NextRequest } from "next/server";
import { apiResponse } from "@/lib/auth";

// Blog categories based on reference
const BLOG_CATEGORIES = [
    "Hướng Dẫn Sử Dụng",
    "Kinh nghiệm nuôi Chó",
    "Kinh nghiệm nuôi Mèo",
    "Kinh nghiệm nuôi Pet",
    "Tin Tức Thú Cưng",
    "Uncategorized",
];

// GET /api/v1/blog/categories - Get available blog categories
export async function GET(request: NextRequest) {
    try {
        return apiResponse.success(BLOG_CATEGORIES);
    } catch (error) {
        console.error("Get blog categories error:", error);
        return apiResponse.serverError("Failed to get categories");
    }
}
