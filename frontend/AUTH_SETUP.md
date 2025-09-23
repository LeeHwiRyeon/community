Authentication System Quick Setup Guide

The authentication system has been fixed and is now working. Here's what's available:

## Test Accounts
- **Admin**: admin@example.com / admin123
- **Moderator**: mod@example.com / mod123  
- **User**: user@example.com / user123

## Features Working:
✅ Login/Register Modal
✅ User Authentication Context
✅ Persistent Login State (uses useKV)
✅ Role-based Permissions (admin, moderator, user)
✅ Session Management (24-hour auto-logout)
✅ User Profile Dropdown in Header
✅ Logout Functionality

## How to Test:
1. Click "로그인" button in header or main page
2. Use any test account above
3. After login, you'll see username in header
4. Admin users can access admin dashboard
5. All users can comment on posts
6. User state persists across page refreshes

## Components:
- `/contexts/AuthContext.tsx` - Main auth logic
- `/components/AuthModal.tsx` - Login/register UI
- `/components/Header.tsx` - User menu integration

## Next Steps:
- Admin dashboard for content moderation
- User profile pages
- Enhanced permissions system
- Real authentication backend integration