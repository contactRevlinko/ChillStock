import mongoose, { Schema, Document } from "mongoose";

export interface IPaymentHistory extends Document {
  adminId: mongoose.Types.ObjectId;
  packageId?: mongoose.Types.ObjectId;
  amount: number;
  paymentId: string;
  orderId: string;
  status: "Pending" | "Paid" | "Failed";
  date: Date;
}

const PaymentHistorySchema = new Schema<IPaymentHistory>({
  adminId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  packageId: { type: Schema.Types.ObjectId, ref: "Package", required: false },
  amount: { type: Number, required: true },
  paymentId: { type: String, required: true },
  orderId: { type: String, required: true },
  status: { type: String, enum: ["Pending", "Paid", "Failed"], required: true },
  date: { type: Date, default: Date.now },
}, {
  timestamps: true
});

export const PaymentHistory = mongoose.model<IPaymentHistory>("PaymentHistory", PaymentHistorySchema);
