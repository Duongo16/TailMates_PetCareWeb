import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/db"
import Order, { OrderStatus } from "@/models/Order"
import Booking, { BookingStatus } from "@/models/Booking"
import User from "@/models/User"
import Package from "@/models/Package"
import { authenticate, authorize, apiResponse } from "@/lib/auth"
import { UserRole } from "@/models/User"
import mongoose from "mongoose"
import { startOfDay, endOfDay, subDays, format, eachDayOfInterval } from "date-fns"

export async function GET(req: NextRequest) {
    const { user, error } = await authenticate(req)
    if (error || !user) return error || apiResponse.unauthorized()

    const authError = authorize(user, [UserRole.MERCHANT])
    if (authError) return authError

    await connectDB()

    const { searchParams } = new URL(req.url)
    const range = searchParams.get("range") || "7d"
    const fromStr = searchParams.get("from")
    const toStr = searchParams.get("to")

    let startDate: Date
    let endDate = endOfDay(new Date())

    if (range === "30d") {
        startDate = startOfDay(subDays(new Date(), 29))
    } else if (range === "custom" && fromStr && toStr) {
        startDate = startOfDay(new Date(fromStr))
        endDate = endOfDay(new Date(toStr))
    } else {
        // Default 7d
        startDate = startOfDay(subDays(new Date(), 6))
    }

    const merchantId = user._id

    try {
        // Get merchant commission rate from subscription
        let commissionRate = 0.1 // Default 10%
        if (user.subscription?.package_id) {
            const pkg = await Package.findById(user.subscription.package_id)
            if (pkg) {
                commissionRate = pkg.commission_rate
            }
        }

        // 1. Summary Metrics & Revenue Chart Data
        const revenueData = await Order.aggregate([
            {
                $match: {
                    merchant_id: merchantId,
                    status: OrderStatus.COMPLETED,
                    created_at: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$created_at" } },
                    dailyRevenue: { $sum: "$total_amount" },
                    orderCount: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ])

        const bookingRevenueData = await Booking.aggregate([
            {
                $match: {
                    merchant_id: merchantId,
                    status: BookingStatus.COMPLETED,
                    booking_time: { $gte: startDate, $lte: endDate }
                }
            },
            {
                // We need service price. Since Booking doesn't have total_amount, 
                // we lookup Service to get price_min/max. For analytics, we'll use price_min as actual.
                $lookup: {
                    from: "services",
                    localField: "service_id",
                    foreignField: "_id",
                    as: "service"
                }
            },
            { $unwind: "$service" },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$booking_time" } },
                    dailyRevenue: { $sum: "$service.price_min" },
                    bookingCount: { $sum: 1 }
                }
            }
        ])

        // Merge and Zero-fill Revenue Data
        const dateInterval = eachDayOfInterval({ start: startDate, end: endDate })
        const chartData = dateInterval.map(date => {
            const dateStr = format(date, "yyyy-MM-dd")
            const ord = revenueData.find(d => d._id === dateStr)
            const bok = bookingRevenueData.find(d => d._id === dateStr)

            const revenue = (ord?.dailyRevenue || 0) + (bok?.dailyRevenue || 0)
            return {
                name: format(date, "dd/MM"),
                date: dateStr,
                revenue: revenue,
                netIncome: Math.round(revenue * (1 - commissionRate)),
                orders: (ord?.orderCount || 0) + (bok?.bookingCount || 0)
            }
        })

        const totalRevenue = chartData.reduce((sum, d) => sum + d.revenue, 0)
        const totalOrders = chartData.reduce((sum, d) => sum + d.orders, 0)
        const netIncome = chartData.reduce((sum, d) => sum + d.netIncome, 0)

        // 2. Category Distribution
        const productCategories = await Order.aggregate([
            {
                $match: {
                    merchant_id: merchantId,
                    status: OrderStatus.COMPLETED,
                    created_at: { $gte: startDate, $lte: endDate }
                }
            },
            { $unwind: "$items" },
            {
                $lookup: {
                    from: "products",
                    localField: "items.product_id",
                    foreignField: "_id",
                    as: "product"
                }
            },
            { $unwind: "$product" },
            {
                $group: {
                    _id: "$product.category",
                    value: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
                }
            }
        ])

        const bookingCategories = await Booking.aggregate([
            {
                $match: {
                    merchant_id: merchantId,
                    status: BookingStatus.COMPLETED,
                    booking_time: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $lookup: {
                    from: "services",
                    localField: "service_id",
                    foreignField: "_id",
                    as: "service"
                }
            },
            { $unwind: "$service" },
            {
                $group: {
                    _id: "SERVICE", // Group all bookings as Service category
                    value: { $sum: "$service.price_min" }
                }
            }
        ])

        const combinedCategories = [...productCategories, ...bookingCategories].reduce((acc: any[], curr) => {
            const existing = acc.find(c => c.name === curr._id)
            if (existing) {
                existing.value += curr.value
            } else {
                acc.push({ name: curr._id, value: curr.value })
            }
            return acc
        }, [])

        // 3. Top Products
        const topProducts = await Order.aggregate([
            {
                $match: {
                    merchant_id: merchantId,
                    status: OrderStatus.COMPLETED,
                    created_at: { $gte: startDate, $lte: endDate }
                }
            },
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.product_id",
                    name: { $first: "$items.name" },
                    sold: { $sum: "$items.quantity" },
                    revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
                }
            },
            {
                $lookup: {
                    from: "products",
                    localField: "_id",
                    foreignField: "_id",
                    as: "product"
                }
            },
            { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    id: "$_id",
                    name: 1,
                    sold: 1,
                    revenue: 1,
                    stock: "$product.stock_quantity",
                    image: { $arrayElemAt: ["$product.images.url", 0] }
                }
            },
            { $sort: { sold: -1 } },
            { $limit: 5 }
        ])

        // 4. Top Customers
        const topCustomers = await Order.aggregate([
            {
                $match: {
                    merchant_id: merchantId,
                    status: OrderStatus.COMPLETED,
                    created_at: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: "$customer_id",
                    totalSpent: { $sum: "$total_amount" },
                    orderCount: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "customer"
                }
            },
            { $unwind: "$customer" },
            {
                $project: {
                    id: "$_id",
                    name: "$customer.full_name",
                    email: "$customer.email",
                    avatar: "$customer.avatar.url",
                    totalSpent: 1,
                    orderCount: 1
                }
            },
            { $sort: { totalSpent: -1 } },
            { $limit: 5 }
        ])

        // 5. Slow Moving Products
        // This is a bit more complex, let's simplify for now: products with stock but 0 sold in period
        const soldProductIds = await Order.distinct("items.product_id", {
            merchant_id: merchantId,
            status: OrderStatus.COMPLETED,
            created_at: { $gte: startDate, $lte: endDate }
        })

        const slowProducts = await mongoose.model("Product").find({
            merchant_id: merchantId,
            _id: { $nin: soldProductIds },
            stock_quantity: { $gt: 0 },
            is_active: true
        }).limit(5).select("name stock_quantity updated_at")

        const formattedSlowProducts = slowProducts.map((p: any) => ({
            id: p._id,
            name: p.name,
            stock: p.stock_quantity,
            lastSold: "N/A" // Simplified
        }))

        return apiResponse.success({
            summary: {
                totalRevenue,
                netIncome,
                totalOrders,
                conversionRate: 0 // TODO
            },
            chartData,
            categories: combinedCategories,
            topProducts,
            topCustomers,
            slowProducts: formattedSlowProducts
        })

    } catch (err: any) {
        console.error("Analytics Error:", err)
        return apiResponse.serverError(err.message)
    }
}
