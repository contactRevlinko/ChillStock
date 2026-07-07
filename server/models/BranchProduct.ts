import mongoose, { Schema, Document } from "mongoose";

export interface IBranchProduct extends Document {
  branchId: mongoose.Types.ObjectId;
  globalProductId: mongoose.Types.ObjectId;
  transferRate: number;
  sellingPrice: number;
  currentStock: number;
  lowStockThreshold: number;
  createdAt: Date;
  updatedAt: Date;
}

const BranchProductSchema = new Schema<IBranchProduct>({
  branchId: { type: Schema.Types.ObjectId, ref: "Branch", required: true },
  globalProductId: { type: Schema.Types.ObjectId, ref: "GlobalProduct", required: true },
  transferRate: { type: Number, required: true },
  sellingPrice: { type: Number, required: true },
  currentStock: { type: Number, required: true, default: 0 },
  lowStockThreshold: { type: Number, required: true, default: 10 }
}, {
  timestamps: true
});

// Create compound index so products with same transferRate and sellingPrice merge
BranchProductSchema.index({ branchId: 1, globalProductId: 1, transferRate: 1, sellingPrice: 1 }, { unique: true });

export const BranchProduct = mongoose.model<IBranchProduct>("BranchProduct", BranchProductSchema);
