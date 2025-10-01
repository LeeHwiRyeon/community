# API Documentation

> **Version**: 2.0.0  
> **Base URL**: `http://localhost:50000`  
> **Last Updated**: 2025-01-26

## 🔐 Authentication

All API endpoints require authentication using JWT tokens.

### Headers
```http
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

### Getting a Token
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "user@example.com"
    }
  }
}
```

## 📝 TODO API

### List TODOs
```http
GET /api/todos
```

**Query Parameters:**
- `status` (optional): Filter by status (`pending`, `in_progress`, `completed`, `cancelled`, `on_hold`)
- `priority` (optional): Filter by priority (1-5)
- `category` (optional): Filter by category (`feature`, `bug`, `improvement`, `documentation`, `testing`, `refactoring`, `deployment`)
- `assignee` (optional): Filter by assignee ID
- `project` (optional): Filter by project ID
- `sprint` (optional): Filter by sprint ID
- `overdue` (optional): Filter overdue items (`true`/`false`)
- `search` (optional): Search in title, description, and tags
- `sortBy` (optional): Sort field (`createdAt`, `dueDate`, `priority`, `status`, `lastActivityAt`)
- `sortOrder` (optional): Sort order (`asc`, `desc`)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "todo_id",
      "title": "Implement user authentication",
      "description": "Add JWT-based authentication system",
      "status": "in_progress",
      "priority": 4,
      "category": "feature",
      "assignee": {
        "_id": "user_id",
        "name": "John Doe",
        "email": "john@example.com",
        "avatar": "avatar_url"
      },
      "creator": {
        "_id": "creator_id",
        "name": "Jane Smith",
        "email": "jane@example.com"
      },
      "dueDate": "2025-02-01T00:00:00.000Z",
      "estimatedHours": 8,
      "actualHours": 4,
      "tags": ["authentication", "security"],
      "subtasks": [
        {
          "title": "Create login API",
          "completed": true,
          "completedAt": "2025-01-25T10:00:00.000Z"
        },
        {
          "title": "Create register API",
          "completed": false
        }
      ],
      "comments": [
        {
          "_id": "comment_id",
          "user": {
            "_id": "user_id",
            "name": "John Doe",
            "avatar": "avatar_url"
          },
          "content": "Great progress on this!",
          "createdAt": "2025-01-25T14:30:00.000Z"
        }
      ],
      "watchers": [
        {
          "_id": "watcher_id",
          "name": "Jane Smith",
          "email": "jane@example.com"
        }
      ],
      "project": {
        "_id": "project_id",
        "name": "Community Platform"
      },
      "sprint": {
        "_id": "sprint_id",
        "name": "Sprint 1"
      },
      "isOverdue": false,
      "progress": 50,
      "timeRemaining": 4,
      "createdAt": "2025-01-20T09:00:00.000Z",
      "updatedAt": "2025-01-25T14:30:00.000Z",
      "lastActivityAt": "2025-01-25T14:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "pages": 3
  }
}
```

### Get Single TODO
```http
GET /api/todos/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    // Same structure as TODO object above
  }
}
```

### Create TODO
```http
POST /api/todos
Content-Type: application/json

{
  "title": "Implement user authentication",
  "description": "Add JWT-based authentication system",
  "status": "pending",
  "priority": 4,
  "category": "feature",
  "assignee": "user_id",
  "dueDate": "2025-02-01T00:00:00.000Z",
  "estimatedHours": 8,
  "tags": ["authentication", "security"],
  "dependencies": ["todo_id_1", "todo_id_2"],
  "subtasks": [
    {
      "title": "Create login API"
    },
    {
      "title": "Create register API"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    // Created TODO object
  }
}
```

### Update TODO
```http
PUT /api/todos/:id
Content-Type: application/json

{
  "title": "Updated title",
  "description": "Updated description",
  "status": "in_progress",
  "priority": 5,
  "actualHours": 6
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    // Updated TODO object
  }
}
```

### Delete TODO
```http
DELETE /api/todos/:id
```

**Response:**
```json
{
  "success": true,
  "message": "TODO deleted successfully"
}
```

### Change TODO Status
```http
PATCH /api/todos/:id/status
Content-Type: application/json

{
  "status": "completed"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    // Updated TODO object
  }
}
```

### Add Comment
```http
POST /api/todos/:id/comments
Content-Type: application/json

{
  "content": "This is a comment"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    // Updated TODO object with new comment
  }
}
```

### Add Subtask
```http
POST /api/todos/:id/subtasks
Content-Type: application/json

