# Community Hub API Reference

This document provides comprehensive API documentation for the Community Hub platform.

## Base URL
- Development: `http://localhost:50000`
- Production: `https://api.communityhub.com`

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": { ... }
  }
}
```

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Endpoints

### Authentication

#### Login
```http
POST /api/auth/login
```

**Request Body:**
```json
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
    "token": "jwt-token-here",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "username": "username",
      "profile": { ... }
    }
  }
}
```

#### Register
```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "username": "username",
  "displayName": "Display Name"
}
```

#### Logout
```http
POST /api/auth/logout
```

**Headers:**
```
Authorization: Bearer <token>
```

### Communities

#### List Communities
```http
GET /api/communities
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `search` (optional): Search term

**Response:**
```json
{
  "success": true,
  "data": {
    "communities": [
      {
        "id": 1,
        "name": "Gaming Community",
        "description": "A community for gamers",
        "memberCount": 1250,
        "postCount": 5432,
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "pages": 1
    }
  }
}
```

#### Get Community Details
```http
GET /api/communities/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Gaming Community",
    "description": "A community for gamers",
    "memberCount": 1250,
    "postCount": 5432,
    "boards": [
      {
        "id": 1,
        "name": "General Discussion",
        "description": "General gaming discussions",
        "postCount": 1234
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### Boards

#### List Boards
```http
GET /api/boards
```

**Query Parameters:**
- `communityId` (optional): Filter by community
- `page` (optional): Page number
- `limit` (optional): Items per page

#### Get Board Details
```http
GET /api/boards/:id
```

#### Get Board Posts
```http
GET /api/boards/:id/posts
```

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `sort` (optional): Sort order (newest, oldest, popular)
- `search` (optional): Search term
- `tags` (optional): Filter by tags (comma-separated)

### Posts

#### List Posts
```http
GET /api/posts
```

**Query Parameters:**
- `boardId` (optional): Filter by board
- `userId` (optional): Filter by author
- `page` (optional): Page number
- `limit` (optional): Items per page
- `sort` (optional): Sort order
- `search` (optional): Search term
- `tags` (optional): Filter by tags

**Response:**
```json
{
  "success": true,
  "data": {
    "posts": [
      {
        "id": 1,
        "title": "Post Title",
        "content": "Post content...",
        "author": {
          "id": 1,
          "username": "author",
          "displayName": "Author Name"
        },
        "board": {
          "id": 1,
          "name": "General Discussion"
        },
        "tags": ["gaming", "discussion"],
        "voteCount": 15,
        "commentCount": 8,
        "viewCount": 150,
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": { ... }
  }
}
```

#### Create Post
```http
POST /api/posts
```

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Post Title",
  "content": "Post content...",
  "boardId": 1,
  "tags": ["gaming", "discussion"],
  "isDraft": false
}
```

#### Get Post Details
```http
GET /api/posts/:id
```

#### Update Post
```http
PUT /api/posts/:id
```

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

#### Delete Post
```http
DELETE /api/posts/:id
```

**Headers:**
```
Authorization: Bearer <token>
```

### Comments

#### List Comments
```http
GET /api/posts/:postId/comments
```

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `sort` (optional): Sort order (newest, oldest, popular)

#### Create Comment
```http
POST /api/posts/:postId/comments
```

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "content": "Comment content...",
  "parentId": null
}
```

#### Update Comment
```http
PUT /api/comments/:id
```

#### Delete Comment
```http
DELETE /api/comments/:id
```

### Users

#### Get User Profile
```http
GET /api/users/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "username",
    "displayName": "Display Name",
    "email": "user@example.com",
    "profile": {
      "bio": "User bio...",
      "avatar": "avatar-url",
      "level": 5,
      "experience": 1250,
      "badges": [
        {
          "id": 1,
          "name": "First Post",
          "description": "Created your first post",
          "icon": "badge-icon-url"
        }
      ]
    },
    "stats": {
      "postCount": 25,
      "commentCount": 150,
      "voteCount": 500
    },
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

#### Update User Profile
```http
PUT /api/users/:id
```

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

### Search

#### Search Posts and Users
```http
GET /api/search
```

**Query Parameters:**
- `q` (required): Search query
- `type` (optional): Content type (posts, users, comments)
- `boardId` (optional): Filter by board
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response:**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "type": "post",
        "id": 1,
        "title": "Post Title",
        "content": "Post content...",
        "author": { ... },
        "board": { ... },
        "score": 0.95
      }
    ],
    "pagination": { ... }
  }
}
```

### Notifications

#### List Notifications
```http
GET /api/notifications
```

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `unread` (optional): Filter unread notifications

#### Mark Notification as Read
```http
PUT /api/notifications/:id/read
```

#### Mark All Notifications as Read
```http
PUT /api/notifications/read-all
```

### Tags

#### List Tags
```http
GET /api/tags
```

**Query Parameters:**
- `popular` (optional): Get popular tags
- `limit` (optional): Number of tags to return

#### Get Tag Details
```http
GET /api/tags/:name
```

### Voting

#### Vote on Post
```http
POST /api/posts/:id/vote
```

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "type": "up" // or "down"
}
```

