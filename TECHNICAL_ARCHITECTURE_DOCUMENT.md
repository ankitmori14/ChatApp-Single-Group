# Technical Architecture & Functional Flow Documentation

## Executive Summary

This document provides a comprehensive overview of the Call App Backend - a real-time communication platform built with Node.js, Express, MongoDB, and Socket.IO. The application supports user authentication, direct messaging, group management, video/audio calling via WebRTC, and push notifications with end-to-end AES-128 message encryption.

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Technology Stack](#technology-stack)
3. [Application Flow](#application-flow)
4. [Core Components](#core-components)
5. [Data Models](#data-models)
6. [Security Architecture](#security-architecture)
7. [Logging & Monitoring](#logging--monitoring)
8. [API Architecture](#api-architecture)
9. [Real-Time Communication](#real-time-communication)
10. [Deployment Architecture](#deployment-architecture)

---

## 1. System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                             │
│  (Web/Mobile Apps - Angular, React, React Native, etc.)        │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Gateway Layer                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   REST API   │  │  Socket.IO   │  │   Swagger    │         │
│  │   Endpoints  │  │   WebSocket  │  │     Docs     │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Middleware Layer                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │     CORS     │  │     Auth     │  │  Validation  │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Controller Layer                              │
│  (Request Handling, Response Formatting)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │     User     │  │    Group     │  │     Log      │         │
│  │  Controller  │  │  Controller  │  │  Controller  │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Service Layer                                │
│  (Business Logic, Data Processing, Logging)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │     User     │  │    Group     │  │  Encryption  │         │
│  │   Service    │  │   Service    │  │   Service    │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Message    │  │     Push     │  │    Logger    │         │
│  │   Service    │  │Notification  │  │   Wrapper    │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Data Layer                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   MongoDB    │  │  File System │  │   Winston    │         │
│  │   Database   │  │  (Log Files) │  │   Logger     │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

### Architectural Patterns

1. **Layered Architecture**: Clear separation of concerns across layers
2. **MVC Pattern**: Model-View-Controller for API endpoints
3. **Service Layer Pattern**: Business logic encapsulation
4. **Repository Pattern**: Data access abstraction through Mongoose
5. **Middleware Pattern**: Request/response processing pipeline
6. **Observer Pattern**: Real-time event handling with Socket.IO

---

## 2. Technology Stack

### Backend Framework
- **Node.js** (v14+): JavaScript runtime
- **Express.js**: Web application framework
- **Socket.IO**: Real-time bidirectional communication

### Database
- **MongoDB**: NoSQL document database
- **Mongoose**: ODM (Object Data Modeling) library

### Authentication & Security
- **JWT (jsonwebtoken)**: Token-based authentication
- **bcrypt/bcryptjs**: Password hashing
- **Node.js Crypto**: AES-128-CBC encryption for messages

### Logging & Monitoring
- **Winston**: Logging library
- **winston-daily-rotate-file**: Log file rotation
- **winston-mongodb**: MongoDB transport for logs

### Validation & Documentation
- **express-validator**: Input validation
- **Swagger UI**: API documentation

### Push Notifications
- **web-push**: Web Push protocol implementation

### Development Tools
- **nodemon**: Auto-restart during development
- **dotenv**: Environment variable management

---

## 3. Application Flow

### Application Initialization Flow

```
1. Load Environment Variables (dotenv)
   ↓
2. Initialize Database Connection (MongoDB)
   ↓
3. Create Database Indexes
   ↓
4. Initialize Winston Logger
   ↓
5. Configure Express App
   ↓
6. Setup Middleware (CORS, Body Parser, Auth)
   ↓
7. Configure Web Push (VAPID keys)
   ↓
8. Mount Routes (User, Group, Logs)
   ↓
9. Setup Swagger Documentation
   ↓
10. Create HTTP Server
   ↓
11. Initialize Socket.IO
   ↓
12. Start Server (Listen on PORT)
```

### Request Processing Flow

#### REST API Request Flow
```
Client Request
   ↓
Express Router
   ↓
CORS Middleware
   ↓
Body Parser Middleware
   ↓
Authentication Middleware (if required)
   ↓
Validation Middleware
   ↓
Controller (Request Handler)
   ↓
Service Layer (Business Logic + Logging)
   ↓
Model/Database (Data Access)
   ↓
Service Layer (Process Result)
   ↓
Controller (Format Response)
   ↓
Response Service (Standardized Response)
   ↓
Client Response
```

#### Socket.IO Event Flow
```
Client Socket Connection
   ↓
Socket.IO Server
   ↓
Connection Event Handler
   ↓
User Joins Room
   ↓
Event Listeners Registered
   ↓
Client Emits Event (e.g., sendMessage)
   ↓
Server Event Handler
   ↓
Service Layer (Process + Encrypt)
   ↓
Database (Store Message)
   ↓
Emit to Target Socket(s)
   ↓
Client Receives Event
```

---

## 4. Core Components

### 4.1 Entry Point (`index.js`)

**Purpose**: Application bootstrap and server initialization

**Key Responsibilities**:
- Load database connection
- Configure Express application
- Setup middleware (CORS, body parser)
- Initialize Web Push with VAPID keys
- Mount API routes
- Setup Swagger documentation
- Create HTTP server
- Initialize Socket.IO
- Start server on configured PORT

**Code Flow**:
```javascript
1. Require database connection (auto-connects)
2. Create Express app
3. Configure Web Push
4. Apply middleware
5. Mount routes
6. Create HTTP server
7. Attach Socket.IO
8. Listen on PORT
```

### 4.2 Database Connection (`config/dbConnection.js`)

**Purpose**: MongoDB connection management and index creation

**Key Features**:
- Automatic connection on module load
- Connection event handlers (connected, error)
- Automatic index creation for all models
- Error handling and logging

**Models with Indexes**:
- User
- Group
- GroupJoinRequest
- GroupMemberHistory
- ChatMessage
- Log

### 4.3 Environment Configuration (`environment/environment.js`)

**Purpose**: Centralized environment variable management

**Configuration Categories**:
1. **Server**: PORT
2. **Database**: DB_URL
3. **Authentication**: API_SECRET
4. **Push Notifications**: WEB_PUSH_PUBLIC_KEY, WEB_PUSH_PRIVATE_KEY
5. **Encryption**: ENCRYPTION_KEY (16 characters for AES-128)
6. **Group Management**: MAX_GROUP_MEMBERS_DEFAULT, COOLDOWN_PERIOD_HOURS
7. **Messaging**: MAX_MESSAGE_LENGTH
8. **Logging**: LOG_LEVEL

### 4.4 Middleware Layer

#### Authentication Middleware (`middleware/authenticate.js`)

**Purpose**: JWT token validation and user authentication

**Flow**:
```
1. Extract Authorization header
2. Extract Bearer token
3. Verify JWT token with API_SECRET
4. Decode user ID from token
5. Query database for user
6. Attach user object to request
7. Call next() or return error
```

**Error Handling**:
- Missing Authorization header → 401
- Missing token → 404
- Invalid/expired token → 401
- User not found → 404
- Server error → 500

#### Validation Middleware (`validation/`)

**Purpose**: Input validation using express-validator

**Validators**:
- `user.middleware.js`: User registration, login validation
- `group.middleware.js`: Group creation, management validation

**Validation Flow**:
```
1. Define validation rules (express-validator)
2. Apply to route
3. Check validation result in bodyvalidator.service
4. Return first error or proceed
```

### 4.5 Controller Layer

**Purpose**: Handle HTTP requests and responses

**Controllers**:
1. **user.controller.js**: User management endpoints
2. **group.controller.js**: Group management endpoints
3. **log.controller.js**: Log query endpoints

**Responsibilities**:
- Parse request parameters
- Call appropriate service functions
- Handle errors
- Format responses using response.service

### 4.6 Service Layer

**Purpose**: Business logic implementation with comprehensive logging

**Services**:

1. **user.service.js**
   - User CRUD operations
   - Chat history retrieval
   - Message decryption

2. **group.service.js**
   - Group CRUD operations
   - Member management (add, remove, ban)
   - Ownership transfer
   - Capacity and cooldown checks
   - Member history tracking

3. **groupJoinRequest.service.js**
   - Join request creation
   - Request approval/decline
   - Pending request queries

4. **groupMessage.service.js**
   - Group message sending
   - Message history retrieval
   - Message deletion

5. **encryption.service.js**
   - AES-128-CBC encryption
   - Message decryption
   - Key management

6. **push-notification.service.js**
   - Web Push notification sending
   - Endpoint validation

7. **response.service.js**
   - Standardized response formatting
   - Status code-based logging

8. **socket.service.js**
   - Socket.IO event handling
   - Real-time message delivery
   - WebRTC signaling

9. **log.service.js**
   - Log querying with filters
   - Log statistics and aggregations
   - Old log cleanup

**Service Pattern**:
All services use the logger wrapper for automatic logging:
```javascript
const wrappedFunction = logServiceExecution(
  'ServiceName',
  'functionName',
  async (params) => {
    // Business logic
  },
  { sensitiveFields: ['password'] }
);
```

---

## 5. Data Models

### 5.1 User Model (`models/user.model.js`)

**Schema**:
```javascript
{
  username: String (required),
  email: String (required, unique),
  password: String (required, hashed),
  profileImage: String,
  isAvatarImageSet: Boolean,
  is_google_login: Boolean,
  is_facebook_login: Boolean,
  isOnline: Boolean,
  push_notification_endpoint: Object,
  timestamps: true
}
```

**Methods**:
- `generateAuthToken()`: Creates JWT token with 30-day expiration

**Indexes**:
- email (unique)

### 5.2 Group Model (`models/group.model.js`)

**Schema**:
```javascript
{
  name: String (required, 3-50 chars),
  type: String (enum: ['private', 'open']),
  owner: ObjectId (ref: 'user'),
  members: [ObjectId] (ref: 'user'),
  bannedUsers: [ObjectId] (ref: 'user'),
  maxMembers: Number (min: 2, null = unlimited),
  timestamps: true
}
```

**Instance Methods**:
- `isMember(userId)`: Check if user is member
- `isOwner(userId)`: Check if user is owner
- `isBanned(userId)`: Check if user is banned
- `hasCapacity()`: Check if group can accept new members
- `canUserJoin(userId)`: Comprehensive join eligibility check

**Hooks**:
- Pre-save: Ensure owner is in members array

**Indexes**:
- owner
- members
- type

### 5.3 ChatMessage Model (`models/chatMessage.model.js`)

**Schema**:
```javascript
{
  message: String (required, encrypted),
  fromUser: ObjectId (ref: 'user', required),
  toUser: ObjectId (ref: 'user'),
  group: ObjectId (ref: 'Group'),
  messageType: String (enum: ['direct', 'group']),
  timestamps: true
}
```

**Validation**:
- Direct messages require toUser
- Group messages require group
- Cannot have both toUser and group

**Indexes**:
- fromUser + toUser (direct messages)
- group + createdAt (group messages)

### 5.4 GroupJoinRequest Model

**Schema**:
```javascript
{
  user: ObjectId (ref: 'user'),
  group: ObjectId (ref: 'Group'),
  status: String (enum: ['pending', 'approved', 'declined']),
  requestedAt: Date,
  processedAt: Date,
  processedBy: ObjectId (ref: 'user')
}
```

### 5.5 GroupMemberHistory Model

**Schema**:
```javascript
{
  user: ObjectId (ref: 'user'),
  group: ObjectId (ref: 'Group'),
  action: String (enum: ['joined', 'left', 'banished']),
  performedBy: ObjectId (ref: 'user'),
  timestamp: Date
}
```

**Purpose**: Track member actions for cooldown enforcement

### 5.6 Log Model (`models/log.model.js`)

**Schema**:
```javascript
{
  level: String (enum: ['error', 'warn', 'info', 'debug']),
  message: String,
  timestamp: Date,
  service: String,
  function: String,
  action: String (enum: ['START', 'END', 'ERROR']),
  duration: Number,
  params: Mixed,
  result: String,
  error: { message, stack },
  meta: Mixed,
  timestamps: true
}
```

**Indexes**:
- timestamp (descending)
- level + timestamp
- service + timestamp
- TTL index (30 days)

---

## 6. Security Architecture

### 6.1 Authentication Flow

```
User Registration:
1. Validate input (email, password, username)
2. Hash password with bcrypt (10 rounds)
3. Store user in database
4. Generate JWT token (30-day expiration)
5. Return user data + token

User Login:
1. Validate credentials
2. Find user by email
3. Compare password with bcrypt
4. Generate JWT token
5. Update isOnline status
6. Return user data + token

Protected Route Access:
1. Extract Bearer token from Authorization header
2. Verify JWT signature with API_SECRET
3. Decode user ID
4. Query database for user
5. Attach user to request object
6. Proceed to controller
```

### 6.2 Message Encryption

**Algorithm**: AES-128-CBC

**Encryption Flow**:
```
1. Get 16-byte encryption key from environment
2. Generate random 16-byte IV (Initialization Vector)
3. Create cipher with algorithm, key, IV
4. Encrypt plaintext message
5. Return format: "iv:encryptedData" (both hex-encoded)
```

**Decryption Flow**:
```
1. Split encrypted string by ':'
2. Extract IV and encrypted data
3. Create decipher with algorithm, key, IV
4. Decrypt data
5. Return plaintext message
```

**Security Features**:
- Unique IV per message (prevents pattern analysis)
- 128-bit encryption strength
- Secure key storage in environment variables
- Automatic encryption/decryption in services

### 6.3 Input Validation

**Validation Layers**:
1. **express-validator**: Schema-based validation
2. **Mongoose**: Schema validation
3. **Custom validators**: Business rule validation

**Validated Fields**:
- Email format
- Password strength
- Username length
- Group name length
- Message length
- Enum values (group type, message type)

### 6.4 Security Best Practices

1. **Password Security**:
   - bcrypt hashing with salt rounds
   - Never store plaintext passwords
   - Password excluded from API responses

2. **Token Security**:
   - JWT with expiration (30 days)
   - Secure secret key
   - Token verification on every protected route

3. **Data Protection**:
   - Message encryption at rest
   - Sensitive data filtering in logs
   - CORS configuration

4. **MongoDB Security**:
   - Mongoose query sanitization
   - Injection prevention
   - Connection string security

---

## 7. Logging & Monitoring

### 7.1 Winston Logger Architecture

**Components**:
1. **Logger Configuration** (`utils/logger.js`)
2. **Logger Wrapper** (`utils/loggerWrapper.js`)
3. **Sensitive Data Filter** (`utils/sensitiveDataFilter.js`)

**Transports**:
1. **Console**: Development environment (colorized)
2. **File (error.log)**: Error-level logs with rotation
3. **File (combined.log)**: All logs with rotation
4. **MongoDB**: All logs in database

**Log Levels**:
- `error`: Critical errors
- `warn`: Warnings and validation failures
- `info`: General information (default)
- `debug`: Detailed debugging information

### 7.2 Logging Flow

```
Service Function Called
   ↓
Logger Wrapper (logServiceExecution)
   ↓
Log Entry (START) → Winston → Transports
   ↓
Filter Sensitive Data
   ↓
Execute Service Function
   ↓
Measure Duration
   ↓
Log Exit (END) → Winston → Transports
   ↓
Return Result

(If Error Occurs)
   ↓
Catch Error
   ↓
Log Error (ERROR) → Winston → Transports
   ↓
Re-throw Error
```

### 7.3 Log Storage

**File Storage**:
- Location: `logs/` directory
- Rotation: 20MB per file
- Retention: 14 days
- Format: Text with timestamps

**MongoDB Storage**:
- Collection: `logs`
- TTL: 30 days (automatic cleanup)
- Indexed: timestamp, level, service
- Format: JSON documents

### 7.4 Log Querying

**API Endpoints**:
- `GET /logs`: Query with filters
- `GET /logs/errors`: Error logs only
- `GET /logs/service/:name`: Service-specific logs
- `GET /logs/slow`: Slow operations
- `GET /logs/stats`: Aggregated statistics

**MongoDB Queries**:
```javascript
// Find errors
db.logs.find({ level: "error" })

// Find slow operations
db.logs.find({ duration: { $gt: 1000 } })

// Statistics by service
db.logs.aggregate([
  { $group: { _id: "$service", count: { $sum: 1 } } }
])
```

---

## 8. API Architecture

### 8.1 RESTful API Design

**Base URL**: `http://localhost:3001`

**API Structure**:
```
/
├── /user
│   ├── POST /register
│   ├── POST /login
│   ├── POST /logout
│   ├── POST /setavatar
│   ├── GET /getavatar
│   ├── GET /allusers
│   ├── GET /chatHistory/:toUser
│   ├── POST /pushNotification
│   └── POST /sendMessageToUser
│
├── /group
│   ├── POST /create
│   ├── GET /my-groups
│   ├── GET /:groupId
│   ├── GET /:groupId/members
│   ├── DELETE /:groupId
│   ├── POST /:groupId/join
│   ├── POST /:groupId/leave
│   ├── POST /:groupId/banish
│   ├── POST /:groupId/transfer
│   ├── GET /:groupId/requests
│   ├── POST /:groupId/approve
│   ├── POST /:groupId/decline
│   ├── POST /:groupId/message
│   └── GET /:groupId/messages
│
└── /logs
    ├── GET /
    ├── GET /errors
    ├── GET /service/:serviceName
    ├── GET /slow
    └── GET /stats
```

### 8.2 Response Format

**Success Response**:
```json
{
  "status": true,
  "message": "Success message",
  "data": { /* response data */ }
}
```

**Error Response**:
```json
{
  "status": false,
  "message": "Error message",
  "data": null
}
```

### 8.3 HTTP Status Codes

- **200**: Success
- **201**: Created
- **400**: Bad Request (validation errors)
- **401**: Unauthorized (authentication required)
- **403**: Forbidden (insufficient permissions)
- **404**: Not Found
- **409**: Conflict (duplicate, capacity, cooldown)
- **500**: Internal Server Error

---

## 9. Real-Time Communication

### 9.1 Socket.IO Architecture

**Connection Flow**:
```
Client Connects
   ↓
Socket.IO Server
   ↓
Connection Event Fired
   ↓
User Count Incremented
   ↓
Event Listeners Registered
   ↓
User Joins Room(s)
   ↓
Ready for Real-Time Communication
```

### 9.2 Socket Events

**Direct Messaging**:
- `room`: Join user room
- `sendMessage`: Send direct message
- `receiveMessage`: Receive direct message

**Group Messaging**:
- `joinGroupRoom`: Join group room
- `leaveGroupRoom`: Leave group room
- `sendGroupMessage`: Send group message
- `receiveGroupMessage`: Receive group message
- `groupMemberJoined`: Member joined notification
- `groupMemberLeft`: Member left notification

**WebRTC Signaling**:
- `callInit`: Initiate call
- `ready`: Ready for connection
- `candidate`: ICE candidate exchange
- `offer`: SDP offer
- `answer`: SDP answer
- `callendFromCaller`: Caller ended call
- `callendFromReceiver`: Receiver ended call
- `receiverPickUpCall`: Call answered

**User Status**:
- `userConnect`: User came online
- `userDisconnect`: User went offline

### 9.3 Room Management

**Direct Message Rooms**:
- Room ID: User's MongoDB ObjectId
- Purpose: Receive direct messages

**Group Rooms**:
- Room ID: `group_${groupId}`
- Purpose: Receive group messages and notifications
- Membership verification required

---

## 10. Deployment Architecture

### 10.1 Environment Setup

**Development**:
```
- NODE_ENV=development
- LOG_LEVEL=debug
- Console + File + MongoDB logging
- CORS: Allow all origins
```

**Production**:
```
- NODE_ENV=production
- LOG_LEVEL=info
- File + MongoDB logging only
- CORS: Specific origins
- HTTPS enabled
- Rate limiting
```

### 10.2 Deployment Checklist

1. **Environment Variables**:
   - Set strong API_SECRET
   - Set 16-character ENCRYPTION_KEY
   - Configure DB_URL (MongoDB Atlas)
   - Set VAPID keys for push notifications
   - Set LOG_LEVEL appropriately

2. **Database**:
   - MongoDB Atlas cluster
   - Database indexes created
   - Backup strategy
   - Connection pooling

3. **Security**:
   - HTTPS/TLS enabled
   - CORS configured for specific origins
   - Rate limiting implemented
   - Input validation enabled

4. **Monitoring**:
   - Log aggregation service
   - Error tracking (Sentry)
   - Performance monitoring
   - Uptime monitoring

5. **Scaling**:
   - Load balancer
   - Multiple server instances
   - Redis for Socket.IO (multi-server)
   - CDN for static assets

### 10.3 Performance Optimization

1. **Database**:
   - Proper indexing
   - Query optimization
   - Connection pooling
   - Aggregation pipelines

2. **Caching**:
   - Redis for session data
   - Cache frequently accessed data
   - CDN for static content

3. **Logging**:
   - Async logging (non-blocking)
   - Log rotation
   - Appropriate log levels
   - MongoDB TTL indexes

4. **Code**:
   - Async/await patterns
   - Error handling
   - Memory leak prevention
   - Efficient algorithms

---

## Conclusion

This Call App Backend demonstrates a well-architected, scalable, and secure real-time communication platform. Key strengths include:

1. **Layered Architecture**: Clear separation of concerns
2. **Comprehensive Logging**: Winston with MongoDB storage
3. **Security**: JWT authentication, AES-128 encryption, input validation
4. **Real-Time**: Socket.IO for instant messaging and WebRTC signaling
5. **Scalability**: MongoDB, proper indexing, efficient queries
6. **Maintainability**: Service layer pattern, comprehensive documentation
7. **Monitoring**: Detailed logging, API for log queries, statistics

The system is production-ready with proper error handling, security measures, and monitoring capabilities.
