/**
 * Database Configuration
 * Handles MongoDB connection with Mongoose
 */
import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        const uri = process.env.MONGODB_URI || process.env.MONGO_URI;

        if (!uri) {
            throw new Error('❌ MongoDB URI not found in environment variables');
        }

        const conn = await mongoose.connect(uri);

        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        console.log(`📊 Database: ${conn.connection.name}`);
    } catch (error) {
        console.error(`❌ Database connection error: ${error.message}`);
        process.exit(1);
    }

    // Connection event listeners
    mongoose.connection.on('disconnected', () => {
        console.log('🔌 MongoDB disconnected');
    });

    mongoose.connection.on('error', (err) => {
        console.error('❌ MongoDB connection error:', err.message);
    });

    mongoose.connection.on('reconnected', () => {
        console.log('🔄 MongoDB reconnected');
    });
};

export default connectDB;