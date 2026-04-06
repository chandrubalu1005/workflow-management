import mongoose from 'mongoose';
import connectDB from './config/database.js';
import { User } from './models/index.js';
import fs from 'fs';
import path from 'path';

const seedAndCheck = async () => {
    let output = '';
    const appendLog = (msg) => {
        console.log(msg);
        output += msg + '\n';
    };

    try {
        appendLog('--- Seed & Check Start ---');
        const dbInfo = await connectDB();
        appendLog(`Connected to: ${dbInfo.type}`);

        // Create a normal user if none exists
        const normalUserExists = await User.findOne({ role: 'normal' });
        if (!normalUserExists) {
            appendLog('Creating default normal user...');
            const normalUser = new User({
                name: 'Kiran R.',
                email: 'kiran@gmail.com',
                password: 'Password@123',
                role: 'normal',
                position: 'Senior Engineer',
                mustChangePassword: false
            });
            await normalUser.save();
            appendLog('Default normal user created (kiran@gmail.com / Password@123)');
        } else {
            appendLog('Normal user(s) already exist.');
        }

        const users = await User.find({}, 'name email role').lean();
        appendLog(`Total Users: ${users.length}`);
        users.forEach(u => appendLog(` - ${u.name} (${u.email}) [${u.role}]`));

        appendLog('--- Seed & Check End ---');

        fs.writeFileSync(path.join(process.cwd(), 'seed_result.log'), output);
        process.exit(0);
    } catch (error) {
        fs.writeFileSync(path.join(process.cwd(), 'seed_error.log'), error.stack);
        process.exit(1);
    }
};

seedAndCheck();
