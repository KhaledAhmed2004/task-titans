# Task Titans - System Architecture Documentation

## Overview

Task Titans is a comprehensive task management and freelancing platform built with Node.js, Express, and MongoDB. This document provides architectural diagrams and system flow documentation to help understand the application structure and interactions.

## System Architecture Diagram

```mermaid
graph TB
    %% Client Layer
    subgraph "Client Layer"
        WEB[Web Application]
        MOBILE[Mobile App]
        API_CLIENT[API Clients]
    end

    %% API Gateway / Load Balancer
    subgraph "API Layer"
        LB[Load Balancer]
        AUTH_MW[Authentication Middleware]
        RATE_LIMIT[Rate Limiting]
        CORS[CORS Handler]
    end

    %% Application Layer
    subgraph "Application Layer"
        subgraph "Core Modules"
            USER_MOD[User Module]
            TASK_MOD[Task Module]
            BID_MOD[Bid Module]
            AUTH_MOD[Auth Module]
        end
        
        subgraph "Communication Modules"
            CHAT_MOD[Chat Module]
            MSG_MOD[Message Module]
            NOTIF_MOD[Notification Module]
        end
        
        subgraph "Support Modules"
            RATING_MOD[Rating Module]
            REPORT_MOD[Report Module]
            FAQ_MOD[FAQ Module]
            RULE_MOD[Rule Module]
        end
        
        subgraph "Utility Modules"
            CAT_MOD[Category Module]
            BOOKMARK_MOD[Bookmark Module]
            RESET_MOD[Reset Token Module]
        end
    end

    %% Data Layer
    subgraph "Data Layer"
        MONGODB[(MongoDB)]
        REDIS[(Redis Cache)]
        FILE_STORAGE[File Storage]
    end

    %% External Services
    subgraph "External Services"
        EMAIL_SVC[Email Service]
        SMS_SVC[SMS Service]
        PAYMENT_SVC[Payment Gateway]
        CLOUD_STORAGE[Cloud Storage]
        PUSH_SVC[Push Notifications]
    end

    %% Connections
    WEB --> LB
    MOBILE --> LB
    API_CLIENT --> LB
    
    LB --> AUTH_MW
    AUTH_MW --> RATE_LIMIT
    RATE_LIMIT --> CORS
    
    CORS --> USER_MOD
    CORS --> TASK_MOD
    CORS --> BID_MOD
    CORS --> AUTH_MOD
    CORS --> CHAT_MOD
    CORS --> MSG_MOD
    CORS --> NOTIF_MOD
    CORS --> RATING_MOD
    CORS --> REPORT_MOD
    CORS --> FAQ_MOD
    CORS --> RULE_MOD
    CORS --> CAT_MOD
    CORS --> BOOKMARK_MOD
    CORS --> RESET_MOD
    
    USER_MOD --> MONGODB
    TASK_MOD --> MONGODB
    BID_MOD --> MONGODB
    AUTH_MOD --> MONGODB
    CHAT_MOD --> MONGODB
    MSG_MOD --> MONGODB
    NOTIF_MOD --> MONGODB
    RATING_MOD --> MONGODB
    REPORT_MOD --> MONGODB
    FAQ_MOD --> MONGODB
    RULE_MOD --> MONGODB
    CAT_MOD --> MONGODB
    BOOKMARK_MOD --> MONGODB
    RESET_MOD --> MONGODB
    
    USER_MOD --> REDIS
    AUTH_MOD --> REDIS
    TASK_MOD --> REDIS
    
    TASK_MOD --> FILE_STORAGE
    USER_MOD --> FILE_STORAGE
    MSG_MOD --> FILE_STORAGE
    
    NOTIF_MOD --> EMAIL_SVC
    NOTIF_MOD --> SMS_SVC
    NOTIF_MOD --> PUSH_SVC
    
    BID_MOD --> PAYMENT_SVC
    TASK_MOD --> PAYMENT_SVC
    
    FILE_STORAGE --> CLOUD_STORAGE
```

## Module Interaction Diagram

