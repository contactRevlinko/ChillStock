import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGODB_URI as string).then(async () => {
  console.log('Fixing corrupted StockIn logs...');
  // Find the admin user
  const admin = await mongoose.connection.db.collection('users').findOne({ email: 'astha@gmail.com' });
  if (admin) {
    const result = await mongoose.connection.db.collection('stockins').updateMany(
      { addedBy: { $exists: false } },
      { $set: { addedBy: admin._id } }
    );
    console.log(`Updated ${result.modifiedCount} logs`);
    
    const result2 = await mongoose.connection.db.collection('stockins').updateMany(
      { addedBy: null },
      { $set: { addedBy: admin._id } }
    );
    console.log(`Updated ${result2.modifiedCount} null logs`);
  }
  console.log('Done!');
  process.exit(0);
});
