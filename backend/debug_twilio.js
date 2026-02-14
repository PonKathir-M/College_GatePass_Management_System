require('dotenv').config();
const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

if (!accountSid || !authToken || !fromNumber) {
    console.error("❌ Missing Twilio credentials in .env file");
    process.exit(1);
}

const client = twilio(accountSid, authToken);
const toDropdown = process.argv[2];

if (!toDropdown) {
    console.log("Usage: node debug_twilio.js <verified_phone_number_with_country_code>");
    console.log("Example: node debug_twilio.js +919876543210");
    process.exit(1);
}

console.log(`\n🔍 Debugging Twilio SMS...`);
console.log(`--------------------------------`);
console.log(`From: ${fromNumber}`);
console.log(`To:   ${toDropdown}`);
console.log(`SID:  ${accountSid.substring(0, 6)}...`);
console.log(`--------------------------------\n`);

client.messages
    .create({
        body: 'Test SMS from GatePass Debugger',
        from: fromNumber,
        to: toDropdown
    })
    .then(message => {
        console.log(`✅ Success! SID: ${message.sid}`);
        console.log(`   Status: ${message.status}`);
    })
    .catch(error => {
        console.error(`❌ Failed to send SMS:`);
        console.error(`   Code: ${error.code}`);
        console.error(`   Message: ${error.message}`);
        console.error(`   More Info: ${error.moreInfo}`);

        if (error.code === 21608) {
            console.log("\n💡 TIP: Since you have a Trial Account, you can only send to Verified Caller IDs.");
            console.log("   Verify this number here: https://console.twilio.com/us1/develop/phone-numbers/manage/verified");
        }
        if (error.code === 21211) {
            console.log("\n💡 TIP: Invalid Phone Number. Make sure to include the Country Code (e.g., +1 or +91).");
        }
    });
