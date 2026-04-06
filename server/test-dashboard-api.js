import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

const API = `http://localhost:${process.env.PORT || 3000}`;

// Note: This script assumes you have a valid admin token or can bypass auth for testing
// In a real scenario, you'd log in first.
const endpoints = [
    '/api/analytics/overview',
    '/api/analytics/completion-trend',
    '/api/analytics/task-aging',
    '/api/analytics/role-distribution',
    '/api/analytics/performance',
    '/api/analytics/workload',
    '/api/analytics/activity'
];

async function testEndpoints() {
    console.log(`🚀 Testing Analytics Endpoints on ${API}...\n`);

    for (const endpoint of endpoints) {
        try {
            const res = await fetch(`${API}${endpoint}`, {
                headers: { 'Authorization': 'Bearer ' + process.env.TEST_TOKEN } // Set this in .env for local testing
            });
            const data = await res.json();

            if (res.ok) {
                console.log(`✅ ${endpoint}: OK`);
                if (endpoint === '/api/analytics/overview') {
                    console.log('   Data check:', !!data.radarData ? 'HAS RADAR' : 'MISSING RADAR');
                }
            } else {
                console.log(`❌ ${endpoint}: FAILED (${res.status}) - ${data.message || 'Unknown error'}`);
            }
        } catch (err) {
            console.log(`❌ ${endpoint}: ERROR - ${err.message}`);
        }
    }
}

testEndpoints();
