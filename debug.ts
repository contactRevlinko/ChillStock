import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGODB_URI as string).then(async () => {
  const transfers = await mongoose.connection.db.collection('stocktransfers').find({}).toArray();
  console.log("TRANSFERS:", JSON.stringify(transfers, null, 2));

  const users = await mongoose.connection.db.collection('users').find({ role: 'admin' }).toArray();
  console.log("ADMINS:", JSON.stringify(users, null, 2));

  process.exit(0);
});
