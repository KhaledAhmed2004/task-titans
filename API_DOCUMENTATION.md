# Task Titans - API Documentation

## Overview

Task Titans provides a comprehensive RESTful API for managing tasks, bids, users, and all platform functionality. This documentation covers all available endpoints, request/response formats, authentication requirements, and usage examples.

## Base URL

```
Production: https://api.tasktitans.com
Staging: https://staging-api.tasktitans.com
Development: http://localhost:5000
```

## Authentication

### JWT Token Authentication

Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```http
Authorization: Bearer <your-jwt-token>
```

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "role": "freelancer", // or "client"
  "profile": {
    "bio": "Experienced developer",
    "skills": ["JavaScript", "Node.js", "React"],
    "hourlyRate": 50,
    "location": "New York, USA"
  }
}
```

**Response:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "freelancer",
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Login User
```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "freelancer",
      "profile": {
        "bio": "Experienced developer",
        "skills": ["JavaScript", "Node.js", "React"],
        "hourlyRate": 50,
        "rating": 4.8,
        "completedTasks": 25
      }
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Forgot Password
```http
POST /api/auth/forgot-password
```

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

#### Reset Password
```http
POST /api/auth/reset-password
```

**Request Body:**
```json
{
  "token": "reset-token-here",
  "newPassword": "newSecurePassword123"
}
```

## User Management API

### Get User Profile
```http
GET /api/users/profile
```
**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Profile retrieved successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "freelancer",
    "profile": {
      "bio": "Experienced full-stack developer",
      "skills": ["JavaScript", "Node.js", "React", "MongoDB"],
      "hourlyRate": 50,
      "location": "New York, USA",
      "avatar": "https://storage.example.com/avatars/john-doe.jpg",
      "portfolio": [
        {
          "title": "E-commerce Platform",
          "description": "Built a full-stack e-commerce solution",
          "url": "https://example-ecommerce.com",
          "image": "https://storage.example.com/portfolio/ecommerce.jpg"
        }
      ]
    },
    "stats": {
      "rating": 4.8,
      "completedTasks": 25,
      "totalEarnings": 12500,
      "responseTime": "2 hours",
      "completionRate": 98
    },
    "isActive": true,
    "createdAt": "2023-06-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T14:20:00.000Z"
  }
}
```

### Update User Profile
```http
PUT /api/users/profile
```
**Authentication:** Required

**Request Body:**
```json
{
  "name": "John Smith",
  "profile": {
    "bio": "Senior full-stack developer with 5+ years experience",
    "skills": ["JavaScript", "Node.js", "React", "MongoDB", "AWS"],
    "hourlyRate": 60,
    "location": "San Francisco, USA"
  }
}
```

### Get All Users (Admin)
```http
GET /api/users?page=1&limit=10&role=freelancer&status=active
```
**Authentication:** Admin Required

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 50)
- `role` (optional): Filter by user role (freelancer, client, admin)
- `status` (optional): Filter by status (active, inactive, suspended)
- `search` (optional): Search by name or email
- `sortBy` (optional): Sort field (name, createdAt, rating)
- `sortOrder` (optional): Sort order (asc, desc)

## Task Management API

### Create Task
```http
POST /api/tasks
```
**Authentication:** Required (Client role)
**Content-Type:** multipart/form-data (for file uploads)

**Request Body:**
```json
{
  "title": "Build a React Dashboard",
  "description": "I need a modern dashboard built with React and Chart.js for data visualization. The dashboard should include user management, analytics, and reporting features.",
  "categoryId": "507f1f77bcf86cd799439020",
  "budget": 1500,
  "deadline": "2024-02-15T23:59:59.000Z",
  "skills": ["React", "JavaScript", "Chart.js", "CSS"],
  "priority": "high",
  "attachments": ["file1.pdf", "file2.jpg"], // File uploads
  "requirements": {
    "experience": "intermediate",
    "availability": "full-time",
    "location": "remote"
  }
}
```

**Response:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Task created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439030",
    "title": "Build a React Dashboard",
    "description": "I need a modern dashboard built with React...",
    "userId": "507f1f77bcf86cd799439011",
    "categoryId": "507f1f77bcf86cd799439020",
    "budget": 1500,
    "status": "open",
    "deadline": "2024-02-15T23:59:59.000Z",
    "skills": ["React", "JavaScript", "Chart.js", "CSS"],
    "priority": "high",
    "attachments": [
      {
        "filename": "requirements.pdf",
        "url": "https://storage.example.com/tasks/requirements.pdf",
        "size": 245760,
        "type": "application/pdf"
      }
    ],
    "stats": {
      "views": 0,
      "bids": 0,
      "bookmarks": 0
    },
    "createdAt": "2024-01-15T16:30:00.000Z"
  }
}
```

