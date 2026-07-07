import mongoose, { Schema, Document } from "mongoose";

export interface IPackage extends Document {
  name: string;
  description?: string;
  price: number;
  durationDays: number;
  features: string[];
  isActive: boolean;
}

const PackageSchema = new Schema<IPackage>({
  name: { type: String, required: true },
  description: { type: String, required: false },
  price: { type: Number, required: true },
  durationDays: { type: Number, required: true },
  features: { type: [String], default: [] },
  isActive: { type: Boolean, default: true },
}, {
  timestamps: true
});

export const Package = mongoose.model<IPackage>("Package", PackageSchema);
