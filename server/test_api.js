import fs from 'fs';
import fetch from 'node-fetch';

async function test() {
    try {
        fs.writeFileSync('test_log.txt', 'Fetching API...\n');
        const res = await fetch('http://localhost:5000/api/auth/profile');
        fs.appendFileSync('test_log.txt', 'Response: ' + res.status + '\n');
    } catch(e) {
        fs.appendFileSync('test_log.txt', 'Fetch threw: ' + e.message + '\n');
    }
}
test();
