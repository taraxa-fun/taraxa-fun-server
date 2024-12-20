// config/db.ts
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('Connected to MongoDB via Mongoose');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

export default connectDB;
