import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";

// Pages
import Home from "./pages/Home";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import LeaderDashboard from "./pages/leader/LeaderDashboard";
import LeaderCreateEvent from "./pages/leader/LeaderCreateEvent";
import LeaderEditEvent from "./pages/leader/LeaderEditEvent";
import LeaderScanQR from "./pages/leader/LeaderScanQR";
import ParticipantDashboard from "./pages/participant/ParticipantDashboard";
import ParticipantCreateClub from "./pages/participant/ParticipantCreateClub";
import ParticipantMyProposals from "./pages/participant/ParticipantMyProposals";
import ParticipantEventDetails from "./pages/participant/ParticipantEventDetails";
import MyProfile from "./pages/participant/MyProfile";
import LeaderMyProfile from "./pages/leader/MyProfile";
import UniversityMyProfile from "./pages/university/MyProfile";
import UniversityDashboard from "./pages/university/UniversityDashboard";
import UniversityClubManagement from "./pages/university/UniversityClubManagement";

// Components
import Navbar from "./components/Navbar";

// Wrapper to allow navigation inside App component
function AppWrapper() {
  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const [role, setRole] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Hide navbar on login/register pages, participant pages, leader pages, and university pages (they have their own sidebar)
  const showNavbar = ![
    "/login", 
    "/register", 
    "/participant", 
    "/participant/create-club", 
    "/participant/proposals",
    "/participant/profile",
    "/leader",
    "/leader/create",
    "/leader/checkin",
    "/leader/profile",
    "/university",
    "/university/clubs",
    "/university/profile"
  ].includes(location.pathname) && !location.pathname.startsWith("/leader/events/") && !location.pathname.startsWith("/participant/events/");

  // Load token + role on first load
  useEffect(() => {
    const savedRole = localStorage.getItem("clubhub_role");
    const savedToken = localStorage.getItem("clubhub_token");

    if (savedRole && savedToken) {
      setRole(savedRole);
      setIsAuthenticated(true);
    }
  }, []);

  // FIXED LOGOUT FUNCTION
  const handleLogout = () => {
    localStorage.removeItem("clubhub_token");
    localStorage.removeItem("clubhub_role");  // <<< FIXED HERE
    localStorage.removeItem("clubhub_user_email");

    setIsAuthenticated(false);
    setRole(null);

    navigate("/login");
  };

  // Callback passed to Login.jsx
  const handleLoginSuccess = (newRole) => {
    setRole(newRole);
    setIsAuthenticated(true);
  };

  const shellClass = showNavbar ? "ai-shell" : "ai-shell ai-shell--bare";

  return (
    <>
      {showNavbar && (
        <Navbar onLogout={isAuthenticated ? handleLogout : null} role={role} />
      )}

      <div className={shellClass}>
        <Routes>
          {/* Default route - redirect based on auth status */}
          <Route
            path="/"
            element={
              isAuthenticated ? (
                role === "leader" ? (
                  <Navigate to="/leader" replace />
                ) : role === "university" ? (
                  <Navigate to="/university" replace />
                ) : (
                  <Navigate to="/participant" replace />
                )
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* Participant dashboard - protected */}
          <Route
            path="/participant"
            element={
              isAuthenticated && role === "participant" ? (
                <ParticipantDashboard onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/participant/create-club"
            element={
              isAuthenticated && role === "participant" ? (
                <ParticipantCreateClub onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/participant/proposals"
            element={
              isAuthenticated && role === "participant" ? (
                <ParticipantMyProposals onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/participant/profile"
            element={
              isAuthenticated && role === "participant" ? (
                <MyProfile onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/participant/events/:eventId"
            element={
              isAuthenticated && role === "participant" ? (
                <ParticipantEventDetails onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* University Dashboard - protected */}
          <Route
            path="/university"
            element={
              isAuthenticated && role === "university" ? (
                <UniversityDashboard />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/university/clubs"
            element={
              isAuthenticated && role === "university" ? (
                <UniversityClubManagement />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/university/profile"
            element={
              isAuthenticated && role === "university" ? (
                <UniversityMyProfile onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* Authentication */}
          <Route
            path="/login"
            element={
              isAuthenticated ? (
                role === "leader" ? (
                  <Navigate to="/leader" replace />
                ) : role === "university" ? (
                  <Navigate to="/university" replace />
                ) : (
                  <Navigate to="/participant" replace />
                )
              ) : (
                <Login onLogin={handleLoginSuccess} />
              )
            }
          />
          <Route path="/register" element={<Register />} />

          {/* Leader Protected Route */}
          <Route
            path="/leader"
            element={
              isAuthenticated && role === "leader" ? (
                <LeaderDashboard />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/leader/create"
            element={
              isAuthenticated && role === "leader" ? (
                <LeaderCreateEvent />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/leader/events/:eventId/edit"
            element={
              isAuthenticated && role === "leader" ? (
                <LeaderEditEvent />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/leader/checkin"
            element={
              isAuthenticated && role === "leader" ? (
                <LeaderScanQR />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/leader/profile"
            element={
              isAuthenticated && role === "leader" ? (
                <LeaderMyProfile onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
        </Routes>
      </div>
    </>
  );
}

export default AppWrapper;
