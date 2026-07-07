import mongoose, { Schema, Document } from "mongoose";

export interface ISettings extends Document {
  razorpayKeyId: string;
  razorpayKeySecret: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
}

const SettingsSchema = new Schema<ISettings>({
  razorpayKeyId: { type: String, required: true, default: "rzp_test_SBeVxtsLwf3FdT" },
  razorpayKeySecret: { type: String, required: true, default: "H6gAiLnCqI6iidzc9xznc1X9" },
  smtpHost: { type: String },
  smtpPort: { type: Number },
  smtpUser: { type: String },
  smtpPassword: { type: String },
}, {
  timestamps: true
});

export const Settings = mongoose.model<ISettings>("Settings", SettingsSchema);
