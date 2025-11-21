import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
  Area,
  AreaChart,
} from "recharts";

export default function LeaderDashboard() {
  const navigate = useNavigate();
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [selectedEventDetails, setSelectedEventDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [activeChart, setActiveChart] = useState("bar"); // bar, line, area
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard"); // dashboard, events, analytics
  const [aiInsights, setAiInsights] = useState(null);
  const [aiInsightsLoading, setAiInsightsLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch analytics from backend
  useEffect(() => {
    loadAnalytics();
    loadLeaderEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const overviewRes = await API.get("/api/analytics/overview");
      setOverview(overviewRes.data || { total_events: 0, total_registrations: 0 });
    } catch (err) {
      console.error("Error loading analytics:", err);
      setOverview({ total_events: 0, total_registrations: 0 });
    } finally {
      setLoading(false);
    }
  };

  const loadLeaderEvents = async () => {
    try {
      setEventsLoading(true);
      const res = await API.get("/api/leader/events");
      setEvents(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error loading leader events:", err);
      setEvents([]);
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.clear();
        navigate("/login");
      }
    } finally {
      setEventsLoading(false);
    }
  };

  const viewEventDetails = async (eventId) => {
    try {
      setDetailsLoading(true);
      const res = await API.get(`/api/leader/registrations/${eventId}`);
      setSelectedEventDetails(res.data);
    } catch (err) {
      console.error("Error loading registrations:", err);
      alert("Failed to load registrations for this event.");
    } finally {
      setDetailsLoading(false);
    }
  };

  const clearDetails = () => setSelectedEventDetails(null);

  const generateAIInsights = async () => {
    // Check if user is logged in
    const token = localStorage.getItem("clubhub_token");
    const role = localStorage.getItem("clubhub_role");
    
    if (!token) {
      alert("You must be logged in to generate AI insights. Please log in first.");
      return;
    }
    
    if (role !== "leader") {
      alert("AI insights are only available for club leaders.");
      return;
    }

    try {
      setAiInsightsLoading(true);
      console.log("Requesting AI insights...");
      const res = await API.post("/api/ai/leader-insights");
      console.log("AI insights response:", res.data);
      setAiInsights(res.data);
    } catch (err) {
      console.error("Error generating AI insights:", err);
      console.error("Error response:", err.response?.data);
      console.error("Error status:", err.response?.status);
      
      // Handle 401 Unauthorized
      if (err.response?.status === 401) {
        alert("Session expired. Please log in again.");
        localStorage.clear();
        window.location.href = "/login";
        return;
      }
      
      // Get detailed error message
      const errorMsg = err.response?.data?.error || err.response?.data?.details || err.message || "Failed to generate AI insights";
      const details = err.response?.data?.details || "";
      
      alert(`Error: ${errorMsg}\n\n${details}\n\nPlease check:\n1. You are logged in as a leader\n2. Backend server is running\n3. Gemini API key is configured in .env file\n4. google-generativeai package is installed`);
    } finally {
      setAiInsightsLoading(false);
    }
  };

  const displayTime = (timeStr = "") => {
    if (!timeStr) return "—";
    return timeStr.length >= 5 ? timeStr.slice(0, 5) : timeStr;
  };

  const canDeleteEvent = (dateStr) => {
    if (!dateStr) return false;
    const eventDate = new Date(dateStr);
    const diffDays = Math.floor((eventDate - new Date()) / (1000 * 60 * 60 * 24));
    return diffDays >= 7;
  };

  const canEditEvent = (dateStr) => {
    if (!dateStr) return false;
    const eventDate = new Date(dateStr);
    const diffDays = Math.floor((eventDate - new Date()) / (1000 * 60 * 60 * 24));
    return diffDays >= 1;
  };

  const handleDeleteEvent = async (event) => {
    if (!canDeleteEvent(event.date)) {
      alert("Events can only be deleted at least 7 days before the scheduled date.");
      return;
    }
    const confirmDelete = window.confirm(
      `Delete "${event.title}"? This will remove the event and all registrations.`
    );
    if (!confirmDelete) return;

    try {
      setActionLoadingId(event.id);
      await API.delete(`/api/events/${event.id}`);
      setEvents((prev) => prev.filter((e) => e.id !== event.id));
      if (selectedEventDetails?.event?.id === event.id) {
        setSelectedEventDetails(null);
      }
      alert("Event deleted successfully.");
    } catch (err) {
      console.error("Failed to delete event:", err);
      const message =
        err.response?.data?.error ||
        err.response?.data?.msg ||
        "Unable to delete event.";
      alert(message);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Chart data preparation
  const eventChartData = events.map((event) => {
    const registrations = event.registration_count || 0;
    const views = event.view_count || 0;
    const viewedOnly = Math.max(views - registrations, 0);
    return {
      name: event.title.length > 15 ? `${event.title.slice(0, 15)}...` : event.title,
      fullName: event.title,
      registrations,
      views,
      viewedOnly,
      conversionRate: views > 0 ? ((registrations / views) * 100).toFixed(1) : 0,
    };
  });

  // Pie chart data for engagement
  const totalRegistrations = events.reduce((sum, e) => sum + (e.registration_count || 0), 0);
  const totalViews = events.reduce((sum, e) => sum + (e.view_count || 0), 0);
  const engagementData = [
    { name: "Registered", value: totalRegistrations, color: "#8b5cf6" },
    { name: "Viewed Only", value: Math.max(totalViews - totalRegistrations, 0), color: "#06b6d4" },
  ];

  const COLORS = ["#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"];

  const userEmail = localStorage.getItem("clubhub_user_email");

  const handleLogout = () => {
    localStorage.removeItem("clubhub_token");
    localStorage.removeItem("clubhub_role");
    localStorage.removeItem("clubhub_user_email");
    navigate("/login");
  };

  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      id: "events",
      label: "My Events",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      id: "create",
      label: "Create Event",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      ),
      action: () => navigate("/leader/create"),
    },
    {
      id: "checkin",
      label: "QR Check-In",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
        </svg>
      ),
      action: () => navigate("/leader/checkin"),
    },
    {
      id: "profile",
      label: "My Profile",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      action: () => navigate("/leader/profile"),
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin h-20 w-20 border-4 border-gray-200 border-t-green-600 rounded-full mx-auto mb-6"></div>
            <div className="absolute inset-0 animate-ping h-20 w-20 border-4 border-green-400 rounded-full mx-auto opacity-20"></div>
          </div>
          <p className="text-2xl font-bold text-gray-800 mb-2">Loading Analytics</p>
          <p className="text-gray-600">Preparing your insights...</p>
        </div>
      </div>
    );
  }

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
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
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
        
        .animate-pulse-slow {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
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
          transform: translateY(-8px) scale(1.02);
        }
        
        .glass-effect {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(229, 231, 235, 0.3);
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03);
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
        
        .geometric-card {
          clip-path: polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 0 100%);
          background: white;
          border: 1px solid #e5e7eb;
        }
        
        .minimal-rounded {
          border-radius: 8px;
        }
        
        .asymmetric-card {
          border-radius: 0 12px 12px 0;
          border-left: 4px solid #16a34a;
        }
      `}</style>

      <div className="flex min-h-screen">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="md:hidden fixed top-4 left-4 z-50 p-3 glass-effect rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
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
        <div className={`sidebar-transition glass-effect shadow-2xl flex flex-col z-40
          ${sidebarOpen ? 'w-72' : 'w-20'} 
          fixed top-0 left-0 h-screen
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          ${mounted ? 'animate-slideInRight' : 'initial-hidden'}`}>
          
          {/* Sidebar Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              {sidebarOpen && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-green-600">
                    Student ClubHub
                  </h2>
                </div>
              )}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-green-50 rounded-lg transition-all duration-300 ml-auto hidden md:block"
              >
                <svg className={`w-6 h-6 text-gray-600 transition-transform duration-300 ${!sidebarOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 p-4 overflow-y-auto overflow-x-hidden">
            <ul className="space-y-2">
              {menuItems.map((item, index) => (
                <li key={item.id} className={`${mounted ? 'animate-fadeIn' : 'initial-hidden'}`} style={{ animationDelay: `${0.1 + index * 0.05}s` }}>
                  <button
                    onClick={() => {
                      if (item.action) {
                        item.action();
                      } else {
                        setActiveTab(item.id);
                      }
                      // Close mobile sidebar when item is clicked
                      if (window.innerWidth < 768) {
                        setSidebarOpen(false);
                      }
                    }}
                    className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl font-semibold transition-all duration-300 ${
                      activeTab === item.id && !item.action
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

          {/* Total Events Stat - Sidebar */}
          {sidebarOpen && (
            <div className="px-4 pb-4">
              <div className="bg-green-600 rounded-xl p-4 shadow-lg border border-green-700">
                <div className="flex items-center justify-center mb-3">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-xs text-green-100 font-semibold mb-1 uppercase tracking-wide">Total Events</p>
                  <p className="text-3xl font-extrabold text-white mb-1">
                    {overview?.total_events ?? 0}
                  </p>
                  <p className="text-xs text-green-100">Active & Upcoming</p>
                </div>
              </div>
            </div>
          )}

          {/* User Section with Logout */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            {sidebarOpen && userEmail ? (
              <div className="animate-fadeIn">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {userEmail.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">Club Leader</p>
                    <p className="text-xs text-gray-600 truncate">{userEmail}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
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
                  onClick={handleLogout}
                  className="p-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-110 active:scale-95"
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
        <div className={`flex-1 overflow-y-auto transition-all duration-300 ${sidebarOpen ? 'md:ml-72' : 'md:ml-20'}`}>
          <div className="p-6 md:p-8 max-w-7xl mx-auto mt-16 md:mt-0">
        {/* Header */}
        <div className={`mb-10 ${mounted ? 'animate-fadeInUp' : 'initial-hidden'}`}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-3">
                {activeTab === "dashboard" ? "Dashboard" : "Event Management"}
              </h1>
              <p className="text-base sm:text-lg text-gray-600 max-w-2xl">
                {activeTab === "dashboard" 
                  ? "Track your events and get AI-powered insights to improve engagement"
                  : "Create, edit, and manage your events with ease"}
              </p>
            </div>
            <button
              onClick={() => {
                loadAnalytics();
                loadLeaderEvents();
              }}
              className="px-6 py-3 glass-effect rounded-xl font-bold text-gray-700 hover:bg-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center gap-2 self-start"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Data
            </button>
          </div>
        </div>

        {/* Charts Section - Only show on dashboard tab */}
        {activeTab === "dashboard" && (
        <div className="mb-10">
          {/* Main Chart - Full width */}
          <div className={`${mounted ? 'animate-scaleIn delay-200' : 'initial-hidden'}`}>
            <div className="professional-card minimal-rounded p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">
                    Event Performance Analytics
                  </h2>
                  <p className="text-sm text-gray-600">Registration trends across your events</p>
                </div>
                <div className="flex gap-2 bg-gray-50 p-1.5 border border-gray-200 minimal-rounded">
                  <button
                    onClick={() => setActiveChart("bar")}
                    className={`px-4 py-2 minimal-rounded font-semibold transition-all duration-300 ${
                      activeChart === "bar"
                        ? "bg-white text-green-600 border border-green-200 shadow-sm"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    Bar
                  </button>
                  <button
                    onClick={() => setActiveChart("line")}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
                      activeChart === "line"
                        ? "bg-white text-green-600 shadow-md"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Line
                  </button>
                  <button
                    onClick={() => setActiveChart("area")}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
                      activeChart === "area"
                        ? "bg-white text-green-600 shadow-md"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Area
                  </button>
                </div>
              </div>

              <div className="w-full h-96">
                {eventChartData.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <p className="text-gray-600 font-semibold mb-2">No Data Available</p>
                      <p className="text-sm text-gray-500">Create your first event to see analytics</p>
                    </div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    {activeChart === "bar" ? (
                      <BarChart data={eventChartData}>
                        <defs>
                          <linearGradient id="colorReg" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#16a34a" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#16a34a" stopOpacity={0.6}/>
                          </linearGradient>
                          <linearGradient id="colorView" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0.6}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="name" stroke="#6b7280" style={{ fontSize: '12px' }} />
                        <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                            border: 'none', 
                            borderRadius: '12px', 
                            boxShadow: '0 10px 25px rgba(0,0,0,0.1)' 
                          }}
                          labelStyle={{ fontWeight: 'bold', marginBottom: '8px' }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        <Bar dataKey="registrations" fill="url(#colorReg)" name="Registrations" radius={[8, 8, 0, 0]} />
                        <Bar dataKey="viewedOnly" fill="url(#colorView)" name="Views (No Registration)" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    ) : activeChart === "line" ? (
                      <LineChart data={eventChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="name" stroke="#6b7280" style={{ fontSize: '12px' }} />
                        <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                            border: 'none', 
                            borderRadius: '12px', 
                            boxShadow: '0 10px 25px rgba(0,0,0,0.1)' 
                          }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        <Line type="monotone" dataKey="registrations" stroke="#16a34a" strokeWidth={3} name="Registrations" dot={{ fill: '#16a34a', r: 6 }} />
                        <Line type="monotone" dataKey="views" stroke="#22c55e" strokeWidth={3} name="Total Views" dot={{ fill: '#22c55e', r: 6 }} />
                      </LineChart>
                    ) : (
                      <AreaChart data={eventChartData}>
                        <defs>
                          <linearGradient id="colorRegArea" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#16a34a" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#16a34a" stopOpacity={0.1}/>
                          </linearGradient>
                          <linearGradient id="colorViewArea" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="name" stroke="#6b7280" style={{ fontSize: '12px' }} />
                        <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                            border: 'none', 
                            borderRadius: '12px', 
                            boxShadow: '0 10px 25px rgba(0,0,0,0.1)' 
                          }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        <Area type="monotone" dataKey="registrations" stroke="#16a34a" fillOpacity={1} fill="url(#colorRegArea)" name="Registrations" />
                        <Area type="monotone" dataKey="views" stroke="#22c55e" fillOpacity={1} fill="url(#colorViewArea)" name="Total Views" />
                      </AreaChart>
                    )}
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        </div>
        )}

        {/* AI Insights Section - Innovative Layout */}
        {activeTab === "dashboard" && (
        <div className={`mb-10 ${mounted ? 'animate-fadeIn delay-300' : 'initial-hidden'}`}>
          {/* AI Insights Hero Section */}
          <div className="relative overflow-hidden minimal-rounded bg-green-600 p-8 md:p-12 shadow-lg mb-8 border-l-4 border-green-700">
            <div className="relative z-10">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-16 h-16 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center border-2 border-white border-opacity-30">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">AI-Powered Insights</h2>
                      <p className="text-green-100 text-lg">Get intelligent analytics and actionable recommendations</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={generateAIInsights}
                  disabled={aiInsightsLoading}
                  className="px-8 py-4 bg-white text-green-600 font-bold rounded-xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 whitespace-nowrap"
                >
                  {aiInsightsLoading ? (
                    <>
                      <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Generating Insights...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span>Generate Insights</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* AI Insights Content */}
          {aiInsights ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Summary Card - Full width on mobile, 2 columns on desktop */}
              {aiInsights.summary && (
                <div className="lg:col-span-2 bg-white minimal-rounded p-6 innovative-border shadow-lg">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-green-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-3">Executive Summary</h3>
                      <p className="text-gray-700 leading-relaxed text-lg">{aiInsights.summary}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Key Insights Card */}
              {aiInsights.key_insights && aiInsights.key_insights.length > 0 && (
                <div className="bg-white minimal-rounded p-6 innovative-border shadow-lg">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Key Insights
                  </h3>
                  <ul className="space-y-3">
                    {aiInsights.key_insights.map((insight, index) => (
                      <li key={index} className="flex items-start gap-3 p-3 bg-green-50 minimal-rounded border-l-4 border-green-600 hover:shadow-md transition">
                        <span className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0 text-white text-sm font-bold shadow-md">
                          {index + 1}
                        </span>
                        <span className="text-gray-700 flex-1 pt-1">{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations Card - Full width */}
              {aiInsights.recommendations && aiInsights.recommendations.length > 0 && (
                <div className="lg:col-span-3 bg-white minimal-rounded p-6 innovative-border shadow-lg">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Actionable Recommendations
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {aiInsights.recommendations.map((rec, index) => (
                      <div key={index} className="flex items-start gap-3 p-4 bg-white minimal-rounded border-l-4 border-green-600 shadow-sm hover:shadow-md transition">
                        <span className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0 text-white text-sm font-bold shadow-md">
                          ✓
                        </span>
                        <span className="text-gray-700 flex-1 pt-1 font-medium">{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : !aiInsightsLoading && (
            <div className="text-center py-16 bg-white minimal-rounded border border-gray-200 shadow-sm">
              <div className="w-24 h-24 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <p className="text-gray-700 font-bold text-xl mb-2">Ready to Generate Insights</p>
              <p className="text-gray-600">Click the button above to get AI-powered analytics and recommendations</p>
            </div>
          )}
        </div>
        )}

        {/* My Events Tab - Show events list */}
        {activeTab === "events" && (
        <div className={`mb-10 ${mounted ? 'animate-fadeIn delay-200' : 'initial-hidden'}`}>
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">My Events</h2>
            <p className="text-gray-600">Manage and track all your events</p>
          </div>

          {eventsLoading ? (
            <div className="flex justify-center py-20">
              <div className="relative">
                <div className="animate-spin h-16 w-16 border-4 border-gray-200 border-t-green-600 rounded-full"></div>
                <div className="absolute inset-0 animate-ping h-16 w-16 border-4 border-green-400 rounded-full opacity-20"></div>
              </div>
            </div>
          ) : events.length === 0 ? (
            <div className="bg-white minimal-rounded p-12 text-center shadow-lg innovative-border">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">No Events Yet</h3>
              <p className="text-gray-600 mb-6">Create your first event to start managing your club activities</p>
              <button
                onClick={() => navigate("/leader/create")}
                className="px-8 py-4 bg-green-600 hover:bg-green-700 text-white minimal-rounded font-bold shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105"
              >
                Create First Event
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event, index) => (
                <div
                  key={event.id}
                  className={`professional-card minimal-rounded p-6 transition-all duration-300 ${mounted ? 'animate-scaleIn' : 'initial-hidden'}`}
                  style={{ animationDelay: `${0.1 + index * 0.05}s` }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-1 line-clamp-2">
                        {event.title}
                      </h3>
                      <p className="text-sm text-gray-600 font-medium">
                        {event.club_name || "Uncategorized"}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 ml-3">
                      <span className="px-3 py-1 text-xs bg-green-100 text-green-700 minimal-rounded font-bold border border-green-200">
                        {event.registration_count || 0} 👥
                      </span>
                      <span className="px-3 py-1 text-xs bg-gray-100 text-gray-700 minimal-rounded font-bold border border-gray-200">
                        {event.view_count || 0} 👁️
                      </span>
                    </div>
                  </div>

                  {event.description && (
                    <p className="text-gray-700 mb-4 line-clamp-2 text-sm">
                      {event.description}
                    </p>
                  )}

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-gray-700 bg-gray-50 p-2.5 minimal-rounded border border-gray-200">
                      <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm font-medium">{event.date}</span>
                      <span className="text-gray-400">•</span>
                      <span className="text-sm font-medium">{displayTime(event.time)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700 bg-gray-50 p-2.5 minimal-rounded border border-gray-200">
                      <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      <span className="text-sm font-medium truncate">{event.location}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <button
                      onClick={() => viewEventDetails(event.id)}
                      className="text-green-600 font-semibold hover:text-green-700 transition flex items-center gap-1 text-sm"
                    >
                      View Details
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/leader/events/${event.id}/edit`)}
                        disabled={!canEditEvent(event.date)}
                        className={`px-3 py-1.5 minimal-rounded font-semibold text-xs transition-all duration-300 border ${
                          canEditEvent(event.date)
                            ? "bg-green-100 text-green-700 hover:bg-green-200 border-green-200"
                            : "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200"
                        }`}
                        title={canEditEvent(event.date) ? "Edit event" : "Can't edit past events"}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(event)}
                        disabled={actionLoadingId === event.id || !canDeleteEvent(event.date)}
                        className={`px-3 py-1.5 minimal-rounded font-semibold text-xs transition-all duration-300 border ${
                          canDeleteEvent(event.date)
                            ? "bg-red-100 text-red-700 hover:bg-red-200 border-red-200"
                            : "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200"
                        }`}
                        title={canDeleteEvent(event.date) ? "Delete event" : "Can only delete 7+ days before"}
                      >
                        {actionLoadingId === event.id ? "..." : "Delete"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        )}

        {/* Event Details Modal */}
        {selectedEventDetails && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fadeIn backdrop-blur-sm">
            <div className="glass-effect minimal-rounded shadow-2xl max-w-4xl w-full p-8 max-h-[90vh] overflow-y-auto animate-scaleIn border border-gray-200">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    {selectedEventDetails.event.title}
                  </h2>
                  <div className="flex items-center gap-4 text-gray-600">
                    <span className="flex items-center gap-1">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {selectedEventDetails.event.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {displayTime(selectedEventDetails.event.time)}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      {selectedEventDetails.event.location}
                    </span>
                  </div>
                </div>
                <button
                  onClick={clearDetails}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Registrations ({selectedEventDetails.registrations.length})
                </h3>
                {detailsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin h-8 w-8 border-b-2 border-green-600 rounded-full"></div>
                  </div>
                ) : selectedEventDetails.registrations.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-xl">
                    <p className="text-gray-600">No registrations yet for this event</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedEventDetails.registrations.map((reg, index) => (
                      <div
                        key={reg.id}
                        className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-xl hover:shadow-md transition"
                      >
                        <div className="flex items-center gap-4">
                          {reg.participant_profile_image ? (
                            <img
                              src={`http://localhost:5000${reg.participant_profile_image}`}
                              alt={reg.participant_name || reg.email}
                              className="w-12 h-12 rounded-full object-cover border-2 border-green-300 shadow-md"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div 
                            className={`w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-lg ${reg.participant_profile_image ? 'hidden' : ''}`}
                          >
                            {(reg.participant_name || reg.email).charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">
                              {reg.participant_name || reg.email}
                            </p>
                            <p className="text-sm text-gray-600">{reg.email}</p>
                            {reg.participant_bio && (
                              <p className="text-xs text-gray-500 mt-1 line-clamp-1">{reg.participant_bio}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Registered</p>
                          <p className="text-sm font-semibold text-gray-700">
                            {new Date(reg.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
