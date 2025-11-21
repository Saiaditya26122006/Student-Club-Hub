# ClubHub - Project Structure

This document outlines the clean, organized, production-ready structure of the ClubHub project.

## 📁 Directory Structure

```
ClubHub IIT Challenge/
├── backend/                    # Flask REST API
│   ├── app/                   # Main application package
│   │   ├── __init__.py        # Application factory
│   │   ├── routes/            # API route modules
│   │   │   ├── __init__.py
│   │   │   ├── auth.py
│   │   │   ├── clubs.py
│   │   │   ├── events.py
│   │   │   ├── registrations.py
│   │   │   ├── analytics.py
│   │   │   ├── leader.py
│   │   │   ├── university.py
│   │   │   ├── ai.py
│   │   │   ├── profile.py
│   │   │   ├── club_requests.py
│   │   │   └── general.py
│   │   ├── models/            # Database models
│   │   │   └── __init__.py
│   │   ├── services/          # Business logic (future)
│   │   ├── extensions/        # Flask extensions
│   │   │   └── __init__.py
│   │   ├── utils/             # Utility functions
│   │   │   └── __init__.py
│   │   └── config/            # Configuration
│   │       └── __init__.py
│   ├── static/                # Static files
│   │   ├── event_posters/     # Event poster images
│   │   ├── profile_images/   # User profile images
│   │   └── qr_codes/          # Generated QR codes
│   ├── migrations/            # Database migrations (future)
│   ├── tests/                 # Test files
│   ├── requirements.txt       # Python dependencies
│   ├── run.py                 # Application entry point
│   └── GEMINI_SETUP.md        # AI setup guide
│
├── frontend/                   # React frontend
│   ├── public/                # Static assets
│   │   ├── index.html
│   │   ├── favicon.ico
│   │   └── manifest.json
│   ├── src/                   # Source code
│   │   ├── api/               # API client
│   │   │   └── index.js
│   │   ├── components/        # Reusable components
│   │   │   └── Navbar.js
│   │   ├── pages/            # Page components
│   │   │   ├── Home.js
│   │   │   ├── auth/         # Authentication pages
│   │   │   │   ├── Login.js
│   │   │   │   └── Register.js
│   │   │   ├── participant/  # Participant pages
│   │   │   │   ├── ParticipantDashboard.js
│   │   │   │   ├── ParticipantCreateClub.jsx
│   │   │   │   ├── ParticipantMyProposals.jsx
│   │   │   │   └── MyProfile.js
│   │   │   ├── leader/        # Leader pages
│   │   │   │   ├── LeaderDashboard.js
│   │   │   │   ├── LeaderCreateEvent.jsx
│   │   │   │   ├── LeaderEditEvent.jsx
│   │   │   │   ├── LeaderScanQR.jsx
│   │   │   │   └── MyProfile.js
│   │   │   └── university/   # University pages
│   │   │       ├── UniversityDashboard.jsx
│   │   │       ├── UniversityClubManagement.jsx
│   │   │       └── MyProfile.js
│   │   ├── App.js             # Main app component
│   │   ├── index.js           # Entry point
│   │   └── index.css          # Global styles
│   ├── package.json           # Node dependencies
│   └── tailwind.config.js     # Tailwind CSS configuration
│
├── docker/                     # Docker configuration
│   ├── backend.Dockerfile     # Backend container
│   └── frontend.Dockerfile    # Frontend container
│
├── docs/                       # Documentation
│   ├── API.md                 # API documentation
│   ├── FEATURES.md            # Feature documentation
│   └── SETUP.md               # Setup instructions
│
├── .gitignore                 # Git ignore rules
├── .gitlab-ci.yml             # CI/CD configuration
├── .env.example               # Environment variables template
├── README.md                  # Main project README
├── SUBMISSION_CHECKLIST.md    # Submission checklist
└── PROJECT_STRUCTURE.md       # This file
```

## 🏗️ Architecture Overview

### Backend Structure

The backend follows a **modular, scalable architecture**:

- **`app/`**: Main application package
  - **`routes/`**: API endpoints organized by feature
  - **`models/`**: SQLAlchemy database models
  - **`services/`**: Business logic layer (for future expansion)
  - **`utils/`**: Helper functions and utilities
  - **`config/`**: Configuration management
  - **`extensions/`**: Flask extension instances

- **`static/`**: User-generated content
  - Event posters, profile images, QR codes

- **`migrations/`**: Database migration scripts (Flask-Migrate)

- **`tests/`**: Unit and integration tests

### Frontend Structure

The frontend follows **React best practices**:

- **`src/api/`**: API client configuration
- **`src/components/`**: Reusable UI components
- **`src/pages/`**: Page-level components organized by role
- **`src/hooks/`**: Custom React hooks (for future expansion)
- **`src/layouts/`**: Layout components (for future expansion)

## 🚀 Running the Application

### Backend

```bash
cd backend
python run.py
```

Or using Flask directly:
```bash
cd backend
flask run
```

### Frontend

```bash
cd frontend
npm install
npm start
```

## 🐳 Docker Deployment

### Build Backend

```bash
docker build -f docker/backend.Dockerfile -t clubhub-backend .
```

### Build Frontend

```bash
docker build -f docker/frontend.Dockerfile -t clubhub-frontend .
```

## 🔄 CI/CD Pipeline

The project includes a GitLab CI/CD configuration (`.gitlab-ci.yml`) with:

- **Test Stage**: Runs backend and frontend tests
- **Build Stage**: Builds Docker images
- **Deploy Stage**: Deploys to production (configure as needed)

## 📝 Key Features

1. **Modular Architecture**: Clear separation of concerns
2. **Scalable Structure**: Easy to add new features
3. **Production Ready**: Docker support, CI/CD configuration
4. **Well Documented**: Comprehensive documentation
5. **Best Practices**: Follows Flask and React conventions

## 🔒 Security

- Environment variables in `.env` (gitignored)
- `.env.example` provided as template
- Sensitive data excluded from version control
- User-generated content in `static/` (gitignored)

## 📦 Dependencies

### Backend
- Flask
- SQLAlchemy
- Flask-JWT-Extended
- Flask-CORS
- Flask-Bcrypt
- Google Generative AI

### Frontend
- React
- React Router
- Axios
- Tailwind CSS
- Recharts

## 🎯 Next Steps

1. Add database migrations (Flask-Migrate)
2. Expand test coverage
3. Add custom React hooks
4. Implement service layer for business logic
5. Configure production deployment

## 📚 Documentation

- **API Documentation**: `docs/API.md`
- **Features**: `docs/FEATURES.md`
- **Setup Guide**: `docs/SETUP.md`
- **AI Setup**: `backend/GEMINI_SETUP.md`
