import fetch from 'node-fetch';

async function test() {
    try {
        console.log("Logging in...");
        const loginRes = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({email: 'chandru.it23@bitsathy.ac.in', password: 'Bitsathy@123'})
        });
        const loginData = await loginRes.json();
        const token = loginData.token;
        console.log("Login token:", token ? "OK" : loginData);

        if (token) {
            console.log("Fetching dashboard stats...");
            const statsRes = await fetch('http://localhost:3000/api/reports/dashboard-stats', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const text = await statsRes.text();
            console.log("Stats Status:", statsRes.status);
            console.log("Stats Body:", text);
        }
    } catch(e) {
        console.error("Fetch threw:", e.message);
    }
}
test();
