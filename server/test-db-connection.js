import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load .env from the server directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

const testConnection = async () => {
    const uri = process.env.MONGODB_URI;
    console.log(`Testing connection to: ${uri.replace(/:([^:@]+)@/, ':****@')}`); // Hide password

    try {
        await mongoose.connect(uri);
        console.log('✅ SUCCESS: Connected to MongoDB Atlas!');

        // Check for existing data
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log(`\nFound ${collections.length} collections:`);
        collections.forEach(c => console.log(` - ${c.name}`));

        console.log('\nData saved here will be PERMANENT.');
        await mongoose.disconnect();
        process.exit(0);

    } catch (error) {
        console.error('\n❌ CONNECTION FAILED');
        console.error('Error Name:', error.name);
        console.error('Error Message:', error.message);

        if (error.message.includes('ECONNREFUSED') || error.message.includes('bad auth')) {
            console.log('\nPossible Causes:');
            console.log('1. IP Address not whitelisted in MongoDB Atlas (Most likely)');
            console.log('2. Incorrect Username/Password');
            console.log('3. Firewall blocking port 27017');
        }
        process.exit(1);
    }
};

testConnection();
