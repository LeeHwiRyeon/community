# Authentication System Demo

## Test Users

You can use these test accounts to explore the authentication system:

### Admin Account
- **Email:** admin@example.com
- **Password:** admin123
- **Role:** Admin (has access to admin dashboard and all moderation features)

### Moderator Account  
- **Email:** mod@example.com
- **Password:** mod123
- **Role:** Moderator (has access to admin dashboard and content moderation)

### Regular User Account
- **Email:** user@example.com  
- **Password:** user123
- **Role:** User (standard user access)

## Features Implemented

✅ **Complete Authentication Flow**
- Login/logout functionality
- User registration with validation
- Session persistence using useKV hook
- Automatic session expiry after 24 hours of inactivity

✅ **Role-Based Access Control**
- Admin role: Full access to admin dashboard and all features
- Moderator role: Access to content moderation tools
- User role: Standard community access

✅ **User Profile Management**
- Profile dropdown with user information
- User stats (reputation, posts, comments)
- Bookmarks and liked content tracking
- Online status indicators

✅ **Admin Dashboard**
- Content moderation interface
- User management (planned)
- Community statistics
- Reported content review
- Export capabilities

✅ **Security Features**
- Password validation (minimum 6 characters)
- Session management with auto-logout
- Role-based UI rendering
- Protected admin routes

✅ **UI/UX Enhancements**
- Apple-inspired design language
- Newspaper warm color scheme
- Smooth animations and transitions
- Responsive design
- Toast notifications for user feedback

## How to Test

1. **Login Test:** Click the "Login" button in the header and use one of the test accounts above
2. **Registration Test:** Switch to the "Sign Up" tab and create a new account
3. **Admin Features:** Login as admin/moderator to see the shield icon for admin dashboard access
4. **User Profile:** Once logged in, click on your avatar to see the profile dropdown
5. **Logout Test:** Use the logout option in the profile dropdown
6. **Session Persistence:** Refresh the page while logged in to see session persistence
7. **Auto-logout:** The system will auto-logout after 24 hours of inactivity

## Architecture

The authentication system uses:
- **React Context** for global state management
- **useKV hook** for persistent storage
- **Mock user database** for demonstration (easily replaceable with real API)
- **TypeScript** for type safety
- **Role-based permissions** system for access control