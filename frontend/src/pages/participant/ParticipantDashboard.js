import React, { useEffect, useMemo, useState } from "react";
import API from "../../api";
import { useNavigate } from "react-router-dom";

export default function ParticipantDashboard({ onLogout }) {
  const [clubs, setClubs] = useState([]);
  const [selectedClub, setSelectedClub] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [registeredEvents, setRegisteredEvents] = useState({});
  const [registeringEventId, setRegisteringEventId] = useState(null);
  const [myRegistrationsLoading, setMyRegistrationsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("clubs"); // "clubs" or "dashboard"
  const [showRsvpSuccess, setShowRsvpSuccess] = useState(null); // {event, registration}
  const [selectedEventDetails, setSelectedEventDetails] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [aiRecommendations, setAiRecommendations] = useState(null);
  const [aiRecommendationsLoading, setAiRecommendationsLoading] = useState(false);

  const userEmail = useMemo(
    () => localStorage.getItem("clubhub_user_email"),
    []
  );

  const navigate = useNavigate();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch clubs
  useEffect(() => {
    async function fetchClubs() {
      try {
        setLoading(true);
        const res = await API.get("/api/clubs");
        setClubs(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.error("❌ Error loading clubs:", error);
        alert("Failed to load clubs. Ensure backend is running.");
      } finally {
        setLoading(false);
      }
    }
    fetchClubs();
  }, []);

  // Fetch events for selected club
  const fetchClubEvents = async (clubId) => {
    try {
      setEventsLoading(true);
      const res = await API.get("/api/events");
      const allEvents = Array.isArray(res.data) ? res.data : [];
      // Filter events for selected club
      const clubEvents = allEvents.filter((event) => event.club_id === clubId);
      setEvents(clubEvents);
    } catch (error) {
      console.error("❌ Error loading events:", error);
      alert("Failed to load events.");
    } finally {
      setEventsLoading(false);
    }
  };

  // Fetch user's registrations
  const fetchMyRegistrations = async () => {
    if (!userEmail) {
      setRegisteredEvents({});
      return;
    }
    try {
      setMyRegistrationsLoading(true);
      const res = await API.get(`/api/participant/registrations/${userEmail}`);
      const list = Array.isArray(res.data) ? res.data : [];
      const mapped = {};
      list.forEach((reg) => {
        mapped[reg.event_id] = {
          registrationId: reg.id,
          eventId: reg.event_id,
          qrCodeUrl: `${API.defaults.baseURL}/api/registrations/${reg.id}/qr?t=${Date.now()}`,
          registration: reg,
        };
      });
      setRegisteredEvents(mapped);
    } catch (error) {
      console.error("❌ Failed to load registrations", error);
    } finally {
      setMyRegistrationsLoading(false);
    }
  };

  useEffect(() => {
    fetchMyRegistrations();
  }, [userEmail]);

  // Load event details for registered events
  useEffect(() => {
    if (!Object.keys(registeredEvents).length) return;
    
    async function loadEventDetails() {
      try {
        const res = await API.get("/api/events");
        const allEvents = Array.isArray(res.data) ? res.data : [];
        const updated = { ...registeredEvents };
        
        allEvents.forEach((event) => {
          if (updated[event.id]) {
            updated[event.id] = {
              ...updated[event.id],
              event,
            };
          }
        });
        setRegisteredEvents(updated);
      } catch (error) {
        console.error("Error loading event details:", error);
      }
    }
    
    loadEventDetails();
  }, [registeredEvents]);

  const handleClubSelect = (club) => {
    setSelectedClub(club);
    fetchClubEvents(club.id);
  };

  const handleBackToClubs = () => {
    setSelectedClub(null);
    setEvents([]);
    setShowRsvpSuccess(null);
  };

  const registerForEvent = async (eventId) => {
    try {
      if (registeringEventId === eventId) return;

      setRegisteringEventId(eventId);
      const token = localStorage.getItem("clubhub_token");

      if (!token) {
        alert("Please login first to RSVP for events");
        navigate("/login");
        return;
      }

      const res = await API.post(`/api/events/${eventId}/register`, {});
      const registration = res.data.registration;
      const event = res.data.event || events.find((ev) => ev.id === eventId);

      // Construct QR code URL with timestamp to prevent caching
      const qrCodeUrl = `${API.defaults.baseURL}/api/registrations/${registration.id}/qr?t=${Date.now()}`;
      
      // Show success message
      setShowRsvpSuccess({
        event,
        registration: {
          id: registration.id,
          qrCodeUrl: qrCodeUrl,
        },
      });

      // Update registered events
      setRegisteredEvents((prev) => ({
        ...prev,
        [eventId]: {
          registrationId: registration.id,
          eventId,
          qrCodeUrl: `${API.defaults.baseURL}/api/registrations/${registration.id}/qr?t=${Date.now()}`,
          event,
          registration,
        },
      }));

      // Refresh registrations
      fetchMyRegistrations();
    } catch (error) {
      console.error("❌ Registration Error:", error);
      if (error.response) {
        const status = error.response.status;
        const msg =
          error.response.data.error ||
          error.response.data.msg ||
          "Unknown error";

        if (status === 400) {
          alert(msg || "Already registered.");
        } else if (status === 401) {
          alert("⚠️ Session expired. Please login again.");
          localStorage.clear();
          navigate("/login");
        } else {
          alert(`Registration failed: ${msg}`);
        }
      } else {
        alert("⚠️ Cannot connect to backend server.");
      }
    } finally {
      setRegisteringEventId(null);
    }
  };

  const isRegistered = (eventId) => {
    return registeredEvents[eventId] !== undefined;
  };

  const handleViewEventDetails = (eventId) => {
    const reg = registeredEvents[eventId];
    if (reg && reg.event) {
      setSelectedEventDetails(reg);
    }
  };

  const getAIRecommendations = async () => {
    // Check if user is logged in
    const token = localStorage.getItem("clubhub_token");
    const role = localStorage.getItem("clubhub_role");
    
    if (!token) {
      alert("You must be logged in to get AI recommendations. Please log in first.");
      navigate("/login");
      return;
    }
    
    if (role !== "participant") {
      alert("AI recommendations are only available for participants. Please log in as a participant.");
      return;
    }

    try {
      setAiRecommendationsLoading(true);
      console.log("Requesting AI recommendations with token:", token ? "Token exists" : "No token");
      const res = await API.post("/api/ai/recommend-events");
      console.log("AI recommendations response:", res.data);
      setAiRecommendations(res.data);
    } catch (err) {
      console.error("Error getting AI recommendations:", err);
      console.error("Error response:", err.response?.data);
      console.error("Error status:", err.response?.status);
      
      // Handle 401 Unauthorized specifically
      if (err.response?.status === 401) {
        const errorDetails = err.response?.data?.error || err.response?.data?.details || "Authentication failed";
        alert(`Session expired or invalid. Please log in again.\n\nError: ${errorDetails}`);
        localStorage.clear();
        navigate("/login");
        return;
      }
      
      // Handle insufficient registrations error
      if (err.response?.data?.error === "Insufficient data for recommendations" || err.response?.data?.message) {
        const message = err.response.data.message || err.response.data.error;
        const currentCount = err.response.data.current_count || Object.keys(registeredEvents).length;
        const requiredCount = err.response.data.required_count || 4;
        
        alert(`${message}\n\nYou currently have ${currentCount} registration(s). Register for ${requiredCount - currentCount} more event(s) to unlock AI recommendations!`);
        return;
      }
      
      const errorMsg = err.response?.data?.error || err.response?.data?.details || err.message || "Failed to get AI recommendations. Please try again.";
      alert(`Error: ${errorMsg}\n\nPlease check:\n1. You are logged in as a participant\n2. Backend server is running\n3. Gemini API key is configured`);
    } finally {
      setAiRecommendationsLoading(false);
    }
  };

  const handleRegisterFromRecommendation = async (eventId) => {
    try {
      setRegisteringEventId(eventId);
      await API.post(`/api/registrations/events/${eventId}/register`);
      alert("Successfully registered for the event!");
      await fetchMyRegistrations();
      // Refresh recommendations to update
      await getAIRecommendations();
    } catch (err) {
      console.error("Registration error:", err);
      const errorMsg = err.response?.data?.error || "Failed to register. Please try again.";
      alert(errorMsg);
    } finally {
      setRegisteringEventId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin h-20 w-20 border-4 border-gray-200 border-t-green-600 rounded-full mx-auto mb-6"></div>
            <div className="absolute inset-0 animate-ping h-20 w-20 border-4 border-green-400 rounded-full mx-auto opacity-20"></div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-2">Loading Student ClubHub</p>
          <p className="text-gray-600">Fetching your clubs...</p>
        </div>
      </div>
    );
  }

  const stats = {
    totalClubs: clubs.length,
    registeredEvents: Object.keys(registeredEvents).length,
    upcomingEvents: Object.values(registeredEvents).filter(r => r.event).length,
  };

  const menuItems = [
    {
      id: "clubs",
      label: "Explore Clubs",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      id: "dashboard",
      label: "Your Dashboard",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      id: "create-club",
      label: "Create Club",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      ),
    },
    {
      id: "proposals",
      label: "My Proposals",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
    },
    {
      id: "profile",
      label: "My Profile",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }
        
        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease-out forwards;
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
        
        .animate-slideInRight {
          animation: slideInRight 0.5s ease-out forwards;
        }
        
        .animate-scaleIn {
          animation: scaleIn 0.4s ease-out forwards;
        }
        
        .initial-hidden {
          opacity: 0;
        }
        
        .delay-100 {
          animation-delay: 0.1s;
        }
        
        .delay-200 {
          animation-delay: 0.2s;
        }
        
        .delay-300 {
          animation-delay: 0.3s;
        }
        
        .delay-400 {
          animation-delay: 0.4s;
        }
        
        .card-hover {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .card-hover:hover {
          transform: translateY(-8px);
          box-shadow: 0 0 30px rgba(34, 211, 238, 0.3);
        }
        
        .cyber-grid {
          background-image: 
            linear-gradient(rgba(34, 211, 238, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34, 211, 238, 0.1) 1px, transparent 1px);
          background-size: 50px 50px;
        }
        
        .tech-border {
          border: 2px solid rgba(34, 211, 238, 0.3);
        }
        
        .neon-text {
          text-shadow: 0 0 10px currentColor, 0 0 20px currentColor;
        }
        
        .gradient-border {
          position: relative;
          background: white;
          border-radius: 1rem;
        }
        
        .gradient-border::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 1rem;
          padding: 2px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
        }
        
        .sidebar-transition {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .professional-card {
          background: white;
          border: 1px solid #e5e7eb;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03);
          position: relative;
          overflow: hidden;
        }
        
        .professional-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #16a34a 0%, #22c55e 100%);
        }
        
        .professional-card:hover {
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          border-color: #16a34a;
          transform: translateY(-2px);
        }
        
        .innovative-border {
          border: none;
          border-left: 4px solid #16a34a;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        
        .minimal-rounded {
          border-radius: 8px;
        }
        
        @media (max-width: 768px) {
          .sidebar-mobile {
            position: fixed;
            top: 0;
            left: 0;
            height: 100vh;
            z-index: 50;
            transform: translateX(-100%);
          }
          
          .sidebar-mobile.open {
            transform: translateX(0);
          }
        }
      `}</style>

      <div className="flex min-h-screen">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="md:hidden fixed top-4 left-4 z-50 p-3 bg-white border border-gray-300 minimal-rounded shadow-md hover:shadow-lg transition-all duration-300"
        >
          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {sidebarOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div 
            className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40 animate-fadeIn"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div className={`sidebar-transition bg-white shadow-2xl flex flex-col relative z-40
          ${sidebarOpen ? 'w-72' : 'w-20'} 
          md:relative md:translate-x-0
          fixed top-0 left-0 h-screen
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          ${mounted ? 'animate-slideInRight' : 'initial-hidden'}`}>
        {/* Sidebar Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-600 minimal-rounded flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-green-600">
                  Student ClubHub
                </h2>
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 minimal-rounded transition-all duration-300 ml-auto hidden md:block"
            >
              <svg className={`w-6 h-6 text-gray-600 transition-transform duration-300 ${!sidebarOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-2">
            {menuItems.map((item, index) => (
              <li key={item.id} className={`${mounted ? 'animate-fadeIn' : 'initial-hidden'}`} style={{ animationDelay: `${0.1 + index * 0.05}s` }}>
                <button
                  onClick={() => {
                    if (item.id === "profile") {
                      navigate("/participant/profile");
                      if (window.innerWidth < 768) {
                        setSidebarOpen(false);
                      }
                      return;
                    }
                    setActiveTab(item.id);
                    if (item.id === "clubs") {
                      handleBackToClubs();
                    }
                    // Close mobile sidebar when item is clicked
                    if (window.innerWidth < 768) {
                      setSidebarOpen(false);
                    }
                  }}
                    className={`w-full flex items-center gap-4 px-4 py-3 minimal-rounded font-semibold transition-all duration-300 ${
                      activeTab === item.id
                        ? "bg-green-600 text-white shadow-lg transform scale-105"
                        : "text-gray-700 hover:bg-green-50 hover:scale-105"
                    }`}
                  title={!sidebarOpen ? item.label : ''}
                >
                  <div className="flex-shrink-0">
                    {item.icon}
                  </div>
                  {sidebarOpen && (
                    <span className="text-left">{item.label}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* User Section with Logout */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
            {sidebarOpen && userEmail ? (
              <div className="animate-fadeIn">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-green-600 minimal-rounded flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {userEmail.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">Participant</p>
                    <p className="text-xs text-gray-600 truncate">{userEmail}</p>
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white minimal-rounded font-semibold transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex justify-center">
                <button
                  onClick={onLogout}
                  className="p-3 bg-red-600 hover:bg-red-700 text-white minimal-rounded transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-110 active:scale-95"
                  title="Logout"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            )}
          </div>
      </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto md:ml-0">
          <div className="p-6 md:p-8 max-w-7xl mx-auto mt-16 md:mt-0">
        {/* Header Section with Innovative Stats */}
        <div className={`mb-8 ${mounted ? 'animate-fadeInUp' : 'initial-hidden'}`}>
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-6">
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-3">
                {activeTab === "clubs"
                  ? selectedClub
                    ? `${selectedClub.name} Events`
                    : "Discover Campus Life"
                  : activeTab === "dashboard"
                  ? "Your Event Hub"
                  : activeTab === "proposals"
                  ? "Proposal Tracker"
                  : "Launch Your Club"}
              </h1>
              <p className="text-base sm:text-lg text-gray-600 max-w-3xl">
                {activeTab === "clubs"
                  ? selectedClub
                    ? "Browse upcoming events and secure your spot with instant RSVP"
                    : "Explore vibrant student organizations and find your community"
                  : activeTab === "dashboard"
                  ? "Access your event registrations, QR codes, and manage your campus schedule"
                  : activeTab === "proposals"
                  ? "Monitor your club creation requests and approval status in real-time"
                  : "Submit your club proposal and bring your vision to campus life"}
              </p>
            </div>

            {/* Innovative Floating Stats Cards */}
            {(activeTab === "clubs" || activeTab === "dashboard") && (
              <div className={`flex gap-4 ${mounted ? 'animate-slideInRight delay-200' : 'initial-hidden'}`}>
                <div className="relative group">
                  <div className="professional-card minimal-rounded p-4 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-green-600 minimal-rounded flex items-center justify-center shadow-lg">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide">Clubs</p>
                        <p className="text-3xl font-bold text-green-600">{stats.totalClubs}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="relative group">
                  <div className="professional-card minimal-rounded p-4 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-green-600 minimal-rounded flex items-center justify-center shadow-lg">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide">RSVPs</p>
                        <p className="text-3xl font-bold text-green-600">{stats.registeredEvents}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="relative group">
                  <div className="professional-card minimal-rounded p-4 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-green-600 minimal-rounded flex items-center justify-center shadow-lg">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide">Events</p>
                        <p className="text-3xl font-bold text-green-600">{stats.upcomingEvents}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RSVP Success Modal */}
        {showRsvpSuccess && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fadeIn backdrop-blur-sm">
            <div className="bg-white minimal-rounded shadow-2xl max-w-md w-full p-8 animate-scaleIn">
              <div className="text-center mb-6">
                <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-600 mb-4 animate-scaleIn">
                  <svg
                    className="h-10 w-10 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-3">
                  Registration Successful! 🎉
                </h2>
                <p className="text-gray-600 text-lg">
                  You've successfully RSVP'd for{" "}
                  <span className="font-semibold text-gray-900">{showRsvpSuccess.event.title}</span>
                </p>
              </div>

              <div className="bg-white innovative-border minimal-rounded p-6 text-center mb-6">
                <p className="font-bold text-gray-800 mb-4 text-lg">Your Entry QR Code</p>
                <div className="bg-white p-4 minimal-rounded inline-block shadow-md">
                  <img
                    src={showRsvpSuccess.registration.qrCodeUrl}
                    alt="QR Code"
                    className="w-56 h-56 mx-auto object-contain"
                    onLoad={() => console.log("QR code loaded successfully")}
                    onError={(e) => {
                      console.error("QR code failed to load:", showRsvpSuccess.registration.qrCodeUrl);
                      e.target.style.display = "none";
                      const errorDiv = e.target.nextElementSibling;
                      if (errorDiv) errorDiv.style.display = "block";
                    }}
                    crossOrigin="anonymous"
                  />
                  <div style={{ display: "none" }} className="text-red-600 text-sm font-medium">
                    QR code unavailable. Please refresh or contact support.
                  </div>
                </div>
                <div className="mt-4 p-3 bg-white border-l-4 border-green-600 border border-green-200 minimal-rounded">
                  <p className="text-gray-600 text-sm mb-1 font-medium">Registration ID:</p>
                  <p
                    className="font-mono font-bold text-gray-900 cursor-pointer hover:text-green-600 transition text-lg"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        showRsvpSuccess.registration.id.toString()
                      );
                      alert("✓ Registration ID copied!");
                    }}
                    title="Click to copy"
                  >
                    #{showRsvpSuccess.registration.id}
                  </p>
                  <p className="text-gray-500 text-xs mt-1">Click to copy</p>
                </div>
              </div>

              <button
                onClick={() => setShowRsvpSuccess(null)}
                className="w-full py-4 bg-green-600 text-white minimal-rounded font-bold text-lg hover:bg-green-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
              >
                Awesome! Got it 🎊
              </button>
            </div>
          </div>
        )}

        {/* Event Details Modal */}
        {selectedEventDetails && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fadeIn backdrop-blur-sm">
            <div className="professional-card minimal-rounded max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto animate-scaleIn">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-4xl font-bold text-gray-900 mb-2">
                    {selectedEventDetails.event.title}
                  </h2>
                  <p className="text-gray-600">Event Details & QR Code</p>
                </div>
                <button
                  onClick={() => setSelectedEventDetails(null)}
                  className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 minimal-rounded p-2 transition"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <div className="bg-gray-50 minimal-rounded p-4 border border-gray-200">
                  <p className="text-gray-700 text-lg leading-relaxed">{selectedEventDetails.event.description}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="flex items-center gap-3 bg-green-50 text-green-700 p-4 minimal-rounded border-l-4 border-green-600 border border-green-200">
                    <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <p className="text-xs font-medium opacity-75">Date</p>
                      <p className="font-semibold">{selectedEventDetails.event.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-green-50 text-green-700 p-4 minimal-rounded border-l-4 border-green-600 border border-green-200">
                    <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-xs font-medium opacity-75">Time</p>
                      <p className="font-semibold">{selectedEventDetails.event.time}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-red-50 text-red-700 p-4 minimal-rounded border-l-4 border-red-600 border border-red-200">
                    <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <div>
                      <p className="text-xs font-medium opacity-75">Location</p>
                      <p className="font-semibold">{selectedEventDetails.event.location}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white innovative-border minimal-rounded p-6 text-center">
                <p className="font-bold text-gray-800 mb-4 text-lg">Your Entry QR Code</p>
                <div className="bg-white p-4 minimal-rounded inline-block shadow-md">
                  <img
                    src={selectedEventDetails.qrCodeUrl}
                    alt="QR Code"
                    className="w-56 h-56 mx-auto object-contain"
                    onLoad={() => console.log("QR code loaded successfully")}
                    onError={(e) => {
                      console.error("QR code failed to load:", selectedEventDetails.qrCodeUrl);
                      e.target.style.display = "none";
                      const errorDiv = e.target.nextElementSibling;
                      if (errorDiv) errorDiv.style.display = "block";
                    }}
                    crossOrigin="anonymous"
                  />
                  <div style={{ display: "none" }} className="text-red-600 text-sm font-medium">
                    QR code unavailable. Please refresh or contact support.
                  </div>
                </div>
                <div className="mt-4 p-3 bg-white border-l-4 border-green-600 border border-green-200 minimal-rounded">
                  <p className="text-gray-600 text-sm mb-1 font-medium">Registration ID:</p>
                  <p
                    className="font-mono font-bold text-gray-900 cursor-pointer hover:text-green-600 transition text-lg"
                    onClick={() => {
                      navigator.clipboard.writeText(selectedEventDetails.registrationId.toString());
                      alert("✓ Registration ID copied!");
                    }}
                    title="Click to copy"
                  >
                    #{selectedEventDetails.registrationId}
                  </p>
                  <p className="text-gray-500 text-xs mt-1">Click to copy</p>
                </div>
                <a
                  href={selectedEventDetails.qrCodeUrl}
                  download={`qr-${selectedEventDetails.event.title.replace(/\s+/g, "-")}.png`}
                  className="mt-4 inline-flex items-center gap-2 text-green-600 hover:text-blue-800 font-semibold transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download QR Code
                </a>
              </div>
            </div>
          </div>
        )}

        {activeTab === "clubs" && (
          <>
            {!selectedClub ? (
              // Clubs List View
              <div className={`${mounted ? 'animate-fadeIn delay-400' : 'initial-hidden'}`}>
                {clubs.length === 0 ? (
                  <div className="text-center py-20 professional-card minimal-rounded">
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 mb-2">No Clubs Available</p>
                    <p className="text-gray-600 mb-6">Be the first to create a club!</p>
                    <button
                      onClick={() => navigate("/participant/create-club")}
                      className="px-6 py-3 bg-green-600 text-white minimal-rounded font-semibold hover:bg-green-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      Create First Club
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {clubs.map((club, index) => (
                      <div
                        key={club.id}
                        className={`professional-card minimal-rounded p-6 card-hover ${mounted ? 'animate-scaleIn' : 'initial-hidden'}`}
                        style={{ animationDelay: `${0.4 + index * 0.1}s` }}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-14 h-14 bg-green-600 minimal-rounded flex items-center justify-center text-white text-2xl font-bold shadow-md">
                            {club.name.charAt(0)}
                          </div>
                          <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                            {club.category || "General"}
                          </span>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-3">{club.name}</h2>
                        <p className="text-gray-600 mb-6 line-clamp-3 min-h-[4.5rem]">
                          {club.description || "No description available."}
                        </p>
                        <button
                          onClick={() => handleClubSelect(club)}
                          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:bg-green-700 text-white py-3 minimal-rounded font-semibold transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
                        >
                          View Events →
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              // Events List for Selected Club
              <div>
                <button
                  onClick={handleBackToClubs}
                  className="mb-6 text-green-600 hover:text-blue-800 flex items-center gap-2 font-semibold text-lg transition hover:gap-3"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to All Clubs
                </button>

                {eventsLoading ? (
                  <div className="text-center py-20 professional-card minimal-rounded">
                    <div className="relative inline-block">
                      <div className="animate-spin h-16 w-16 border-4 border-green-200 border-t-blue-600 rounded-full"></div>
                      <div className="absolute inset-0 animate-ping h-16 w-16 border-4 border-blue-400 rounded-full opacity-20"></div>
                    </div>
                    <p className="text-xl font-bold text-gray-800 mt-6">Loading Events</p>
                    <p className="text-gray-600 mt-2">Fetching the latest events...</p>
                  </div>
                ) : (
                  events.length === 0 ? (
                    <div className="text-center py-20 professional-card minimal-rounded">
                      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-2xl font-bold text-gray-900 mb-2">No Events Yet</p>
                      <p className="text-gray-600">This club hasn't created any events yet. Check back soon!</p>
                    </div>
                  ) : (
                    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                      {events.map((event, index) => (
                        <div
                          key={event.id}
                          className={`professional-card minimal-rounded overflow-hidden card-hover ${mounted ? 'animate-fadeInUp' : 'initial-hidden'}`}
                          style={{ animationDelay: `${index * 0.1}s` }}
                        >
                        {/* Event Poster Image */}
                        {event.poster_image && (
                          <div className="relative h-48 overflow-hidden">
                            <img 
                              src={event.poster_image.startsWith('/') ? `http://localhost:5000${event.poster_image}` : event.poster_image} 
                              alt={`${event.title} poster`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.parentElement.style.display = 'none';
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                            <div className="absolute bottom-3 left-3 right-3">
                              <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-xs font-bold text-gray-900 rounded-full">
                                Featured Event
                              </span>
                            </div>
                          </div>
                        )}
                        
                        <div className="p-6">
                          <div className="mb-4">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">{event.title}</h2>
                            <p className="text-gray-600 mb-4 line-clamp-2 min-h-[3rem]">{event.description}</p>
                          </div>

                        <div className="space-y-2 mb-5">
                          <div className="flex items-center gap-3 text-gray-700 bg-green-50 p-3 minimal-rounded">
                            <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="font-medium">{event.date}</span>
                          </div>
                          <div className="flex items-center gap-3 text-gray-700 bg-green-50 p-3 minimal-rounded">
                            <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="font-medium">{event.time}</span>
                          </div>
                          <div className="flex items-center gap-3 text-gray-700 bg-red-50 p-3 minimal-rounded">
                            <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="font-medium">{event.location}</span>
                          </div>
                        </div>

                        {isRegistered(event.id) ? (
                          <div className="bg-green-600 border-l-4 border-green-700 border border-green-200 minimal-rounded p-4 text-center shadow-sm">
                            <p className="text-white font-bold text-lg flex items-center justify-center gap-2">
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              RSVP Confirmed!
                            </p>
                          </div>
                        ) : (
                          <button
                            className={`w-full py-3 font-bold minimal-rounded transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 ${
                              registeringEventId === event.id
                                ? "bg-gray-300 cursor-not-allowed text-gray-600"
                                : "bg-green-600 hover:bg-green-700 text-white"
                            }`}
                            disabled={registeringEventId === event.id}
                            onClick={() => registerForEvent(event.id)}
                          >
                            {registeringEventId === event.id ? (
                              <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Processing...
                              </span>
                            ) : "RSVP Now 🎉"}
                          </button>
                        )}
                        </div>
                      </div>
                      ))}
                    </div>
                  )
                )}
              </div>
            )}
          </>
        )}

        {activeTab === "dashboard" && (
          <div className={`${mounted ? 'animate-fadeIn delay-400' : 'initial-hidden'}`}>
            {/* AI Recommendations Section - Only show if user has 4+ registrations */}
            {Object.keys(registeredEvents).length >= 4 ? (
            <div className="mb-10 bg-white minimal-rounded p-6 shadow-xl border border-green-200">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1 flex items-center gap-3">
                    <span className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 minimal-rounded flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </span>
                    AI Event Recommendations
                  </h2>
                  <p className="text-sm text-gray-600">Get personalized event suggestions based on your interests</p>
                </div>
                <button
                  onClick={getAIRecommendations}
                  disabled={aiRecommendationsLoading}
                  className="px-6 py-3 bg-green-600 text-white font-bold minimal-rounded shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {aiRecommendationsLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Finding Events...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span>Get Recommendations</span>
                    </>
                  )}
                </button>
              </div>

              {aiRecommendations && aiRecommendations.recommendations && (
                <div className="space-y-4">
                  {aiRecommendations.recommendations.length > 0 ? (
                    <>
                      {aiRecommendations.profile_summary && (
                        <div className="bg-green-50 minimal-rounded p-4 mb-4 border border-green-200">
                          <p className="text-sm text-gray-700">
                            <span className="font-bold">Based on:</span> {aiRecommendations.profile_summary.past_events} past events • 
                            Interests: {aiRecommendations.profile_summary.interests.length > 0 
                              ? aiRecommendations.profile_summary.interests.join(", ") 
                              : "General"}
                          </p>
                        </div>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {aiRecommendations.recommendations.map((rec, index) => (
                          <div key={rec.event_id || index} className="bg-white minimal-rounded p-5 border border-green-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h3 className="font-bold text-gray-900 text-lg mb-1">{rec.title}</h3>
                                <p className="text-sm text-purple-600 font-semibold">{rec.club_name}</p>
                                <p className="text-xs text-gray-500 mt-1">{rec.club_category}</p>
                              </div>
                              <span className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                {index + 1}
                              </span>
                            </div>
                            
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{rec.description || "Join us for an exciting event!"}</p>
                            
                            <div className="space-y-2 mb-4">
                              <div className="flex items-center gap-2 text-xs text-gray-600">
                                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span>{new Date(rec.date).toLocaleDateString()}</span>
                                <span className="mx-1">•</span>
                                <span>{rec.time}</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-600">
                                <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span className="truncate">{rec.location}</span>
                              </div>
                              {rec.popularity > 0 && (
                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                  </svg>
                                  <span>{rec.popularity} registered</span>
                                </div>
                              )}
                            </div>

                            <div className="bg-green-50 minimal-rounded p-3 mb-4 border border-green-200">
                              <p className="text-xs font-semibold text-blue-900 mb-1">💡 Why we recommend this:</p>
                              <p className="text-xs text-green-700">{rec.explanation}</p>
                            </div>

                            {isRegistered(rec.event_id) ? (
                              <div className="bg-green-600 minimal-rounded p-3 text-center text-white font-bold text-sm">
                                ✓ Already Registered
                              </div>
                            ) : (
                              <button
                                onClick={() => handleRegisterFromRecommendation(rec.event_id)}
                                disabled={registeringEventId === rec.event_id}
                                className={`w-full py-3 font-bold minimal-rounded transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 ${
                                  registeringEventId === rec.event_id
                                    ? "bg-gray-300 cursor-not-allowed text-gray-600"
                                    : "bg-green-600 hover:bg-green-700 text-white"
                                }`}
                              >
                                {registeringEventId === rec.event_id ? (
                                  <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Registering...
                                  </span>
                                ) : (
                                  "Register Now 🎉"
                                )}
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12 bg-gray-50 minimal-rounded border border-dashed border-gray-300">
                      <p className="text-gray-600 font-semibold">No recommendations available at this time</p>
                      <p className="text-sm text-gray-500 mt-2">Try again later or explore events manually</p>
                    </div>
                  )}
                </div>
              )}

              {!aiRecommendations && !aiRecommendationsLoading && (
                <div className="text-center py-12 bg-gray-50 minimal-rounded border border-dashed border-gray-300">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <p className="text-gray-600 font-semibold mb-2">Ready for Personalized Recommendations</p>
                  <p className="text-sm text-gray-500">Click the button above to discover events tailored to your interests</p>
                </div>
              )}
            </div>
            ) : (
              // Show message when user has less than 4 registrations
              <div className="mb-10 professional-card minimal-rounded p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-amber-500 minimal-rounded flex items-center justify-center flex-shrink-0 shadow-md">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">AI Recommendations Coming Soon!</h3>
                    <p className="text-gray-700 mb-3">
                      Register for <span className="font-bold text-amber-700">{4 - Object.keys(registeredEvents).length}</span> more event{4 - Object.keys(registeredEvents).length === 1 ? '' : 's'} to unlock personalized AI recommendations.
                    </p>
                    <div className="bg-white minimal-rounded p-4 mb-4 border border-amber-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-gray-700">Your Progress:</span>
                        <span className="text-sm font-bold text-amber-700">
                          {Object.keys(registeredEvents).length} / 4 events
                        </span>
                      </div>
                      <div className="w-full bg-amber-100 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-amber-400 to-orange-500 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min((Object.keys(registeredEvents).length / 4) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTab("clubs")}
                      className="px-6 py-3 bg-green-600 text-white font-bold minimal-rounded shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Explore Events
                    </button>
                  </div>
                </div>
              </div>
            )}

            {userEmail ? (
              <>
                {myRegistrationsLoading ? (
                  <div className="text-center py-20 professional-card minimal-rounded">
                    <div className="relative inline-block">
                      <div className="animate-spin h-16 w-16 border-4 border-green-200 border-t-purple-600 rounded-full"></div>
                      <div className="absolute inset-0 animate-ping h-16 w-16 border-4 border-purple-400 rounded-full opacity-20"></div>
                    </div>
                    <p className="text-xl font-bold text-gray-800 mt-6">Loading Your RSVPs</p>
                    <p className="text-gray-600 mt-2">Fetching your registered events...</p>
                  </div>
                ) : Object.keys(registeredEvents).length === 0 ? (
                  <div className="text-center py-20 professional-card minimal-rounded">
                    <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <svg className="w-12 h-12 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 mb-3">No RSVPs Yet</p>
                    <p className="text-gray-600 mb-6">Start exploring clubs and RSVP to events!</p>
                    <button
                      onClick={() => setActiveTab("clubs")}
                      className="px-6 py-3 bg-green-600 text-white minimal-rounded font-semibold hover:bg-green-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      Explore Clubs
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                    {Object.values(registeredEvents)
                      .filter((reg) => reg.event)
                      .map((reg, index) => (
                        <div
                          key={reg.registrationId}
                          className={`bg-white border border-gray-100 minimal-rounded p-6 shadow-lg card-hover ${mounted ? 'animate-scaleIn' : 'initial-hidden'}`}
                          style={{ animationDelay: `${index * 0.1}s` }}
                        >
                          <div className="flex items-start justify-between mb-4">
                            <h3 className="text-2xl font-bold text-gray-900 flex-1">
                              {reg.event.title}
                            </h3>
                            <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full flex items-center gap-1">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              RSVP'd
                            </span>
                          </div>
                          <div className="space-y-2 mb-5">
                            <div className="flex items-center gap-3 text-gray-700 bg-green-50 p-3 minimal-rounded">
                              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span className="font-medium">{reg.event.date}</span>
                            </div>
                            <div className="flex items-center gap-3 text-gray-700 bg-green-50 p-3 minimal-rounded">
                              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="font-medium">{reg.event.time}</span>
                            </div>
                            <div className="flex items-center gap-3 text-gray-700 bg-red-50 p-3 minimal-rounded">
                              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span className="font-medium">{reg.event.location}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleViewEventDetails(reg.eventId)}
                            className="w-full py-3 bg-green-600 hover:bg-green-700 text-white minimal-rounded font-bold transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View Details & QR Code
                          </button>
                        </div>
                      ))}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-20 bg-white minimal-rounded shadow-lg">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-3">Please Log In</h2>
                <p className="text-gray-600 mb-6 text-lg">
                  Sign in to access your personalized dashboard with RSVPs and QR codes.
                </p>
                <button
                  className="px-8 py-4 bg-green-600 text-white minimal-rounded font-bold text-lg hover:bg-green-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                  onClick={() => navigate("/login")}
                >
                  Login Now
                </button>
              </div>
            )}
          </div>
        )}

        {/* Create Club Section */}
        {activeTab === "create-club" && (
          <div className={`${mounted ? 'animate-fadeIn delay-400' : 'initial-hidden'}`}>
            <div className="max-w-3xl mx-auto">
              <div className="bg-white minimal-rounded shadow-xl p-8 border border-gray-100">
                <div className="text-center mb-8">
                  <div className="w-20 h-20 bg-green-600 minimal-rounded flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Your Club</h2>
                  <p className="text-gray-600">Fill in the details below to submit your club proposal</p>
                </div>

                <button
                  onClick={() => navigate("/participant/create-club")}
                  className="w-full py-4 bg-green-600 hover:bg-green-700 text-white minimal-rounded font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 flex items-center justify-center gap-3"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Go to Create Club Form
                </button>

                <div className="mt-8 p-6 bg-green-50 minimal-rounded border border-green-200">
                  <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    What you'll need:
                  </h3>
                  <ul className="space-y-2 text-blue-800">
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span><strong>Club Name:</strong> A unique and catchy name for your club</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span><strong>Description:</strong> Explain what your club is about and its goals</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span><strong>Category:</strong> Choose the category that best fits your club</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span><strong>Contact Info:</strong> How members can reach you</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-6 p-4 bg-yellow-50 minimal-rounded border border-yellow-200">
                  <p className="text-sm text-yellow-800 flex items-start gap-2">
                    <svg className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span><strong>Note:</strong> Your club proposal will be reviewed by the university administration before approval.</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* My Proposals Section */}
        {activeTab === "proposals" && (
          <div className={`${mounted ? 'animate-fadeIn delay-400' : 'initial-hidden'}`}>
            <div className="max-w-4xl mx-auto">
              <div className="bg-white minimal-rounded shadow-xl p-8 border border-gray-100 mb-6">
                <div className="text-center mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 minimal-rounded flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Track Your Proposals</h2>
                  <p className="text-gray-600">View the status of your club creation proposals</p>
                </div>

                <button
                  onClick={() => navigate("/participant/proposals")}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white minimal-rounded font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 flex items-center justify-center gap-3"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  View All Proposals
                </button>
              </div>

              {/* Proposal Status Legend */}
              <div className="bg-white minimal-rounded shadow-lg p-6 border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Proposal Status Guide
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-yellow-50 minimal-rounded border border-yellow-200">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                      <span className="font-bold text-yellow-800">Pending</span>
                    </div>
                    <p className="text-sm text-yellow-700">Your proposal is under review by the university administration</p>
                  </div>
                  
                  <div className="p-4 bg-green-50 minimal-rounded border border-green-200">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="font-bold text-green-800">Approved</span>
                    </div>
                    <p className="text-sm text-green-700">Congratulations! Your club has been approved and is now active</p>
                  </div>
                  
                  <div className="p-4 bg-red-50 minimal-rounded border border-red-200">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="font-bold text-red-800">Rejected</span>
                    </div>
                    <p className="text-sm text-red-700">Your proposal needs revision. Check feedback and resubmit</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
          </div>
        </div>
      </div>
    </div>
  );
}
