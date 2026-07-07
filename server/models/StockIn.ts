import mongoose, { Schema, Document } from "mongoose";

export interface IStockIn extends Document {
  globalProductId: mongoose.Types.ObjectId;
  quantity: number;
  addedBy?: mongoose.Types.ObjectId; // Optional: admin user ID
  createdAt: Date;
  updatedAt: Date;
}

const StockInSchema = new Schema<IStockIn>({
  globalProductId: { type: Schema.Types.ObjectId, ref: "GlobalProduct", required: true },
  quantity: { type: Number, required: true },
  addedBy: { type: Schema.Types.ObjectId, ref: "User" }
}, {
  timestamps: true
});

export const StockIn = mongoose.model<IStockIn>("StockIn", StockInSchema);
