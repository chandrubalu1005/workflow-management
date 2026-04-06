import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000/api';

const routes = [
    '/auth/login',
    '/users',
    '/tasks',
    '/logs',
    '/notes',
    '/reports',
    '/projects',
    '/teams',
    '/analytics',
    '/notifications',
    '/settings',
    '/templates',
    '/performance',
    '/goals',
    '/comments'
];

async function verifyRoutes() {
    console.log(`Starting verification at ${new Date().toISOString()}`);
    for (const route of routes) {
        try {
            const res = await fetch(`${BASE_URL}${route}`, {
                method: route.endsWith('login') ? 'POST' : 'GET',
                headers: { 'Content-Type': 'application/json' },
                body: route.endsWith('login') ? JSON.stringify({ email: 'test@test.com', password: 'pass', intendedRole: 'user' }) : undefined
            });
            console.log(`[${res.status}] ${route} - ${res.statusText}`);
            if (route.endsWith('login')) {
                const data = await res.json();
                console.log(`  Login Result: ${data.user?.role || 'No Role Found'}`);
            }
        } catch (err) {
            console.log(`[ERR] ${route} - ${err.message}`);
        }
    }
}

verifyRoutes();
