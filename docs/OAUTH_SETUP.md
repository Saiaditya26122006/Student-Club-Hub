# OAuth Social Login Setup Guide

This guide will help you set up OAuth authentication for Google, Facebook, and LinkedIn in the Student Club-Hub application.

## Overview

The application now supports social media authentication, allowing users to sign in or sign up using their Google, Facebook, or LinkedIn accounts. This makes it easier to:
- Register new accounts quickly
- Sign in without remembering passwords
- Send notifications to users via their social media accounts

## Backend Setup

### 1. Install Dependencies

The required packages are already in `requirements.txt`:
- `Authlib==1.3.0` - OAuth library
- `requests==2.31.0` - For making HTTP requests to OAuth providers

Install them:
```bash
cd backend
pip install -r requirements.txt
```

### 2. Database Migration

The User model has been updated to support OAuth:
- `password` field is now nullable (OAuth users don't have passwords)
- `provider` field stores the OAuth provider name ('google', 'facebook', 'linkedin', or None)
- `provider_id` field stores the OAuth provider's user ID

**Important:** You need to update your database schema. Run this SQL migration:

```sql
-- Make password nullable
ALTER TABLE users ALTER COLUMN password DROP NOT NULL;

-- Add OAuth fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS provider VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS provider_id VARCHAR(200);
```

Or use Flask-Migrate:
```bash
flask db migrate -m "Add OAuth support"
flask db upgrade
```

### 3. Environment Variables

No additional environment variables are required for the backend. The OAuth verification is done using access tokens provided by the frontend.

## Frontend Setup

### 1. Environment Variables

Create a `.env` file in the `frontend` directory (or add to existing `.env`):

```env
# Google OAuth
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id_here

# Facebook OAuth
REACT_APP_FACEBOOK_APP_ID=your_facebook_app_id_here

# LinkedIn OAuth (optional)
REACT_APP_LINKEDIN_CLIENT_ID=your_linkedin_client_id_here
```

### 2. Get OAuth Credentials

#### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Choose "Web application"
6. Add authorized JavaScript origins:
   - `http://localhost:3000` (for development)
   - `https://yourdomain.com` (for production)
7. Add authorized redirect URIs:
   - `http://localhost:3000` (for development)
   - `https://yourdomain.com` (for production)
8. Copy the Client ID and add it to `.env` as `REACT_APP_GOOGLE_CLIENT_ID`

#### Facebook OAuth Setup

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app or select an existing one
3. Add "Facebook Login" product
4. Go to Settings → Basic
5. Add your site URL to "App Domains"
6. Add platform "Website" with Site URL:
   - `http://localhost:3000` (for development)
   - `https://yourdomain.com` (for production)
7. Copy the App ID and add it to `.env` as `REACT_APP_FACEBOOK_APP_ID`
8. In Facebook Login → Settings, add Valid OAuth Redirect URIs:
   - `http://localhost:3000` (for development)
   - `https://yourdomain.com` (for production)

#### LinkedIn OAuth Setup

1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Create a new app
3. In "Auth" tab, add redirect URLs:
   - `http://localhost:3000` (for development)
   - `https://yourdomain.com` (for production)
4. Request access to "Sign In with LinkedIn" product
5. Copy the Client ID and add it to `.env` as `REACT_APP_LINKEDIN_CLIENT_ID`

**Note:** LinkedIn OAuth requires server-side token exchange, which is more complex. The current implementation provides a basic structure, but you may need to implement a server-side callback endpoint for full LinkedIn support.

## How It Works

### User Flow

1. User clicks on a social login button (Google, Facebook, or LinkedIn)
2. A popup window opens with the OAuth provider's login page
3. User authenticates with the provider
4. Provider returns an access token
5. Frontend sends the access token to backend endpoint `/api/oauth/<provider>`
6. Backend verifies the token with the provider and gets user info
7. Backend creates a new user (if first time) or logs in existing user
8. Backend returns a JWT token
9. User is logged in and redirected to their dashboard

### Backend Endpoints

- `POST /api/oauth/google` - Handle Google OAuth
- `POST /api/oauth/facebook` - Handle Facebook OAuth
- `POST /api/oauth/linkedin` - Handle LinkedIn OAuth

All endpoints expect:
```json
{
  "access_token": "token_from_provider",
  "email": "user@example.com",
  "name": "User Name",
  "profile_image": "https://...",
  "provider_id": "provider_user_id",
  "role": "participant" // optional, defaults to "participant"
}
```

### Security Notes

1. **Token Verification**: The backend always verifies tokens with the OAuth provider before creating/logging in users
2. **Email Uniqueness**: Each email can only be registered with one OAuth provider
3. **Password Protection**: OAuth users cannot use password login (they must use social login)
4. **JWT Tokens**: All users (OAuth or not) receive JWT tokens for session management

## Testing

1. Start the backend server:
   ```bash
   cd backend
   python app.py
   ```

2. Start the frontend:
   ```bash
   cd frontend
   npm start
   ```

3. Navigate to `/login` or `/register`
4. Click on a social login button
5. Complete the OAuth flow
6. You should be logged in and redirected to your dashboard

## Troubleshooting

### Google Login Not Working
- Check that `REACT_APP_GOOGLE_CLIENT_ID` is set correctly
- Verify authorized origins and redirect URIs in Google Cloud Console
- Check browser console for errors

### Facebook Login Not Working
- Ensure Facebook SDK is loaded (check browser console)
- Verify App ID is correct
- Check that redirect URIs are added in Facebook App Settings
- Make sure the app is not in "Development Mode" if testing with non-admin accounts

### LinkedIn Login Not Working
- LinkedIn OAuth requires server-side implementation
- Consider implementing a callback endpoint for full LinkedIn support
- For now, users can use Google or Facebook

### "Invalid or expired token" Error
- Tokens expire quickly (usually within minutes)
- Make sure the OAuth flow completes quickly
- Check that the backend can reach the OAuth provider's API

### Database Errors
- Make sure you've run the database migration
- Check that `password` column allows NULL values
- Verify `provider` and `provider_id` columns exist

## Production Considerations

1. **HTTPS Required**: OAuth providers require HTTPS in production
2. **Environment Variables**: Never commit `.env` files to version control
3. **Error Handling**: Implement proper error handling and user feedback
4. **Rate Limiting**: Consider rate limiting on OAuth endpoints
5. **Logging**: Log OAuth attempts for security monitoring

## Support

For issues or questions, please refer to:
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Facebook Login Documentation](https://developers.facebook.com/docs/facebook-login/)
- [LinkedIn OAuth Documentation](https://docs.microsoft.com/en-us/linkedin/shared/authentication/authentication)

