import mongoose, { Schema, Document } from "mongoose";

export interface ISale extends Document {
  branchId: mongoose.Types.ObjectId;
  globalProductId: mongoose.Types.ObjectId; // For names and global tracking
  branchProductId: mongoose.Types.ObjectId; // Specific stock line item
  quantity: number;
  transferRate: number; // The rate at which the branch received it
  priceAtSale: number; // The selling price set by branch
  totalAmount: number; // qty * priceAtSale
  totalProfit: number; // qty * (priceAtSale - transferRate)
  soldBy: mongoose.Types.ObjectId;
  note: string;
  createdAt: Date;
}

const SaleSchema = new Schema<ISale>({
  branchId: { type: Schema.Types.ObjectId, ref: "Branch", required: true },
  globalProductId: { type: Schema.Types.ObjectId, ref: "GlobalProduct", required: true },
  branchProductId: { type: Schema.Types.ObjectId, ref: "BranchProduct", required: true },
  quantity: { type: Number, required: true },
  transferRate: { type: Number, required: true },
  priceAtSale: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  totalProfit: { type: Number, required: true },
  soldBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  note: { type: String, default: "" }
}, {
  timestamps: true // This provides the timestamp requested by the schema
});

export const Sale = mongoose.model<ISale>("Sale", SaleSchema);
