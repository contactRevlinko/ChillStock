import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGODB_URI as string).then(async () => {
  const products = await mongoose.connection.db!.collection('globalproducts').find({}).toArray();
  for (const p of products) {
    if (!p.name) {
      console.log(`Fixing product ${p._id}, setting name to ${p.sku}`);
      await mongoose.connection.db!.collection('globalproducts').updateOne(
        { _id: p._id },
        { $set: { name: p.sku || 'Unknown Product' } }
      );
    }
  }
  console.log("Database fixed!");
  process.exit(0);
});