```mermaid
graph LR
    %% Core Business Flow
    USER[User Module] --> AUTH[Auth Module]
    AUTH --> TASK[Task Module]
    TASK --> BID[Bid Module]
    BID --> CHAT[Chat Module]
    CHAT --> MESSAGE[Message Module]
    MESSAGE --> NOTIFICATION[Notification Module]
    BID --> RATING[Rating Module]
    
    %% Support and Utility Flows
    USER --> BOOKMARK[Bookmark Module]
    TASK --> CATEGORY[Category Module]
    USER --> REPORT[Report Module]
    TASK --> REPORT
    BID --> REPORT
    
    %% Administrative Flows
    USER --> FAQ[FAQ Module]
    USER --> RULE[Rule Module]
    AUTH --> RESET_TOKEN[Reset Token Module]
    
    %% Cross-cutting Concerns
    NOTIFICATION -.-> USER
    NOTIFICATION -.-> TASK
    NOTIFICATION -.-> BID
    NOTIFICATION -.-> CHAT
    
    REPORT -.-> USER
    REPORT -.-> TASK
    REPORT -.-> BID
```

## Task Management Flow Sequence Diagram

```mermaid
sequenceDiagram
    participant Client
    participant Auth
    participant User
    participant Task
    participant Category
    participant Notification
    participant FileStorage

    Client->>Auth: POST /auth/login
    Auth->>User: Validate credentials
    User-->>Auth: User data
    Auth-->>Client: JWT Token
    
    Client->>Task: POST /tasks (with JWT)
    Task->>Auth: Verify token
    Auth-->>Task: User verified
    
    Task->>Category: Validate category
    Category-->>Task: Category valid
    
    alt Has file attachments
        Task->>FileStorage: Upload files
        FileStorage-->>Task: File URLs
    end
    
    Task->>Task: Create task in DB
    Task->>Notification: Send task created notification
    Notification->>User: Get user preferences
    User-->>Notification: Notification settings
    Notification->>Notification: Send email/push notification
    
    Task-->>Client: Task created successfully
```

## Bidding Process Sequence Diagram

```mermaid
sequenceDiagram
    participant Freelancer
    participant Auth
    participant Bid
    participant Task
    participant User
    participant Notification
    participant Payment

    Freelancer->>Bid: POST /bids
    Bid->>Auth: Verify freelancer token
    Auth-->>Bid: Freelancer verified
    
    Bid->>Task: Get task details
    Task-->>Bid: Task data
    
    Bid->>Bid: Validate bid amount
    Bid->>Bid: Create bid in DB
    
    Bid->>User: Get task owner details
    User-->>Bid: Owner data
    
    Bid->>Notification: Send bid notification
    Notification->>Notification: Send to task owner
    
    Bid-->>Freelancer: Bid created successfully
    
    Note over Freelancer,Payment: Later - Bid Acceptance Flow
    
    participant TaskOwner
    TaskOwner->>Bid: PUT /bids/:id/accept
    Bid->>Auth: Verify owner token
    Auth-->>Bid: Owner verified
    
    Bid->>Task: Update task status
    Task-->>Bid: Task updated
    
    Bid->>Payment: Process payment hold
    Payment-->>Bid: Payment secured
    
    Bid->>Notification: Send acceptance notification
    Notification->>Notification: Notify freelancer
    
    Bid-->>TaskOwner: Bid accepted successfully
```

## Chat and Messaging Flow

```mermaid
sequenceDiagram
    participant User1
    participant User2
    participant Auth
    participant Chat
    participant Message
    participant Notification
    participant WebSocket

    User1->>Chat: POST /chats
    Chat->>Auth: Verify user1 token
    Auth-->>Chat: User1 verified
    
    Chat->>Chat: Create chat room
    Chat-->>User1: Chat room created
    
    User1->>WebSocket: Connect to chat room
    User2->>WebSocket: Connect to chat room
    
    User1->>Message: POST /messages
    Message->>Auth: Verify user1 token
    Auth-->>Message: User1 verified
    
    Message->>Chat: Validate chat membership
    Chat-->>Message: User is member
    
    Message->>Message: Create message in DB
    Message->>WebSocket: Broadcast to room
    WebSocket-->>User2: Real-time message
    
    Message->>Notification: Send offline notification
    Notification->>Notification: Check if User2 online
    
    alt User2 is offline
        Notification->>Notification: Send push/email notification
    end
    
    Message-->>User1: Message sent successfully
```

## Authentication and Authorization Flow

