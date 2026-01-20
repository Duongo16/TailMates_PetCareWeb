import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import Pet from "@/models/Pet";
import MedicalRecord, { ConfirmationStatus } from "@/models/MedicalRecord";
import { authenticate, apiResponse } from "@/lib/auth";
import mongoose from "mongoose";

interface RouteParams {
    params: Promise<{ id: string; recordId: string }>;
}

// GET /api/v1/pets/[id]/medical-records/[recordId] - Get single medical record
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { user, error } = await authenticate(request);
        if (error) return error;

        await connectDB();

        const { id, recordId } = await params;

        if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(recordId)) {
            return apiResponse.error("Invalid ID");
        }

        const pet = await Pet.findById(id);
        if (!pet) {
            return apiResponse.notFound("Pet not found");
        }

        const isOwner = pet.owner_id.toString() === user!._id.toString();
        const isMerchant = user!.role === "MERCHANT";
        const isManager = user!.role === "MANAGER";
        const isAdmin = user!.role === "ADMIN";

        if (!isOwner && !isMerchant && !isManager && !isAdmin) {
            return apiResponse.forbidden("You don't have access to this record");
        }

        const record = await MedicalRecord.findOne({ _id: recordId, pet_id: id })
            .populate("vet_id", "full_name merchant_profile.shop_name merchant_profile.address phone_number")
            .populate("booking_id", "booking_time service_id");

        if (!record) {
            return apiResponse.notFound("Medical record not found");
        }

        return apiResponse.success(record);
    } catch (error) {
        console.error("Get medical record error:", error);
        return apiResponse.serverError("Failed to get medical record");
    }
}

// PATCH /api/v1/pets/[id]/medical-records/[recordId] - Update medical record (merchant edit or customer confirm/reject)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const { user, error } = await authenticate(request);
        if (error) return error;

        await connectDB();

        const { id, recordId } = await params;

        if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(recordId)) {
            return apiResponse.error("Invalid ID");
        }

        const pet = await Pet.findById(id);
        if (!pet) {
            return apiResponse.notFound("Pet not found");
        }

        const record = await MedicalRecord.findOne({ _id: recordId, pet_id: id });
        if (!record) {
            return apiResponse.notFound("Medical record not found");
        }

        const isOwner = pet.owner_id.toString() === user!._id.toString();
        const isMerchant = user!.role === "MERCHANT";
        const isRecordCreator = record.vet_id?.toString() === user!._id.toString();

        const body = await request.json();

        // Customer can confirm/reject records
        if (isOwner) {
            const { action, customer_feedback } = body;

            if (!action || !["confirm", "reject", "request_revision"].includes(action)) {
                return apiResponse.error("Valid action is required (confirm/reject/request_revision)");
            }

            if (record.confirmation_status === ConfirmationStatus.CONFIRMED) {
                return apiResponse.error("This record is already confirmed");
            }

            let newStatus: ConfirmationStatus;
            switch (action) {
                case "confirm":
                    newStatus = ConfirmationStatus.CONFIRMED;
                    break;
                case "reject":
                    newStatus = ConfirmationStatus.REJECTED;
                    break;
                case "request_revision":
                    newStatus = ConfirmationStatus.NEEDS_REVISION;
                    break;
                default:
                    return apiResponse.error("Invalid action");
            }

            record.confirmation_status = newStatus;
            if (customer_feedback) {
                record.customer_feedback = customer_feedback;
            }

            await record.save();

            return apiResponse.success(record, `Medical record ${action}ed successfully`);
        }

        // Merchant can edit their own records (if PENDING or NEEDS_REVISION)
        if (isMerchant && isRecordCreator) {
            if (record.confirmation_status === ConfirmationStatus.CONFIRMED) {
                return apiResponse.error("Cannot edit a confirmed record");
            }

            const {
                record_type,
                visit_date,
                diagnosis,
                treatment,
                condition,
                notes,
                vaccines,
                medications,
                follow_up_date,
                follow_up_notes,
                attachments,
            } = body;

            if (record_type) record.record_type = record_type;
            if (visit_date) record.visit_date = new Date(visit_date);
            if (diagnosis) record.diagnosis = diagnosis;
            if (treatment !== undefined) record.treatment = treatment;
            if (condition !== undefined) record.condition = condition;
            if (notes !== undefined) record.notes = notes;
            if (vaccines) record.vaccines = vaccines;
            if (medications) record.medications = medications;
            if (follow_up_date !== undefined) {
                record.follow_up_date = follow_up_date ? new Date(follow_up_date) : undefined;
            }
            if (follow_up_notes !== undefined) record.follow_up_notes = follow_up_notes;
            if (attachments) record.attachments = attachments;

            // Reset to PENDING when merchant edits (so customer needs to re-confirm)
            if (record.confirmation_status === ConfirmationStatus.NEEDS_REVISION) {
                record.confirmation_status = ConfirmationStatus.PENDING;
            }

            await record.save();

            return apiResponse.success(record, "Medical record updated successfully");
        }

        return apiResponse.forbidden("You cannot modify this record");
    } catch (error) {
        console.error("Update medical record error:", error);
        return apiResponse.serverError("Failed to update medical record");
    }
}

// DELETE /api/v1/pets/[id]/medical-records/[recordId] - Delete medical record
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { user, error } = await authenticate(request);
        if (error) return error;

        await connectDB();

        const { id, recordId } = await params;

        if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(recordId)) {
            return apiResponse.error("Invalid ID");
        }

        const pet = await Pet.findById(id);
        if (!pet) {
            return apiResponse.notFound("Pet not found");
        }

        const record = await MedicalRecord.findOne({ _id: recordId, pet_id: id });
        if (!record) {
            return apiResponse.notFound("Medical record not found");
        }

        const isOwner = pet.owner_id.toString() === user!._id.toString();
        const isMerchant = user!.role === "MERCHANT";
        const isRecordCreator = record.vet_id?.toString() === user!._id.toString();
        const isAdmin = user!.role === "ADMIN";

        // Only owner (for their own records), record creator (if not confirmed yet), or admin can delete
        const canDelete =
            (isOwner && !record.vet_id) || // Owner can delete their own personal records
            (isMerchant && isRecordCreator && record.confirmation_status !== ConfirmationStatus.CONFIRMED) ||
            isAdmin;

        if (!canDelete) {
            return apiResponse.forbidden("You cannot delete this record");
        }

        await MedicalRecord.findByIdAndDelete(recordId);

        return apiResponse.success(null, "Medical record deleted successfully");
    } catch (error) {
        console.error("Delete medical record error:", error);
        return apiResponse.serverError("Failed to delete medical record");
    }
}
