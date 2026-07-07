import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  phone?: string;
  companyName?: string;
  password?: string;
  role: "admin" | "branch" | "super_admin";
  branchId?: mongoose.Types.ObjectId;
  // Subscription fields
  packageId?: mongoose.Types.ObjectId;
  paymentStatus?: "Pending" | "Paid" | "Expired" | "Cancelled";
  subscriptionStatus?: "Active" | "Inactive" | "Expired";
  paymentId?: string;
  orderId?: string;
  subscriptionStartDate?: Date;
  subscriptionEndDate?: Date;
  lastPaymentDate?: Date;
  isActive?: boolean;
  isEnabled?: boolean;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["admin", "branch", "super_admin"], required: true },
  phone: { type: String, required: false },
  companyName: { type: String, required: false },
  isEnabled: { type: Boolean, default: true },
  branchId: { type: Schema.Types.ObjectId, ref: "Branch", required: false },
  // Subscription fields
  packageId: { type: Schema.Types.ObjectId, ref: "Package", required: false },
  paymentStatus: { type: String, enum: ["Pending", "Paid", "Expired", "Cancelled"], default: "Pending" },
  subscriptionStatus: { type: String, enum: ["Active", "Inactive", "Expired"], default: "Inactive" },
  paymentId: { type: String, required: false },
  orderId: { type: String, required: false },
  subscriptionStartDate: { type: Date, required: false },
  subscriptionEndDate: { type: Date, required: false },
  lastPaymentDate: { type: Date, required: false },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

export const User = mongoose.model<IUser>("User", UserSchema);