```mermaid
sequenceDiagram
    participant Client
    participant Auth
    participant User
    participant ResetToken
    participant Email
    participant Redis

    %% Registration Flow
    Client->>Auth: POST /auth/register
    Auth->>User: Check if email exists
    User-->>Auth: Email available
    
    Auth->>Auth: Hash password
    Auth->>User: Create user account
    User-->>Auth: User created
    
    Auth->>Auth: Generate JWT token
    Auth-->>Client: Registration successful + JWT
    
    %% Login Flow
    Client->>Auth: POST /auth/login
    Auth->>User: Validate credentials
    User-->>Auth: Credentials valid
    
    Auth->>Redis: Store session
    Redis-->>Auth: Session stored
    
    Auth->>Auth: Generate JWT token
    Auth-->>Client: Login successful + JWT
    
    %% Password Reset Flow
    Client->>Auth: POST /auth/forgot-password
    Auth->>User: Check if email exists
    User-->>Auth: User found
    
    Auth->>ResetToken: Generate reset token
    ResetToken-->>Auth: Token created
    
    Auth->>Email: Send reset email
    Email-->>Auth: Email sent
    
    Auth-->>Client: Reset email sent
    
    Client->>Auth: POST /auth/reset-password
    Auth->>ResetToken: Validate token
    ResetToken-->>Auth: Token valid
    
    Auth->>User: Update password
    User-->>Auth: Password updated
    
    Auth->>ResetToken: Invalidate token
    ResetToken-->>Auth: Token invalidated
    
    Auth-->>Client: Password reset successful
```

## Rating and Review System Flow

```mermaid
sequenceDiagram
    participant Client
    participant Auth
    participant Rating
    participant Task
    participant Bid
    participant User
    participant Notification

    Client->>Rating: POST /ratings
    Rating->>Auth: Verify user token
    Auth-->>Rating: User verified
    
    Rating->>Task: Get task details
    Task-->>Rating: Task data
    
    Rating->>Bid: Verify bid relationship
    Bid-->>Rating: Relationship confirmed
    
    Rating->>Rating: Validate rating data
    Rating->>Rating: Create rating in DB
    
    Rating->>User: Update user rating stats
    User-->>Rating: Stats updated
    
    Rating->>Notification: Send rating notification
    Notification->>Notification: Notify rated user
    
    Rating-->>Client: Rating submitted successfully
```

## File Upload and Management Flow

```mermaid
sequenceDiagram
    participant Client
    participant Auth
    participant Task
    participant FileStorage
    participant CloudStorage
    participant Validation

    Client->>Task: POST /tasks (with files)
    Task->>Auth: Verify user token
    Auth-->>Task: User verified
    
    Task->>Validation: Validate file types/sizes
    Validation-->>Task: Files valid
    
    loop For each file
        Task->>FileStorage: Process file upload
        FileStorage->>CloudStorage: Upload to cloud
        CloudStorage-->>FileStorage: File URL
        FileStorage-->>Task: File metadata
    end
    
    Task->>Task: Create task with file references
    Task-->>Client: Task created with files
```

## Error Handling and Logging Flow

```mermaid
sequenceDiagram
    participant Client
    participant Middleware
    participant Controller
    participant Service
    participant Database
    participant Logger
    participant ErrorHandler

    Client->>Middleware: API Request
    Middleware->>Controller: Validated request
    Controller->>Service: Business logic call
    Service->>Database: Database operation
    
    alt Database Error
        Database-->>Service: Error response
        Service->>Logger: Log error details
        Service-->>Controller: Service error
        Controller->>ErrorHandler: Handle error
        ErrorHandler-->>Client: Formatted error response
    else Success
        Database-->>Service: Success response
        Service-->>Controller: Success data
        Controller-->>Client: Success response
    end
```

## Data Models Relationship Diagram

