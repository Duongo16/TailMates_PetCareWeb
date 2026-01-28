import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import TermsAndPolicies, { TermsType } from "@/models/TermsAndPolicies";
import { authenticate, authorize, apiResponse } from "@/lib/auth";
import { UserRole } from "@/models/User";

// GET /api/v1/admin/terms-policies - List all terms and policies (Admin only)
export async function GET(request: NextRequest) {
    try {
        const { user, error } = await authenticate(request);
        if (error) return error;

        const roleError = authorize(user!, [UserRole.ADMIN, UserRole.MANAGER]);
        if (roleError) return roleError;

        await connectDB();

        const { searchParams } = new URL(request.url);
        const type = searchParams.get("type");
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "50");

        const query: any = {};
        if (type && Object.values(TermsType).includes(type as TermsType)) {
            query.type = type;
        }

        const skip = (page - 1) * limit;

        const [documents, total] = await Promise.all([
            TermsAndPolicies.find(query)
                .select("-__v")
                .sort({ created_at: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            TermsAndPolicies.countDocuments(query),
        ]);

        return apiResponse.success({
            documents,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Admin get terms and policies error:", error);
        return apiResponse.serverError("Failed to fetch terms and policies");
    }
}

// POST /api/v1/admin/terms-policies - Create new terms or policy (Admin only)
export async function POST(request: NextRequest) {
    try {
        const { user, error } = await authenticate(request);
        if (error) return error;

        const roleError = authorize(user!, [UserRole.ADMIN, UserRole.MANAGER]);
        if (roleError) return roleError;

        await connectDB();

        const body = await request.json();
        const { title, content, version, type, is_active } = body;

        // Validation
        if (!title || !content || !version || !type) {
            return apiResponse.error("Title, content, version and type are required");
        }

        if (!Object.values(TermsType).includes(type)) {
            return apiResponse.error("Invalid type. Must be 'terms' or 'privacy'");
        }

        // If setting as active, deactivate all other documents of the same type
        if (is_active) {
            await TermsAndPolicies.updateMany(
                { type, is_active: true },
                { is_active: false }
            );
        }

        // Create new document
        const document = await TermsAndPolicies.create({
            title,
            content,
            version,
            type,
            is_active: is_active || false,
        });

        return apiResponse.created(document, "Document created successfully");
    } catch (error) {
        console.error("Admin create terms and policies error:", error);
        return apiResponse.serverError("Failed to create document");
    }
}
