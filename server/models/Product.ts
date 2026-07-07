import mongoose, { Schema, Document } from "mongoose";

export interface IProduct extends Document {
  branchId: mongoose.Types.ObjectId;
  name: string;
  sku: string;
  category: string;
  unitType: "L" | "mL" | "pcs";
  unitSize: number;
  price: number;
  currentStock: number;
  lowStockThreshold: number;
  imageUrl: string;
  createdAt: Date;
}

const ProductSchema = new Schema<IProduct>({
  branchId: { type: Schema.Types.ObjectId, ref: "Branch", required: true },
  name: { type: String, required: true },
  sku: { type: String, required: true },
  category: { type: String, required: true },
  unitType: { type: String, enum: ["L", "mL", "pcs"], required: true },
  unitSize: { type: Number, required: true },
  price: { type: Number, required: true },
  currentStock: { type: Number, required: true, default: 0 },
  lowStockThreshold: { type: Number, required: true },
  imageUrl: { type: String, default: "" },
}, {
  timestamps: true
});

export const Product = mongoose.model<IProduct>("Product", ProductSchema);
