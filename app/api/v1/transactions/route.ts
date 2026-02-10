import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import Transaction from "@/models/Transaction";
import { authenticate, apiResponse } from "@/lib/auth";

// GET /api/v1/transactions - List transactions for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await authenticate(request);
    if (error) return error;

    await connectDB();

    const { searchParams } = request.nextUrl;
    const limit = parseInt(searchParams.get("limit") || "10");
    const page = parseInt(searchParams.get("page") || "1");
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const skip = (page - 1) * limit;

    // Build filter query
    const query: any = { user_id: user!._id };
    if (type) query.type = type;
    if (status) query.status = status;

    // Fetch transactions for the user, sorted by descending date
    const transactions = await Transaction.find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Transaction.countDocuments(query);

    return apiResponse.success(
      {
        transactions,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      },
      "Fetch transactions success"
    );
  } catch (error) {
    console.error("Fetch transactions error:", error);
    return apiResponse.serverError("Failed to fetch transactions");
  }
}
