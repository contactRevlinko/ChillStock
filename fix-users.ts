import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGODB_URI as string).then(async () => {
  console.log('Fixing corrupted admin users...');
  await mongoose.connection.db.collection('users').updateMany(
    { role: { $in: ['admin', 'super_admin'] } },
    { $unset: { branchId: "" } }
  );
  console.log('Done!');
  process.exit(0);
});
