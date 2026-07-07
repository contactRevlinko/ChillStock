import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://kriyonainfotech:kriyonainfotech@cluster0.ntvag.mongodb.net/himcream";

const StockTransferSchema = new mongoose.Schema({
  globalProductId: { type: mongoose.Schema.Types.ObjectId, ref: 'GlobalProduct', required: false },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: false },
  quantity: { type: Number, required: true },
  transferRate: { type: Number, required: false },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' }
}, { timestamps: true });

const StockTransfer = mongoose.models.StockTransfer || mongoose.model('StockTransfer', StockTransferSchema);

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to DB");
  
  const transfers = await StockTransfer.find({ quantity: 1, status: 'pending', transferRate: 100 });
  console.log("Found matching transfers:", transfers.length);
  
  for (const t of transfers) {
    console.log("Ghost transfer found:", t._id);
    await StockTransfer.findByIdAndDelete(t._id);
    console.log("Deleted ghost transfer", t._id);
  }

  process.exit(0);
}

run().catch(console.error);
