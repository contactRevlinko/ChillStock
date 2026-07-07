import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema({
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  details: { type: String, required: true },
}, { timestamps: true });

export default mongoose.model('ActivityLog', activityLogSchema);
