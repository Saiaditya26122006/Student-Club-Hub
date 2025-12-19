# OAuth Credentials Setup Guide

This guide explains exactly what tokens and credentials you need to get from Google, Facebook, and LinkedIn to enable social login.

## Quick Summary

You need to get **Client IDs** (not tokens) from each provider. These are one-time setup credentials that you add to your `.env` file.

## What You Need

### Required Credentials:
1. **Google**: Client ID (from Google Cloud Console)
2. **Facebook**: App ID (from Facebook Developers)
3. **LinkedIn**: Client ID (from LinkedIn Developers) - Optional

### What You DON'T Need:
- ❌ Access tokens (these are generated automatically during login)
- ❌ Secret keys (not needed for frontend OAuth)
- ❌ API keys (different from OAuth credentials)

---

## Step-by-Step Setup

### 1. Google OAuth Setup

#### What You Need:
- **Google Client ID** (looks like: `123456789-abcdefghijklmnop.apps.googleusercontent.com`)

#### How to Get It:

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Sign in with your Google account

2. **Create or Select a Project**
   - Click the project dropdown at the top
   - Click "New Project" or select an existing one
   - Give it a name like "ClubHub OAuth"

3. **Enable Google+ API**
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API" or "People API"
   - Click "Enable"

4. **Create OAuth Credentials**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - If prompted, configure the OAuth consent screen first:
     - User Type: External
     - App name: "Student Club-Hub"
     - User support email: Your email
     - Developer contact: Your email
     - Click "Save and Continue" through the steps

5. **Create OAuth Client ID**
   - Application type: **Web application**
   - Name: "ClubHub Web Client"
   - **Authorized JavaScript origins:**
     ```
     http://localhost:3000
     https://yourdomain.com  (for production)
     ```
   - **Authorized redirect URIs:**
     ```
     http://localhost:3000
     https://yourdomain.com  (for production)
     ```
   - Click "Create"

6. **Copy Your Client ID**
   - You'll see a popup with your Client ID
   - Copy it (it looks like: `123456789-abcdefghijklmnop.apps.googleusercontent.com`)
   - **You don't need the Client Secret for frontend OAuth**

#### Add to `.env`:
```env
REACT_APP_GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
```

---

### 2. Facebook OAuth Setup

#### What You Need:
- **Facebook App ID** (looks like: `1234567890123456`)

#### How to Get It:

1. **Go to Facebook Developers**
   - Visit: https://developers.facebook.com/
   - Sign in with your Facebook account

2. **Create a New App**
   - Click "My Apps" → "Create App"
   - Choose "Consumer" or "Business" type
   - Fill in:
     - App Display Name: "Student Club-Hub"
     - App Contact Email: Your email
   - Click "Create App"

3. **Add Facebook Login Product**
   - In your app dashboard, find "Add Product"
   - Click "Set Up" on "Facebook Login"
   - Choose "Web" platform

4. **Configure Facebook Login**
   - Go to "Facebook Login" → "Settings"
   - **Valid OAuth Redirect URIs:**
     ```
     http://localhost:3000
     https://yourdomain.com  (for production)
     ```
   - Click "Save Changes"

