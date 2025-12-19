# ✅ Render Deployment Checklist

## Pre-Deployment (5 minutes)

### 1. Accounts Ready
- [ ] GitHub account created
- [ ] Code pushed to GitHub repository
- [ ] Render account created (https://render.com)

### 2. Optional API Keys (if using features)
- [ ] Google Gemini API key (for AI chatbot)
- [ ] Gmail App Password (for email notifications)

---

## Step 1: Push to GitHub (2 minutes)

```bash
cd "Clubhub IIT challenge"
git add .
git commit -m "Ready for Render deployment"
git push origin main
```

- [ ] Code successfully pushed to GitHub
- [ ] Verified all files uploaded on GitHub

---

## Step 2: Create Database (3 minutes)

1. [ ] Login to Render (https://dashboard.render.com)
2. [ ] Click **"New +"** → **"PostgreSQL"**
3. [ ] Settings:
   - Name: `clubhub-db`
   - Database: `clubhub_db`
   - User: `clubhub_user`
   - Region: (Choose closest to you)
   - Plan: **Free**
4. [ ] Click **"Create Database"**
5. [ ] Wait for database to provision (~2 minutes)
6. [ ] **COPY** the **Internal Database URL** (starts with `postgresql://`)
   ```
   Save this! You'll need it in Step 3:
   postgresql://clubhub_user:xxxxx@dpg-xxxxx/clubhub_db
   ```

---

## Step 3: Deploy Backend (8 minutes)

1. [ ] Click **"New +"** → **"Web Service"**
2. [ ] Click **"Connect GitHub"** and authorize
3. [ ] Select your repository: `YOUR_USERNAME/YOUR_REPO`
4. [ ] Configure service:
   - Name: `clubhub-backend`
   - Region: (Same as database)
   - Branch: `main`
   - Root Directory: `backend`
   - Runtime: `Python 3`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `gunicorn -c gunicorn_config.py run:app`
   - Plan: **Free**

5. [ ] Click **"Advanced"** → Add Environment Variables:

**Required:**
```
DATABASE_URL = (paste Internal Database URL from Step 2)
JWT_SECRET_KEY = (generate with: openssl rand -hex 32)
PYTHON_VERSION = 3.11.0
```

**Optional (for features):**
```
GEMINI_API_KEY = your_gemini_api_key
MAIL_SERVER = smtp.gmail.com
MAIL_PORT = 587
MAIL_USERNAME = your_email@gmail.com
MAIL_PASSWORD = your_gmail_app_password
MAIL_USE_TLS = true
```

6. [ ] Click **"Create Web Service"**
7. [ ] Wait for deployment (5-8 minutes)
8. [ ] Check logs for "✅ Student Club-Hub API running"
9. [ ] **COPY backend URL** (e.g., `https://clubhub-backend.onrender.com`)
   ```
   Save this! You'll need it in Step 4:
   https://clubhub-backend.onrender.com
   ```

---

## Step 4: Deploy Frontend (8 minutes)

1. [ ] Click **"New +"** → **"Static Site"**
2. [ ] Connect your GitHub repository (if not already)
3. [ ] Select your repository
4. [ ] Configure service:
   - Name: `clubhub-frontend`
   - Branch: `main`
   - Root Directory: `frontend`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `build`
   - Plan: **Free**

5. [ ] Click **"Advanced"** → Add Environment Variable:
```
REACT_APP_API_URL = (paste backend URL from Step 3)
```

6. [ ] Click **"Create Static Site"**
7. [ ] Wait for deployment (5-8 minutes)
8. [ ] **COPY frontend URL** (e.g., `https://clubhub-frontend.onrender.com`)

---

## Step 5: Verify Deployment (5 minutes)

### Backend Check
- [ ] Open: `https://clubhub-backend.onrender.com/health`
- [ ] Should see: `{"status": "healthy"}` or similar

### Frontend Check
- [ ] Open: `https://clubhub-frontend.onrender.com`
- [ ] Should see: ClubHub homepage

### Feature Tests
- [ ] Register new user account
- [ ] Login successfully
- [ ] View clubs/events page
- [ ] Create a test club (if leader/university)
- [ ] Check database has data (Render Dashboard → Database → Connect)

---

## Troubleshooting

### Backend Build Fails
- [ ] Check Render logs for error
- [ ] Verify `PYTHON_VERSION=3.11.0` is set
- [ ] Check requirements.txt is in backend folder

### Backend Runtime Error
- [ ] Verify `DATABASE_URL` is **Internal** URL (not External)
- [ ] Check `JWT_SECRET_KEY` is set
- [ ] Look at logs: Backend Service → Logs tab

### Frontend Build Fails
- [ ] Check package.json exists in frontend/
- [ ] Verify build command is correct
- [ ] Check Render logs

### Frontend Blank Page
- [ ] Open browser console (F12)
- [ ] Check for API URL errors
- [ ] Verify `REACT_APP_API_URL` is correct
- [ ] Test backend URL directly

### Database Connection Failed
- [ ] Verify DATABASE_URL is Internal, not External
- [ ] Check database and backend are in same region
- [ ] Test connection: `psql <DATABASE_URL>`

### API Requests Fail (CORS)
- [ ] Backend should auto-allow frontend domain
- [ ] Check backend logs for CORS errors
- [ ] Restart backend service if needed

---

## Post-Deployment

### Save Important URLs
```
Frontend: https://clubhub-frontend.onrender.com
Backend: https://clubhub-backend.onrender.com
Database: (Internal URL saved from Step 2)
```

### Monitor Your Services
- [ ] Bookmark Render Dashboard
- [ ] Check logs regularly: Service → Logs
- [ ] Monitor usage: Service → Metrics

### Free Tier Reminders
- [ ] Services sleep after 15 min inactivity (cold start ~50s)
- [ ] Database expires after 90 days (backup data!)
- [ ] 750 hours/month limit per service

### Optional: Keep Services Alive
- [ ] Use UptimeRobot to ping every 14 minutes
- [ ] Or accept cold start delay (fine for demos)

---

## ✅ Success Criteria

Your deployment is successful when:
- ✅ Frontend loads without errors
- ✅ Can register and login
- ✅ Can view clubs and events
- ✅ API requests work (check Network tab in browser)
- ✅ Database stores data

---

## 🎉 You're Live!

**Share your app:**
```
🌐 ClubHub: https://clubhub-frontend.onrender.com
📱 API: https://clubhub-backend.onrender.com
```

**Need help?**
- Full Guide: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- Quick Start: [QUICK_START.md](./QUICK_START.md)
- Summary: [RENDER_DEPLOYMENT_SUMMARY.md](./RENDER_DEPLOYMENT_SUMMARY.md)

---

**Deployment Time:** ~20 minutes total
**Difficulty:** Easy ⭐⭐☆☆☆
**Cost:** FREE! 🎉
