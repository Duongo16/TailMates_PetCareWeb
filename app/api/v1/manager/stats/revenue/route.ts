import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Order from "@/models/Order";
import Booking from "@/models/Booking";
import { authenticate, authorize, apiResponse } from "@/lib/auth";
import { UserRole } from "@/models/User";

// GET /api/v1/manager/stats/revenue - Get revenue statistics (Manager only)
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await authenticate(request);
    if (error) return error;

    const authError = authorize(user!, [UserRole.MANAGER, UserRole.ADMIN]);
    if (authError) return authError;

    await connectDB();

    // Get date range from query params
    const { searchParams } = new URL(request.url);
    const startDateStr = searchParams.get("start_date");
    const endDateStr = searchParams.get("end_date");

    const endDate = endDateStr ? new Date(endDateStr) : new Date();
    const startDate = startDateStr
      ? new Date(startDateStr)
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); // Last 30 days

    // Orders statistics
    const completedOrders = await Order.aggregate([
      {
        $match: {
          status: "COMPLETED",
          created_at: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: null,
          total_revenue: { $sum: "$total_amount" },
          order_count: { $sum: 1 },
        },
      },
    ]);

    // Bookings statistics
    const completedBookings = await Booking.aggregate([
      {
        $match: {
          status: "COMPLETED",
          created_at: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: null,
          booking_count: { $sum: 1 },
        },
      },
    ]);

    // Users statistics
    const userStats = await User.aggregate([
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 },
        },
      },
    ]);

    // Top merchants by revenue
    const topMerchants = await User.find({
      role: "MERCHANT",
      is_active: true,
    })
      .select("full_name merchant_profile")
      .sort({ "merchant_profile.revenue_stats": -1 })
      .limit(5);

    // Daily revenue for chart
    const dailyRevenue = await Order.aggregate([
      {
        $match: {
          status: "COMPLETED",
          created_at: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$created_at" },
          },
          revenue: { $sum: "$total_amount" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return apiResponse.success({
      period: {
        start_date: startDate,
        end_date: endDate,
      },
      orders: {
        total_revenue: completedOrders[0]?.total_revenue || 0,
        order_count: completedOrders[0]?.order_count || 0,
      },
      bookings: {
        booking_count: completedBookings[0]?.booking_count || 0,
      },
      users: userStats.reduce((acc, item) => {
        acc[item._id.toLowerCase()] = item.count;
        return acc;
      }, {} as Record<string, number>),
      top_merchants: topMerchants,
      daily_revenue: dailyRevenue,
    });
  } catch (error) {
    console.error("Get stats error:", error);
    return apiResponse.serverError("Failed to get statistics");
  }
}
