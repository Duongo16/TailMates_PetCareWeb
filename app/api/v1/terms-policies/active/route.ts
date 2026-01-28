import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import TermsAndPolicies, { TermsType } from "@/models/TermsAndPolicies";
import { apiResponse } from "@/lib/auth";

export async function GET(request: NextRequest) {
    try {
        await connectDB();

        // Get active terms and privacy policy
        const [activeTerms, activePrivacy] = await Promise.all([
            TermsAndPolicies.findOne({ type: TermsType.TERMS, is_active: true }).select(
                "-__v"
            ),
            TermsAndPolicies.findOne({
                type: TermsType.PRIVACY,
                is_active: true,
            }).select("-__v"),
        ]);

        return apiResponse.success({
            terms: activeTerms || null,
            privacy: activePrivacy || null,
        });
    } catch (error) {
        console.error("Error fetching active terms and policies:", error);
        return apiResponse.serverError("Failed to fetch terms and policies");
    }
}
