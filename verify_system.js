import mongoose from 'mongoose';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:21017/workflow_pro';
const API_URL = 'http://localhost:3000/api';

async function verifySystem() {
    console.log('🔍 Starting System Health Verification...\n');

    // 1. Check Database Connection
    try {
        console.log('📡 Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ MongoDB Connection: SUCCESSFUL\n');
    } catch (err) {
        console.error('❌ MongoDB Connection: FAILED');
        console.error(err.message);
    }

    // 2. Check API Health
    try {
        console.log(`🌐 Checking API Health at ${API_URL}...`);
        const res = await axios.get(`${API_URL}/analytics/overview`, {
            headers: { Authorization: 'Bearer DEBUG_BYPASS' } // Note: This assumes a bypass or local test mode
        });
        console.log('✅ API Health: SUCCESSFUL');
    } catch (err) {
        if (err.response && err.response.status === 401) {
            console.log('✅ API Health: REACHABLE (Auth Required)');
        } else {
            console.error('❌ API Health: UNREACHABLE/FAILED');
            console.error(err.message);
        }
    }

    console.log('\n✅ Verification Complete.');
    process.exit(0);
}

verifySystem();
