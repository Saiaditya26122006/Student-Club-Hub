# Setup Guide - ClubHub

## Prerequisites

Before you begin, ensure you have the following installed:
- **Python 3.8+** - [Download](https://www.python.org/downloads/)
- **Node.js 14+** - [Download](https://nodejs.org/)
- **PostgreSQL** - [Download](https://www.postgresql.org/download/) (or use SQLite for development)
- **Git** - [Download](https://git-scm.com/)

---

## Database Setup

### Option 1: PostgreSQL (Recommended for Production)

1. **Install PostgreSQL** and start the service

2. **Create a database:**
   ```sql
   CREATE DATABASE clubhub_db;
   ```

3. **Create a user (optional):**
   ```sql
   CREATE USER clubhub_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE clubhub_db TO clubhub_user;
   ```

### Option 2: SQLite (Quick Development)

SQLite will be created automatically when you run the app. No setup needed!

---

## Backend Setup

### 1. Navigate to Backend Directory
```bash
cd backend
```

### 2. Create Virtual Environment
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Create Environment File

Create a `.env` file in the `backend` directory:

```env
# Database Configuration
DB_USER=postgres
DB_PASSWORD=your_password_here
DB_HOST=localhost
DB_PORT=5432
DB_NAME=clubhub_db

# JWT Secret (generate a random string)
JWT_SECRET_KEY=your_very_secret_key_change_this_in_production

# Email Configuration (Optional - for QR code emails)
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password
MAIL_FROM=your_email@gmail.com
MAIL_USE_TLS=true

# Google Gemini AI (Optional - for AI features)
GEMINI_API_KEY=your_gemini_api_key
```

**Note:** For Gmail, you need to use an [App Password](https://support.google.com/accounts/answer/185833), not your regular password.

### 5. Initialize Database

The database tables will be created automatically when you first run the app.

### 6. Run the Backend Server
```bash
python app.py
```

The backend should now be running at `http://localhost:5000`

You should see:
```
✅ ClubHub API v4.1 running at http://127.0.0.1:5000
```

---

## Frontend Setup

### 1. Navigate to Frontend Directory
```bash
cd frontend
```

### 2. Install Dependencies
```bash
npm install
```

This will install:
- React
- React Router
- Axios
- Tailwind CSS
- Recharts
- And other dependencies

### 3. Configure API Endpoint (if needed)

The frontend is configured to connect to `http://localhost:5000` by default.

If your backend runs on a different port, update `frontend/src/api.js`:

```javascript
const API = axios.create({
  baseURL: "http://localhost:YOUR_PORT",  // Change port if needed
  headers: {
    "Content-Type": "application/json",
  },
});
```

### 4. Start Development Server
```bash
npm start
```

The frontend should now be running at `http://localhost:3000`

Your browser should automatically open to the application.

---

## Creating Your First User

### 1. Register as a Leader

1. Navigate to `http://localhost:3000/register`
2. Fill in the form:
   - Name: Your Name
   - Email: your@email.com
   - Password: Choose a secure password
   - Role: Select **Leader**
3. Click "Register"

### 2. Login

1. Navigate to `http://localhost:3000/login`
2. Enter your credentials
3. Click "Login"

### 3. Create a Club

1. After logging in as a leader, you'll be redirected to the Leader Dashboard
2. Click "Create Event" (you'll need to create a club first via API or database)

**Quick way to create a club via API:**

```bash
# Use your JWT token from login
curl -X POST http://localhost:5000/api/clubs \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Tech Club",
    "description": "Technology and Innovation",
    "category": "Technical"
  }'
```

Or insert directly into database:
```sql
INSERT INTO clubs (name, description, category) 
VALUES ('Tech Club', 'Technology and Innovation', 'Technical');
```

---

## Troubleshooting

### Backend Issues

**Problem:** `ModuleNotFoundError: No module named 'flask'`
- **Solution:** Make sure you activated the virtual environment and ran `pip install -r requirements.txt`

**Problem:** Database connection error
- **Solution:** 
  - Check PostgreSQL is running
  - Verify credentials in `.env` file
  - Ensure database exists

**Problem:** `Port 5000 already in use`
- **Solution:** Change the port in `app.py`:
  ```python
  app.run(debug=True, port=5001)  # Use different port
  ```

### Frontend Issues

**Problem:** `npm install` fails
- **Solution:** 
  - Delete `node_modules` and `package-lock.json`
  - Run `npm install` again
  - Try `npm install --legacy-peer-deps`

**Problem:** Cannot connect to backend
- **Solution:**
  - Ensure backend is running on port 5000
  - Check `frontend/src/api.js` has correct baseURL
  - Check browser console for CORS errors

**Problem:** Tailwind CSS not working
- **Solution:** 
  - Restart the development server
  - Clear browser cache
  - Check `tailwind.config.js` exists

---

## Development Tips

### Hot Reload

Both frontend and backend support hot reload:
- **Backend:** Flask debug mode automatically reloads on file changes
- **Frontend:** React dev server reloads on save

### Database Migrations

If you modify the database schema:
1. Delete the database
2. Restart the backend (it will recreate tables)

For production, use a proper migration tool like Alembic.

### Testing Email Functionality

For development, you can use:
- [Mailtrap](https://mailtrap.io/) - Fake SMTP server
- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)

---

## Next Steps

1. ✅ Create a club
2. ✅ Create an event
3. ✅ Register as a participant
4. ✅ RSVP for the event
5. ✅ Download your QR code
6. ✅ Explore the analytics dashboard

---

## Production Deployment

See the main [README.md](../README.md) for deployment instructions.

---

## Need Help?

- Check the [API Documentation](API.md)
- Review the [Features Documentation](FEATURES.md)
- Create an issue in the repository
