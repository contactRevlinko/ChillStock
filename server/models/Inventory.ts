import mongoose, { Schema, Document } from "mongoose";

export interface IInventory extends Document {
  branchId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  currentStock: number;
  lastUpdated: Date;
}

const InventorySchema = new Schema<IInventory>({
  branchId: { type: Schema.Types.ObjectId, ref: "Branch", required: true },
  productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  currentStock: { type: Number, required: true, default: 0 },
}, {
  timestamps: true
});

// Ensure uniqueness of product per branch
InventorySchema.index({ branchId: 1, productId: 1 }, { unique: true });

export const Inventory = mongoose.model<IInventory>("Inventory", InventorySchema);
