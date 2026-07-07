import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGODB_URI as string).then(async () => {
  const products = await mongoose.connection.db.collection('globalproducts').find({}).toArray();
  console.log("PRODUCTS:", JSON.stringify(products, null, 2));
  process.exit(0);
});
