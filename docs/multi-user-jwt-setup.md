# Multi-User JWT Authentication Setup

## Overview
This document explains how the Smart Meal Planner application supports multiple concurrent users across different localhost ports using JWT (JSON Web Tokens) authentication.

## Architecture

### Backend Configuration
- **Single Backend Server**: Runs on `http://localhost:5001`
- **CORS Configuration**: Allows requests from multiple frontend ports
- **JWT Authentication**: Stateless token-based authentication
- **Multiple Sessions**: Supports unlimited concurrent user sessions

### Frontend Instances
- **Port 5173**: Primary frontend instance
- **Port 5174**: Secondary frontend instance  
- **Port 5175**: Tertiary frontend instance
- **Additional Ports**: Can be added as needed (5176, 5177, etc.)

## Key Features

### 1. CORS Configuration
```javascript
app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://localhost:5174',
    'http://localhost:5175', 
    'http://localhost:5176',
    'http://localhost:5177',
    'http://localhost:3000'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
```

### 2. JWT Token Handling
- **Storage**: Tokens stored in `localStorage` with port-specific keys
- **Format**: `Bearer <token>` in Authorization header
- **Expiration**: 7 days for both admin and user tokens
- **Stateless**: No server-side session storage required

### 3. Authentication Middleware
- Extracts token from `Authorization` header
- Verifies JWT signature and expiration
- Supports both admin and regular user authentication
- Returns proper error responses for invalid/expired tokens

### 4. Multi-Session Support
- Each frontend instance maintains independent localStorage
- Same user can login on multiple ports simultaneously
- Different users can login on different ports
- No session conflicts or limitations

## Usage Examples

### Scenario 1: Multiple Users, Different Ports
- **Port 5173**: User A logs in with `user1@test.com`
- **Port 5174**: User B logs in with `user2@test.com`
- **Port 5175**: Admin logs in with `admin/admin1234`

### Scenario 2: Same User, Multiple Ports
- **Port 5173**: Admin logs in
- **Port 5174**: Same admin logs in again
- Both sessions remain active and functional

### Scenario 3: Mixed Sessions
- **Port 5173**: Regular user session
- **Port 5174**: Admin session
- **Port 5175**: Different regular user session

## Testing

### Multi-User Test Page
Access `http://localhost:5173/multi-user-test.html` to:
- Test login functionality across different ports
- Verify API access with stored tokens
- Check session status for all ports
- Demonstrate concurrent user sessions

### Manual Testing Steps
1. Open multiple browser tabs/windows
2. Navigate to different frontend ports
3. Login with different credentials on each port
4. Verify all sessions work independently
5. Test API calls from each session

## Security Considerations

### JWT Benefits
- **Stateless**: No server-side session storage
- **Scalable**: Supports unlimited concurrent sessions
- **Secure**: Cryptographically signed tokens
- **Flexible**: Easy to implement across multiple frontends

### Best Practices Implemented
- Tokens stored in localStorage (not cookies)
- Authorization header used for token transmission
- Proper CORS configuration for multiple origins
- Token expiration handling
- Error responses for authentication failures

## Troubleshooting

### Common Issues
1. **CORS Errors**: Ensure all frontend ports are listed in CORS origin array
2. **Token Not Found**: Check if token is stored with correct port-specific key
3. **Network Errors**: Verify backend server is running on port 5001
4. **Authentication Failures**: Check token format and Authorization header

### Debug Steps
1. Check browser developer tools for network requests
2. Verify Authorization header contains `Bearer <token>`
3. Check backend logs for authentication middleware errors
4. Confirm CORS preflight requests are successful

## File Locations

### Backend Files
- **CORS Config**: `backend/src/server.js`
- **Auth Middleware**: `backend/src/middlewares/auth.js`
- **Login Route**: `backend/src/routes/userRoutes.js`

### Frontend Files
- **Test Page**: `frontend/Smarty/multi-user-test.html`
- **Main App**: `frontend/Smarty/src/`

### Documentation
- **Setup Guide**: `docs/multi-user-jwt-setup.md`

## Conclusion

The Smart Meal Planner application successfully implements multi-user JWT authentication that supports:
- ✅ Multiple concurrent user sessions
- ✅ Cross-port authentication
- ✅ Stateless token-based security
- ✅ Scalable architecture
- ✅ Independent session management

This setup allows unlimited users to access the application simultaneously across different frontend instances without any session conflicts or limitations.