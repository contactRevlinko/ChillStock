import mongoose, { Schema, Document, Types } from "mongoose";

export interface IBranch extends Document {
  name: string;
  location: string;
  managerName: string;
  contact: string;
  adminId: Types.ObjectId;
  createdAt: Date;
}

const BranchSchema = new Schema<IBranch>({
  name: { type: String, required: true },
  location: { type: String, required: true },
  managerName: { type: String, required: true },
  contact: { type: String, required: true },
  adminId: { type: Schema.Types.ObjectId, ref: "User", required: true },
}, {
  timestamps: true
});

export const Branch = mongoose.model<IBranch>("Branch", BranchSchema);