### Get All Tasks
```http
GET /api/tasks?page=1&limit=10&category=web-development&budget_min=500&budget_max=2000&skills=React,Node.js&status=open&sortBy=createdAt&sortOrder=desc
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 50)
- `category` (optional): Filter by category slug
- `budget_min` (optional): Minimum budget filter
- `budget_max` (optional): Maximum budget filter
- `skills` (optional): Comma-separated skills filter
- `status` (optional): Filter by status (open, in_progress, completed, cancelled)
- `priority` (optional): Filter by priority (low, medium, high, urgent)
- `deadline_before` (optional): Tasks with deadline before date
- `deadline_after` (optional): Tasks with deadline after date
- `search` (optional): Search in title and description
- `sortBy` (optional): Sort field (createdAt, budget, deadline, title)
- `sortOrder` (optional): Sort order (asc, desc)

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Tasks retrieved successfully",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439030",
      "title": "Build a React Dashboard",
      "description": "I need a modern dashboard built with React...",
      "user": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "John Doe",
        "profile": {
          "avatar": "https://storage.example.com/avatars/john-doe.jpg"
        }
      },
      "category": {
        "_id": "507f1f77bcf86cd799439020",
        "name": "Web Development",
        "slug": "web-development"
      },
      "budget": 1500,
      "status": "open",
      "deadline": "2024-02-15T23:59:59.000Z",
      "skills": ["React", "JavaScript", "Chart.js", "CSS"],
      "priority": "high",
      "stats": {
        "views": 45,
        "bids": 8,
        "bookmarks": 3
      },
      "createdAt": "2024-01-15T16:30:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 47,
    "itemsPerPage": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "filters": {
    "appliedFilters": {
      "category": "web-development",
      "budget_min": 500,
      "budget_max": 2000,
      "skills": ["React", "Node.js"],
      "status": "open"
    },
    "availableFilters": {
      "categories": [
        {"name": "Web Development", "slug": "web-development", "count": 23},
        {"name": "Mobile Development", "slug": "mobile-development", "count": 15}
      ],
      "skills": [
        {"name": "React", "count": 18},
        {"name": "Node.js", "count": 12}
      ],
      "budgetRanges": [
        {"range": "0-500", "count": 8},
        {"range": "500-1000", "count": 15},
        {"range": "1000-2000", "count": 12},
        {"range": "2000+", "count": 12}
      ]
    }
  }
}
```

