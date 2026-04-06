import mongoose from 'mongoose';
import connectDB from './config/database.js';
import { User } from './models/index.js';

const checkUsers = async () => {
    try {
        console.log('--- Database Diagnostics Start ---');
        const dbInfo = await connectDB();
        console.log(`Connected to: ${dbInfo.type}`);

        const count = await User.countDocuments();
        console.log(`Total Users found: ${count}`);

        if (count > 0) {
            const users = await User.find({}, 'name email role').lean();
            console.log('User List:');
            users.forEach(u => console.log(` - ${u.name} (${u.email}) [${u.role}]`));
        } else {
            console.log('NO USERS FOUND IN DATABASE.');
        }

        console.log('--- Database Diagnostics End ---');
        process.exit(0);
    } catch (error) {
        console.error('Diagnostics Critical Failure:', error);
        process.exit(1);
    }
};

checkUsers();
