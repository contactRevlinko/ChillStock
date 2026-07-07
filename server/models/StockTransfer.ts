import mongoose, { Schema, Document } from "mongoose";

export interface IStockTransfer extends Document {
  globalProductId: mongoose.Types.ObjectId;
  branchId: mongoose.Types.ObjectId;
  quantity: number;
  transferRate: number;
  status: "pending" | "accepted";
  sellingPrice?: number;
  transferredBy: mongoose.Types.ObjectId;
  batchId?: string;
  productName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const StockTransferSchema = new Schema<IStockTransfer>({
  globalProductId: { type: Schema.Types.ObjectId, ref: "GlobalProduct", required: true },
  branchId: { type: Schema.Types.ObjectId, ref: "Branch", required: true },
  quantity: { type: Number, required: true },
  transferRate: { type: Number, required: true },
  status: { type: String, enum: ["pending", "accepted"], default: "pending" },
  sellingPrice: { type: Number },
  transferredBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  batchId: { type: String },
  productName: { type: String }
}, {
  timestamps: true
});

export const StockTransfer = mongoose.model<IStockTransfer>("StockTransfer", StockTransferSchema);