### Get Task by ID
```http
GET /api/tasks/507f1f77bcf86cd799439030
```

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Task retrieved successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439030",
    "title": "Build a React Dashboard",
    "description": "I need a modern dashboard built with React and Chart.js for data visualization. The dashboard should include user management, analytics, and reporting features.",
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "profile": {
        "avatar": "https://storage.example.com/avatars/john-doe.jpg",
        "rating": 4.7,
        "completedTasks": 15
      }
    },
    "category": {
      "_id": "507f1f77bcf86cd799439020",
      "name": "Web Development",
      "slug": "web-development"
    },
    "budget": 1500,
    "status": "open",
    "deadline": "2024-02-15T23:59:59.000Z",
    "skills": ["React", "JavaScript", "Chart.js", "CSS"],
    "priority": "high",
    "attachments": [
      {
        "filename": "requirements.pdf",
        "url": "https://storage.example.com/tasks/requirements.pdf",
        "size": 245760,
        "type": "application/pdf"
      },
      {
        "filename": "mockup.jpg",
        "url": "https://storage.example.com/tasks/mockup.jpg",
        "size": 156432,
        "type": "image/jpeg"
      }
    ],
    "requirements": {
      "experience": "intermediate",
      "availability": "full-time",
      "location": "remote"
    },
    "stats": {
      "views": 45,
      "bids": 8,
      "bookmarks": 3,
      "avgBidAmount": 1200
    },
    "createdAt": "2024-01-15T16:30:00.000Z",
    "updatedAt": "2024-01-15T18:45:00.000Z"
  }
}
```

### Update Task
```http
PUT /api/tasks/507f1f77bcf86cd799439030
```
**Authentication:** Required (Task Owner)

**Request Body:**
```json
{
  "title": "Build a React Dashboard with Advanced Analytics",
  "description": "Updated requirements with additional analytics features...",
  "budget": 1800,
  "deadline": "2024-02-20T23:59:59.000Z",
  "skills": ["React", "JavaScript", "Chart.js", "CSS", "D3.js"]
}
```

### Delete Task
```http
DELETE /api/tasks/507f1f77bcf86cd799439030
```
**Authentication:** Required (Task Owner or Admin)

## Bidding System API

### Create Bid
```http
POST /api/bids
```
**Authentication:** Required (Freelancer role)

**Request Body:**
```json
{
  "taskId": "507f1f77bcf86cd799439030",
  "amount": 1200,
  "proposal": "I have 5+ years of experience building React dashboards. I can deliver this project within 2 weeks with all the requested features including user management, analytics, and reporting. My approach will include...",
  "deliveryTime": 14, // days
  "milestones": [
    {
      "title": "UI/UX Design and Setup",
      "description": "Create wireframes and set up project structure",
      "amount": 300,
      "duration": 3
    },
    {
      "title": "Core Dashboard Development",
      "description": "Implement main dashboard features",
      "amount": 600,
      "duration": 7
    },
    {
      "title": "Analytics and Reporting",
      "description": "Add analytics and reporting functionality",
      "amount": 300,
      "duration": 4
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Bid submitted successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439040",
    "taskId": "507f1f77bcf86cd799439030",
    "userId": "507f1f77bcf86cd799439012",
    "amount": 1200,
    "proposal": "I have 5+ years of experience building React dashboards...",
    "deliveryTime": 14,
    "status": "pending",
    "milestones": [
      {
        "title": "UI/UX Design and Setup",
        "description": "Create wireframes and set up project structure",
        "amount": 300,
        "duration": 3,
        "status": "pending"
      }
    ],
    "createdAt": "2024-01-15T17:30:00.000Z"
  }
}
```

### Get Bids for Task
```http
GET /api/bids/task/507f1f77bcf86cd799439030?page=1&limit=10&sortBy=amount&sortOrder=asc
```

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Bids retrieved successfully",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439040",
      "user": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Jane Smith",
        "profile": {
          "avatar": "https://storage.example.com/avatars/jane-smith.jpg",
          "rating": 4.9,
          "completedTasks": 42,
          "skills": ["React", "JavaScript", "Node.js"],
          "hourlyRate": 45
        }
      },
      "amount": 1200,
      "proposal": "I have 5+ years of experience building React dashboards...",
      "deliveryTime": 14,
      "status": "pending",
      "milestones": [
        {
          "title": "UI/UX Design and Setup",
          "amount": 300,
          "duration": 3
        }
      ],
      "createdAt": "2024-01-15T17:30:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalItems": 8,
    "itemsPerPage": 10
  },
  "stats": {
    "totalBids": 8,
    "avgBidAmount": 1350,
    "minBidAmount": 1000,
    "maxBidAmount": 1800,
    "avgDeliveryTime": 16
  }
}
```

### Accept Bid
```http
PUT /api/bids/507f1f77bcf86cd799439040/accept
```
**Authentication:** Required (Task Owner)

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Bid accepted successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439040",
    "status": "accepted",
    "acceptedAt": "2024-01-16T10:15:00.000Z",
    "task": {
      "_id": "507f1f77bcf86cd799439030",
      "status": "in_progress",
      "assignedTo": "507f1f77bcf86cd799439012"
    }
  }
}
```

## Chat and Messaging API

### Create Chat
```http
POST /api/chats
```
**Authentication:** Required

**Request Body:**
```json
{
  "participants": ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"],
  "taskId": "507f1f77bcf86cd799439030",
  "type": "task_discussion"
}
```

### Send Message
```http
POST /api/messages
```
**Authentication:** Required
**Content-Type:** multipart/form-data (for file attachments)

**Request Body:**
```json
{
  "chatId": "507f1f77bcf86cd799439050",
  "content": "Hi! I have a few questions about the dashboard requirements.",
  "type": "text",
  "attachments": ["file1.jpg"] // Optional file uploads
}
```

**Response:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Message sent successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439060",
    "chatId": "507f1f77bcf86cd799439050",
    "senderId": "507f1f77bcf86cd799439012",
    "content": "Hi! I have a few questions about the dashboard requirements.",
    "type": "text",
    "attachments": [],
    "isRead": false,
    "createdAt": "2024-01-16T11:30:00.000Z"
  }
}
```

