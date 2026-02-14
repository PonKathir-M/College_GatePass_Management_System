require('dotenv').config({ path: 'backend/.env' }); // Adjust path if needed, trying backend/.env or .env
const path = require('path');
// If running from root, path might be 'backend/.env'
// If running from backend dir, path might be '.env'
// Let's try to load from backend/.env first if running from root

const adminController = require('./src/controllers/adminController');

const mockRes = {
    json: (data) => console.log("Success:", JSON.stringify(data, null, 2)),
    status: (code) => ({ json: (data) => console.log(`Error ${code}:`, data) })
};

const mockNext = (err) => console.error("Next called with error:", err);

(async () => {
    try {
        console.log("Testing getDashboardStats...");
        await adminController.getDashboardStats({}, mockRes, mockNext);
        process.exit(0);
    } catch (e) {
        console.error("Critical failure:", e);
        process.exit(1);
    }
})();
