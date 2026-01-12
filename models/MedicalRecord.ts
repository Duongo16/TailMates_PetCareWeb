import mongoose, { Schema, Document, Model } from "mongoose";

// ==================== Sub-Schemas ====================
interface ICloudinaryImage {
  url: string;
  public_id: string;
}

// ==================== Main Interface ====================
export interface IMedicalRecord extends Document {
  _id: mongoose.Types.ObjectId;
  pet_id: mongoose.Types.ObjectId;
  vet_id?: mongoose.Types.ObjectId;
  visit_date: Date;
  diagnosis: string;
  treatment?: string;
  notes?: string;
  vaccines: string[];
  attachments: ICloudinaryImage[];
  created_at: Date;
}

// ==================== Schema Definition ====================
const CloudinaryImageSchema = new Schema<ICloudinaryImage>(
  {
    url: { type: String, required: true },
    public_id: { type: String, required: true },
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
    notes: {
      type: String,
    },
    vaccines: [{ type: String }],
    attachments: [CloudinaryImageSchema],
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: false },
  }
);

// ==================== Indexes ====================
MedicalRecordSchema.index({ pet_id: 1 });
MedicalRecordSchema.index({ vet_id: 1 });
MedicalRecordSchema.index({ visit_date: -1 });

// ==================== Model Export ====================
const MedicalRecord: Model<IMedicalRecord> =
  mongoose.models.MedicalRecord ||
  mongoose.model<IMedicalRecord>("MedicalRecord", MedicalRecordSchema);

export default MedicalRecord;
