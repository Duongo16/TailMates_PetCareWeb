import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import Booking from "@/models/Booking";
import Service from "@/models/Service";
import { apiResponse } from "@/lib/auth";
import mongoose from "mongoose";

// GET /api/v1/bookings/slots - Get booked time slots for a service on a specific date
export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);
        const serviceId = searchParams.get("service_id");
        const dateStr = searchParams.get("date"); // Format: dd/mm/yyyy

        if (!serviceId) {
            return apiResponse.error("Service ID is required");
        }

        if (!dateStr) {
            return apiResponse.error("Date is required");
        }

        if (!mongoose.Types.ObjectId.isValid(serviceId)) {
            return apiResponse.error("Invalid service ID");
        }

        // Get service to find merchant_id
        const service = await Service.findById(serviceId);
        if (!service) {
            return apiResponse.notFound("Service not found");
        }

        // Parse date string (dd/mm/yyyy)
        const [day, month, year] = dateStr.split("/").map(Number);
        const startOfDay = new Date(year, month - 1, day, 0, 0, 0);
        const endOfDay = new Date(year, month - 1, day, 23, 59, 59);

        // Find all bookings for this service's merchant on this date
        const bookings = await Booking.find({
            service_id: serviceId,
            booking_time: {
                $gte: startOfDay,
                $lte: endOfDay,
            },
            status: { $in: ["PENDING", "CONFIRMED"] },
        }).select("booking_time");

        // Extract booked times (HH:MM format)
        const bookedSlots = bookings.map((booking) => {
            const time = new Date(booking.booking_time);
            return `${time.getHours().toString().padStart(2, "0")}:${time.getMinutes().toString().padStart(2, "0")}`;
        });

        return apiResponse.success({
            service_id: serviceId,
            date: dateStr,
            booked_slots: bookedSlots,
        });
    } catch (error) {
        console.error("Get booked slots error:", error);
        return apiResponse.serverError("Failed to get booked slots");
    }
}