### Get Chat Messages
```http
GET /api/messages/chat/507f1f77bcf86cd799439050?page=1&limit=50&before=2024-01-16T12:00:00.000Z
```

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Messages retrieved successfully",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439060",
      "sender": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Jane Smith",
        "profile": {
          "avatar": "https://storage.example.com/avatars/jane-smith.jpg"
        }
      },
      "content": "Hi! I have a few questions about the dashboard requirements.",
      "type": "text",
      "attachments": [],
      "isRead": true,
      "createdAt": "2024-01-16T11:30:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 2,
    "totalItems": 75,
    "itemsPerPage": 50,
    "hasNextPage": true
  }
}
```

## Rating and Review API

### Submit Rating
```http
POST /api/ratings
```
**Authentication:** Required

**Request Body:**
```json
{
  "taskId": "507f1f77bcf86cd799439030",
  "ratedUserId": "507f1f77bcf86cd799439012",
  "rating": 5,
  "review": "Excellent work! Jane delivered the dashboard exactly as requested and even added some extra features. Great communication throughout the project.",
  "type": "task_completion",
  "criteria": {
    "quality": 5,
    "communication": 5,
    "timeliness": 4,
    "professionalism": 5
  }
}
```

**Response:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Rating submitted successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439070",
    "taskId": "507f1f77bcf86cd799439030",
    "raterId": "507f1f77bcf86cd799439011",
    "ratedUserId": "507f1f77bcf86cd799439012",
    "rating": 5,
    "review": "Excellent work! Jane delivered the dashboard exactly as requested...",
    "type": "task_completion",
    "criteria": {
      "quality": 5,
      "communication": 5,
      "timeliness": 4,
      "professionalism": 5
    },
    "createdAt": "2024-01-20T14:30:00.000Z"
  }
}
```

### Get User Ratings
```http
GET /api/ratings/user/507f1f77bcf86cd799439012?page=1&limit=10&type=received
```

**Query Parameters:**
- `type`: "received" or "given"
- `rating`: Filter by rating value (1-5)
- `sortBy`: Sort field (rating, createdAt)
- `sortOrder`: Sort order (asc, desc)

## Notification API

### Get User Notifications
```http
GET /api/notifications?page=1&limit=20&isRead=false&type=bid_received
```
**Authentication:** Required

