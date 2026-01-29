import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import TermsAndPolicies from "@/models/TermsAndPolicies";
import { authenticate, authorize, apiResponse } from "@/lib/auth";
import { UserRole } from "@/models/User";

// GET /api/v1/admin/terms-policies/[id] - Get single document (Admin only)
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { user, error } = await authenticate(request);
        if (error) return error;

        const roleError = authorize(user!, [UserRole.ADMIN, UserRole.MANAGER]);
        if (roleError) return roleError;

        await connectDB();

        const { id } = await params;
        const document = await TermsAndPolicies.findById(id).select("-__v");

        if (!document) {
            return apiResponse.notFound("Document not found");
        }

        return apiResponse.success(document);
    } catch (error) {
        console.error("Admin get single terms and policies error:", error);
        return apiResponse.serverError("Failed to fetch document");
    }
}

// PUT /api/v1/admin/terms-policies/[id] - Update document (Admin only)
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { user, error } = await authenticate(request);
        if (error) return error;

        const roleError = authorize(user!, [UserRole.ADMIN, UserRole.MANAGER]);
        if (roleError) return roleError;

        await connectDB();

        const body = await request.json();
        const { title, content, version, is_active } = body;

        const { id } = await params;
        const document = await TermsAndPolicies.findById(id);

        if (!document) {
            return apiResponse.notFound("Document not found");
        }

        // If setting as active, deactivate all other documents of the same type
        if (is_active && !document.is_active) {
            await TermsAndPolicies.updateMany(
                { type: document.type, is_active: true, _id: { $ne: id } },
                { is_active: false }
            );
        }

        // Update fields
        if (title !== undefined) document.title = title;
        if (content !== undefined) document.content = content;
        if (version !== undefined) document.version = version;
        if (is_active !== undefined) document.is_active = is_active;

        await document.save();

        return apiResponse.success(document, "Document updated successfully");
    } catch (error) {
        console.error("Admin update terms and policies error:", error);
        return apiResponse.serverError("Failed to update document");
    }
}

// DELETE /api/v1/admin/terms-policies/[id] - Delete document (Admin only)
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { user, error } = await authenticate(request);
        if (error) return error;

        const roleError = authorize(user!, [UserRole.ADMIN, UserRole.MANAGER]);
        if (roleError) return roleError;

        await connectDB();

        const { id } = await params;
        const document = await TermsAndPolicies.findByIdAndDelete(id);

        if (!document) {
            return apiResponse.notFound("Document not found");
        }

        return apiResponse.success(
            { id },
            "Document deleted successfully"
        );
    } catch (error) {
        console.error("Admin delete terms and policies error:", error);
        return apiResponse.serverError("Failed to delete document");
    }
}