5. **Get Your App ID**
   - Go to "Settings" → "Basic"
   - You'll see "App ID" at the top
   - Copy it (it's a long number like: `1234567890123456`)

6. **Make App Public (Important!)**
   - In "Settings" → "Basic"
   - Add your domain to "App Domains"
   - Toggle "App Mode" to "Live" (or keep in Development mode for testing)
   - Add test users if in Development mode

#### Add to `.env`:
```env
REACT_APP_FACEBOOK_APP_ID=1234567890123456
```

---

### 3. LinkedIn OAuth Setup (Optional)

#### What You Need:
- **LinkedIn Client ID** (looks like: `86abc123def456`)

#### How to Get It:

1. **Go to LinkedIn Developers**
   - Visit: https://www.linkedin.com/developers/
   - Sign in with your LinkedIn account

2. **Create a New App**
   - Click "Create app"
   - Fill in:
     - App name: "Student Club-Hub"
     - LinkedIn Page: Select your company page (or create one)
     - Privacy policy URL: Your privacy policy URL
     - App logo: Upload a logo
   - Agree to terms and click "Create app"

3. **Request Access to Sign In with LinkedIn**
   - Go to "Products" tab
   - Find "Sign In with LinkedIn using OpenID Connect"
   - Click "Request access"
   - Fill out the form explaining your use case
   - Wait for approval (can take a few days)

4. **Configure Redirect URLs**
   - Go to "Auth" tab
   - Under "Redirect URLs", add:
     ```
     http://localhost:3000
     https://yourdomain.com  (for production)
     ```
   - Click "Update"

5. **Get Your Client ID**
   - In the "Auth" tab, you'll see:
     - **Client ID** (copy this)
     - **Client Secret** (you don't need this for frontend)

#### Add to `.env`:
```env
REACT_APP_LINKEDIN_CLIENT_ID=86abc123def456
```

**Note:** LinkedIn OAuth requires server-side token exchange, which is more complex. The current implementation provides basic structure, but full LinkedIn support may require additional backend work.

---

## Setting Up Your Environment Variables

### 1. Create/Edit `.env` File

In your `frontend` directory, create or edit the `.env` file:

```env
# Google OAuth
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id_here

# Facebook OAuth
REACT_APP_FACEBOOK_APP_ID=your_facebook_app_id_here

# LinkedIn OAuth (Optional)
REACT_APP_LINKEDIN_CLIENT_ID=your_linkedin_client_id_here
```

### 2. Replace Placeholders

Replace the placeholder values with your actual credentials:
- `your_google_client_id_here` → Your Google Client ID
- `your_facebook_app_id_here` → Your Facebook App ID
- `your_linkedin_client_id_here` → Your LinkedIn Client ID (if using)

### 3. Restart Your Development Server

After adding credentials, restart your React app:
```bash
# Stop the server (Ctrl+C)
# Then restart
npm start
```

---

## Testing Your Setup

### Test Google Login:
1. Make sure `REACT_APP_GOOGLE_CLIENT_ID` is set
2. Start your app
3. Go to login page
4. Select "Participant" role
5. Click Google login button
6. You should see Google's login popup

### Test Facebook Login:
1. Make sure `REACT_APP_FACEBOOK_APP_ID` is set
2. Start your app
3. Go to login page
4. Select "Participant" role
5. Click Facebook login button
6. You should see Facebook's login popup

### Common Issues:

**"Google login not working"**
- Check that Client ID is correct
- Verify authorized origins include `http://localhost:3000`
- Make sure you've enabled Google+ API

**"Facebook login not working"**
- Check that App ID is correct
- Verify redirect URIs are set
- Make sure app is not in restricted mode
- Add test users if app is in Development mode

**"LinkedIn login not working"**
- LinkedIn requires server-side implementation
- May need additional backend setup
- Consider using Google or Facebook instead

---

## Production Setup

When deploying to production:

1. **Update Authorized Origins/Redirects:**
   - Add your production domain (e.g., `https://clubhub.com`)
   - Remove `http://localhost:3000` or keep it for testing

2. **Update Environment Variables:**
   - Set production environment variables in your hosting platform
   - Never commit `.env` files to version control

3. **HTTPS Required:**
   - OAuth providers require HTTPS in production
   - Make sure your site has SSL certificate

---

## Security Notes

✅ **DO:**
- Keep your Client IDs in `.env` file
- Add `.env` to `.gitignore`
- Use different credentials for development and production
- Regularly review OAuth app permissions

❌ **DON'T:**
- Commit Client IDs to version control
- Share your credentials publicly
- Use production credentials in development
- Store credentials in code files

---

## Quick Reference

| Provider | What You Need | Where to Get It | Format |
|----------|---------------|-----------------|--------|
| **Google** | Client ID | Google Cloud Console | `123456789-abc...apps.googleusercontent.com` |
| **Facebook** | App ID | Facebook Developers | `1234567890123456` |
| **LinkedIn** | Client ID | LinkedIn Developers | `86abc123def456` |

---

## Need Help?

- **Google OAuth Docs**: https://developers.google.com/identity/protocols/oauth2
- **Facebook Login Docs**: https://developers.facebook.com/docs/facebook-login/
- **LinkedIn OAuth Docs**: https://docs.microsoft.com/en-us/linkedin/shared/authentication/authentication

---

## Summary

**You need to get:**
1. ✅ Google Client ID (required)
2. ✅ Facebook App ID (required)
3. ⚠️ LinkedIn Client ID (optional, more complex)

**You DON'T need:**
- ❌ Access tokens (generated automatically)
- ❌ Client secrets (not needed for frontend)
- ❌ API keys (different from OAuth)

**Time Required:**
- Google: ~10 minutes
- Facebook: ~15 minutes
- LinkedIn: ~20 minutes + approval wait time

Once you have these credentials and add them to your `.env` file, social login will work!