```mermaid
erDiagram
    USER {
        ObjectId _id PK
        string name
        string email UK
        string password
        string role
        object profile
        array skills
        number rating
        boolean isActive
        date createdAt
        date updatedAt
    }
    
    TASK {
        ObjectId _id PK
        string title
        string description
        ObjectId userId FK
        ObjectId categoryId FK
        number budget
        string status
        array attachments
        date deadline
        array skills
        date createdAt
        date updatedAt
    }
    
    BID {
        ObjectId _id PK
        ObjectId taskId FK
        ObjectId userId FK
        number amount
        string proposal
        string status
        date deliveryTime
        date createdAt
        date updatedAt
    }
    
    CHAT {
        ObjectId _id PK
        array participants
        ObjectId taskId FK
        string type
        boolean isActive
        date lastActivity
        date createdAt
        date updatedAt
    }
    
    MESSAGE {
        ObjectId _id PK
        ObjectId chatId FK
        ObjectId senderId FK
        string content
        string type
        array attachments
        boolean isRead
        date createdAt
    }
    
    RATING {
        ObjectId _id PK
        ObjectId taskId FK
        ObjectId raterId FK
        ObjectId ratedUserId FK
        number rating
        string review
        string type
        date createdAt
    }
    
    CATEGORY {
        ObjectId _id PK
        string name
        string description
        string slug
        boolean isActive
        date createdAt
    }
    
    NOTIFICATION {
        ObjectId _id PK
        ObjectId userId FK
        string title
        string message
        string type
        object data
        boolean isRead
        date createdAt
    }
    
    BOOKMARK {
        ObjectId _id PK
        ObjectId userId FK
        ObjectId taskId FK
        date createdAt
    }
    
    REPORT {
        ObjectId _id PK
        ObjectId reporterId FK
        ObjectId reportedUserId FK
        ObjectId taskId FK
        string reason
        string description
        string status
        date createdAt
    }
    
    FAQ {
        ObjectId _id PK
        string question
        string answer
        ObjectId categoryId FK
        boolean isActive
        number order
        date createdAt
    }
    
    RULE {
        ObjectId _id PK
        string content
        string type
        string title
        string version
        boolean isActive
        date effectiveDate
        date createdAt
    }
    
    RESET_TOKEN {
        ObjectId _id PK
        ObjectId userId FK
        string token
        date expireAt
        date createdAt
    }

    %% Relationships
    USER ||--o{ TASK : creates
    USER ||--o{ BID : makes
    USER ||--o{ MESSAGE : sends
    USER ||--o{ RATING : gives
    USER ||--o{ RATING : receives
    USER ||--o{ NOTIFICATION : receives
    USER ||--o{ BOOKMARK : creates
    USER ||--o{ REPORT : makes
    USER ||--o{ REPORT : receives
    USER ||--|| RESET_TOKEN : has
    
    TASK ||--o{ BID : receives
    TASK ||--|| CHAT : has
    TASK ||--o{ RATING : rated_for
    TASK ||--o{ BOOKMARK : bookmarked
    TASK ||--o{ REPORT : reported
    
    CATEGORY ||--o{ TASK : categorizes
    CATEGORY ||--o{ FAQ : categorizes
    
    CHAT ||--o{ MESSAGE : contains
    
    BID ||--o{ RATING : rated_for
```

## Security Architecture

```mermaid
graph TB
    subgraph "Security Layers"
        subgraph "Network Security"
            HTTPS[HTTPS/TLS]
            FIREWALL[Firewall]
            DDoS[DDoS Protection]
        end
        
        subgraph "Application Security"
            JWT[JWT Authentication]
            RBAC[Role-Based Access Control]
            RATE_LIMIT_SEC[Rate Limiting]
            INPUT_VAL[Input Validation]
            XSS[XSS Protection]
            CSRF[CSRF Protection]
        end
        
        subgraph "Data Security"
            ENCRYPTION[Data Encryption]
            HASH[Password Hashing]
            SANITIZATION[Data Sanitization]
            BACKUP[Secure Backups]
        end
        
        subgraph "Infrastructure Security"
            ENV_VAR[Environment Variables]
            SECRET_MGMT[Secret Management]
            AUDIT_LOG[Audit Logging]
            MONITORING[Security Monitoring]
        end
    end
    
    CLIENT[Client] --> HTTPS
    HTTPS --> FIREWALL
    FIREWALL --> DDoS
    DDoS --> JWT
    JWT --> RBAC
    RBAC --> RATE_LIMIT_SEC
    RATE_LIMIT_SEC --> INPUT_VAL
    INPUT_VAL --> XSS
    XSS --> CSRF
    CSRF --> ENCRYPTION
    ENCRYPTION --> HASH
    HASH --> SANITIZATION
    SANITIZATION --> BACKUP
    BACKUP --> ENV_VAR
    ENV_VAR --> SECRET_MGMT
    SECRET_MGMT --> AUDIT_LOG
    AUDIT_LOG --> MONITORING
```

