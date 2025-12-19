# Fix Google OAuth "Can't continue" Error

If you're seeing the error "Can't continue with google.com" or "Something went wrong", you need to configure your Google Cloud Console settings.

## Quick Fix Steps

### 1. Go to Google Cloud Console
Visit: https://console.cloud.google.com/

### 2. Select Your Project
- Make sure you're in the project that has Client ID: `7442551621-d66kti8464k62f5on677luk80mr2k6ce`

### 3. Configure OAuth Settings

Go to: **APIs & Services** → **Credentials** → Click on your OAuth 2.0 Client ID

#### Add Authorized JavaScript Origins:
```
http://localhost:3000
```
(Add your production domain later: `https://yourdomain.com`)

#### Add Authorized Redirect URIs:
```
http://localhost:3000/google-oauth-callback.html
```
(Add your production domain later: `https://yourdomain.com/google-oauth-callback.html`)

### 4. Save Changes
Click **Save** at the bottom

### 5. Wait a Few Minutes
Google's changes can take 1-5 minutes to propagate

### 6. Test Again
- Restart your React app
- Try Google login again

## Important Notes

✅ **Must Include:**
- `http://localhost:3000` in JavaScript Origins
- `http://localhost:3000/google-oauth-callback.html` in Redirect URIs

❌ **Don't Include:**
- Trailing slashes (wrong: `http://localhost:3000/`)
- Different ports
- HTTPS for localhost (use HTTP)

## Still Not Working?

1. **Check OAuth Consent Screen:**
   - Go to **APIs & Services** → **OAuth consent screen**
   - Make sure it's configured (even for testing)
   - Add your email as a test user if in "Testing" mode

2. **Verify Client ID:**
   - Make sure the Client ID matches: `7442551621-d66kti8464k62f5on677luk80mr2k6ce.apps.googleusercontent.com`

3. **Clear Browser Cache:**
   - Clear cookies for `accounts.google.com`
   - Try in incognito/private mode

4. **Check Console for Errors:**
   - Open browser DevTools (F12)
   - Check Console tab for specific error messages

## Production Setup

When deploying to production, add:
- **JavaScript Origins:** `https://yourdomain.com`
- **Redirect URIs:** `https://yourdomain.com/google-oauth-callback.html`

Replace `yourdomain.com` with your actual domain.

