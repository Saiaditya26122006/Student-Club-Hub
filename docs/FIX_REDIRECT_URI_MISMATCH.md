# Fix "Error 400: redirect_uri_mismatch" - Step by Step Guide

This error means Google doesn't recognize the redirect URI your app is using. Follow these exact steps to fix it.

## Step-by-Step Fix

### Step 1: Open Google Cloud Console
1. Go to: **https://console.cloud.google.com/**
2. Make sure you're signed in with the correct Google account

### Step 2: Select Your Project
1. At the top of the page, click the **project dropdown** (shows current project name)
2. Find and select the project that contains your OAuth Client ID: `1401930180-5pakr3jnjlckt95jsgn2hus3kvsbv5v0`
3. If you can't find it, search for projects containing "1401930180"

### Step 3: Navigate to Credentials
1. In the left sidebar, click **"APIs & Services"**
2. Then click **"Credentials"** (or go directly: https://console.cloud.google.com/apis/credentials)

### Step 4: Find Your OAuth Client
1. Look for **"OAuth 2.0 Client IDs"** section
2. Find the client with ID starting with: `1401930180-5pakr3jnjlckt95jsgn2hus3kvsbv5v0`
3. Click on the **name** of the OAuth client (or click the **pencil/edit icon**)

### Step 5: Add Authorized JavaScript Origins
1. Scroll down to **"Authorized JavaScript origins"** section
2. Click **"+ ADD URI"** button
3. Type exactly this (no quotes, no trailing slash):
   ```
   http://localhost:3000
   ```
4. Press Enter or click outside the field

### Step 6: Add Authorized Redirect URIs (THIS IS THE KEY STEP!)
1. Scroll down to **"Authorized redirect URIs"** section
2. Click **"+ ADD URI"** button
3. Type exactly this (no quotes, no trailing slash):
   ```
   http://localhost:3000/google-oauth-callback.html
   ```
4. Press Enter or click outside the field

### Step 7: Save Changes
1. Scroll to the bottom of the page
2. Click the **"SAVE"** button (usually blue, at the bottom)
3. Wait for the confirmation message "Client saved"

### Step 8: Wait for Propagation
- **Wait 1-2 minutes** for Google's servers to update
- Changes can take up to 5 minutes to fully propagate

### Step 9: Test
1. Go back to your React app
2. **Restart your React development server:**
   ```bash
   # Stop the server (Ctrl+C)
   # Then restart
   npm start
   ```
3. Try Google login again

## Visual Checklist

Your Google Cloud Console should show:

**Authorized JavaScript origins:**
```
http://localhost:3000
```

**Authorized redirect URIs:**
```
http://localhost:3000/google-oauth-callback.html
```

## Common Mistakes to Avoid

❌ **WRONG:**
- `http://localhost:3000/` (trailing slash)
- `http://localhost:3000` (missing `/google-oauth-callback.html`)
- `https://localhost:3000/google-oauth-callback.html` (using HTTPS)
- `http://127.0.0.1:3000/google-oauth-callback.html` (using 127.0.0.1 instead of localhost)
- `localhost:3000/google-oauth-callback.html` (missing `http://`)

✅ **CORRECT:**
- `http://localhost:3000/google-oauth-callback.html` (exact match)

## If You're Using a Different Port

If your React app runs on a different port (like 3001, 3002, etc.):

1. Check what port your app is running on (look at the terminal where you ran `npm start`)
2. Use that port instead:
   - JavaScript origin: `http://localhost:YOUR_PORT`
   - Redirect URI: `http://localhost:YOUR_PORT/google-oauth-callback.html`

## Still Not Working?

### 1. Double-Check the Redirect URI
- Make sure it's **exactly**: `http://localhost:3000/google-oauth-callback.html`
- No extra spaces, no quotes, no trailing slash

### 2. Verify You're Editing the Correct Client ID
- The Client ID should start with: `1401930180-5pakr3jnjlckt95jsgn2hus3kvsbv5v0`
- If you have multiple OAuth clients, make sure you're editing the right one

### 3. Clear Browser Cache
- Clear cookies for `accounts.google.com`
- Try in **incognito/private mode**

### 4. Check OAuth Consent Screen
- Go to: **APIs & Services** → **OAuth consent screen**
- Make sure it's configured (even if just for testing)
- If it's in "Testing" mode, add your email (`tsaiaditya1234@gmail.com`) as a test user

### 5. Wait Longer
- Sometimes Google takes 5-10 minutes to propagate changes
- Try again after waiting

### 6. Check Browser Console
- Open DevTools (F12)
- Go to Console tab
- Look for any additional error messages

## Quick Reference

**What to add in Google Cloud Console:**

| Field | Value |
|-------|-------|
| **Authorized JavaScript origins** | `http://localhost:3000` |
| **Authorized redirect URIs** | `http://localhost:3000/google-oauth-callback.html` |

**Your Client ID:**
```
1401930180-5pakr3jnjlckt95jsgn2hus3kvsbv5v0.apps.googleusercontent.com
```

## Still Having Issues?

If you've followed all steps and it's still not working:

1. Take a screenshot of your Google Cloud Console OAuth settings
2. Check the browser console (F12) for any error messages
3. Verify your React app is running on port 3000 (check the terminal)

The most common issue is forgetting to add the redirect URI or adding it incorrectly. Make sure it's **exactly** `http://localhost:3000/google-oauth-callback.html` with no variations.

