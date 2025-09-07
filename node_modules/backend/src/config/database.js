import mongoose from 'mongoose';

export const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB connected successfully");
        // Database connection logic here
    } catch (error) {
        console.error("Database connection error:", error);
        process.exit(1); // Exit process with failure
    }
};

export default connectDB;