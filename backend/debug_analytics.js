require('dotenv').config({ path: 'backend/.env' });
const adminController = require('./src/controllers/adminController');

const mockRes = {
    json: (data) => console.log("Success:", JSON.stringify(data, null, 2)),
    status: (code) => ({ json: (data) => console.log(`Error ${code}:`, data) })
};

const mockNext = (err) => console.error("Next called with error:", err);

(async () => {
    try {
        console.log("Testing analytics...");
        await adminController.analytics({}, mockRes, mockNext);
        process.exit(0);
    } catch (e) {
        console.error("Critical failure:", e);
        process.exit(1);
    }
})();