{
  "title": "New subtask"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    // Updated TODO object with new subtask
  }
}
```

### Complete Subtask
```http
PATCH /api/todos/:id/subtasks/:subtaskIndex
```

**Response:**
```json
{
  "success": true,
  "data": {
    // Updated TODO object with completed subtask
  }
}
```

### Get TODO Statistics
```http
GET /api/todos/stats/overview
```

**Query Parameters:**
- `project` (optional): Filter by project ID
- `assignee` (optional): Filter by assignee ID
- `sprint` (optional): Filter by sprint ID

**Response:**
```json
{
  "success": true,
  "data": {
    "statusStats": [
      {
        "_id": "pending",
        "count": 10,
        "totalEstimatedHours": 80,
        "totalActualHours": 0
      },
      {
        "_id": "in_progress",
        "count": 5,
        "totalEstimatedHours": 40,
        "totalActualHours": 20
      },
      {
        "_id": "completed",
        "count": 25,
        "totalEstimatedHours": 200,
        "totalActualHours": 180
      }
    ],
    "categoryStats": [
      {
        "_id": "feature",
        "count": 20
      },
      {
        "_id": "bug",
        "count": 8
      },
      {
        "_id": "improvement",
        "count": 12
      }
    ],
    "priorityStats": [
      {
        "_id": 5,
        "count": 5
      },
      {
        "_id": 4,
        "count": 15
      },
      {
        "_id": 3,
        "count": 15
      },
      {
        "_id": 2,
        "count": 3
      },
      {
        "_id": 1,
        "count": 2
      }
    ],
    "upcomingDeadlines": [
      {
        "_id": "todo_id",
        "title": "Urgent task",
        "dueDate": "2025-01-27T00:00:00.000Z",
        "assignee": {
          "_id": "user_id",
          "name": "John Doe",
          "email": "john@example.com"
        }
      }
    ]
  }
}
```

## 💬 Chat API

### WebSocket Connection
```javascript
const socket = io('http://localhost:50000', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

### Join Room
```javascript
socket.emit('joinRoom', {
  roomId: 'room_id'
});
```

### Send Message
```javascript
socket.emit('message', {
  content: 'Hello, world!',
  roomId: 'room_id',
  type: 'text'
});
```

### Listen for Messages
```javascript
socket.on('message', (message) => {
  console.log('New message:', message);
});
```

### Listen for User Events
```javascript
socket.on('userJoined', (user) => {
  console.log('User joined:', user);
});

socket.on('userLeft', (userId) => {
  console.log('User left:', userId);
});

socket.on('onlineUsers', (users) => {
  console.log('Online users:', users);
});
```

## 📁 File Upload API

### Upload File
```http
POST /api/upload
Content-Type: multipart/form-data

file: <file>
fileId: <optional_file_id>
```

**Response:**
```json
{
  "success": true,
  "file": {
    "id": "file_id",
    "name": "document.pdf",
    "url": "/uploads/file_id.pdf",
    "thumbnail": "/uploads/thumbnails/thumb_file_id.jpg",
    "size": 1024000,
    "type": "application/pdf",
    "uploadedAt": "2025-01-26T10:00:00.000Z"
  }
}
```

### Download File
```http
GET /api/upload/:fileId
```

**Response:** File content

### Delete File
```http
DELETE /api/upload/:fileId
```

**Response:**
```json
{
  "success": true,
  "message": "File deleted successfully"
}
```

### List User Files
```http
GET /api/upload
```

**Response:**
```json
{
  "success": true,
  "files": [
    {
      "id": "file_id",
      "name": "document.pdf",
      "url": "/uploads/file_id.pdf",
      "thumbnail": "/uploads/thumbnails/thumb_file_id.jpg",
      "size": 1024000,
      "type": "application/pdf",
      "uploadedAt": "2025-01-26T10:00:00.000Z"
    }
  ]
}
```

## 🔔 Notifications API

### Get Notifications
```http
GET /api/notifications
```

**Response:**
```json
{
  "success": true,
  "notifications": [
    {
      "id": "notification_id",
      "type": "todo_assigned",
      "title": "New TODO Assigned",
      "message": "You have been assigned a new TODO: Implement user authentication",
      "todoId": "todo_id",
      "todoTitle": "Implement user authentication",
      "priority": "high",
      "createdAt": "2025-01-26T10:00:00.000Z",
      "read": false,
      "actionUrl": "/todos/todo_id"
    }
  ],
  "unreadCount": 5
}
```

### Mark Notification as Read
```http
PATCH /api/notifications/:id/read
```

**Response:**
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

### Mark All Notifications as Read
```http
PATCH /api/notifications/read-all
```

**Response:**
```json
{
  "success": true,
  "message": "All notifications marked as read"
}
```

### Delete Notification
```http
DELETE /api/notifications/:id
```

**Response:**
```json
{
  "success": true,
  "message": "Notification deleted"
}
```

## 🚨 Error Responses

### 400 Bad Request
```json
{
  "error": "Validation failed",
  "errors": [
    {
      "field": "title",
      "message": "Title is required"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "error": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "error": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "details": "Error message details"
}
```

## 📊 Rate Limiting

- **General API**: 1000 requests per hour per user
- **File Upload**: 100 requests per hour per user
- **Chat Messages**: 1000 messages per hour per user
- **TODO Operations**: 5000 operations per hour per user

## 🔒 Security

### Authentication
- JWT tokens with 24-hour expiration
- Refresh token mechanism
- Secure token storage recommended

### Authorization
- Role-based access control (RBAC)
- Resource-level permissions
- API key authentication for external services

### Data Protection
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CSRF protection
- Rate limiting

## 📈 Monitoring

### Health Check
```http
GET /api/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-26T10:00:00.000Z",
  "uptime": 86400,
  "version": "2.0.0",
  "database": "connected",
  "redis": "connected"
}
```

### Metrics
- Request count and response times
- Error rates and types
- Database query performance
- Memory and CPU usage
- Active user count

---

**API Version**: 2.0.0  
**Last Updated**: 2025-01-26  
**Contact**: For API support, create an issue in the GitHub repository