**Query Parameters:**
- `isRead`: Filter by read status (true, false)
- `type`: Filter by notification type
- `priority`: Filter by priority (low, medium, high, urgent)

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Notifications retrieved successfully",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439080",
      "title": "New Bid Received",
      "message": "Jane Smith submitted a bid of $1,200 for your task 'Build a React Dashboard'",
      "type": "bid_received",
      "priority": "medium",
      "data": {
        "taskId": "507f1f77bcf86cd799439030",
        "bidId": "507f1f77bcf86cd799439040",
        "bidderId": "507f1f77bcf86cd799439012",
        "bidAmount": 1200
      },
      "isRead": false,
      "createdAt": "2024-01-15T17:35:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalItems": 25,
    "itemsPerPage": 20
  },
  "summary": {
    "totalUnread": 8,
    "unreadByType": {
      "bid_received": 3,
      "message_received": 2,
      "task_update": 2,
      "payment_received": 1
    }
  }
}
```

### Mark Notification as Read
```http
PUT /api/notifications/507f1f77bcf86cd799439080/read
```
**Authentication:** Required

### Mark All Notifications as Read
```http
PUT /api/notifications/mark-all-read
```
**Authentication:** Required

## Category API

### Get All Categories
```http
GET /api/categories?isActive=true
```

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Categories retrieved successfully",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439020",
      "name": "Web Development",
      "description": "Frontend and backend web development services",
      "slug": "web-development",
      "icon": "https://storage.example.com/icons/web-dev.svg",
      "isActive": true,
      "stats": {
        "totalTasks": 156,
        "activeTasks": 23,
        "avgBudget": 1250
      },
      "createdAt": "2023-01-15T10:00:00.000Z"
    }
  ]
}
```

## Bookmark API

### Add Bookmark
```http
POST /api/bookmarks
```
**Authentication:** Required

**Request Body:**
```json
{
  "taskId": "507f1f77bcf86cd799439030"
}
```

### Get User Bookmarks
```http
GET /api/bookmarks?page=1&limit=10
```
**Authentication:** Required

### Remove Bookmark
```http
DELETE /api/bookmarks/507f1f77bcf86cd799439090
```
**Authentication:** Required

## Report API

### Submit Report
```http
POST /api/reports
```
**Authentication:** Required

**Request Body:**
```json
{
  "reportedUserId": "507f1f77bcf86cd799439012",
  "taskId": "507f1f77bcf86cd799439030",
  "reason": "inappropriate_behavior",
  "description": "User was unprofessional in communications and failed to deliver as promised.",
  "evidence": [
    {
      "type": "screenshot",
      "url": "https://storage.example.com/reports/evidence1.jpg",
      "description": "Screenshot of inappropriate message"
    }
  ]
}
```

## FAQ API

### Get FAQs
```http
GET /api/faqs?categoryId=507f1f77bcf86cd799439021&isActive=true
```

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "FAQs retrieved successfully",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439100",
      "question": "How do I create my first task?",
      "answer": "To create your first task, click on the 'Post a Task' button in the dashboard. Fill in the task details including title, description, budget, and deadline. You can also attach files and specify required skills.",
      "category": {
        "_id": "507f1f77bcf86cd799439021",
        "name": "Getting Started"
      },
      "isActive": true,
      "order": 1,
      "tags": ["task", "creation", "beginner"],
      "createdAt": "2023-06-15T10:00:00.000Z"
    }
  ]
}
```

## Rules API

### Get Platform Rules
```http
GET /api/rules?type=TERMS_OF_SERVICE&isActive=true
```

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Rules retrieved successfully",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439110",
      "type": "TERMS_OF_SERVICE",
      "title": "Terms of Service",
      "content": "<h1>Terms of Service</h1><p>Welcome to Task Titans...</p>",
      "version": "2.1",
      "isActive": true,
      "effectiveDate": "2024-01-01T00:00:00.000Z",
      "metadata": {
        "wordCount": 2847,
        "readingTime": 12,
        "lastReview": "2024-01-15T10:00:00.000Z"
      },
      "createdAt": "2023-12-15T14:30:00.000Z"
    }
  ]
}
```

## WebSocket Events

Task Titans supports real-time communication through WebSocket connections.

