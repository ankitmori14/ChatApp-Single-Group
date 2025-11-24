const dotenv = require("dotenv");
const path = require('path');

dotenv.config({path: path.join(__dirname, '..', '.env')});

module.exports = {
    PORT: process.env.PORT,
    DB_URL: process.env.DB_URL,
    API_SECRET: process.env.API_SECRET,
    WEB_PUSH_PUBLIC_KEY: process.env.WEB_PUSH_PUBLIC_KEY,
    WEB_PUSH_PRIVATE_KEY: process.env.WEB_PUSH_PRIVATE_KEY,
    
    // Message Encryption Configuration
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY, // Must be exactly 16 characters for AES-128
    
    // Group Management Configuration
    MAX_GROUP_MEMBERS_DEFAULT: process.env.MAX_GROUP_MEMBERS_DEFAULT || 100,
    COOLDOWN_PERIOD_HOURS: process.env.COOLDOWN_PERIOD_HOURS || 48,
    MAX_MESSAGE_LENGTH: process.env.MAX_MESSAGE_LENGTH || 5000
}