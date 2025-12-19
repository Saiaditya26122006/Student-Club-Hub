# ClubHub - Quick Start Guide

## 🚀 Deploy to Render (Recommended - 15 minutes)

### 1. Push to GitHub
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 2. Deploy Database
- Go to https://render.com → Sign up/Login
- Click **"New +"** → **"PostgreSQL"**
- Name: `clubhub-db`
- Plan: **Free**
- Click **"Create Database"**
- Copy the **Internal Database URL**

### 3. Deploy Backend
- Click **"New +"** → **"Web Service"**
- Connect GitHub repo
- Name: `clubhub-backend`
- Root Directory: `backend`
- Build Command: `pip install -r requirements.txt`
- Start Command: `gunicorn -c gunicorn_config.py run:app`
- Plan: **Free**

**Environment Variables:**
- `DATABASE_URL`: (Paste Internal Database URL from step 2)
- `JWT_SECRET_KEY`: (Generate with `openssl rand -hex 32` or any random string)
- `PYTHON_VERSION`: `3.11.0`

Click **"Create Web Service"** → Wait 5-10 minutes → **Copy backend URL**

### 4. Deploy Frontend
- Click **"New +"** → **"Static Site"**
- Connect GitHub repo
- Name: `clubhub-frontend`
- Root Directory: `frontend`
- Build Command: `npm install && npm run build`
- Publish Directory: `build`
- Plan: **Free**

**Environment Variables:**
- `REACT_APP_API_URL`: (Paste backend URL from step 3)

Click **"Create Static Site"** → Wait 5-10 minutes

### ✅ Done!
Your app is live at: `https://clubhub-frontend.onrender.com`

---

## 💻 Run Locally (Development)

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 15+

### 1. Clone & Setup
```bash
git clone <your-repo-url>
cd "Clubhub IIT challenge"
```

### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Create .env file
copy .env.example .env  # Windows
# cp .env.example .env  # Mac/Linux

# Edit .env with your database credentials
notepad .env  # Windows
# nano .env  # Mac/Linux
```

**Required .env variables:**
```env
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/clubhub_db
JWT_SECRET_KEY=your_secret_key_here
```

### 3. Database Setup
```bash
# Create database in PostgreSQL
psql -U postgres
CREATE DATABASE clubhub_db;
\q

# Run backend (will auto-create tables)
python run.py
```

Backend running at: http://localhost:5000

### 4. Frontend Setup
```bash
# Open new terminal
cd frontend

# Install dependencies
npm install

# Run frontend
npm start
```

Frontend running at: http://localhost:3000

### ✅ Done!
Open http://localhost:3000 in your browser

---

## 📁 Project Structure
```
Clubhub IIT challenge/
├── backend/
│   ├── app.py              # Main Flask application (all-in-one)
│   ├── run.py              # Application entry point
│   ├── requirements.txt    # Python dependencies
│   ├── gunicorn_config.py  # Production server config
│   └── static/             # User uploads (QR codes, images)
│
├── frontend/
│   ├── src/
│   │   ├── api/           # API client
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   └── styles/        # CSS files
│   ├── public/            # Static assets
│   └── package.json       # Node dependencies
│
├── docs/                  # Documentation
├── .env.example           # Environment template
├── render.yaml            # Render deployment config
├── DEPLOYMENT_GUIDE.md    # Detailed deployment guide
└── README.md              # Main documentation
```

---

## 🔧 Configuration

### Required Environment Variables
| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ Yes |
| `JWT_SECRET_KEY` | Secret for JWT tokens | ✅ Yes |

### Optional Environment Variables
| Variable | Description | Default |
|----------|-------------|---------|
| `GEMINI_API_KEY` | Google Gemini for AI chatbot | None |
| `MAIL_SERVER` | SMTP server for emails | None |
| `MAIL_USERNAME` | Email username | None |
| `MAIL_PASSWORD` | Email password | None |

---

## 🆘 Troubleshooting

### Backend won't start
- ✅ Check PostgreSQL is running
- ✅ Verify DATABASE_URL in .env
- ✅ Check Python version: `python --version` (need 3.11+)

### Frontend can't connect to backend
- ✅ Check backend is running on port 5000
- ✅ Verify REACT_APP_API_URL points to backend

### Database errors
- ✅ Check database exists: `psql -U postgres -l`
- ✅ Verify credentials in DATABASE_URL
- ✅ Run `python run.py` to auto-create tables

### Render deployment fails
- ✅ Check build logs in Render dashboard
- ✅ Verify environment variables are set
- ✅ Use Internal Database URL (not External)

---

## 📚 Additional Resources
- Full Deployment Guide: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- API Documentation: [docs/API.md](./docs/API.md)
- Features Overview: [docs/FEATURES.md](./docs/FEATURES.md)

---

## 💡 Tips

### For Development
- Backend auto-reloads on code changes
- Frontend hot-reloads automatically
- Check logs for errors

### For Production
- Use strong JWT_SECRET_KEY
- Configure email for full functionality
- Monitor Render dashboard for logs

---

**Need Help?** Check [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed instructions.
