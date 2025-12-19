import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../api";
import Loader from "../../components/Loader";
import "../../styles/ParticipantDashboard.css";
import "../../styles/DarkPattern.css";
import "../../styles/DesignSystem.css";

export default function ParticipantEventDetails({ onLogout }) {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [club, setClub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registration, setRegistration] = useState(null);
  const [registering, setRegistering] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [copied, setCopied] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const [clubEvents, setClubEvents] = useState([]);
  const [loadingClubEvents, setLoadingClubEvents] = useState(false);

  useEffect(() => {
    setMounted(true);
    loadEventDetails();
  }, [eventId]);

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  const loadEventDetails = async () => {
    try {
      setLoading(true);
      const [eventRes, registrationsRes] = await Promise.all([
        API.get(`/api/events/${eventId}`),
        API.get("/api/profile/registrations").catch(() => ({ data: [] }))
      ]);

      const eventData = eventRes.data;
      setEvent(eventData);

      // Load club details and events
      if (eventData.club_id) {
        try {
          const clubRes = await API.get(`/api/clubs/${eventData.club_id}`);
          setClub(clubRes.data);
          
          // Load other events from this club
          loadClubEvents(eventData.club_id, parseInt(eventId));
        } catch (err) {
          console.error("Error loading club:", err);
        }
      }

      // Check if user is registered
      const userRegistrations = registrationsRes.data || [];
      const userRegistration = userRegistrations.find(
        (reg) => reg.event_id === parseInt(eventId)
      );
      
      if (userRegistration) {
        setIsRegistered(true);
        setRegistration(userRegistration);
      }
    } catch (err) {
      console.error("Error loading event:", err);
      alert("Unable to load event details.");
      navigate("/participant");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    try {
      setRegistering(true);
      const res = await API.post(`/api/events/${eventId}/register`, {});
      
      setIsRegistered(true);
      setRegistration({
        id: res.data.registration?.id,
        qrCodeUrl: res.data.qr_code_url,
      });
      
      setTimeout(() => {
        alert("Registration successful! 🎉");
      }, 300);
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || "Registration failed";
      if (msg.includes("already registered")) {
        alert("You are already registered for this event.");
        loadEventDetails();
      } else if (msg.includes("login") || msg.includes("authenticated")) {
        alert("Please log in to register for events.");
        navigate("/login");
      } else {
        alert(`Registration failed: ${msg}`);
      }
    } finally {
      setRegistering(false);
    }
  };

  const handleCopyRegistrationId = () => {
    if (registration?.id) {
      navigator.clipboard.writeText(registration.id.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const loadClubEvents = async (clubId, currentEventId) => {
    try {
      setLoadingClubEvents(true);
      const res = await API.get("/api/events");
      const allEvents = Array.isArray(res.data) ? res.data : [];
      
      // Filter events from the same club, excluding the current event
      const otherEvents = allEvents.filter(
        (e) => e.club_id === clubId && e.id !== currentEventId
      );
      
      setClubEvents(otherEvents);
    } catch (err) {
      console.error("Error loading club events:", err);
    } finally {
      setLoadingClubEvents(false);
    }
  };

  const menuItems = [
    {
      id: "home",
      label: "Home",
      section: "main",
      icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
      ),
    },
    {
      id: "clubs",
      label: "Explore Clubs",
      section: "main",
      icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
      ),
    },
    {
      id: "dashboard",
      label: "Dashboard",
      section: "main",
      icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
      ),
    },
    {
      id: "calendar",
      label: "Calendar",
      section: "features",
      icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
      ),
    },
    {
      id: "profile",
      label: "Profile",
      section: "general",
      icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
      ),
    },
  ];

  const menuSections = {
    main: menuItems.filter(item => item.section === "main"),
    features: menuItems.filter(item => item.section === "features"),
    general: menuItems.filter(item => item.section === "general"),
  };

  const handleMenuClick = (itemId) => {
    if (itemId === "home" || itemId === "dashboard" || itemId === "clubs") {
      navigate("/participant");
    } else if (itemId === "calendar") {
      navigate("/participant");
    } else if (itemId === "profile") {
      navigate("/participant/profile");
    }
    setSidebarOpen(false);
  };

  if (loading) {
    return (
      <div className="container flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader text="Loading" className="mx-auto mb-6" />
          <p className="text-2xl font-bold text-white mb-2">Loading Event Details</p>
          <p className="text-gray-300">Fetching event information...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-xl text-gray-600 mb-4">Event not found</p>
          <button
            onClick={() => navigate("/participant")}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container participant-dashboard">
      <style>{`
        .minimal-rounded { border-radius: 12px; }
        .glass-sidebar {
          background: #ffffff;
          border-right: 1px solid #e5e7eb;
          border-radius: 0;
        }
        .sidebar-header-gradient {
          background: #ffffff;
          border-bottom: 1px solid #e5e7eb;
        }
      `}</style>

      <div className="relative min-h-screen w-full">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="ds-button ds-button-secondary ds-button-md md:hidden fixed top-4 left-4 z-50"
        >
          <svg className="ds-icon ds-icon-md ds-icon-primary" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            {sidebarOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>

        {/* Backdrop Overlay - Progressive Blur */}
        {(sidebarOpen || sidebarHovered) && (
          <div 
            className="fixed inset-0 progressive-blur-modal z-30"
            onClick={() => {
              setSidebarOpen(false);
              setSidebarHovered(false);
            }}
            style={{ pointerEvents: 'auto' }}
          />
        )}

        {/* Hover Trigger Zone - Desktop Only */}
        <div 
          className="hidden md:block fixed left-0 top-0 h-screen w-8"
          style={{ 
            zIndex: 35,
            pointerEvents: sidebarHovered ? 'none' : 'auto'
          }}
          onMouseEnter={() => {
            setSidebarHovered(true);
          }}
          onMouseLeave={() => {
            setSidebarHovered(false);
          }}
        />

        {/* Sidebar */}
        <div 
          className={`glass-sidebar flex flex-col fixed top-0 left-0 h-screen z-40
            ${sidebarOpen || sidebarHovered ? 'w-72' : 'w-20'} 
            ${sidebarOpen || sidebarHovered ? 'translate-x-0' : '-translate-x-full'}
            `}
          onMouseEnter={() => {
            if (window.innerWidth >= 768) {
              setSidebarHovered(true);
            }
          }}
          onMouseLeave={() => {
            if (window.innerWidth >= 768) {
              setSidebarHovered(false);
            }
          }}
        >
          {/* Sidebar Header */}
          <div className="p-6 sidebar-header-gradient">
            <div className="flex items-center justify-between">
              {(sidebarOpen || sidebarHovered) && (
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center relative group">
                    <svg className="ds-icon ds-icon-lg ds-icon-inverse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="ds-heading-4">Club-Hub</h2>
                    <p className="ds-caption">Event Details</p>
                  </div>
                </div>
              )}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="ds-button ds-button-secondary ds-button-sm sidebar-toggle-btn ml-auto hidden md:block"
              >
                <svg className="ds-icon ds-icon-sm ds-icon-secondary" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="sidebar-content flex-1 p-4 overflow-y-auto">
            <ul className="space-y-2">
              {/* MAIN MENU Section */}
              {(sidebarOpen || sidebarHovered) && (
                <li className="mb-4 mt-2">
                  <h3 className="ds-caption px-4">MAIN MENU</h3>
                </li>
              )}
              {menuSections.main.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => handleMenuClick(item.id)}
                    className={`
                      w-full group relative
                      ${(sidebarOpen || sidebarHovered) ? 'px-4 py-3' : 'px-3 py-3'}
                      bg-transparent hover:bg-gray-50 border-l-4 border-transparent hover:border-gray-900 rounded-r-lg
                    `}
                    title={!sidebarOpen && !sidebarHovered ? item.label : ''}
                  >
                    <div className="relative flex items-center gap-3">
                      <div className="ds-icon ds-icon-sm ds-icon-secondary group-hover:ds-icon-primary flex-shrink-0">
                        {item.icon}
                      </div>
                      {(sidebarOpen || sidebarHovered) && (
                        <span className="ds-body-small group-hover:ds-body">
                          {item.label}
                        </span>
                      )}
                    </div>
                    {!sidebarOpen && !sidebarHovered && (
                      <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-50 border border-gray-700">
                        {item.label}
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                      </div>
                    )}
                  </button>
                </li>
              ))}

              {/* FEATURES Section */}
              {(sidebarOpen || sidebarHovered) && (
                <li className="mt-8 mb-4">
                  <h3 className="ds-caption px-4">FEATURES</h3>
                </li>
              )}
              {menuSections.features.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => handleMenuClick(item.id)}
                    className={`
                      w-full group relative
                      ${(sidebarOpen || sidebarHovered) ? 'px-4 py-3' : 'px-3 py-3'}
                      bg-transparent hover:bg-gray-50 border-l-4 border-transparent hover:border-gray-900 rounded-r-lg
                    `}
                    title={!sidebarOpen && !sidebarHovered ? item.label : ''}
                  >
                    <div className="relative flex items-center gap-3">
                      <div className="ds-icon ds-icon-sm ds-icon-secondary group-hover:ds-icon-primary flex-shrink-0">
                        {item.icon}
                      </div>
                      {(sidebarOpen || sidebarHovered) && (
                        <span className="ds-body-small group-hover:ds-body">
                          {item.label}
                        </span>
                      )}
                    </div>
                    {!sidebarOpen && !sidebarHovered && (
                      <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-50 border border-gray-700">
                        {item.label}
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                      </div>
                    )}
                  </button>
                </li>
              ))}

              {/* GENERAL Section */}
              {(sidebarOpen || sidebarHovered) && (
                <li className="mt-8 mb-4">
                  <h3 className="ds-caption px-4">GENERAL</h3>
                </li>
              )}
              {menuSections.general.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => handleMenuClick(item.id)}
                    className={`
                      w-full group relative
                      ${(sidebarOpen || sidebarHovered) ? 'px-4 py-3' : 'px-3 py-3'}
                      bg-transparent hover:bg-gray-50 border-l-4 border-transparent hover:border-gray-900 rounded-r-lg
                    `}
                    title={!sidebarOpen && !sidebarHovered ? item.label : ''}
                  >
                    <div className="relative flex items-center gap-3">
                      <div className="ds-icon ds-icon-sm ds-icon-secondary group-hover:ds-icon-primary flex-shrink-0">
                        {item.icon}
                      </div>
                      {(sidebarOpen || sidebarHovered) && (
                        <span className="ds-body-small group-hover:ds-body">
                          {item.label}
                        </span>
                      )}
                    </div>
                    {!sidebarOpen && !sidebarHovered && (
                      <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-50 border border-gray-700">
                        {item.label}
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                      </div>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-gray-200">
            {(sidebarOpen || sidebarHovered) && (
              <button
                onClick={() => {
                  if (onLogout) {
                    onLogout();
                  } else {
                    localStorage.clear();
                    navigate("/login");
                  }
                }}
                className="ds-button ds-button-secondary ds-button-md w-full"
              >
                <svg className="ds-icon ds-icon-sm ds-icon-secondary" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="ds-body">Logout</span>
              </button>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className={`ds-container py-16 ${sidebarOpen || sidebarHovered ? 'md:ml-72' : 'md:ml-20'}`}>
          {/* Back Button */}
          <div className="ds-spacing-section">
            <button
              onClick={() => navigate("/participant")}
              className="ds-button ds-button-ghost ds-button-sm group"
            >
              <svg 
                className="ds-icon ds-icon-sm ds-icon-secondary group-hover:ds-icon-primary" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span className="ds-body-small">Back to Dashboard</span>
            </button>
          </div>

          {/* Main Event Card - Enhanced 2025 UI */}
          <div className="ds-card card-3d progressive-blur-card light-ray glow-primary ds-spacing-section story-reveal">
            {/* Event Title - Big Bold Typography */}
            <div className="ds-card-header">
              <h1 className="typography-hero mb-8 emoji-inline">
                {event.title} <span className="emoji-xl">🎉</span>
              </h1>
              <div className="ds-divider-thick w-24"></div>
            </div>

            {/* Club Info - 3D Tile */}
            {club && (
              <div 
                className="ds-card-body tile-3d interactive-card flex items-center gap-6 p-8 bg-gray-50 rounded-lg border-2 border-gray-200 mb-12 story-reveal story-reveal-delay-1"
                onMouseEnter={() => setHoveredCard('club')}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div className="w-16 h-16 bg-gray-900 rounded-lg flex items-center justify-center flex-shrink-0 interactive-icon glow-secondary">
                  <svg className="ds-icon ds-icon-xl ds-icon-inverse" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <p className="ds-caption mb-3">Organized by</p>
                  <p className="typography-display">{club.name}</p>
                </div>
              </div>
            )}

            {/* Description - Enhanced Typography */}
            {event.description && (
              <div className="ds-card-body mb-16 p-10 progressive-blur-card bg-gray-50 rounded-lg border-l-4 border-gray-900 story-reveal story-reveal-delay-2">
                <h2 className="typography-display mb-8 emoji-inline">
                  About this Event <span className="emoji-large">📝</span>
                </h2>
                <p className="ds-body-large leading-relaxed">{event.description}</p>
              </div>
            )}

            {/* Event Details Cards - Bento Grid with 3D */}
            <div className="bento-grid ds-spacing-section">
              {/* Date Card - 3D Interactive */}
              <div 
                className={`bento-item card-3d-interactive tile-3d flex items-center gap-6 p-8 border-l-4 border-gray-900 story-reveal story-reveal-delay-1 ${hoveredCard === 'date' ? 'border-gray-400' : ''}`}
                onMouseEnter={() => setHoveredCard('date')}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div className="w-16 h-16 bg-gray-900 rounded-lg flex items-center justify-center flex-shrink-0 interactive-icon glow-secondary">
                  <svg className="ds-icon ds-icon-lg ds-icon-inverse" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="ds-caption mb-3">Date</p>
                  <p className="ds-heading-3">{event.date}</p>
                </div>
              </div>

              {/* Time Card */}
              <div 
                className={`ds-card flex items-center gap-6 p-8 border-l-4 border-gray-900 ${hoveredCard === 'time' ? 'border-gray-400' : ''}`}
                onMouseEnter={() => setHoveredCard('time')}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div className="w-14 h-14 bg-gray-900 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="ds-icon ds-icon-lg ds-icon-inverse" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="ds-caption mb-3">Time</p>
                  <p className="ds-heading-3">{event.time?.slice(0, 5) || event.time}</p>
                </div>
              </div>

              {/* Location Card - 3D Interactive */}
              <div 
                className={`bento-item card-3d-interactive tile-3d flex items-center gap-6 p-8 border-l-4 border-gray-900 story-reveal story-reveal-delay-3 ${hoveredCard === 'location' ? 'border-gray-400' : ''}`}
                onMouseEnter={() => setHoveredCard('location')}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div className="w-16 h-16 bg-gray-900 rounded-lg flex items-center justify-center flex-shrink-0 interactive-icon glow-secondary">
                  <svg className="ds-icon ds-icon-lg ds-icon-inverse" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className="ds-caption mb-3">Location</p>
                  <p className="ds-heading-3">{event.location}</p>
                </div>
              </div>
            </div>

            {/* Poster Image - Enhanced with 3D Effect */}
            {event.poster_image && (
              <div className="mb-16 overflow-hidden rounded-lg border-2 border-gray-200 progressive-blur-card story-reveal story-reveal-delay-3" style={{ padding: '2rem', background: '#f9fafb' }}>
                <div className="illustration-container">
                  <img
                    src={event.poster_image}
                    alt={event.title}
                    className="w-full object-cover max-h-[500px] rounded-lg illustration-3d"
                    style={{ boxShadow: '0 6px 30px rgba(0, 0, 0, 0.08)' }}
                  />
                </div>
              </div>
            )}

            {/* Registration Section */}
            <div className="ds-card-footer">
              {isRegistered ? (
                <div className="space-y-12">
                  <div className="ds-card progressive-blur-card bg-gray-50 glow-success">
                    <div className="flex items-center gap-6 mb-10">
                      <div className="w-16 h-16 bg-gray-900 rounded-lg flex items-center justify-center flex-shrink-0 interactive-icon glow-success">
                        <svg className="ds-icon ds-icon-xl ds-icon-inverse" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <p className="typography-display emoji-inline">You're Registered! <span className="emoji-xl">🎉</span></p>
                    </div>
                    {registration?.qrCodeUrl && (
                      <div className="mt-12">
                        <p className="ds-heading-3 mb-10">Your Entry QR Code</p>
                        <div className="ds-card bg-white p-12 inline-block qr-code-container" style={{ marginBottom: '2rem' }}>
                          <img
                            src={registration.qrCodeUrl}
                            alt="QR Code"
                            className="w-64 h-64 mx-auto object-contain"
                          />
                        </div>
                        {registration.id && (
                          <div 
                            className={`ds-card mt-12 p-8 border-l-4 border-gray-900 cursor-pointer ${copied ? 'bg-gray-50 border-gray-400' : 'hover:bg-gray-50'}`}
                            onClick={handleCopyRegistrationId}
                          >
                            <p className="ds-label mb-4">Registration ID:</p>
                            <div className="flex items-center gap-3 mb-4">
                              <p className="ds-heading-3 font-mono">
                                #{registration.id}
                              </p>
                              {copied && (
                                <span className="ds-body-large">✓ Copied!</span>
                              )}
                            </div>
                            <p className="ds-caption">Click to copy</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleRegister}
                  disabled={registering}
                  className="ds-button ds-button-primary ds-button-lg button-glow w-full"
                >
                  {registering ? (
                    <>
                      <svg className="ds-icon ds-icon-sm ds-icon-inverse animate-spin" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="ds-body">Registering...</span>
                    </>
                  ) : (
                    <>
                      <span className="ds-body emoji-inline">Register for Event <span className="emoji-large">🎫</span></span>
                      <svg className="ds-icon ds-icon-sm ds-icon-inverse interactive-icon" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Other Events from This Club - Bento Grid */}
          {clubEvents.length > 0 && (
            <div className="ds-card progressive-blur-card ds-spacing-section story-reveal">
              <div className="ds-card-header">
                <h2 className="typography-hero mb-8 emoji-inline">
                  More Events from {club?.name} <span className="emoji-xl">🎯</span>
                </h2>
                <div className="ds-divider-thick w-32"></div>
              </div>
              
              {loadingClubEvents ? (
                <div className="flex justify-center py-8">
                  <Loader />
                </div>
              ) : (
                <div className="bento-grid">
                  {clubEvents.map((clubEvent, index) => (
                    <div
                      key={clubEvent.id}
                      onClick={() => navigate(`/participant/events/${clubEvent.id}`)}
                      className={`bento-item card-3d-interactive interactive-card story-reveal story-reveal-delay-${Math.min(index % 4, 4)} overflow-hidden cursor-pointer`}
                    >
                      {/* Event Image - WITH SUFFICIENT EMPTY SPACE */}
                      {clubEvent.poster_image ? (
                        <div className="relative h-56 overflow-hidden" style={{ padding: '1.5rem', background: '#f9fafb' }}>
                          <img
                            src={clubEvent.poster_image}
                            alt={clubEvent.title}
                            className="w-full h-full object-cover rounded-lg"
                            style={{ boxShadow: '0 6px 30px rgba(0, 0, 0, 0.08)' }}
                          />
                        </div>
                      ) : (
                        <div className="h-56 bg-gray-100 flex items-center justify-center border-b border-gray-200" style={{ padding: '1.5rem' }}>
                          <svg className="ds-icon ds-icon-xl ds-icon-tertiary" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                      
                      {/* Event Details */}
                      <div className="ds-card-body p-8">
                        <h3 className="ds-heading-3 mb-6 line-clamp-2">
                          {clubEvent.title}
                        </h3>
                        
                        {/* Date & Time */}
                        <div className="flex items-center gap-3 mb-4">
                          <svg className="ds-icon ds-icon-sm ds-icon-secondary" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="ds-body">
                            {clubEvent.date} {clubEvent.time && `• ${clubEvent.time.slice(0, 5)}`}
                          </span>
                        </div>
                        
                        {/* Location */}
                        {clubEvent.location && (
                          <div className="flex items-center gap-3 mb-6">
                            <svg className="ds-icon ds-icon-sm ds-icon-secondary" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="ds-body">{clubEvent.location}</span>
                          </div>
                        )}
                        
                        {/* Description Preview */}
                        {clubEvent.description && (
                          <p className="ds-body mb-8 line-clamp-2 leading-relaxed">
                            {clubEvent.description.length > 100 
                              ? `${clubEvent.description.substring(0, 100)}...` 
                              : clubEvent.description}
                          </p>
                        )}
                        
                        {/* View Details Button */}
                        <button className="ds-button ds-button-primary ds-button-md w-full">
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
