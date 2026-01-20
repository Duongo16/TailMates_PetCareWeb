import mongoose, { Schema, Document, Model } from "mongoose";

// ==================== Enums ====================
export enum RecordType {
  VACCINATION = "VACCINATION",
  EXAMINATION = "EXAMINATION",
  TREATMENT = "TREATMENT",
  SURGERY = "SURGERY",
  DEWORMING = "DEWORMING",
  CHECKUP = "CHECKUP",
}

export enum ConfirmationStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  REJECTED = "REJECTED",
  NEEDS_REVISION = "NEEDS_REVISION",
}

// ==================== Sub-Schemas ====================
interface ICloudinaryImage {
  url: string;
  public_id: string;
}

interface IMedication {
  name: string;
  dosage: string;
  frequency: string;
  duration_days?: number;
  notes?: string;
}

// ==================== Main Interface ====================
export interface IMedicalRecord extends Document {
  _id: mongoose.Types.ObjectId;
  pet_id: mongoose.Types.ObjectId;
  vet_id?: mongoose.Types.ObjectId;
  booking_id?: mongoose.Types.ObjectId;
  record_type: RecordType;
  confirmation_status: ConfirmationStatus;
  visit_date: Date;
  diagnosis: string;
  treatment?: string;
  condition?: string;
  notes?: string;
  vaccines: string[];
  medications: IMedication[];
  follow_up_date?: Date;
  follow_up_notes?: string;
  attachments: ICloudinaryImage[];
  customer_feedback?: string;
  created_at: Date;
  updated_at: Date;
}

// ==================== Schema Definition ====================
const CloudinaryImageSchema = new Schema<ICloudinaryImage>(
  {
    url: { type: String, required: true },
    public_id: { type: String, required: true },
  },
  { _id: false }
);

const MedicationSchema = new Schema<IMedication>(
  {
    name: { type: String, required: true },
    dosage: { type: String, required: true },
    frequency: { type: String, required: true },
    duration_days: { type: Number },
    notes: { type: String },
  },
  { _id: false }
);

const MedicalRecordSchema = new Schema<IMedicalRecord>(
  {
    pet_id: {
      type: Schema.Types.ObjectId,
      ref: "Pet",
      required: [true, "Pet ID is required"],
    },
    vet_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    booking_id: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
    },
    record_type: {
      type: String,
      enum: Object.values(RecordType),
      required: [true, "Record type is required"],
    },
    confirmation_status: {
      type: String,
      enum: Object.values(ConfirmationStatus),
      default: ConfirmationStatus.PENDING,
    },
    visit_date: {
      type: Date,
      required: [true, "Visit date is required"],
    },
    diagnosis: {
      type: String,
      required: [true, "Diagnosis is required"],
    },
    treatment: {
      type: String,
    },
    condition: {
      type: String,
    },
    notes: {
      type: String,
    },
    vaccines: [{ type: String }],
    medications: [MedicationSchema],
    follow_up_date: {
      type: Date,
    },
    follow_up_notes: {
      type: String,
    },
    attachments: [CloudinaryImageSchema],
    customer_feedback: {
      type: String,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// ==================== Indexes ====================
MedicalRecordSchema.index({ pet_id: 1 });
MedicalRecordSchema.index({ vet_id: 1 });
MedicalRecordSchema.index({ booking_id: 1 });
MedicalRecordSchema.index({ visit_date: -1 });
MedicalRecordSchema.index({ confirmation_status: 1 });
MedicalRecordSchema.index({ record_type: 1 });

// ==================== Model Export ====================
const MedicalRecord: Model<IMedicalRecord> =
  mongoose.models.MedicalRecord ||
  mongoose.model<IMedicalRecord>("MedicalRecord", MedicalRecordSchema);

export default MedicalRecord;

