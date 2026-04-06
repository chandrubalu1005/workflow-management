import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { 
    User, Task, Goal, Note, ActivityLog, 
    Project, Team, Notification 
} from './models/index.js';

dotenv.config();

const modelsMap = {
    'workflow_db.users.json': User,
    'workflow_db.tasks.json': Task,
    'workflow_db.projects.json': Project,
    'workflow_db.teams.json': Team,
    'workflow_db.activitylogs.json': ActivityLog,
    'workflow_db.goals.json': Goal,
    'workflow_db.notes.json': Note,
    'workflow_db.notifications.json': Notification
};

const transform = (obj) => {
    if (Array.isArray(obj)) return obj.map(transform);
    if (obj && typeof obj === 'object') {
        if (obj.$oid) return new mongoose.Types.ObjectId(obj.$oid);
        if (obj.$date) {
            // Handle both string and long formats if necessary
            return new Date(obj.$date.$numberLong ? parseInt(obj.$date.$numberLong) : obj.$date);
        }
        if (obj.$numberInt) return parseInt(obj.$numberInt);
        if (obj.$numberLong) return parseInt(obj.$numberLong);
        if (obj.$numberDouble) return parseFloat(obj.$numberDouble);
        if (obj.$numberDecimal) return mongoose.Types.Decimal128.fromString(obj.$numberDecimal);

        const newObj = {};
        for (const key in obj) {
            newObj[key] = transform(obj[key]);
        }
        return newObj;
    }
    return obj;
};

const importData = async () => {
    try {
        console.log('--- SCRIPT STARTING ---');
        console.log('\n-----------------------------------------------------');
        console.log('🚀 MONGODB ATLAS MIGRATION STARTING');
        console.log('-----------------------------------------------------\n');

        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI not found in .env');
        }

        console.log('⌛ Connecting to MongoDB Atlas...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected successfully.\n');

        for (const [filename, Model] of Object.entries(modelsMap)) {
            const filePath = path.join(process.cwd(), filename);
            if (!fs.existsSync(filePath)) {
                console.warn(`⚠️  Skipping ${filename}: File not found.`);
                continue;
            }

            console.log(`📦 Processing ${filename}...`);
            const rawData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            const transformedData = transform(rawData);

            // Clean existing data to avoid Duplicate Key errors on _id
            console.log(`   - Removing existing documents from '${Model.collection.collectionName}'...`);
            await Model.deleteMany({});

            // Insert data
            if (transformedData.length > 0) {
                await Model.insertMany(transformedData, { ordered: false });
                console.log(`   - ✅ Successfully imported ${transformedData.length} documents.`);
            } else {
                console.log('   - ℹ️  File is empty, nothing to import.');
            }
        }

        console.log('\n-----------------------------------------------------');
        console.log('✨ MIGRATION COMPLETE! YOUR DATA IS NOW ON ATLAS.');
        console.log('-----------------------------------------------------\n');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ MIGRATION FAILED:', error.message);
        if (error.stack) console.error(error.stack);
        process.exit(1);
    }
};

importData();
