# Functional Flow Diagrams

## Table of Contents
1. [User Authentication Flows](#user-authentication-flows)
2. [Direct Messaging Flows](#direct-messaging-flows)
3. [Group Management Flows](#group-management-flows)
4. [Group Messaging Flows](#group-messaging-flows)
5. [WebRTC Calling Flows](#webrtc-calling-flows)
6. [Logging Flows](#logging-flows)

---

## 1. User Authentication Flows

### 1.1 User Registration Flow

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant Validator
    participant Controller
    participant Service
    participant Database
    participant Logger

    Client->>API: POST /user/register
    API->>Validator: Validate input
    Validator-->>API: Validation result
    
    alt Validation Failed
        API-->>Client: 400 Bad Request
    else Validation Passed
        API->>Controller: userRegister()
        Controller->>Service: createUserService()
        Service->>Logger: Log START
        Service->>Service: Hash password (bcrypt)
        Service->>Database: Create user
        Database-->>Service: User created
        Service->>Service: Generate JWT token
        Service->>Logger: Log END
        Service-->>Controller: User + Token
        Controller-->>Client: 200 Success
    end
```

### 1.2 User Login Flow

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant Controller
    participant Service
    participant Database
    participant Logger

    Client->>API: POST /user/login
    API->>Controller: userLogin()
    Controller->>Service: userFindOneService()
    Service->>Logger: Log START
    Service->>Database: Find user by email
    Database-->>Service: User data
    
    alt User Not Found
        Service->>Logger: Log END
        Service-->>Controller: null
        Controller-->>Client: 404 User not found
    else User Found
        Service->>Service: Compare password (bcrypt)
        
        alt Password Invalid
            Service->>Logger: Log END
            Service-->>Controller: Invalid
            Controller-->>Client: 401 Invalid credentials
        else Password Valid
            Service->>Service: Generate JWT token
            Service->>Database: Update isOnline = true
            Service->>Logger: Log END
            Service-->>Controller: User + Token
            Controller-->>Client: 200 Success
        end
    end
```

### 1.3 Protected Route Access Flow

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant AuthMiddleware
    participant Database
    participant Controller

    Client->>API: Request with Bearer Token
    API->>AuthMiddleware: authenticate()
    
    alt No Authorization Header
        AuthMiddleware-->>Client: 401 Unauthorized
    else Has Authorization Header
        AuthMiddleware->>AuthMiddleware: Extract token
        AuthMiddleware->>AuthMiddleware: Verify JWT
        
        alt Token Invalid/Expired
            AuthMiddleware-->>Client: 401 Token expired
        else Token Valid
            AuthMiddleware->>Database: Find user by ID
            
            alt User Not Found
                AuthMiddleware-->>Client: 404 User not found
            else User Found
                AuthMiddleware->>AuthMiddleware: Attach user to request
                AuthMiddleware->>Controller: next()
                Controller-->>Client: Process request
            end
        end
    end
```

---

## 2. Direct Messaging Flows

### 2.1 Send Direct Message (Socket.IO)

```mermaid
sequenceDiagram
    participant Sender
    participant SocketIO
    participant Service
    participant Encryption
    participant Database
    participant Receiver
    participant Logger

    Sender->>SocketIO: emit('sendMessage', {fromUser, toUser, message})
    SocketIO->>Service: Handle sendMessage event
    Service->>Logger: Log message send START
    Service->>Encryption: encryptMessage(message)
    Encryption->>Logger: Log encryption START
    Encryption->>Encryption: Generate IV
    Encryption->>Encryption: Encrypt with AES-128
    Encryption->>Logger: Log encryption END
    Encryption-->>Service: Encrypted message
    Service->>Database: Save ChatMessage
    Database-->>Service: Message saved
    Service->>Encryption: decryptMessage()
    Encryption-->>Service: Decrypted message
    Service->>Logger: Log message send END
    Service->>SocketIO: Emit to receiver
    SocketIO->>Receiver: emit('receiveMessage', message)
```

### 2.2 Get Chat History

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant Controller
    participant Service
    participant Database
    participant Encryption
    participant Logger

    Client->>API: GET /user/chatHistory/:toUser
    API->>Controller: getChatHistory()
    Controller->>Service: getUserChatHistoryService()
    Service->>Logger: Log START
    Service->>Database: Find messages (fromUser ↔ toUser)
    Database-->>Service: Encrypted messages
    Service->>Service: Loop through messages
    loop For each message
        Service->>Encryption: decryptMessage()
        Encryption->>Logger: Log decryption
        Encryption-->>Service: Decrypted message
    end
    Service->>Logger: Log END (message count)
    Service-->>Controller: Decrypted messages
    Controller-->>Client: 200 Success
```

---

## 3. Group Management Flows

### 3.1 Create Group Flow

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant Controller
    participant GroupService
    participant HistoryService
    participant Database
    participant Logger

    Client->>API: POST /group/create
    API->>Controller: createGroup()
    Controller->>GroupService: createGroupService()
    GroupService->>Logger: Log START
    GroupService->>Database: Create group
    Database-->>GroupService: Group created
    GroupService->>HistoryService: recordMemberActionService()
    HistoryService->>Logger: Log START
    HistoryService->>Database: Record 'joined' action
    HistoryService->>Logger: Log END
    GroupService->>Logger: Log END (group ID)
    GroupService-->>Controller: Group data
    Controller-->>Client: 201 Created
```

### 3.2 Join Group Flow (Open Group)

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant Controller
    participant GroupService
    participant Database
    participant Logger

    Client->>API: POST /group/:groupId/join
    API->>Controller: joinGroup()
    Controller->>GroupService: findGroupByIdService()
    GroupService->>Logger: Log START
    GroupService->>Database: Find group
    Database-->>GroupService: Group data
    GroupService->>Logger: Log END
    
    alt Group Type = Open
        Controller->>GroupService: checkUserCanJoinService()
        GroupService->>Logger: Log START
        GroupService->>GroupService: Check membership
        GroupService->>GroupService: Check banned
        GroupService->>GroupService: Check capacity
        GroupService->>Logger: Log END (can join: true)
        
        alt Can Join
            Controller->>GroupService: addMemberToGroupService()
            GroupService->>Logger: Log START
            GroupService->>Database: Add user to members
            GroupService->>Database: Record 'joined' action
            GroupService->>Logger: Log END
            Controller-->>Client: 200 Success
        else Cannot Join
            Controller-->>Client: 403/409 Error
        end
    end
```

### 3.3 Join Group Flow (Private Group)

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant Controller
    participant GroupService
    participant RequestService
    participant Database
    participant Logger

    Client->>API: POST /group/:groupId/join
    API->>Controller: joinGroup()
    Controller->>GroupService: findGroupByIdService()
    GroupService-->>Controller: Group (type: private)
    
    Controller->>GroupService: checkCooldownPeriodService()
    GroupService->>Logger: Log START
    GroupService->>Database: Get last leave/banish timestamp
    GroupService->>GroupService: Calculate cooldown
    GroupService->>Logger: Log END (cooldown status)
    
    alt In Cooldown
        Controller-->>Client: 403 Must wait 48 hours
    else Not In Cooldown
        Controller->>RequestService: createJoinRequestService()
        RequestService->>Logger: Log START
        RequestService->>Database: Create join request
        RequestService->>Logger: Log END
        Controller-->>Client: 200 Request created
    end
```

### 3.4 Approve Join Request Flow

```mermaid
sequenceDiagram
    participant Owner
    participant API
    participant Controller
    participant RequestService
    participant GroupService
    participant Database
    participant Logger

    Owner->>API: POST /group/:groupId/approve
    API->>Controller: approveJoinRequest()
    Controller->>RequestService: approveJoinRequestService()
    RequestService->>Logger: Log START
    RequestService->>Database: Find request
    RequestService->>GroupService: addMemberToGroupService()
    GroupService->>Logger: Log START
    GroupService->>Database: Add user to members
    GroupService->>Database: Record 'joined' action
    GroupService->>Logger: Log END
    RequestService->>Database: Update request status = 'approved'
    RequestService->>Logger: Log END
    Controller-->>Owner: 200 Success
```

### 3.5 Ban Member Flow

```mermaid
sequenceDiagram
    participant Owner
    participant API
    participant Controller
    participant GroupService
    participant Database
    participant Logger

    Owner->>API: POST /group/:groupId/banish
    API->>Controller: banishMember()
    Controller->>GroupService: banMemberFromGroupService()
    GroupService->>Logger: Log START
    GroupService->>Database: Remove from members
    GroupService->>Database: Add to bannedUsers
    GroupService->>Database: Record 'banished' action
    GroupService->>Logger: Log END
    Controller-->>Owner: 200 Success
```

---

## 4. Group Messaging Flows

### 4.1 Send Group Message (Socket.IO)

```mermaid
sequenceDiagram
    participant Sender
    participant SocketIO
    participant Service
    participant Database
    participant Encryption
    participant GroupMembers
    participant Logger

    Sender->>SocketIO: emit('sendGroupMessage', {groupId, userId, message})
    SocketIO->>Service: Handle event
    Service->>Logger: Log START
    Service->>Database: Verify membership
    
    alt Not Member
        Service->>Logger: Log END
        SocketIO-->>Sender: emit('groupMessageError')
    else Is Member
        Service->>Encryption: encryptMessage()
        Encryption->>Logger: Log encryption
        Encryption-->>Service: Encrypted message
        Service->>Database: Save ChatMessage
        Service->>Encryption: decryptMessage()
        Service->>Logger: Log END
        SocketIO->>GroupMembers: emit('receiveGroupMessage') to room
    end
```

### 4.2 Get Group Message History

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant Controller
    participant Service
    participant Database
    participant Encryption
    participant Logger

    Client->>API: GET /group/:groupId/messages
    API->>Controller: getGroupMessages()
    Controller->>Service: getGroupMessageHistoryService()
    Service->>Logger: Log START
    Service->>Database: Find messages (group, pagination)
    Database-->>Service: Encrypted messages
    loop For each message
        Service->>Encryption: decryptMessage()
        Encryption-->>Service: Decrypted message
    end
    Service->>Logger: Log END (message count)
    Service-->>Controller: Decrypted messages
    Controller-->>Client: 200 Success
```

---

## 5. WebRTC Calling Flows

### 5.1 Call Initiation Flow

```mermaid
sequenceDiagram
    participant Caller
    participant SocketIO
    participant Receiver

    Caller->>SocketIO: emit('callInit', {fromUser, toUser})
    SocketIO->>Receiver: emit('anyOneCalling', {callerDetails, receiverDetails})
    Receiver->>Receiver: Show incoming call UI
```

### 5.2 WebRTC Connection Establishment

```mermaid
sequenceDiagram
    participant Caller
    participant SocketIO
    participant Receiver

    Caller->>SocketIO: emit('ready', roomName)
    SocketIO->>Receiver: emit('ready', roomName)
    
    Caller->>Caller: Create RTCPeerConnection
    Caller->>Caller: Create offer
    Caller->>SocketIO: emit('offer', offer)
    SocketIO->>Receiver: emit('offer', offer)
    
    Receiver->>Receiver: Set remote description
    Receiver->>Receiver: Create answer
    Receiver->>SocketIO: emit('answer', answer)
    SocketIO->>Caller: emit('answer', answer)
    
    Caller->>Caller: Set remote description
    
    loop ICE Candidate Exchange
        Caller->>SocketIO: emit('candidate', candidate)
        SocketIO->>Receiver: emit('candidate', candidate)
        Receiver->>SocketIO: emit('candidate', candidate)
        SocketIO->>Caller: emit('candidate', candidate)
    end
    
    Note over Caller,Receiver: Connection Established
```

---

## 6. Logging Flows

### 6.1 Service Execution Logging Flow

```mermaid
sequenceDiagram
    participant Service
    participant LoggerWrapper
    participant SensitiveFilter
    participant Winston
    participant MongoDB
    participant FileSystem

    Service->>LoggerWrapper: Call wrapped function
    LoggerWrapper->>SensitiveFilter: Filter parameters
    SensitiveFilter-->>LoggerWrapper: Sanitized params
    LoggerWrapper->>Winston: Log START
    Winston->>MongoDB: Store log
    Winston->>FileSystem: Write to file
    
    LoggerWrapper->>Service: Execute function
    Service-->>LoggerWrapper: Result/Error
    
    alt Success
        LoggerWrapper->>Winston: Log END (duration)
        Winston->>MongoDB: Store log
        Winston->>FileSystem: Write to file
    else Error
        LoggerWrapper->>Winston: Log ERROR (stack trace)
        Winston->>MongoDB: Store log
        Winston->>FileSystem: Write to file
        LoggerWrapper->>Service: Re-throw error
    end
```

### 6.2 Log Query Flow

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant Controller
    participant LogService
    participant MongoDB

    Client->>API: GET /logs?level=error&service=UserService
    API->>Controller: getLogs()
    Controller->>LogService: getLogsService(filters, options)
    LogService->>MongoDB: Query logs collection
    MongoDB-->>LogService: Log documents
    LogService->>LogService: Apply pagination
    LogService-->>Controller: Logs + pagination
    Controller-->>Client: 200 Success
```

### 6.3 Log Statistics Flow

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant Controller
    participant LogService
    participant MongoDB

    Client->>API: GET /logs/stats
    API->>Controller: getLogStats()
    Controller->>LogService: getLogStatsService()
    
    par Parallel Aggregations
        LogService->>MongoDB: Count by level
        LogService->>MongoDB: Count by service
        LogService->>MongoDB: Average duration
    end
    
    MongoDB-->>LogService: Aggregation results
    LogService-->>Controller: Statistics
    Controller-->>Client: 200 Success
```

---

## Summary

These functional flow diagrams illustrate:

1. **User Authentication**: Registration, login, and protected route access
2. **Direct Messaging**: Real-time messaging with encryption
3. **Group Management**: Creation, joining (open/private), approval, and banning
4. **Group Messaging**: Real-time group communication
5. **WebRTC Calling**: Call initiation and connection establishment
6. **Logging**: Comprehensive logging with MongoDB storage and querying

Each flow demonstrates the interaction between components, error handling, and logging integration throughout the application.
