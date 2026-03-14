import mongoose, { Schema, Document } from "mongoose";

export interface ISystemSettings extends Document {
  key: string;
  topup_maintenance: boolean;
  topup_maintenance_message?: string;
  updated_at: Date;
}

const SystemSettingsSchema = new Schema<ISystemSettings>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: "system_settings",
    },
    topup_maintenance: {
      type: Boolean,
      default: false,
    },
    topup_maintenance_message: {
      type: String,
      default: "Chức năng nạp tiền đang tạm bảo trì. Vui lòng quay lại sau.",
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// Helper to get or create the singleton settings document
SystemSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne({ key: "system_settings" });
  if (!settings) {
    settings = await this.create({ key: "system_settings" });
  }
  return settings;
};

export default mongoose.models.SystemSettings ||
  mongoose.model<ISystemSettings>("SystemSettings", SystemSettingsSchema);