## Deployment Architecture

```mermaid
graph TB
    subgraph "Production Environment"
        subgraph "Load Balancer Layer"
            LB1[Load Balancer 1]
            LB2[Load Balancer 2]
        end
        
        subgraph "Application Layer"
            APP1[App Server 1]
            APP2[App Server 2]
            APP3[App Server 3]
        end
        
        subgraph "Database Layer"
            MONGO_PRIMARY[(MongoDB Primary)]
            MONGO_SECONDARY1[(MongoDB Secondary 1)]
            MONGO_SECONDARY2[(MongoDB Secondary 2)]
        end
        
        subgraph "Cache Layer"
            REDIS_MASTER[(Redis Master)]
            REDIS_SLAVE[(Redis Slave)]
        end
        
        subgraph "Storage Layer"
            FILE_STORE[File Storage]
            BACKUP_STORE[Backup Storage]
        end
        
        subgraph "Monitoring"
            LOGS[Log Aggregation]
            METRICS[Metrics Collection]
            ALERTS[Alert System]
        end
    end
    
    INTERNET[Internet] --> LB1
    INTERNET --> LB2
    
    LB1 --> APP1
    LB1 --> APP2
    LB2 --> APP2
    LB2 --> APP3
    
    APP1 --> MONGO_PRIMARY
    APP2 --> MONGO_PRIMARY
    APP3 --> MONGO_PRIMARY
    
    MONGO_PRIMARY --> MONGO_SECONDARY1
    MONGO_PRIMARY --> MONGO_SECONDARY2
    
    APP1 --> REDIS_MASTER
    APP2 --> REDIS_MASTER
    APP3 --> REDIS_MASTER
    
    REDIS_MASTER --> REDIS_SLAVE
    
    APP1 --> FILE_STORE
    APP2 --> FILE_STORE
    APP3 --> FILE_STORE
    
    FILE_STORE --> BACKUP_STORE
    MONGO_PRIMARY --> BACKUP_STORE
    
    APP1 --> LOGS
    APP2 --> LOGS
    APP3 --> LOGS
    
    LOGS --> METRICS
    METRICS --> ALERTS
```

## Performance Optimization Strategy

```mermaid
graph LR
    subgraph "Frontend Optimization"
        CDN[CDN Distribution]
        COMPRESS[Asset Compression]
        LAZY[Lazy Loading]
        CACHE_BROWSER[Browser Caching]
    end
    
    subgraph "Backend Optimization"
        CACHE_REDIS[Redis Caching]
        DB_INDEX[Database Indexing]
        QUERY_OPT[Query Optimization]
        CONNECTION_POOL[Connection Pooling]
    end
    
    subgraph "Infrastructure Optimization"
        LOAD_BALANCE[Load Balancing]
        AUTO_SCALE[Auto Scaling]
        MONITORING_PERF[Performance Monitoring]
        RESOURCE_OPT[Resource Optimization]
    end
    
    CDN --> COMPRESS
    COMPRESS --> LAZY
    LAZY --> CACHE_BROWSER
    
    CACHE_REDIS --> DB_INDEX
    DB_INDEX --> QUERY_OPT
    QUERY_OPT --> CONNECTION_POOL
    
    LOAD_BALANCE --> AUTO_SCALE
    AUTO_SCALE --> MONITORING_PERF
    MONITORING_PERF --> RESOURCE_OPT
```

## Conclusion

This architectural documentation provides a comprehensive overview of the Task Titans system, including:

- **System Architecture**: High-level view of all components and their interactions
- **Module Interactions**: How different modules communicate with each other
- **Sequence Diagrams**: Detailed flow of major business processes
- **Data Models**: Database schema and relationships
- **Security Architecture**: Multi-layered security approach
- **Deployment Strategy**: Production environment setup
- **Performance Optimization**: Strategies for optimal performance

These diagrams and documentation serve as a reference for developers, architects, and stakeholders to understand the system's design, flow, and implementation details.