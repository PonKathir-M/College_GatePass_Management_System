require('dotenv').config({ path: 'backend/.env' });
const { sequelize } = require('./backend/src/models');
const adminController = require('./backend/src/controllers/adminController');

const mockRes = {
    json: (data) => console.log("Success:", JSON.stringify(data, null, 2)),
    status: (code) => {
        console.log("Status set to:", code);
        return { json: (data) => console.log(`Error ${code}:`, data) };
    }
};

const mockNext = (err) => console.error("Next called with error:", err);

(async () => {
    try {
        console.log("Connecting to DB...");
        await sequelize.authenticate();
        console.log("DB Connected.");

        console.log("Testing analytics...");
        await adminController.analytics({}, mockRes, mockNext);
        console.log("Analytics test done.");
        process.exit(0);
    } catch (e) {
        console.error("Critical failure in script:", e);
        process.exit(1);
    }
})();
