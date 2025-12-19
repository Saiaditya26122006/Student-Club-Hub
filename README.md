# 🎓 Student Club-Hub - Intelligent Student Club Management Platform

<div align="center">

[![Flask](https://img.shields.io/badge/Flask-3.1.2-000000?style=for-the-badge&logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![React](https://img.shields.io/badge/React-18.0-blue?style=for-the-badge&logo=react&logoColor=white)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![GitLab CI/CD](https://img.shields.io/badge/GitLab_CI/CD-Enabled-FC6D26?style=for-the-badge&logo=gitlab&logoColor=white)](https://gitlab.com/)

**A comprehensive, AI-powered event management platform designed for educational institutions**

*Streamline club management, enhance participant engagement, and drive data-driven decisions*

[Features](#-features) • [Quick Start](#-quick-start) • [Architecture](#-architecture) • [Documentation](#-documentation) • [Deployment](#-deployment)

---

</div>

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Technology Stack](#-technology-stack)
- [Architecture](#-architecture)
- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Deployment](#-deployment)
- [Security](#-security)
- [Testing](#-testing)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Overview

**Student Club-Hub** is an enterprise-grade, full-stack web application revolutionizing how educational institutions manage student clubs, organize events, and engage participants. Built with modern best practices, the platform combines powerful analytics, AI-driven insights, and intuitive user interfaces to create a seamless experience for all stakeholders.

### 🏆 Problem Statement

Traditional club management systems suffer from:
- ❌ Fragmented communication channels
- ❌ Manual registration and check-in processes
- ❌ Lack of data-driven insights
- ❌ Poor participant engagement tracking
- ❌ Inefficient resource allocation

### ✨ Our Solution

Student Club-Hub addresses these challenges with:
- ✅ Centralized platform for all club activities
- ✅ Automated QR code-based check-in system
- ✅ Real-time analytics and performance metrics
- ✅ AI-powered insights and recommendations
- ✅ Role-based access control for seamless management

---

## ✨ Key Features

### 👥 For Students (Participants)

| Feature | Description |
|---------|-------------|
| 🎫 **Event Discovery** | Browse upcoming events across all clubs with advanced filtering |
| 📱 **One-Click RSVP** | Instant event registration with email confirmation |
| 📧 **QR Code Delivery** | Automated QR code emails for seamless check-in |
| 🤖 **AI Recommendations** | Personalized event suggestions based on interests and history |
| 📊 **Personal Dashboard** | Track all registrations, attendance, and upcoming events |
| 🏛️ **Club Proposals** | Submit proposals for new clubs to university administrators |

### 🎓 For Club Leaders

| Feature | Description |
|---------|-------------|
| 📈 **Analytics Dashboard** | Comprehensive metrics on registrations, attendance, and engagement |
| 🤖 **AI-Powered Insights** | Data-driven recommendations for improving event performance |
| 📊 **Real-Time Charts** | Visual analytics with Recharts for better decision-making |
| 👥 **Participant Management** | View attendee lists, check-in status, and contact information |
| 🔍 **QR Code Scanner** | Mobile-friendly scanner for efficient event check-ins |
| 📅 **Event Management** | Create, edit, and manage events with poster uploads |
| 📧 **Automated Notifications** | Send QR codes and updates to participants automatically |

### 🏛️ For University Administrators

| Feature | Description |
|---------|-------------|
| ✅ **Club Approval System** | Review and approve/reject club proposals from students |
| 👤 **Leader Management** | Assign and revoke leader access to clubs |
| 📊 **System-Wide Analytics** | Monitor all clubs, events, and participation metrics |
| 🔒 **Access Control** | Comprehensive role-based permission management |
| 📈 **Performance Tracking** | Identify high-performing clubs and engagement trends |

### 🚀 System Features

- 🔐 **JWT Authentication** - Secure token-based authentication with role-based access
- 🤖 **AI Integration** - Google Gemini AI for insights and recommendations
- 📧 **Email Automation** - Automated notifications with QR code attachments
- 🎨 **Modern UI** - Responsive design with Tailwind CSS
- 📱 **Mobile-First** - Optimized for all devices
- 🐳 **Docker Support** - Containerized deployment
- 🔄 **CI/CD Pipeline** - Automated testing and deployment

---

## 🛠️ Technology Stack

### Backend

<div align="center">

| Category | Technology | Purpose |
|----------|-----------|---------|
| **Framework** | Flask 3.1.2 | RESTful API server |
| **Architecture** | Application Factory Pattern | Scalable, modular structure |
| **Database** | PostgreSQL | Relational database |
| **ORM** | SQLAlchemy | Database abstraction |
| **Authentication** | Flask-JWT-Extended | Secure token-based auth |
| **Security** | Flask-Bcrypt | Password hashing |
| **CORS** | Flask-CORS | Cross-origin resource sharing |
| **AI** | Google Gemini AI | Intelligent insights |

</div>

### Frontend

<div align="center">

| Category | Technology | Purpose |
|----------|-----------|---------|
| **Framework** | React 18+ | Component-based UI |
| **Routing** | React Router v6 | Client-side routing |
| **Styling** | Tailwind CSS | Utility-first CSS framework |
| **Charts** | Recharts | Data visualization |
| **HTTP Client** | Axios | API communication |
| **QR Scanner** | html5-qrcode | Mobile QR code scanning |

</div>

### DevOps & Infrastructure

<div align="center">

| Tool | Purpose |
|------|---------|
| **Docker** | Containerization |
| **GitLab CI/CD** | Continuous Integration/Deployment |
| **Git** | Version Control |

</div>

---

## 🏗️ Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Client Layer (React)                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │Participant│  │  Leader  │  │University│             │
│  │ Dashboard │  │ Dashboard│  │ Dashboard│             │
│  └──────────┘  └──────────┘  └──────────┘             │
└───────────────────────┬─────────────────────────────────┘
                        │
                        │ REST API (JWT Auth)
                        │
┌───────────────────────▼─────────────────────────────────┐
│              Backend Layer (Flask)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │  Routes  │  │  Models  │  │   Utils  │             │
│  └──────────┘  └──────────┘  └──────────┘             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │  Config  │  │Extensions│  │Services  │             │
│  └──────────┘  └──────────┘  └──────────┘             │
└───────────────────────┬─────────────────────────────────┘
                        │
                        │ SQLAlchemy ORM
                        │
┌───────────────────────▼─────────────────────────────────┐
│              Data Layer (PostgreSQL)                     │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐              │
│  │Users │  │Clubs │  │Events│  │Regist│              │
│  └──────┘  └──────┘  └──────┘  └──────┘              │
└─────────────────────────────────────────────────────────┘
```

### Design Patterns

- ✅ **Application Factory Pattern** - Flexible app initialization
- ✅ **Blueprint Pattern** - Modular route organization
- ✅ **Repository Pattern** - Data access abstraction
- ✅ **Service Layer Pattern** - Business logic separation

---

## 🚀 Quick Start

### Prerequisites

- 🐍 Python 3.8+ (3.12 recommended)
- 📦 Node.js 16+ and npm
- 🐘 PostgreSQL 12+
- 🐳 Docker (optional, for containerized deployment)
- 🔧 Git

### Installation

#### 1. Clone the Repository

```bash
git clone <repository-url>
cd clubhub-iit-challenge
```

#### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file (copy from .env.example)
cp .env.example .env

# Edit .env with your configuration
nano .env  # or use your preferred editor
```

**Required Environment Variables:**

```env
# Database Configuration
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=clubhub_db

# JWT Configuration
JWT_SECRET_KEY=your_secure_secret_key_here

# Google Gemini AI (Optional - for AI features)
GEMINI_API_KEY=your_gemini_api_key
```

#### 3. Initialize Database

The application will automatically create tables and apply schema migrations on first run.

#### 4. Run Backend Server

```bash
python run.py
```

Backend will run on `http://localhost:5000`

#### 5. Frontend Setup

```bash
# Navigate to frontend directory
cd ../frontend

# Install dependencies
npm install

# Start development server
npm start
```

Frontend will run on `http://localhost:3000`

---

## 📁 Project Structure

```
clubhub-iit-challenge/
│
├── 📂 backend/                      # Flask REST API
│   ├── 📂 app/                     # Main application package
│   │   ├── __init__.py            # Application factory
│   │   ├── 📂 routes/             # API route modules
│   │   │   ├── auth.py           # Authentication endpoints
│   │   │   ├── clubs.py          # Club management
│   │   │   ├── events.py         # Event management
│   │   │   ├── registrations.py  # Registration handling
│   │   │   ├── analytics.py      # Analytics endpoints
│   │   │   ├── leader.py         # Leader dashboard
│   │   │   ├── university.py     # University admin
│   │   │   ├── ai.py             # AI features
│   │   │   └── profile.py        # Profile management
│   │   ├── 📂 models/            # Database models
│   │   ├── 📂 services/          # Business logic (future)
│   │   ├── 📂 extensions/        # Flask extensions
│   │   ├── 📂 utils/             # Utility functions
│   │   └── 📂 config/            # Configuration
│   ├── 📂 static/                # Static files
│   │   ├── event_posters/        # Event poster images
│   │   ├── profile_images/       # User profile images
│   │   └── qr_codes/             # Generated QR codes
│   ├── run.py                    # Application entry point
│   ├── requirements.txt          # Python dependencies
│   └── GEMINI_SETUP.md          # AI setup guide
│
├── 📂 frontend/                    # React frontend
│   ├── 📂 src/
│   │   ├── 📂 api/               # API client
│   │   ├── 📂 components/        # Reusable components
│   │   ├── 📂 pages/             # Page components
│   │   │   ├── auth/            # Authentication pages
│   │   │   ├── participant/     # Participant pages
│   │   │   ├── leader/          # Leader pages
│   │   │   └── university/      # University pages
│   │   ├── App.js                # Main app component
│   │   └── index.js              # Entry point
│   └── package.json              # Node dependencies
│
├── 📂 docker/                      # Docker configuration
│   ├── backend.Dockerfile        # Backend container
│   └── frontend.Dockerfile       # Frontend container
│
├── 📂 docs/                        # Documentation
│   ├── API.md                    # API documentation
│   ├── FEATURES.md               # Feature documentation
│   └── SETUP.md                  # Setup instructions
│
├── .gitlab-ci.yml                 # CI/CD configuration
├── .env.example                   # Environment variables template
└── README.md                      # This file
```

---

## 📡 API Documentation

### Authentication

```http
POST /api/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword",
  "role": "participant"
}

POST /api/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepassword"
}
```

### Key Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/clubs` | Get all clubs | No |
| `POST` | `/api/events` | Create event | Leader |
| `GET` | `/api/events/<id>` | Get event details | No |
| `POST` | `/api/events/<id>/register` | RSVP for event | Participant |
| `GET` | `/api/leader/events` | Get leader's events | Leader |
| `POST` | `/api/ai/leader-insights` | Generate AI insights | Leader |
| `POST` | `/api/ai/recommend-events` | Get event recommendations | Participant |

For complete API documentation, see [docs/API.md](docs/API.md)

---

## 🐳 Deployment

### Docker Deployment

#### Build and Run Backend

```bash
docker build -f docker/backend.Dockerfile -t clubhub-backend .
docker run -p 5000:5000 --env-file backend/.env clubhub-backend
```

#### Build and Run Frontend

```bash
docker build -f docker/frontend.Dockerfile -t clubhub-frontend .
docker run -p 80:80 clubhub-frontend
```

### Production Deployment

#### Backend (Heroku/Railway/Render)

1. Create `Procfile`:
   ```
   web: gunicorn run:app
   ```

2. Update `requirements.txt`:
   ```
   gunicorn==21.2.0
   ```

3. Set environment variables in hosting platform

4. Deploy:
   ```bash
   git push heroku main
   ```

#### Frontend (Vercel/Netlify)

1. Build the application:
   ```bash
   npm run build
   ```

2. Deploy the `build` folder

3. Set environment variable:
   - `REACT_APP_API_URL` - Your backend API URL

### CI/CD Pipeline

The project includes a GitLab CI/CD configuration that automatically:
- ✅ Runs tests on push/merge
- ✅ Builds Docker images on main branch
- ✅ Pushes images to GitLab Container Registry
- ✅ Deploys to production (configurable)

---

## 🔒 Security

### Security Features

- 🔐 **Password Hashing** - Bcrypt with salt rounds
- 🎫 **JWT Authentication** - Secure token-based authentication
- 🛡️ **Role-Based Access Control** - Three-tier permission system
- ✅ **Input Validation** - Server-side validation for all inputs
- 🚫 **SQL Injection Prevention** - SQLAlchemy ORM with parameterized queries
- 🌐 **CORS Configuration** - Controlled cross-origin resource sharing
- 🔒 **Secure File Uploads** - Validated file types and secure storage
- 🔑 **Environment Variables** - Sensitive data stored securely

### Best Practices

- ✅ All API endpoints are protected with JWT authentication
- ✅ Password hashing with bcrypt (salt rounds: 12)
- ✅ Environment variables for sensitive configuration
- ✅ CORS configured for allowed origins only
- ✅ SQL injection prevention through ORM
- ✅ XSS protection through input sanitization

---

## 🧪 Testing

### Backend Testing

```bash
cd backend
python -m pytest tests/
```

### Frontend Testing

```bash
cd frontend
npm test
```

### Test Coverage

- Unit tests for models and utilities
- Integration tests for API endpoints
- End-to-end tests for critical user flows

---

## 📊 Database Schema

### Core Tables

| Table | Description |
|-------|-------------|
| `users` | User accounts (participants, leaders, university) |
| `clubs` | Club information and metadata |
| `events` | Event details with posters |
| `registrations` | Event registrations with QR codes |
| `event_insights` | Event view tracking and analytics |
| `club_requests` | Club proposal submissions |

See [backend/app/models/__init__.py](backend/app/models/__init__.py) for detailed schema.

---

## 🎨 UI/UX Features

- 🎨 **Modern Design** - Clean, professional interface with green theme
- 📱 **Responsive Layout** - Mobile-first design that works on all devices
- 🎯 **Role-Based Themes** - Color-coded interfaces for each role
- 📊 **Interactive Dashboards** - Real-time charts and analytics
- ✨ **Smooth Animations** - CSS animations and transitions
- ♿ **Accessibility** - ARIA labels and keyboard navigation support
- 🎭 **Professional Borders** - Innovative design with minimal rounded corners

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. 🍴 Fork the repository
2. 🌿 Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. 💾 Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. 📤 Push to the branch (`git push origin feature/AmazingFeature`)
5. 🔀 Open a Pull Request

---

## 📄 License

This project is created for the **IIT Challenge** submission.

---

## 👥 Team

<div align="center">

**Developed by:** TALLURI SAI ADITYA  
**Institution:** Eada Business School  
**Challenge:** IIT Challenge Gitlab

</div>

---

## 📞 Support & Documentation

- 📚 [Complete API Documentation](docs/API.md)
- 🚀 [Setup Guide](docs/SETUP.md)
- 📖 [Feature Documentation](docs/FEATURES.md)
- 🏗️ [Project Structure](PROJECT_STRUCTURE.md)
- 🤖 [AI Setup Guide](backend/GEMINI_SETUP.md)

For issues or questions:
- 🐛 [Create an Issue](https://gitlab.com/your-repo/issues)
- 💬 [Join Discussions](https://gitlab.com/your-repo/discussions)

---

## 🎉 Acknowledgments

- Flask and React communities for excellent frameworks
- Tailwind CSS for the beautiful styling framework
- Google Gemini AI for powerful AI capabilities
- All open-source libraries that made this project possible

---

<div align="center">

### 🌟 Built with ❤️ for the IIT Challenge

**Version:** 4.1 - Production Ready  
**Status:** ✅ Ready for Deployment

---

[![Made with Flask](https://img.shields.io/badge/Made%20with-Flask-red?style=flat-square&logo=flask)](https://flask.palletsprojects.com/)
[![Made with React](https://img.shields.io/badge/Made%20with-React-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org/)
[![Powered by AI](https://img.shields.io/badge/Powered%20by-AI-4285F4?style=flat-square&logo=google&logoColor=white)](https://ai.google.dev/)

</div>