### Connection
```javascript
const socket = io('wss://api.tasktitans.com', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

### Events

#### Join Chat Room
```javascript
socket.emit('join_chat', {
  chatId: '507f1f77bcf86cd799439050'
});
```

#### Send Message
```javascript
socket.emit('send_message', {
  chatId: '507f1f77bcf86cd799439050',
  content: 'Hello!',
  type: 'text'
});
```

#### Receive Message
```javascript
socket.on('new_message', (data) => {
  console.log('New message:', data);
});
```

#### Typing Indicator
```javascript
// Send typing indicator
socket.emit('typing', {
  chatId: '507f1f77bcf86cd799439050',
  isTyping: true
});

// Receive typing indicator
socket.on('user_typing', (data) => {
  console.log(`${data.userName} is typing...`);
});
```

#### Real-time Notifications
```javascript
socket.on('notification', (data) => {
  console.log('New notification:', data);
});
```

## Error Handling

### Standard Error Response Format

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation error",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters"
    }
  ],
  "timestamp": "2024-01-15T16:30:00.000Z",
  "path": "/api/auth/register"
}
```

### Common HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `422` - Unprocessable Entity (business logic error)
- `429` - Too Many Requests (rate limiting)
- `500` - Internal Server Error

### Error Types

#### Validation Errors
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "budget",
      "message": "Budget must be greater than 0",
      "code": "INVALID_VALUE"
    }
  ]
}
```

#### Authentication Errors
```json
{
  "success": false,
  "statusCode": 401,
  "message": "Invalid or expired token",
  "code": "TOKEN_EXPIRED"
}
```

#### Authorization Errors
```json
{
  "success": false,
  "statusCode": 403,
  "message": "You don't have permission to access this resource",
  "code": "INSUFFICIENT_PERMISSIONS"
}
```

#### Rate Limiting Errors
```json
{
  "success": false,
  "statusCode": 429,
  "message": "Too many requests. Please try again later.",
  "retryAfter": 60,
  "code": "RATE_LIMIT_EXCEEDED"
}
```

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

- **Authentication endpoints**: 5 requests per minute per IP
- **General API endpoints**: 100 requests per minute per user
- **File upload endpoints**: 10 requests per minute per user
- **Search endpoints**: 30 requests per minute per user

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642262400
X-RateLimit-Window: 60
```

## Pagination

All list endpoints support pagination:

### Query Parameters
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)
- `sortBy`: Sort field
- `sortOrder`: Sort order (asc, desc)

### Response Format
```json
{
  "data": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 47,
    "itemsPerPage": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

## File Upload

### Supported File Types
- **Images**: jpg, jpeg, png, gif, webp (max 5MB)
- **Documents**: pdf, doc, docx, txt, rtf (max 10MB)
- **Archives**: zip, rar, 7z (max 25MB)
- **Code**: js, html, css, json, xml (max 1MB)

### Upload Endpoint
```http
POST /api/upload
```
**Content-Type:** multipart/form-data
**Authentication:** Required

**Request:**
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('type', 'task_attachment');
formData.append('taskId', '507f1f77bcf86cd799439030');

fetch('/api/upload', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token
  },
  body: formData
});
```

**Response:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "File uploaded successfully",
  "data": {
    "filename": "document.pdf",
    "originalName": "project-requirements.pdf",
    "url": "https://storage.example.com/uploads/document.pdf",
    "size": 245760,
    "type": "application/pdf",
    "uploadedAt": "2024-01-15T16:30:00.000Z"
  }
}
```

## Search API

### Global Search
```http
GET /api/search?q=react%20dashboard&type=tasks&page=1&limit=10
```

**Query Parameters:**
- `q`: Search query (required)
- `type`: Search type (tasks, users, all)
- `filters`: Additional filters (JSON encoded)

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Search completed successfully",
  "data": {
    "tasks": [
      {
        "_id": "507f1f77bcf86cd799439030",
        "title": "Build a React Dashboard",
        "description": "I need a modern dashboard built with React...",
        "budget": 1500,
        "relevanceScore": 0.95,
        "matchedFields": ["title", "description", "skills"]
      }
    ],
    "users": [],
    "totalResults": 1,
    "searchTime": "0.045s"
  },
  "suggestions": [
    "react development",
    "dashboard design",
    "react components"
  ]
}
```

