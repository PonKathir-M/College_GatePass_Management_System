require('dotenv').config();
const { sendSMS } = require('./src/utils/smsService');

async function testSMS() {
    console.log("🚀 Starting SMS Test...");
    console.log("------------------------------------------------");

    const testPhone = process.argv[2] || "+1234567890";
    const testMessage = "This is a test message from GatePass System.";

    console.log(`Target Phone: ${testPhone}`);
    console.log(`Message: "${testMessage}"`);
    console.log("------------------------------------------------");

    if (process.env.TWILIO_ACCOUNT_SID) {
        console.log("✅ Twilio Config Found. Attempting real SMS...");
    } else {
        console.log("⚠️ No Twilio Config. Expecting file log only...");
    }

    await sendSMS(testPhone, testMessage);

    console.log("------------------------------------------------");
    console.log("✅ Test Completed. Check 'backend/logs/sms.log' for details.");
}

testSMS();
