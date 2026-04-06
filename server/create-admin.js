import mongoose from 'mongoose';
import connectDB from './config/database.js';
import { User } from './models/index.js';

const createAdmin = async () => {
    try {
        console.log('Connecting to database...');
        await connectDB();

        // Check if admin already exists
        const existingAdmin = await User.findOne({ role: 'admin' });
        if (existingAdmin) {
            console.log(`Admin already exists: ${existingAdmin.email}`);
            console.log('Updating password to Bitsathy@123...');
            existingAdmin.password = 'Bitsathy@123';
            existingAdmin.email = 'chandru.it23@bitsathy.ac.in';
            existingAdmin.name = 'chandru';
            existingAdmin.status = 'active';
            await existingAdmin.save();
            console.log('Admin credentials updated successfully!');
            console.log(`  Email: chandru.it23@bitsathy.ac.in`);
            console.log(`  Password: Bitsathy@123`);
        } else {
            console.log('Creating new admin user...');
            const adminUser = new User({
                name: 'chandru',
                email: 'chandru.it23@bitsathy.ac.in',
                password: 'Bitsathy@123',
                role: 'admin',
                position: 'System Administrator',
                status: 'active',
                mustChangePassword: false,
                theme: 'dark'
            });
            await adminUser.save();
            console.log('Admin user created successfully!');
            console.log(`  Email: chandru.it23@bitsathy.ac.in`);
            console.log(`  Password: Bitsathy@123`);
        }

        // List all users
        const users = await User.find({}, 'name email role status').lean();
        console.log('\nAll users in database:');
        users.forEach(u => console.log(`  - ${u.name} (${u.email}) [${u.role}] [${u.status}]`));

        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
};

createAdmin();
