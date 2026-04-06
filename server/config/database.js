import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/workflow_db', {
            serverSelectionTimeoutMS: 2000, // 2 seconds timeout before fallback
            maxPoolSize: 10,                // Max concurrent connections
            minPoolSize: 2,                 // Keep at least 2 connections alive
            maxIdleTimeMS: 45000,           // Close idle connections after 45s
            waitQueueTimeoutMS: 10000,      // Timeout waiting for a free connection
            socketTimeoutMS: 45000,
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        return { type: 'Atlas/Local', host: conn.connection.host };
    } catch (error) {
        console.error(`Error connecting to MongoDB: ${error.message}`);

        // Fallback to In-Memory Database (with Persistence) for Development
        if (process.env.NODE_ENV === 'development') {
            console.log('Attempting to start Persistent Local Database as fallback...');
            try {
                const { MongoMemoryServer } = await import('mongodb-memory-server');
                const path = await import('path');
                const fs = await import('fs');

                // Ensure data directory exists
                const dbPath = path.join(process.cwd(), 'data', 'db-fallback');
                if (!fs.existsSync(dbPath)) {
                    fs.mkdirSync(dbPath, { recursive: true });
                }

                const mongod = await MongoMemoryServer.create({
                    instance: {
                        dbPath: dbPath,
                        storageEngine: 'wiredTiger' // Ensure data is written to disk
                    }
                });

                const uri = mongod.getUri();

                await mongoose.connect(uri);
                console.log(`Fallback: Connected to Persistent Local MongoDB at ${uri}`);
                console.log(`Data Storage: ${dbPath}`);
                return { type: 'Local (Persistent)', host: 'Local Disk' };
            } catch (fallbackError) {
                console.error(`Fallback failed: ${fallbackError.message}`);
                process.exit(1);
            }
        } else {
            console.error('Non-development environment. Exiting.');
            process.exit(1);
        }
    }
};

export default connectDB;
