import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import Booking from "@/models/Booking";
import Service from "@/models/Service";
import Pet from "@/models/Pet";
import { authenticate, authorize, apiResponse } from "@/lib/auth";
import { UserRole } from "@/models/User";
import mongoose from "mongoose";

// GET /api/v1/bookings - Get bookings
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await authenticate(request);
    if (error) return error;

    await connectDB();

    let query: Record<string, unknown> = {};

    if (user!.role === UserRole.CUSTOMER) {
      query.customer_id = user!._id;
    } else if (user!.role === UserRole.MERCHANT) {
      query.merchant_id = user!._id;
    }

    const bookings = await Booking.find(query)
      .populate("customer_id", "full_name phone_number email")
      .populate("merchant_id", "full_name merchant_profile.shop_name")
      .populate("service_id", "name price_min price_max duration_minutes")
      .populate("pet_id", "name species breed image")
      .sort({ booking_time: 1 });

    return apiResponse.success(bookings);
  } catch (error) {
    console.error("Get bookings error:", error);
    return apiResponse.serverError("Failed to get bookings");
  }
}

// POST /api/v1/bookings - Create booking (customer books service)
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await authenticate(request);
    if (error) return error;

    const authError = authorize(user!, [UserRole.CUSTOMER]);
    if (authError) return authError;

    await connectDB();

    const body = await request.json();
    const { service_id, pet_id, booking_time, note } = body;

    // Validation
    if (!service_id || !pet_id || !booking_time) {
      return apiResponse.error(
        "Service ID, pet ID, and booking time are required"
      );
    }

    if (!mongoose.Types.ObjectId.isValid(service_id)) {
      return apiResponse.error("Invalid service ID");
    }

    if (!mongoose.Types.ObjectId.isValid(pet_id)) {
      return apiResponse.error("Invalid pet ID");
    }

    // Verify service exists
    const service = await Service.findById(service_id);
    if (!service) {
      return apiResponse.notFound("Service not found");
    }
    if (!service.is_active) {
      return apiResponse.error("Service is not available");
    }

    // Verify pet belongs to user
    const pet = await Pet.findById(pet_id);
    if (!pet) {
      return apiResponse.notFound("Pet not found");
    }
    if (pet.owner_id.toString() !== user!._id.toString()) {
      return apiResponse.forbidden("You can only book for your own pets");
    }

    // Check for conflicting bookings
    const bookingDate = new Date(booking_time);
    const conflictingBooking = await Booking.findOne({
      merchant_id: service.merchant_id,
      booking_time: bookingDate,
      status: { $in: ["PENDING", "CONFIRMED"] },
    });

    if (conflictingBooking) {
      return apiResponse.error(
        "This time slot is already booked. Please choose another time."
      );
    }

    // Create booking
    const booking = await Booking.create({
      customer_id: user!._id,
      merchant_id: service.merchant_id,
      service_id,
      pet_id,
      booking_time: bookingDate,
      status: "PENDING",
      note,
    });

    const populatedBooking = await Booking.findById(booking._id)
      .populate("service_id", "name price_min price_max duration_minutes")
      .populate("pet_id", "name species breed");

    return apiResponse.created(populatedBooking, "Booking created successfully");
  } catch (error) {
    console.error("Create booking error:", error);
    return apiResponse.serverError("Failed to create booking");
  }
}
