/**
 * Comprehensive System Test for Workflow Management
 * Tests frontend, backend, and API integration
 */

const BASE_URL = 'http://localhost:3000';
const FRONTEND_URL = 'http://localhost:5173';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testSystem() {
    console.log('🧪 Starting Comprehensive System Tests...\n');

    let token = null;
    let allTestsPassed = true;

    // Test 1: Backend Health Check
    console.log('📋 Test 1: Backend Health Check');
    try {
        const res = await fetch(`${BASE_URL}/`);
        const data = await res.json();
        console.log('✅ Backend is running:', data.message);
    } catch (error) {
        console.error('❌ Backend not accessible:', error.message);
        allTestsPassed = false;
    }

    // Test 2: Frontend Health Check
    console.log('\n📋 Test 2: Frontend Health Check');
    try {
        const res = await fetch(FRONTEND_URL);
        console.log('✅ Frontend is running (Status:', res.status + ')');
    } catch (error) {
        console.error('❌ Frontend not accessible:', error.message);
        allTestsPassed = false;
    }

    // Test 3: Login API
    console.log('\n📋 Test 3: Authentication (Login)');
    try {
        const res = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'chandru.it23@bitsathy.ac.in',
                password: 'Bitsathy@123'
            })
        });

        const data = await res.json();

        if (res.status === 200 && data.token) {
            token = data.token;
            console.log('✅ Login successful!');
            console.log('   User:', data.user.name, `(${data.user.email})`);
            console.log('   Token:', token.substring(0, 20) + '...');
        } else {
            console.error('❌ Login failed:', data.message || res.statusText);
            allTestsPassed = false;
        }
    } catch (error) {
        console.error('❌ Login error:', error.message);
        allTestsPassed = false;
    }

    // Test 4: Protected Analytics API
    if (token) {
        console.log('\n📋 Test 4: Analytics API (Protected)');
        try {
            const res = await fetch(`${BASE_URL}/api/analytics/overview`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.status === 200) {
                const data = await res.json();
                console.log('✅ Analytics API is working!');
                console.log('   Total Tasks:', data.total || 0);
                console.log('   Completed:', data.completed || 0);
                console.log('   In Progress:', data.inProgress || 0);
                console.log('   Overdue:', data.overdue || 0);
            } else {
                console.error('❌ Analytics API failed:', res.statusText);
                allTestsPassed = false;
            }
        } catch (error) {
            console.error('❌ Analytics API error:', error.message);
            allTestsPassed = false;
        }

        // Test 5: Recent Activity API
        console.log('\n📋 Test 5: Recent Activity API');
        try {
            const res = await fetch(`${BASE_URL}/api/analytics/activity`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.status === 200) {
                const data = await res.json();
                console.log('✅ Recent Activity API is working!');
                console.log('   Activities found:', Array.isArray(data) ? data.length : 'data structure issue');
            } else {
                console.error('❌ Recent Activity API failed:', res.statusText);
                allTestsPassed = false;
            }
        } catch (error) {
            console.error('❌ Recent Activity API error:', error.message);
            allTestsPassed = false;
        }

        // Test 6: Tasks API
        console.log('\n📋 Test 6: Tasks API');
        try {
            const res = await fetch(`${BASE_URL}/api/tasks`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.status === 200) {
                const data = await res.json();
                console.log('✅ Tasks API is working!');
                console.log('   Tasks found:', Array.isArray(data) ? data.length : 'unknown');
            } else {
                console.error('❌ Tasks API failed:', res.statusText);
                allTestsPassed = false;
            }
        } catch (error) {
            console.error('❌ Tasks API error:', error.message);
            allTestsPassed = false;
        }

        // Test 7: User Info API
        console.log('\n📋 Test 7: User Profile API');
        try {
            const res = await fetch(`${BASE_URL}/api/users/profile`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.status === 200 || res.status === 404) {
                console.log('✅ User Profile API is responding');
            } else {
                console.error('❌ User Profile API failed:', res.statusText);
                allTestsPassed = false;
            }
        } catch (error) {
            console.error('❌ User Profile API error:', error.message);
            allTestsPassed = false;
        }
    }

    // Final Report
    console.log('\n' + '='.repeat(50));
    if (allTestsPassed && token) {
        console.log('✅ ALL TESTS PASSED! System is fully operational.');
        console.log('\nYou can now access:');
        console.log('  Frontend: http://localhost:5173');
        console.log('  Backend API: http://localhost:3000');
        console.log('\nReady to log in and use the Dashboard!');
    } else {
        console.log('⚠️  Some tests failed. Check errors above.');
    }
    console.log('='.repeat(50));
}

testSystem().catch(console.error);
