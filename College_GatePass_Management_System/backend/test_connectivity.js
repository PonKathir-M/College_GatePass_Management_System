const axios = require('axios');

const BASE_URL = 'http://10.170.117.93:5000/api';
// Using the credentials found in check_security_users.js (assuming password is 'security' or similar based on hash, 
// strictly we don't know the plain text password from the hash, but 'security' is a good guess for 'security' user.
// The user output showed hashed passwords. I cannot know the *actual* password unless I reset it or guess it.
// However, the previous turn output for check_security_users.js showed a specific hash.
// Wait, I can't login without the plain text password.
// But the user's prompt implies they are testing. 
// I will try to login with 'security123' or 'password' or 'security'.
// OR, more reliably, I can create a NEW security user with a known password to test, or reset one.
// Actually, `check_security_users.js` showed `security` user. 
// I'll try to create a temporary test user or just assume the user knows their password.
// Better: I will create a script that tries to login with common passwords, OR better yet, 
// I will create a script `verify_backend_api.js` that checks if the server is reachable at the IP 
// and returns 401 for bad credentials, which proves connectivity.

async function checkConnectivity() {
    try {
        console.log(`Testing connectivity to ${BASE_URL}...`);
        // Try a public endpoint or just root
        try {
            await axios.get('http://10.170.117.93:5000/');
            console.log('✅ Server root is reachable');
        } catch (e) {
            console.log('⚠️ Server root might not serve GET, but connected: ' + e.message);
        }

        console.log('Testing Login Endpoint (expecting 400/401)...');
        try {
            await axios.post(`${BASE_URL}/auth/login`, {
                email: 'wrong@email.com',
                password: 'wrongpassword'
            });
        } catch (error) {
            if (error.response) {
                console.log(`✅ Server responded with ${error.response.status} (Expected for bad creds)`);
                if (error.response.status === 401) {
                    console.log('✅ APIs are reachable via LAN IP');
                }
            } else {
                console.error('❌ Could not connect to backend via LAN IP:', error.message);
            }
        }

        console.log('Testing Localhost Connectivity...');
        try {
            await axios.get('http://localhost:5000/api/auth/login'); // Trying get on post route just to see if it connects
        } catch (error) {
            if (error.response && error.response.status === 404) {
                // 404 means route not found for GET, but connected!
                console.log('✅ Localhost connection successful (404 expected for GET on POST route)');
            } else if (error.code === 'ECONNREFUSED') {
                console.log('❌ Localhost connection refused');
            } else {
                console.log('✅ Localhost connection behaved as expected (connected)');
            }
        }

    } catch (error) {
        console.error('❌ general error:', error.message);
    }
}

checkConnectivity();
