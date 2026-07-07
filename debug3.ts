import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGODB_URI as string).then(async () => {
  const out = await mongoose.connection.db.collection('stocktransfers').aggregate([
    { $group: { _id: { productId: '$globalProductId', branchId: '$branchId' }, totalOutToBranch: { $sum: '$quantity' } } },
    { $group: { _id: '$_id.productId', totalOut: { $sum: '$totalOutToBranch' }, branches: { $push: { branchId: '$_id.branchId', quantity: '$totalOutToBranch' } } } }
  ]).toArray();
  console.log(JSON.stringify(out, null, 2));
  process.exit(0);
});
