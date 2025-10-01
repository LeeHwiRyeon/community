# Community Hub - English Documentation

Community Hub is a modern React + TypeScript community platform featuring real-time interactions, user profiles, content management, and comprehensive community features. The platform is built with a full-stack architecture using Express.js backend and React frontend.

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Quick Start](#quick-start)
- [Development Setup](#development-setup)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## Overview

Community Hub is a comprehensive community platform designed to facilitate user engagement, content sharing, and real-time interactions. The platform supports multiple community boards, user profiles with RPG-style progression, real-time notifications, and advanced content management features.

### Key Capabilities
- **Multi-Community Support**: Multiple themed community boards
- **User Management**: Profile system with RPG-style progression and badges
- **Real-time Features**: Live notifications, real-time updates
- **Content Management**: Rich text editing, file attachments, draft system
- **Search & Discovery**: Advanced search with filtering and categorization
- **Analytics**: Comprehensive user and content analytics

## Features

### Core Community Features
- **Community Boards**: Themed boards for different topics and interests
- **Post Management**: Create, edit, and manage posts with rich text editing
- **Comment System**: Nested comment threads with reactions and voting
- **User Profiles**: Detailed user profiles with activity tracking
- **Search & Filtering**: Advanced search with multiple filter options
- **Notifications**: Real-time notification system

### Advanced Features
- **RPG Profile System**: Level-based progression with badges and achievements
- **Draft System**: Auto-save drafts with conflict resolution
- **File Attachments**: Support for images, videos, and documents
- **Voting System**: Community-driven content ranking
- **Tag System**: Content categorization and discovery
- **Analytics Dashboard**: User and content performance metrics

### Technical Features
- **Real-time Updates**: WebSocket-based live updates
- **Responsive Design**: Mobile-first responsive interface
- **Performance Optimization**: Lazy loading, caching, and optimization
- **Security**: JWT authentication, input validation, and security headers
- **Testing**: Comprehensive test coverage with unit, integration, and E2E tests

## Technology Stack

### Frontend
- **React 18**: Modern React with hooks and functional components
- **TypeScript**: Type-safe development
- **Chakra UI**: Component library for consistent UI
- **React Router**: Client-side routing
- **TanStack Query**: Data fetching and caching
- **Redux Toolkit**: State management
- **Vite**: Build tool and development server

### Backend
- **Node.js**: JavaScript runtime
- **Express.js**: Web application framework
- **MariaDB/MySQL**: Primary database
- **Redis**: Caching and session storage
- **JWT**: Authentication and authorization
- **WebSocket**: Real-time communication
- **BullMQ**: Background job processing

### Development & Testing
- **Vitest**: Unit testing framework
- **Playwright**: End-to-end testing
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Docker**: Containerization

## Quick Start

### Prerequisites
- Node.js 18+ and npm 8+
- MariaDB/MySQL database
- Redis server
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd community
   ```

2. **Install dependencies**
   ```bash
   # Backend dependencies
   cd server-backend
   npm install

   # Frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Environment setup**
   ```bash
   # Copy environment template
   cp server-backend/.env.example server-backend/.env
   
   # Configure database and Redis settings
   # Edit server-backend/.env with your database credentials
   ```

4. **Database setup**
   ```bash
   cd server-backend
   npm run import:init
   ```

5. **Start development servers**
   ```bash
   # Backend (Terminal 1)
   cd server-backend
   npm run dev

   # Frontend (Terminal 2)
   cd frontend
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:5000
   - Backend API: http://localhost:50000

## Development Setup

### Project Structure
```
community/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── contexts/       # React contexts
│   │   ├── api/            # API service functions
│   │   └── utils/          # Utility functions
│   └── package.json
├── server-backend/          # Express.js backend
│   ├── src/
│   │   ├── routes/         # API route handlers
│   │   ├── services/       # Business logic services
│   │   ├── auth/           # Authentication modules
│   │   └── db.js           # Database connection
│   └── package.json
├── data/                    # Initial data and fixtures
├── docs/                    # Documentation
└── scripts/                 # Utility scripts
```

### Development Workflow

1. **Feature Development**
   - Create feature branches from `main`
   - Follow the component-first development approach
   - Write tests for new features
   - Update documentation as needed

2. **Code Quality**
   - Run linting: `npm run lint`
   - Run type checking: `npm run typecheck`
   - Run tests: `npm test`

3. **Testing Strategy**
   - Unit tests for individual components and functions
   - Integration tests for API endpoints
   - End-to-end tests for user workflows

## API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile

### Community Endpoints
- `GET /api/communities` - List all communities
- `GET /api/communities/:id` - Get community details
- `GET /api/communities/:id/boards` - Get community boards

### Post Endpoints
- `GET /api/posts` - List posts with pagination
- `POST /api/posts` - Create new post
- `GET /api/posts/:id` - Get post details
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post

### User Endpoints
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/:id` - Update user profile
- `GET /api/users/:id/posts` - Get user's posts

### Search Endpoints
- `GET /api/search` - Search posts and users
- `GET /api/search/suggestions` - Get search suggestions

## Testing

### Running Tests

```bash
# Frontend tests
cd frontend
npm test

# Backend tests
cd server-backend
npm test

# End-to-end tests
npm run test:e2e

# All tests
npm run test:ci
```

### Test Coverage
- Unit tests: 85%+ coverage
- Integration tests: All API endpoints
- E2E tests: Critical user workflows

## Deployment

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up --build

# Production deployment
docker-compose -f docker-compose.prod.yml up -d
```

### Environment Configuration
- Development: Local development with hot reload
- Staging: Pre-production testing environment
- Production: Live production environment

### Monitoring
- Health checks: `/api/health`
- Metrics: `/api/metrics`
- Logs: Structured logging with different levels

## Contributing

### Development Guidelines
1. Follow the existing code style and patterns
2. Write comprehensive tests for new features
3. Update documentation for API changes
4. Use meaningful commit messages
5. Create pull requests for all changes

### Code Review Process
1. All code must be reviewed before merging
2. Tests must pass before review
3. Documentation must be updated
4. Security implications must be considered

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

For more detailed documentation, see the `/docs` directory for specific guides and API references.
