const crypto = require("crypto");
const logger = require("../utils/logger");

// AES-128 requires a 16-byte (128-bit) key
const ALGORITHM = "aes-128-cbc";
const IV_LENGTH = 16; // Initialization vector length

// Get encryption key from environment or use default (should be in .env)
const getEncryptionKey = () => {
  const key = process.env.ENCRYPTION_KEY;
  
  if (!key) {
    logger.warn("WARNING: ENCRYPTION_KEY not set in environment. Using default key. This is NOT secure for production!");
    return Buffer.from("0123456789abcdef"); // 16 bytes for AES-128
  }
  
  // Ensure key is exactly 16 bytes
  const keyBuffer = Buffer.from(key, "utf-8");
  if (keyBuffer.length !== 16) {
    throw new Error("ENCRYPTION_KEY must be exactly 16 characters (128 bits) for AES-128");
  }
  
  return keyBuffer;
};

/**
 * Encrypt a message using AES-128-CBC
 * @param {string} text - Plain text message to encrypt
 * @returns {string} - Encrypted message in format: iv:encryptedData (both hex encoded)
 */
const encryptMessage = (text) => {
  const startTime = Date.now();
  logger.info("Service: EncryptionService | Function: encryptMessage | Action: START");
  
  try {
    if (!text || typeof text !== "string") {
      throw new Error("Text to encrypt must be a non-empty string");
    }
    
    const key = getEncryptionKey();
    
    // Generate random initialization vector
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    // Encrypt the text
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    
    // Return IV and encrypted data (both hex encoded) separated by ':'
    const result = iv.toString("hex") + ":" + encrypted;
    
    const duration = Date.now() - startTime;
    logger.info(`Service: EncryptionService | Function: encryptMessage | Action: END | Duration: ${duration}ms`);
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`Service: EncryptionService | Function: encryptMessage | Action: ERROR | Duration: ${duration}ms | Message: ${error.message}`, { stack: error.stack });
    throw new Error("Failed to encrypt message");
  }
};

/**
 * Decrypt a message using AES-128-CBC
 * @param {string} encryptedText - Encrypted message in format: iv:encryptedData
 * @returns {string} - Decrypted plain text message
 */
const decryptMessage = (encryptedText) => {
  const startTime = Date.now();
  logger.info("Service: EncryptionService | Function: decryptMessage | Action: START");
  
  try {
    if (!encryptedText || typeof encryptedText !== "string") {
      throw new Error("Encrypted text must be a non-empty string");
    }
    
    const key = getEncryptionKey();
    
    // Split IV and encrypted data
    const parts = encryptedText.split(":");
    if (parts.length !== 2) {
      throw new Error("Invalid encrypted message format");
    }
    
    const iv = Buffer.from(parts[0], "hex");
    const encryptedData = parts[1];
    
    // Validate IV length
    if (iv.length !== IV_LENGTH) {
      throw new Error("Invalid initialization vector");
    }
    
    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    
    // Decrypt the data
    let decrypted = decipher.update(encryptedData, "hex", "utf8");
    decrypted += decipher.final("utf8");
    
    const duration = Date.now() - startTime;
    logger.info(`Service: EncryptionService | Function: decryptMessage | Action: END | Duration: ${duration}ms`);
    
    return decrypted;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`Service: EncryptionService | Function: decryptMessage | Action: ERROR | Duration: ${duration}ms | Message: ${error.message}`, { stack: error.stack });
    throw new Error("Failed to decrypt message");
  }
};

/**
 * Generate a random 16-byte encryption key (for setup)
 * @returns {string} - Random 16-character key
 */
const generateEncryptionKey = () => {
  return crypto.randomBytes(16).toString("hex").substring(0, 16);
};

module.exports = {
  encryptMessage,
  decryptMessage,
  generateEncryptionKey,
};