## Analytics API (Admin)

### Platform Statistics
```http
GET /api/admin/analytics/overview
```
**Authentication:** Admin Required

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Analytics retrieved successfully",
  "data": {
    "users": {
      "total": 1250,
      "active": 890,
      "newThisMonth": 45,
      "growthRate": 12.5
    },
    "tasks": {
      "total": 3420,
      "active": 156,
      "completedThisMonth": 89,
      "avgCompletionTime": 8.5
    },
    "revenue": {
      "totalVolume": 125000,
      "thisMonth": 15600,
      "platformFees": 12500,
      "growthRate": 18.2
    },
    "engagement": {
      "avgSessionDuration": "24m 15s",
      "bounceRate": 0.23,
      "pageViews": 45600,
      "uniqueVisitors": 8900
    }
  }
}
```

## SDK Examples

### JavaScript/Node.js

```javascript
class TaskTitansAPI {
  constructor(baseURL, token) {
    this.baseURL = baseURL;
    this.token = token;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
        ...options.headers
      },
      ...options
    };

    const response = await fetch(url, config);
    return response.json();
  }

  // Authentication
  async login(email, password) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  }

  // Tasks
  async createTask(taskData) {
    return this.request('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData)
    });
  }

  async getTasks(filters = {}) {
    const queryString = new URLSearchParams(filters).toString();
    return this.request(`/api/tasks?${queryString}`);
  }

  // Bids
  async createBid(bidData) {
    return this.request('/api/bids', {
      method: 'POST',
      body: JSON.stringify(bidData)
    });
  }
}

// Usage
const api = new TaskTitansAPI('https://api.tasktitans.com', 'your-jwt-token');

// Create a task
const task = await api.createTask({
  title: 'Build a React App',
  description: 'Need a modern React application...',
  budget: 1000,
  skills: ['React', 'JavaScript']
});

console.log('Task created:', task.data._id);
```

### Python

```python
import requests
import json

class TaskTitansAPI:
    def __init__(self, base_url, token):
        self.base_url = base_url
        self.token = token
        self.headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {token}'
        }
    
    def request(self, endpoint, method='GET', data=None):
        url = f"{self.base_url}{endpoint}"
        response = requests.request(
            method=method,
            url=url,
            headers=self.headers,
            json=data
        )
        return response.json()
    
    def login(self, email, password):
        return self.request('/api/auth/login', 'POST', {
            'email': email,
            'password': password
        })
    
    def create_task(self, task_data):
        return self.request('/api/tasks', 'POST', task_data)
    
    def get_tasks(self, **filters):
        query_string = '&'.join([f"{k}={v}" for k, v in filters.items()])
        return self.request(f'/api/tasks?{query_string}')

# Usage
api = TaskTitansAPI('https://api.tasktitans.com', 'your-jwt-token')

# Create a task
task = api.create_task({
    'title': 'Build a Python API',
    'description': 'Need a REST API built with FastAPI...',
    'budget': 800,
    'skills': ['Python', 'FastAPI', 'PostgreSQL']
})

print(f"Task created: {task['data']['_id']}")
```

## Conclusion

This API documentation provides comprehensive coverage of all Task Titans endpoints, including:

- **Authentication & Authorization**: JWT-based security
- **Core Features**: Tasks, bids, users, messaging
- **Real-time Communication**: WebSocket support
- **File Management**: Upload and storage capabilities
- **Search & Filtering**: Advanced search functionality
- **Error Handling**: Standardized error responses
- **Rate Limiting**: API usage protection
- **Analytics**: Platform insights and metrics

For additional support or questions about the API, please contact our developer support team or refer to the interactive API documentation at `https://api.tasktitans.com/docs`.