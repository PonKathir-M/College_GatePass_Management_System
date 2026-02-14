const fs = require('fs');
const path = require('path');
const twilio = require('twilio');

const getTwilioClient = () => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (accountSid && authToken) {
    return twilio(accountSid, authToken);
  }
  return null;
};

exports.sendSMS = async (phone, message) => {
  try {
    const client = getTwilioClient();
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    // 1. Try sending via Twilio if configured
    if (client && fromNumber) {
      // Ensure E.164 format (Default to +91 if missing)
      let formattedPhone = phone;
      if (!phone.startsWith('+')) {
        formattedPhone = `+91${phone}`;
      }

      await client.messages.create({
        body: message,
        from: fromNumber,
        to: formattedPhone
      });
      console.log(`✅ SMS sent to ${formattedPhone} via Twilio`);
    } else {
      console.log(`⚠️ Twilio not configured. Logging SMS to file.`);
    }

    // 2. Always log to file for history/debugging
    const logDir = path.join(__dirname, '../../logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    const logFile = path.join(logDir, 'sms.log');
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] To: ${phone} | Msg: ${message}\n`;

    fs.appendFileSync(logFile, logEntry);
    console.log(`📂 SMS logged to ${logFile}`);

  } catch (error) {
    console.error(`❌ Error sending SMS to ${phone}:`, error.message);
  }
};
