# Agent Instructions for Community Hub Development

## Language Policy

**CRITICAL: All documentation, code comments, and communication must be in English only.**

### Documentation Standards
- All README files, API documentation, and technical guides must be written in English
- Code comments and inline documentation must be in English
- Commit messages and pull request descriptions must be in English
- User-facing text in the application should be in English (unless specifically for internationalization)

### Code Quality Standards
- Follow TypeScript strict mode guidelines
- Use meaningful English variable and function names
- Write comprehensive English comments for complex logic
- Maintain consistent code formatting with Prettier

## Project Structure Overview

### Frontend Architecture (React + TypeScript)
```
frontend/src/
├── components/          # Reusable UI components
│   ├── AdvancedVotingSystem.tsx
│   ├── CommentSection.tsx
│   ├── Header.tsx
│   ├── Navigation.tsx
│   ├── PostListWithReadStatus.tsx
│   └── [other components]
├── pages/              # Page-level components
│   ├── HomePage.tsx
│   ├── PostPage.tsx
│   ├── BoardPage.tsx
│   └── [other pages]
├── hooks/              # Custom React hooks
│   ├── useCommunityData.ts
│   ├── usePostData.ts
│   └── useDraftAutoSave.ts
├── contexts/           # React contexts
│   ├── AuthContext.tsx
│   └── ThemeContext.tsx
├── api/                # API service functions
├── utils/              # Utility functions
└── store/              # Redux store configuration
```

### Backend Architecture (Node.js + Express)
```
server-backend/src/
├── routes.js           # Main API routes
├── server.js           # Express server setup
├── auth/               # Authentication modules
├── services/           # Business logic services
│   ├── posts/          # Post-related services
│   ├── profile/        # User profile services
│   └── attachments/    # File attachment services
├── config/             # Configuration files
├── optimizations/      # Performance optimizations
└── tests/              # Test files
```

## Development Guidelines

### Component Development
1. **Use TypeScript interfaces for props**
   ```typescript
   interface PostCardProps {
     post: Post;
     onVote: (postId: number, type: 'up' | 'down') => void;
     showActions?: boolean;
   }
   ```

2. **Follow React best practices**
   - Use functional components with hooks
   - Implement proper error boundaries
   - Use memoization for performance optimization
   - Write comprehensive tests

3. **Component structure**
   ```typescript
   const ComponentName: React.FC<ComponentNameProps> = ({ 
     // Destructure props
   }) => {
     // Component logic here
     
     return (
       <div className="component-class">
         {/* JSX content */}
       </div>
     );
   };
   ```

### API Development
1. **Follow RESTful conventions**
   - Use appropriate HTTP methods (GET, POST, PUT, DELETE)
   - Implement proper status codes
   - Include comprehensive error handling

2. **Response format**
   ```javascript
   // Success response
   {
     "success": true,
     "data": { ... },
     "message": "Operation completed successfully"
   }

   // Error response
   {
     "success": false,
     "error": {
       "code": "ERROR_CODE",
       "message": "Human readable error message"
     }
   }
   ```

### Database Management
1. **Use prepared statements**
   ```javascript
   const posts = await db.query(
     'SELECT * FROM posts WHERE board_id = ? AND created_at > ?',
     [boardId, sinceDate]
   );
   ```

2. **Implement proper indexing**
   ```sql
   CREATE INDEX idx_posts_board_id ON posts(board_id);
   CREATE INDEX idx_posts_created_at ON posts(created_at);
   ```

### Testing Requirements
1. **Unit tests** - Test individual functions and components
2. **Integration tests** - Test API endpoints and database interactions
3. **End-to-end tests** - Test complete user workflows
4. **Maintain 85%+ test coverage**

## Code Inspection Findings

### Frontend Components
- **Well-structured React components** with proper TypeScript interfaces
- **Comprehensive component library** including voting systems, comment systems, and user interfaces
- **Custom hooks** for data management and state handling
- **Proper separation of concerns** between components, pages, and utilities

### Backend Services
- **Modular service architecture** with separate concerns for posts, profiles, and attachments
- **Comprehensive authentication system** with JWT and social providers
- **Performance optimization middleware** for caching and response times
- **Robust error handling** and logging systems

### Database Schema
- **Well-normalized database structure** with proper foreign key relationships
- **Comprehensive indexing strategy** for optimal query performance
- **Support for complex features** like voting, comments, and user profiles

## Security Guidelines

### Input Validation
- Sanitize all user inputs
- Validate data types and formats
- Implement rate limiting for API endpoints

### Authentication & Authorization
- Use JWT tokens for session management
- Implement proper password hashing
- Validate user permissions for all operations

### Data Protection
- Use HTTPS in production
- Implement proper CORS policies
- Sanitize database queries to prevent SQL injection

## Performance Optimization

### Frontend
- Implement code splitting for large components
- Use React.memo for expensive components
- Optimize images and assets
- Implement virtual scrolling for large lists

### Backend
- Use Redis for caching frequently accessed data
- Implement database connection pooling
- Optimize database queries with proper indexing
- Use compression middleware

## Deployment Guidelines

### Environment Configuration
- Use environment variables for sensitive configuration
- Implement proper logging levels
- Configure health checks and monitoring

### Docker Configuration
- Use multi-stage builds for optimized images
- Implement proper security practices
- Configure resource limits

## Monitoring and Maintenance

### Logging
- Use structured logging with appropriate levels
- Implement log rotation and retention policies
- Monitor error rates and performance metrics

### Health Checks
- Implement comprehensive health check endpoints
- Monitor database connectivity
- Track API response times

## Translation System

### Chat Translation (Korean ↔ English)
- **Input**: Korean messages should be automatically translated to English for processing
- **Output**: English responses should be automatically translated to Korean for user display
- **Implementation**: Use a translation service or API to handle real-time translation

### Documentation Translation
- All technical documentation must be in English
- User-facing documentation can be translated to Korean if needed
- Maintain English as the primary language for development

## Quality Assurance

### Code Review Checklist
- [ ] All code is in English
- [ ] TypeScript types are properly defined
- [ ] Components have proper error handling
- [ ] API endpoints have comprehensive error responses
- [ ] Tests cover all new functionality
- [ ] Performance implications are considered
- [ ] Security best practices are followed

### Testing Requirements
- [ ] Unit tests for all new functions
- [ ] Integration tests for API endpoints
- [ ] End-to-end tests for user workflows
- [ ] Performance tests for critical paths
- [ ] Security tests for authentication flows

## Communication Guidelines

### Development Communication
- All technical discussions must be in English
- Use clear, concise language in code comments
- Document all architectural decisions
- Maintain comprehensive changelog

### User Communication
- User-facing messages should be in Korean (for Korean users)
- Error messages should be clear and actionable
- Provide helpful context for troubleshooting

## Emergency Procedures

### Critical Issues
1. **Security vulnerabilities** - Immediately patch and deploy fixes
2. **Data corruption** - Restore from backups and investigate root cause
3. **Performance degradation** - Monitor metrics and implement optimizations
4. **Service outages** - Follow incident response procedures

### Backup and Recovery
- Regular database backups
- Code repository backups
- Configuration file backups
- Disaster recovery procedures

---

**Remember: English is the primary language for all development work. This ensures consistency, maintainability, and international collaboration.**