#### Vote on Comment
```http
POST /api/comments/:id/vote
```

### Attachments

#### Upload File
```http
POST /api/attachments/upload
```

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body:**
```
file: <file>
type: image|video|document
```

#### Get Attachment
```http
GET /api/attachments/:id
```

### Drafts

#### List Drafts
```http
GET /api/drafts
```

**Headers:**
```
Authorization: Bearer <token>
```

#### Create Draft
```http
POST /api/drafts
```

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Draft Title",
  "content": "Draft content...",
  "boardId": 1
}
```

#### Update Draft
```http
PUT /api/drafts/:id
```

#### Delete Draft
```http
DELETE /api/drafts/:id
```

## Error Codes

| Code                  | Description               |
| --------------------- | ------------------------- |
| `INVALID_CREDENTIALS` | Invalid email or password |
| `USER_NOT_FOUND`      | User does not exist       |
| `POST_NOT_FOUND`      | Post does not exist       |
| `UNAUTHORIZED`        | Authentication required   |
| `FORBIDDEN`           | Insufficient permissions  |
| `VALIDATION_ERROR`    | Request validation failed |
| `RATE_LIMITED`        | Too many requests         |
| `SERVER_ERROR`        | Internal server error     |

## Rate Limiting

API requests are rate limited to prevent abuse:

- **Authentication endpoints**: 5 requests per minute
- **General endpoints**: 100 requests per minute
- **Search endpoints**: 20 requests per minute

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## WebSocket Events

The platform supports real-time updates via WebSocket:

### Connection
```javascript
const ws = new WebSocket('ws://localhost:50000/ws');
```

### Events

#### New Post
```json
{
  "type": "new_post",
  "data": {
    "post": { ... },
    "boardId": 1
  }
}
```

#### New Comment
```json
{
  "type": "new_comment",
  "data": {
    "comment": { ... },
    "postId": 1
  }
}
```

#### New Notification
```json
{
  "type": "new_notification",
  "data": {
    "notification": { ... }
  }
}
```

## SDK Examples

### JavaScript/TypeScript
```javascript
class CommunityHubAPI {
  constructor(baseURL, token) {
    this.baseURL = baseURL;
    this.token = token;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    const response = await fetch(url, config);
    return response.json();
  }

  async getPosts(boardId, page = 1) {
    return this.request(`/api/posts?boardId=${boardId}&page=${page}`);
  }

  async createPost(postData) {
    return this.request('/api/posts', {
      method: 'POST',
      body: JSON.stringify(postData)
    });
  }
}
```

### Python
```python
import requests

class CommunityHubAPI:
    def __init__(self, base_url, token):
        self.base_url = base_url
        self.token = token
        self.headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }

    def get_posts(self, board_id, page=1):
        response = requests.get(
            f'{self.base_url}/api/posts',
            params={'boardId': board_id, 'page': page},
            headers=self.headers
        )
        return response.json()

    def create_post(self, post_data):
        response = requests.post(
            f'{self.base_url}/api/posts',
            json=post_data,
            headers=self.headers
        )
        return response.json()
```

## Changelog

### Version 1.0.0
- Initial API release
- Authentication system
- Post and comment management
- User profiles and RPG system
- Real-time notifications
- Search functionality
- File attachments
- Draft system
