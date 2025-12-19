# ClubHub - Render Deployment Guide

## Prerequisites
1. GitHub account
2. Render account (sign up at https://render.com)
3. Your code pushed to GitHub repository

## Step 1: Push Code to GitHub

```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit changes
git commit -m "Prepare for Render deployment"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

## Step 2: Create PostgreSQL Database on Render

1. Go to https://dashboard.render.com
2. Click "New +" → "PostgreSQL"
3. Fill in:
   - **Name**: `clubhub-db`
   - **Database**: `clubhub_db`
   - **User**: `clubhub_user`
   - **Region**: Choose closest to you
   - **Plan**: Free
4. Click "Create Database"
5. **IMPORTANT**: Copy the "Internal Database URL" (it starts with `postgresql://`)

## Step 3: Deploy Backend API

1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Fill in:
   - **Name**: `clubhub-backend`
   - **Region**: Same as database
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn -c gunicorn_config.py run:app`
   - **Plan**: Free

4. **Environment Variables** - Click "Advanced" → Add these:
   - `DATABASE_URL`: Paste the Internal Database URL from Step 2
   - `JWT_SECRET_KEY`: Generate a random string (e.g., `openssl rand -hex 32`)
   - `PYTHON_VERSION`: `3.11.0`
   
   **Optional (for features):**
   - `GEMINI_API_KEY`: Your Google Gemini API key (for AI chatbot)
   - `MAIL_SERVER`: `smtp.gmail.com` (for email notifications)
   - `MAIL_PORT`: `587`
   - `MAIL_USERNAME`: Your Gmail address
   - `MAIL_PASSWORD`: Your Gmail App Password
   - `MAIL_USE_TLS`: `true`

5. Click "Create Web Service"
6. Wait for deployment (5-10 minutes)
7. **Copy the service URL** (e.g., `https://clubhub-backend.onrender.com`)

## Step 4: Deploy Frontend

1. Update API URL in frontend:
   - Edit `frontend/src/api/index.js`
   - Change `baseURL` to your backend URL from Step 3

2. Commit and push changes:
   ```bash
   git add .
   git commit -m "Update API URL for production"
   git push
   ```

3. On Render Dashboard:
   - Click "New +" → "Static Site"
   - Connect your GitHub repository
   - Fill in:
     - **Name**: `clubhub-frontend`
     - **Branch**: `main`
     - **Root Directory**: `frontend`
     - **Build Command**: `npm install && npm run build`
     - **Publish Directory**: `build`
   
4. **Environment Variables**:
   - `REACT_APP_API_URL`: Your backend URL (e.g., `https://clubhub-backend.onrender.com`)

5. Click "Create Static Site"
6. Wait for deployment (5-10 minutes)

## Step 5: Update CORS Settings

After frontend deployment, update backend CORS:

1. Go to your backend service on Render
2. Click "Environment" → Add new variable:
   - `FRONTEND_URL`: Your frontend URL (e.g., `https://clubhub-frontend.onrender.com`)

## Step 6: Test Your Application

1. Open your frontend URL
2. Test:
   - User registration and login
   - Create/view clubs and events
   - Register for events
   - All other features

## Important Notes

### Free Tier Limitations
- **Spin Down**: Free services sleep after 15 minutes of inactivity
- **First Request**: May take 50+ seconds to wake up
- **Database**: 90-day expiration (backup your data!)
- **Monthly Hours**: 750 hours/month

### Database Backup
```bash
# To backup your database locally
pg_dump -h <render-host> -U <user> -d <database> > backup.sql
```

### Monitoring
- Check logs: Dashboard → Your Service → Logs
- View metrics: Dashboard → Your Service → Metrics

## Troubleshooting

### Build Fails
- Check Python version: Add `PYTHON_VERSION=3.11.0`
- Check logs for missing dependencies

### Database Connection Issues
- Verify `DATABASE_URL` is the **Internal** URL
- Check database is in same region

### Frontend Can't Connect to Backend
- Verify API URL in `frontend/src/api/index.js`
- Check CORS settings in backend
- Look for HTTPS/HTTP mismatch

### Service Keeps Restarting
- Check logs for errors
- Verify all required environment variables are set
- Check database connection

## Optional: Custom Domain

1. Buy domain from any registrar
2. In Render: Service Settings → Custom Domain
3. Add your domain and follow DNS instructions

## Estimated Deployment Time
- Database: 2-3 minutes
- Backend: 5-10 minutes
- Frontend: 5-10 minutes
- **Total**: ~20 minutes

## Support Resources
- Render Docs: https://render.com/docs
- Render Community: https://community.render.com
- Flask Deployment: https://flask.palletsprojects.com/en/latest/deploying/

---

**Your app will be live at:**
- Frontend: `https://clubhub-frontend.onrender.com`
- Backend API: `https://clubhub-backend.onrender.com`

🎉 **Congratulations! Your ClubHub is now live!**
