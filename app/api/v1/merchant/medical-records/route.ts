import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import MedicalRecord, { ConfirmationStatus } from "@/models/MedicalRecord";
import Booking, { BookingStatus } from "@/models/Booking";
import { authenticate, authorize, apiResponse } from "@/lib/auth";
import { UserRole } from "@/models/User";

// GET /api/v1/merchant/medical-records - Get completed bookings and medical records for merchant
export async function GET(request: NextRequest) {
    try {
        const { user, error } = await authenticate(request);
        if (error) return error;

        const authError = authorize(user!, [UserRole.MERCHANT]);
        if (authError) return authError;

        await connectDB();

        const { searchParams } = new URL(request.url);
        const type = searchParams.get("type"); // "bookings" or "records"
        const status = searchParams.get("status");
        const petId = searchParams.get("pet_id");

        if (type === "bookings") {
            // Get completed bookings that don't have medical records yet
            const query: Record<string, unknown> = {
                merchant_id: user!._id,
                status: BookingStatus.COMPLETED,
            };

            const completedBookings = await Booking.find(query)
                .populate("customer_id", "full_name phone_number email")
                .populate("pet_id", "name species breed image owner_id")
                .populate("service_id", "name")
                .sort({ booking_time: -1 });

            // Filter out bookings that already have medical records
            const bookingIds = completedBookings.map(b => b._id);
            const existingRecords = await MedicalRecord.find({
                booking_id: { $in: bookingIds }
            }).select("booking_id");

            const existingBookingIds = new Set(existingRecords.map(r => r.booking_id?.toString()));

            const bookingsWithoutRecords = completedBookings.filter(
                b => !existingBookingIds.has(b._id.toString())
            );

            return apiResponse.success({
                bookings: bookingsWithoutRecords,
                total: bookingsWithoutRecords.length,
            });
        }

        // Default: Get medical records created by this merchant
        const recordQuery: Record<string, unknown> = {
            vet_id: user!._id,
        };

        if (status) {
            recordQuery.confirmation_status = status;
        }

        if (petId) {
            recordQuery.pet_id = petId;
        }

        const records = await MedicalRecord.find(recordQuery)
            .populate("pet_id", "name species breed image owner_id")
            .populate("booking_id", "booking_time service_id")
            .sort({ created_at: -1 });

        // Get unique pets
        const uniquePets = new Map();
        records.forEach(record => {
            const pet = record.pet_id as any;
            if (pet && !uniquePets.has(pet._id.toString())) {
                uniquePets.set(pet._id.toString(), pet);
            }
        });

        return apiResponse.success({
            records,
            pets: Array.from(uniquePets.values()),
            total: records.length,
            stats: {
                pending: records.filter(r => r.confirmation_status === ConfirmationStatus.PENDING).length,
                confirmed: records.filter(r => r.confirmation_status === ConfirmationStatus.CONFIRMED).length,
                rejected: records.filter(r => r.confirmation_status === ConfirmationStatus.REJECTED).length,
                needsRevision: records.filter(r => r.confirmation_status === ConfirmationStatus.NEEDS_REVISION).length,
            }
        });
    } catch (error) {
        console.error("Get merchant medical records error:", error);
        return apiResponse.serverError("Failed to get medical records");
    }
}
