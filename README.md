# Complete Setup Guide - Call App Backend

This guide will walk you through setting up the Call App Backend from scratch, including all dependencies, environment configuration, and testing.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation Steps](#installation-steps)
3. [Environment Configuration](#environment-configuration)
4. [Database Setup](#database-setup)
5. [Security Configuration](#security-configuration)
6. [Running the Application](#running-the-application)
7. [Verification](#verification)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

Before starting, ensure you have the following installed:

#### 1. Node.js (v14 or higher)

**Check if installed:**
```bash
node --version
npm --version
```

**Installation:**
- **Windows/Mac**: Download from [nodejs.org](https://nodejs.org/)
- **Linux (Ubuntu/Debian)**:
  ```bash
  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
  sudo apt-get install -y nodejs
  ```

#### 2. MongoDB

**Option A: Local Installation**

- **Windows**: Download from [mongodb.com](https://www.mongodb.com/try/download/community)
- **Mac** (using Homebrew):
  ```bash
  brew tap mongodb/brew
  brew install mongodb-community
  brew services start mongodb-community
  ```
- **Linux (Ubuntu/Debian)**:
  ```bash
  wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
  echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
  sudo apt-get update
  sudo apt-get install -y mongodb-org
  sudo systemctl start mongod
  ```

**Option B: MongoDB Atlas (Cloud - Recommended)**

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account
3. Create a new cluster (free tier available)
4. Get your connection string
5. Whitelist your IP address

#### 3. Git

**Check if installed:**
```bash
git --version
```

**Installation:**
- **Windows**: Download from [git-scm.com](https://git-scm.com/)
- **Mac**: `brew install git`
- **Linux**: `sudo apt-get install git`

---

## Installation Steps

### Step 1: Clone the Repository

```bash
# Clone the repository
git clone https://github.com/ankitmori14/call-app-backend.git

# Navigate to project directory
cd call-app-backend
```

### Step 2: Install Dependencies

```bash
# Install all npm packages
npm install
```

This will install all required packages including:
- express
- mongoose
- socket.io
- jsonwebtoken
- bcrypt
- express-validator
- web-push
- swagger-ui-express
- And more...

**Expected output:**
```
added 200+ packages in 30s
```

---

## Environment Configuration

### Step 1: Create Environment File

```bash
# Copy the example environment file
cp .env.example .env
```

### Step 2: Generate Encryption Key

The application uses AES-128 encryption for messages, which requires a 16-character key.

```bash
# Generate a secure 16-character encryption key
node -e "console.log(require('crypto').randomBytes(16).toString('hex').substring(0, 16))"
```

**Example output:**
```
a1b2c3d4e5f6g7h8
```

Copy this key - you'll need it for the `.env` file.

### Step 3: Generate VAPID Keys

VAPID keys are required for web push notifications.

```bash
# Generate VAPID keys
npx web-push generate-vapid-keys
```

**Example output:**
```
=======================================
Public Key:
BEl62iUYgUivxIkv69yViEuiBIa-Ib27SGeRo...

Private Key:
VCqfP5YQxgu...
=======================================
```

Copy both keys - you'll need them for the `.env` file.

### Step 4: Configure Environment Variables

Open the `.env` file and update all values:

```env
# Server Configuration
PORT=3001

# Database Configuration
# For local MongoDB:
DB_URL=mongodb://localhost:27017/call-app

# For MongoDB Atlas:
# DB_URL=mongodb+srv://username:password@cluster.mongodb.net/call-app?retryWrites=true&w=majority

# JWT Configuration
API_SECRET=your-generated-secret-key-here

# Message Encryption (paste the 16-character key you generated)
ENCRYPTION_KEY=a1b2c3d4e5f6g7h8

# Web Push Notifications (paste the VAPID keys you generated)
WEB_PUSH_PUBLIC_KEY=BEl62iUYgUivxIkv69yViEuiBIa-Ib27SGeRo...
WEB_PUSH_PRIVATE_KEY=VCqfP5YQxgu...

# Group Management (optional - defaults provided)
MAX_GROUP_MEMBERS_DEFAULT=100
COOLDOWN_PERIOD_HOURS=48
MAX_MESSAGE_LENGTH=5000
```

### Step 5: Verify Environment Configuration

Create a simple test script to verify your environment:

```bash
# Test environment variables
node -e "require('dotenv').config(); console.log('PORT:', process.env.PORT); console.log('DB_URL:', process.env.DB_URL ? 'Set' : 'Missing'); console.log('ENCRYPTION_KEY length:', process.env.ENCRYPTION_KEY?.length);"
```

**Expected output:**
```
PORT: 3001
DB_URL: Set
ENCRYPTION_KEY length: 16
```

---

## Database Setup

### Option A: Local MongoDB

1. **Start MongoDB:**
   ```bash
   # Mac (if installed via Homebrew)
   brew services start mongodb-community
   
   # Linux
   sudo systemctl start mongod
   
   # Windows
   # MongoDB should start automatically as a service
   ```

2. **Verify MongoDB is running:**
   ```bash
   # Connect to MongoDB shell
   mongosh
   
   # Or for older versions
   mongo
   ```

3. **Create database (optional - will be created automatically):**
   ```javascript
   use call-app
   ```

### Option B: MongoDB Atlas

1. **Get Connection String:**
   - Log in to MongoDB Atlas
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string

2. **Update .env:**
   ```env
   DB_URL=mongodb+srv://username:password@cluster.mongodb.net/call-app?retryWrites=true&w=majority
   ```
   
   Replace:
   - `username` with your database username
   - `password` with your database password
   - `cluster` with your cluster name

3. **Whitelist IP Address:**
   - In Atlas, go to "Network Access"
   - Click "Add IP Address"
   - Add your current IP or `0.0.0.0/0` for all IPs (development only)

---

## Security Configuration

### 1. Generate Strong Secrets

For production, use strong random values:

```bash
# Generate API_SECRET (32 characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate ENCRYPTION_KEY (16 characters)
node -e "console.log(require('crypto').randomBytes(16).toString('hex').substring(0, 16))"
```

### 2. Secure Your .env File

```bash
# Ensure .env is in .gitignore
echo ".env" >> .gitignore

# Set proper file permissions (Linux/Mac)
chmod 600 .env
```

### 3. CORS Configuration

For production, update CORS settings in `services/socket.service.js`:

```javascript
cors: {
  origin: [
    "https://your-production-domain.com",
    "https://your-staging-domain.com"
  ],
  methods: ["GET", "PATCH", "POST", "HEAD", "OPTIONS"],
  transports: ["websocket"],
}
```

---

## Running the Application

### Development Mode

```bash
# Run with auto-restart on file changes
npm run dev
```

### Production Mode

```bash
# Run without auto-restart
npm start
```

### Expected Console Output

When the server starts successfully, you should see:

```
Database connected!
Database indexes created successfully!
Server is running on 3001
```

---

## Verification

### Step 1: Check Server Health

Open your browser and navigate to:
```
http://localhost:3001
```

You should see:
```json
{
  "message": "Welcome to the API. Visit /api-docs for documentation"
}
```

### Step 2: Access API Documentation

Navigate to:
```
http://localhost:3001/api-docs
```

You should see the Swagger UI with all API endpoints documented.

### Step 3: Test User Registration

Using Swagger UI or curl:

```bash
curl -X POST http://localhost:3001/user/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Expected response:**
```json
{
  "status": true,
  "message": "User registerd",
  "data": {
    "_id": "...",
    "username": "testuser",
    "email": "test@example.com",
    ...
  }
}
```

### Step 4: Test User Login

```bash
curl -X POST http://localhost:3001/user/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Expected response:**
```json
{
  "status": true,
  "message": "Login successfully",
  "data": {
    "userData": { ... },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Step 5: Test Encryption

Create a test script to verify encryption:

```javascript
// test-encryption.js
const { encryptMessage, decryptMessage } = require('./services/encryption.service');

const originalMessage = "Hello, this is a test message!";
console.log("Original:", originalMessage);

const encrypted = encryptMessage(originalMessage);
console.log("Encrypted:", encrypted);

const decrypted = decryptMessage(encrypted);
console.log("Decrypted:", decrypted);

console.log("Match:", originalMessage === decrypted ? "✓ SUCCESS" : "✗ FAILED");
```

Run it:
```bash
node test-encryption.js
```

**Expected output:**
```
Original: Hello, this is a test message!
Encrypted: a1b2c3d4e5f6g7h8:9i0j1k2l3m4n5o6p...
Decrypted: Hello, this is a test message!
Match: ✓ SUCCESS
```

### Step 6: Test Group Creation

Using the token from login:

```bash
curl -X POST http://localhost:3001/group/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "name": "Test Group",
    "type": "open",
    "maxMembers": 10
  }'
```

---

## Troubleshooting

### Issue: "Database connection failed"

**Possible causes:**
1. MongoDB is not running
2. Incorrect DB_URL in .env
3. Network/firewall issues

**Solutions:**
```bash
# Check if MongoDB is running (local)
mongosh

# For Atlas, verify:
# - Connection string is correct
# - IP is whitelisted
# - Username/password are correct
```

### Issue: "ENCRYPTION_KEY must be exactly 16 characters"

**Solution:**
```bash
# Generate a new 16-character key
node -e "console.log(require('crypto').randomBytes(16).toString('hex').substring(0, 16))"

# Update .env with the new key
```

### Issue: "Port 3001 is already in use"

**Solution:**
```bash
# Find process using port 3001
# Mac/Linux:
lsof -i :3001

# Windows:
netstat -ano | findstr :3001

# Kill the process or change PORT in .env
```

### Issue: "Module not found"

**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Issue: "Token expired" or "Unauthorized"

**Solution:**
- Login again to get a new token
- Ensure token is included in Authorization header
- Check API_SECRET hasn't changed

### Issue: "Failed to decrypt message"

**Possible causes:**
1. ENCRYPTION_KEY changed after messages were encrypted
2. Corrupted message data

**Solution:**
- Don't change ENCRYPTION_KEY after encrypting messages
- If key must change, migrate existing messages

### Issue: Swagger UI not loading

**Solution:**
```bash
# Verify swagger packages are installed
npm list swagger-ui-express

# Reinstall if needed
npm install swagger-ui-express --save
```

---

## Next Steps

After successful setup:

1. **Read the Documentation:**
   - [README.md](./README.md) - Complete API documentation
   - [GROUP_MANAGEMENT_README.md](./GROUP_MANAGEMENT_README.md) - Group features

2. **Test All Features:**
   - User registration and login
   - Direct messaging
   - Group creation and management
   - Real-time messaging via Socket.IO

3. **Configure for Production:**
   - Set strong secrets
   - Configure CORS
   - Set up monitoring
   - Enable HTTPS
   - Configure rate limiting

4. **Deploy:**
   - Choose a hosting platform (Render, Heroku, AWS, etc.)
   - Set environment variables on the platform
   - Deploy and test

---

## Support

If you encounter issues not covered in this guide:

1. Check the [README.md](./README.md) for detailed documentation
2. Review error messages in the console
3. Check MongoDB connection and logs
4. Verify all environment variables are set correctly
5. Open an issue on GitHub with:
   - Error message
   - Steps to reproduce
   - Environment details (OS, Node version, etc.)

---

## Quick Reference

### Common Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run production server
npm start

# Generate encryption key
node -e "console.log(require('crypto').randomBytes(16).toString('hex').substring(0, 16))"

# Generate VAPID keys
npx web-push generate-vapid-keys

# Test database connection
mongosh

# Check Node version
node --version

# Check npm version
npm --version
```

### Important URLs

- **API Server**: http://localhost:3001
- **Swagger UI**: http://localhost:3001/api-docs
- **MongoDB Atlas**: https://cloud.mongodb.com
- **Node.js**: https://nodejs.org
- **MongoDB**: https://www.mongodb.com

---

## Checklist

Use this checklist to ensure everything is set up correctly:

- [ ] Node.js installed (v14+)
- [ ] MongoDB installed or Atlas configured
- [ ] Repository cloned
- [ ] Dependencies installed (`npm install`)
- [ ] `.env` file created from `.env.example`
- [ ] Encryption key generated (16 characters)
- [ ] VAPID keys generated
- [ ] All environment variables configured
- [ ] MongoDB running (local) or Atlas connection working
- [ ] Server starts without errors
- [ ] Can access http://localhost:3001
- [ ] Swagger UI loads at /api-docs
- [ ] User registration works
- [ ] User login works
- [ ] Encryption test passes
- [ ] Group creation works

---

**Setup Complete! 🎉**

Your Call App Backend is now ready for development and testing.
