import mongoose from 'mongoose';
import connectDB from './config/database.js';
import { User } from './models/index.js';

async function checkAdmin() {
    await connectDB();
    const users = await User.find({});
    console.log(users.map(u => ({ name: u.name, email: u.email, role: u.role })));
    process.exit(0);
}
checkAdmin();
