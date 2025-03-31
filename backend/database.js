import mongoose from "mongoose";
import dotenv from 'dotenv';

dotenv.config();
const mongoURI = process.env.MONGO_URI;

const connectDB = async () => {
  try {
    // Connect to MongoDB using Mongoose
    await mongoose.connect(mongoURI);
      console.log('MongoDB connected successfully');
    

 
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1); // Exit the process with failure code
  }
};

export default connectDB;