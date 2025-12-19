import React, { useEffect, useMemo, useState, useRef } from "react";
import API from "../../api";
import { useNavigate } from "react-router-dom";
import skyBackground from "../../images/image.png";
import Loader from "../../components/Loader";
import LogoutButton from "../../components/LogoutButton";
import EventCard from "../../components/EventCard";
import TopPickEventCard from "../../components/TopPickEventCard";
import FloatingContextDock from "../../components/FloatingContextDock";
import GeminiChatbot from "../../components/GeminiChatbot";
import SwipeableEventCard from "../../components/SwipeableEventCard";
import { useScrollReveal } from "../../hooks/useScrollReveal";
import "../../styles/TopPickEventCard.css";
import "../../styles/ParticipantDashboard.css";
import "../../styles/DarkPattern.css";
import "../../styles/DesignSystem.css";
import "../../styles/SwipeableCard.css";

export default function ParticipantDashboard({ onLogout }) {
  const [clubs, setClubs] = useState([]);
  const [selectedClub, setSelectedClub] = useState(null);
  const [events, setEvents] = useState([]);
  const [allEvents, setAllEvents] = useState([]); // All events for home page
  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [allEventsLoading, setAllEventsLoading] = useState(false);
  const [registeredEvents, setRegisteredEvents] = useState({});
  const [registeringEventId, setRegisteringEventId] = useState(null);
  const [myRegistrationsLoading, setMyRegistrationsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("home"); // "home", "clubs", or "dashboard"
  const [showRsvpSuccess, setShowRsvpSuccess] = useState(null); // {event, registration}
  const [selectedEventDetails, setSelectedEventDetails] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState(null);
  const [aiRecommendationsLoading, setAiRecommendationsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [viewMode, setViewMode] = useState("grid"); // "grid" or "list"
  // Home page filters
  const [homeSearchQuery, setHomeSearchQuery] = useState("");
  const [homeSelectedCategory, setHomeSelectedCategory] = useState("all");
  const [homeViewMode, setHomeViewMode] = useState("grid");
  const [homeActiveFilter, setHomeActiveFilter] = useState("for-you"); // Default to "For you"
  
  // Swipeable card states
  const [swipeableEvents, setSwipeableEvents] = useState([]);
  const [likedEvents, setLikedEvents] = useState([]);
  const [passedEvents, setPassedEvents] = useState([]);
  
  // New feature states
  const [participantStats, setParticipantStats] = useState(null);
  const [badges, setBadges] = useState([]);
  const [friends, setFriends] = useState([]);
  const [collections, setCollections] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [calendarView, setCalendarView] = useState("month"); // "month", "week", "day"
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingCalendar, setLoadingCalendar] = useState(false);
  const [universityCalendarSynced, setUniversityCalendarSynced] = useState(false);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(null);
  
  // Profile states
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileUploading, setProfileUploading] = useState(false);
  const [profileRegistrations, setProfileRegistrations] = useState([]);
  const [showRegistrations, setShowRegistrations] = useState(false);
  const [profileEditMode, setProfileEditMode] = useState(false);
  const [profileFormData, setProfileFormData] = useState({
    name: "",
    bio: ""
  });
  const [previewImage, setPreviewImage] = useState(null);

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

  // Auto-refresh data every 30 seconds to keep it synchronized
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      // Refresh clubs
      async function refreshClubs() {
        try {
          const res = await API.get("/api/clubs");
          setClubs(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
          console.error("Error refreshing clubs:", error);
        }
      }
      refreshClubs();
      
      // Refresh events based on active tab
      if (selectedClub) {
        fetchClubEvents(selectedClub.id);
      }
      if (activeTab === "home") {
        fetchAllEvents();
      }
      
      // Refresh registrations
      fetchMyRegistrations();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(refreshInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClub, activeTab]);

  // Fetch all events when home tab is active
  useEffect(() => {
    if (activeTab === "home") {
      fetchAllEvents();
      fetchMyRegistrations();
      fetchProfileData(); // Fetch profile for welcome message
    }
  }, [activeTab]);

  // Fetch participant stats when dashboard tab is active
  useEffect(() => {
    if (activeTab === "dashboard") {
      fetchParticipantStats();
      fetchBadges();
    }
  }, [activeTab]);

  // Fetch calendar events when calendar tab is active
  useEffect(() => {
    if (activeTab === "calendar") {
      fetchCalendarEvents();
    }
  }, [activeTab, selectedDate]);

  // Fetch friends when friends tab is active
  useEffect(() => {
    if (activeTab === "friends") {
      fetchFriends();
    }
  }, [activeTab]);

  // Fetch collections when collections tab is active
  useEffect(() => {
    if (activeTab === "collections") {
      fetchCollections();
    }
    if (activeTab === "profile") {
      fetchProfileData();
      fetchProfileRegistrations();
    }
  }, [activeTab]);

  // Profile functions
  const fetchProfileData = async () => {
    try {
      setProfileLoading(true);
      const res = await API.get("/api/profile/");
      setProfile(res.data);
      setProfileFormData({
        name: res.data.name || "",
        bio: res.data.bio || ""
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      alert("Failed to load profile");
    } finally {
      setProfileLoading(false);
    }
  };

  const fetchProfileRegistrations = async () => {
    try {
      const res = await API.get("/api/profile/registrations");
      setProfileRegistrations(res.data);
    } catch (error) {
      console.error("Error fetching registrations:", error);
    }
  };

  const handleProfileImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      alert("Please select a valid image file (PNG, JPG, GIF, or WEBP)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image size must be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result);
    };
    reader.readAsDataURL(file);

    try {
      setProfileUploading(true);
      const formData = new FormData();
      formData.append("file", file);

      const res = await API.post("/api/profile/upload-image", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      setProfile(res.data.user);
      setPreviewImage(null);
      alert("Profile image updated successfully!");
    } catch (error) {
      console.error("Error uploading image:", error);
      alert(error.response?.data?.error || "Failed to upload image");
      setPreviewImage(null);
    } finally {
      setProfileUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setProfileSaving(true);
      const res = await API.put("/api/profile/", profileFormData);
      setProfile(res.data.user);
      setProfileEditMode(false);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert(error.response?.data?.error || "Failed to update profile");
    } finally {
      setProfileSaving(false);
    }
  };

  const getProfileImageUrl = () => {
    if (previewImage) return previewImage;
    if (profile?.profile_image) {
      if (profile.profile_image.startsWith('http')) {
        return profile.profile_image;
      }
      return `http://localhost:5000${profile.profile_image}`;
    }
    return null;
  };

  const getInitials = () => {
    if (profile?.name) {
      return profile.name
        .split(" ")
        .map(n => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return "U";
  };

  // Fetch all events for home page
  const fetchAllEvents = async () => {
    try {
      setAllEventsLoading(true);
      const res = await API.get("/api/events");
      const eventsList = Array.isArray(res.data) ? res.data : [];
      setAllEvents(eventsList);
    } catch (error) {
      console.error("❌ Error loading all events:", error);
      alert("Failed to load events.");
    } finally {
      setAllEventsLoading(false);
    }
  };

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

  // Navigation handler for Floating Context Dock
  const handleNavigate = (tabId) => {
    if (tabId === "clubs") {
      handleBackToClubs();
    }
    setActiveTab(tabId);
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

      // Refresh registrations and events to ensure data consistency
      await fetchMyRegistrations();
      if (selectedClub) {
        await fetchClubEvents(selectedClub.id);
      }
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

  const handleViewEventFullPage = (event) => {
    // Navigate to event details page
    navigate(`/participant/events/${event.id}`);
  };

  // Swipeable card handlers
  const handleSwipeRight = async (event) => {
    // User likes the event - register for it
    setLikedEvents(prev => [...prev, event]);
    setSwipeableEvents(prev => prev.filter(e => e.id !== event.id));
    
    // Auto-register for the event
    await registerForEvent(event.id);
  };

  const handleSwipeLeft = (event) => {
    // User passes on the event
    setPassedEvents(prev => [...prev, event]);
    setSwipeableEvents(prev => prev.filter(e => e.id !== event.id));
  };

  // Initialize swipeable events from allEvents
  useEffect(() => {
    if (homeViewMode === "swipe" && allEvents.length > 0) {
      const unregisteredEvents = allEvents.filter(
        event => !isRegistered(event.id) && !passedEvents.some(p => p.id === event.id)
      );
      setSwipeableEvents(unregisteredEvents);
    }
  }, [homeViewMode, allEvents, registeredEvents, passedEvents]);

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
      alert(`Error: ${errorMsg}

Please check:
1. You are logged in as a participant
2. Backend server is running
3. Gemini API key is configured`);
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
      // Refresh stats if on dashboard tab
      if (activeTab === "dashboard") {
        fetchParticipantStats();
        fetchBadges();
      }
    } catch (err) {
      console.error("Registration error:", err);
      const errorMsg = err.response?.data?.error || "Failed to register. Please try again.";
      alert(errorMsg);
    } finally {
      setRegisteringEventId(null);
    }
  };

  // New feature fetch functions
  const fetchParticipantStats = async () => {
    try {
      setLoadingStats(true);
      const res = await API.get("/api/participant/stats");
      setParticipantStats(res.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchBadges = async () => {
    try {
      const res = await API.get("/api/participant/badges");
      setBadges(res.data);
    } catch (error) {
      console.error("Error fetching badges:", error);
    }
  };

  const fetchCalendarEvents = async () => {
    try {
      setLoadingCalendar(true);
      const startDate = new Date(selectedDate);
      startDate.setDate(1); // First day of month
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
      endDate.setDate(0); // Last day of month
      
      const res = await API.get("/api/participant/events/calendar", {
        params: {
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0]
        }
      });
      setCalendarEvents(res.data);
    } catch (error) {
      console.error("Error fetching calendar events:", error);
    } finally {
      setLoadingCalendar(false);
    }
  };

  const fetchFriends = async () => {
    try {
      const res = await API.get("/api/participant/friends");
      setFriends(res.data);
    } catch (error) {
      console.error("Error fetching friends:", error);
    }
  };

  const fetchCollections = async () => {
    try {
      const res = await API.get("/api/participant/collections");
      setCollections(res.data);
    } catch (error) {
      console.error("Error fetching collections:", error);
    }
  };

  const handleUniversityCalendarSync = async (calendarUrl) => {
    try {
      const res = await API.post("/api/participant/events/calendar/university-sync", {
        calendar_url: calendarUrl,
        type: "ical"
      });
      setUniversityCalendarSynced(true);
      alert(`Successfully synced! Found ${res.data.events_found} events from university calendar.`);
      // Refresh calendar events
      fetchCalendarEvents();
    } catch (error) {
      console.error("Error syncing calendar:", error);
      const errorMsg = error.response?.data?.error || "Failed to sync university calendar. Please check the URL and try again.";
      alert(errorMsg);
    }
  };

  // Check if university calendar is synced
  useEffect(() => {
    if (activeTab === "calendar" && calendarEvents.length > 0) {
      const hasUniEvents = calendarEvents.some(e => e.type === "university");
      setUniversityCalendarSynced(hasUniEvents);
    }
  }, [calendarEvents, activeTab]);

  // Calendar Grid Component
  const CalendarGrid = ({ events, selectedDate, view, onDateClick }) => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const day = selectedDate.getDate();
    
    // Group events by date
    const eventsByDate = {};
    events.forEach(event => {
      const eventDate = new Date(event.date).toISOString().split('T')[0];
      if (!eventsByDate[eventDate]) {
        eventsByDate[eventDate] = [];
      }
      eventsByDate[eventDate].push(event);
    });
    
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayNamesFull = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    let weeks = [];
    
    if (view === "month") {
      // Get first day of month and number of days
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const daysInMonth = lastDay.getDate();
      const startingDayOfWeek = firstDay.getDay();
      
      // Generate calendar days
      const calendarDays = [];
      
      // Add empty cells for days before month starts
      for (let i = 0; i < startingDayOfWeek; i++) {
        calendarDays.push(null);
      }
      
      // Add days of the month
      for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(year, month, d);
        const dateKey = date.toISOString().split('T')[0];
        calendarDays.push({
          day: d,
          date,
          dateKey,
          events: eventsByDate[dateKey] || [],
          isToday: dateKey === new Date().toISOString().split('T')[0]
        });
      }
      
      // Create weeks
      for (let i = 0; i < calendarDays.length; i += 7) {
        weeks.push(calendarDays.slice(i, i + 7));
      }
    } else if (view === "week") {
      // Get the start of the week (Sunday)
      const currentDate = new Date(year, month, day);
      const dayOfWeek = currentDate.getDay();
      const weekStart = new Date(currentDate);
      weekStart.setDate(currentDate.getDate() - dayOfWeek);
      
      // Generate 7 days for the week
      const weekDays = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + i);
        const dateKey = date.toISOString().split('T')[0];
        weekDays.push({
          day: date.getDate(),
          date,
          dateKey,
          events: eventsByDate[dateKey] || [],
          isToday: dateKey === new Date().toISOString().split('T')[0],
          dayName: dayNamesFull[i]
        });
      }
      weeks = [weekDays];
    }
    
    return (
      <div className="calendar-container">
        {/* Day names header */}
        <div className={`grid gap-1 mb-2 ${view === "week" ? "grid-cols-7" : "grid-cols-7"}`}>
          {dayNames.map(day => (
            <div key={day} className="p-2 text-center font-bold text-gray-700 text-sm">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar grid */}
        <div className={`grid gap-1 ${view === "week" ? "grid-cols-7" : "grid-cols-7"}`}>
          {weeks.map((week, weekIndex) => (
            <React.Fragment key={weekIndex}>
              {week.map((dayData, dayIndex) => {
                if (!dayData) {
                  return <div key={`empty-${dayIndex}`} className={`${view === "week" ? "min-h-[120px]" : "aspect-square"} bg-gray-50 minimal-rounded border border-gray-100`}></div>;
                }
                
                const { day, dateKey, events: dayEvents, isToday, dayName } = dayData;
                const registeredEvents = dayEvents.filter(e => e.is_registered);
                const conflictEvents = dayEvents.filter(e => e.has_conflict);
                const universityEvents = dayEvents.filter(e => e.type === "university");
                const clubhubEvents = dayEvents.filter(e => e.type !== "university");
                
                return (
                  <div
                    key={dateKey}
                    onClick={() => onDateClick && onDateClick(new Date(dateKey))}
                    className={`${view === "week" ? "min-h-[120px]" : "aspect-square"} minimal-rounded border-2 p-2 cursor-pointer transition-all duration-150 hover:shadow-lg hover:scale-[1.02] ${
                      isToday
                        ? 'bg-blue-100 border-blue-500 shadow-md'
                        : 'bg-white border-gray-200 hover:border-blue-300'
                    } ${dayEvents.length > 0 ? 'bg-gradient-to-br from-blue-50 to-white' : ''}`}
                  >
                    <div className="flex flex-col h-full">
                      <div className="flex items-center justify-between mb-1">
                        <div className={`text-sm font-bold ${isToday ? 'text-blue-700' : 'text-gray-900'}`}>
                          {day}
                        </div>
                        {view === "week" && dayName && (
                          <div className="text-xs text-gray-500">{dayName}</div>
                        )}
                      </div>
                      <div className="flex-1 overflow-y-auto space-y-1">
                        {registeredEvents.length > 0 && (
                          <div className={`text-xs px-1.5 py-1 minimal-rounded ${
                            conflictEvents.length > 0 ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
                          }`} title={registeredEvents[0].title}>
                            {registeredEvents[0].title}
                          </div>
                        )}
                        {universityEvents.length > 0 && registeredEvents.length === 0 && (
                          <div 
                            className="text-xs px-1.5 py-1 bg-purple-500 text-white minimal-rounded cursor-pointer transition-all duration-150 hover:opacity-80 hover:shadow-md" 
                            title={universityEvents[0].title}
                            onClick={(e) => {
                              e.stopPropagation();
                              // University events might not have IDs, show info
                              if (universityEvents[0].title) {
                                alert(`${universityEvents[0].title}\nDate: ${new Date(universityEvents[0].date).toLocaleDateString()}\nType: University Event`);
                              }
                            }}
                          >
                            {universityEvents[0].title}
                          </div>
                        )}
                        {clubhubEvents.length > registeredEvents.length && (
                          <div className="text-xs text-blue-600 px-1">
                            +{clubhubEvents.length - registeredEvents.length} Club-Hub
                          </div>
                        )}
                        {universityEvents.length > 1 && (
                          <div className="text-xs text-purple-600 px-1">
                            +{universityEvents.length - 1} Uni
                          </div>
                        )}
                        {dayEvents.length > 1 && registeredEvents.length === 0 && universityEvents.length === 0 && (
                          <div className="text-xs text-blue-600 px-1">
                            {dayEvents.length} events
                          </div>
                        )}
                        {view === "week" && dayEvents.length > 0 && (
                          <div className="space-y-1 mt-1">
                            {dayEvents.slice(0, 3).map((event, idx) => (
                              <div
                                key={idx}
                                className={`text-xs px-1.5 py-0.5 minimal-rounded truncate cursor-pointer transition-all duration-150 hover:opacity-80 hover:shadow-sm ${
                                  event.type === "university"
                                    ? "bg-purple-100 text-purple-700"
                                    : event.is_registered
                                    ? event.has_conflict
                                      ? "bg-red-100 text-red-700"
                                      : "bg-green-100 text-green-700"
                                    : "bg-gray-100 text-gray-700"
                                }`}
                                title={event.has_conflict 
                                  ? `${event.title} - This event overlaps with other events`
                                  : `${event.title}${event.time ? ` at ${event.time}` : ''}`
                                }
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (event.id) {
                                    navigate(`/participant/events/${event.id}`);
                                  } else if (event.title) {
                                    // Show event details for university events or events without IDs
                                    const eventInfo = [
                                      event.title,
                                      `Date: ${new Date(event.date).toLocaleDateString()}`,
                                      event.time ? `Time: ${event.time}` : '',
                                      event.type ? `Type: ${event.type === 'university' ? 'University Event' : 'Club Event'}` : '',
                                      event.has_conflict ? '⚠️ This event overlaps with other events' : ''
                                    ].filter(Boolean).join('\n');
                                    alert(eventInfo);
                                  }
                                }}
                              >
                                {event.time} - {event.title}
                              </div>
                            ))}
                            {dayEvents.length > 3 && (
                              <div className="text-xs text-gray-500 px-1">
                                +{dayEvents.length - 3} more
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
        
        {/* Legend */}
        <div className="mt-6 flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 minimal-rounded"></div>
            <span>Registered Event</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 minimal-rounded"></div>
            <span>Conflict</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-purple-500 minimal-rounded"></div>
            <span>University Event</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-100 border-2 border-blue-400 minimal-rounded"></div>
            <span>Today</span>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader text="Loading" className="mx-auto mb-8" />
          <p className="ds-heading-2 text-white mb-4">Loading Student Club-Hub</p>
          <p className="ds-body-large text-gray-300">Fetching your clubs...</p>
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
    // MAIN MENU
    {
      id: "home",
      label: "Home",
      section: "main",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      id: "clubs",
      label: "Explore Clubs",
      section: "main",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      id: "dashboard",
      label: "My Dashboard",
      section: "main",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
    },
    // FEATURES
    {
      id: "calendar",
      label: "Calendar",
      section: "features",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      id: "collections",
      label: "Collections",
      section: "features",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
      ),
    },
    // GENERAL
    {
      id: "profile",
      label: "Profile",
      section: "general",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      id: "settings",
      label: "Settings",
      section: "general",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      id: "help-desk",
      label: "Help Desk",
      section: "general",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  // Organize menu items by section
  const menuSections = {
    main: menuItems.filter(item => item.section === "main"),
    features: menuItems.filter(item => item.section === "features"),
    general: menuItems.filter(item => item.section === "general"),
  };

  return (
    <div className="container participant-dashboard">
      {/* Animated Background Grid */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
          animation: 'grid-move 20s linear infinite'
        }}></div>
      </div>
      
      {/* Floating Shapes */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute -bottom-32 left-1/2 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{ animationDelay: '4s' }}></div>
      </div>
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
        
        .animate-slideInRight {
          animation: slideInRight 0.5s ease-out forwards;
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
        
        @keyframes gradient-xy {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        
        .animate-gradient-xy {
          background-size: 200% 200%;
          animation: gradient-xy 3s ease infinite;
        }
        
        @keyframes pulse-soft {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }
        
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .animate-slide-in-left {
          animation: slide-in-left 0.6s ease-out forwards;
        }
        
        .animate-slide-in-right {
          animation: slide-in-right 0.6s ease-out forwards;
        }
        
        .animate-bounce-subtle {
          animation: bounce-subtle 3s ease-in-out infinite;
        }
        
        .animate-pulse-soft {
          animation: pulse-soft 2s ease-in-out infinite;
        }
        
        .animate-scale-in {
          animation: scale-in 0.5s ease-out forwards;
        }
        
        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(143, 179, 227, 0.4);
          }
          50% {
            box-shadow: 0 0 40px rgba(143, 179, 227, 0.8);
          }
        }
        
        @keyframes grid-move {
          0% {
            transform: translate(0, 0);
          }
          100% {
            transform: translate(50px, 50px);
          }
        }
        
        @keyframes slide-in-left {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slide-in-right {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes bounce-subtle {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
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
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }
        
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        .gradient-animated {
          background-size: 200% 200%;
          animation: gradient-shift 3s ease infinite;
        }
        
        .card-3d {
          transform-style: preserve-3d;
          transition: transform 0.3s ease;
        }
        
        .card-3d:hover {
          transform: perspective(1000px) rotateY(5deg) rotateX(5deg) scale(1.02);
        }
        
        .glass-morphism {
          background: rgba(255, 255, 255, 0.25);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
        }
        
        .neon-border {
          position: relative;
          border: 2px solid transparent;
          background: linear-gradient(white, white) padding-box,
                      linear-gradient(135deg, #8fb3e3, #6f90bd, #8fb3e3) border-box;
          background-size: 200% 200%;
          animation: gradient-shift 3s ease infinite;
        }
        
        .hover-lift {
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        
        .hover-lift:hover {
          transform: translateY(-12px) scale(1.03);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }
        
        .magnetic-effect {
          transition: transform 0.2s ease-out;
        }
        
        .magnetic-effect:hover {
          transform: scale(1.05);
        }
        
        .glow-on-hover {
          transition: all 0.3s ease;
        }
        
        .glow-on-hover:hover {
          box-shadow: 0 0 30px rgba(143, 179, 227, 0.6),
                      0 0 60px rgba(143, 179, 227, 0.4),
                      0 0 90px rgba(143, 179, 227, 0.2);
        }
        
        .text-gradient {
          color: #1e293b;
          font-weight: 700;
        }
        
        .text-primary {
          color: #3b82f6;
        }
        
        .text-secondary {
          color: #64748b;
        }
        
        .text-accent-blue {
          color: #3b82f6;
        }
        
        .text-accent-purple {
          color: #8b5cf6;
        }
        
        .text-accent-pink {
          color: #ec4899;
        }
        
        .text-accent-orange {
          color: #f97316;
        }
        
        .particle-bg {
          position: relative;
          overflow: hidden;
        }
        
        .particle-bg::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(143, 179, 227, 0.1) 1px, transparent 1px);
          background-size: 50px 50px;
          animation: rotate-3d 20s linear infinite;
        }
        
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        .charcoal-theme {
          color: #F8FAFC;
        }

        .charcoal-theme .bg-white {
          background-color: rgba(18, 22, 27, 0.92) !important;
          color: #F8FAFC !important;
        }

        .charcoal-theme .bg-gray-100 {
          background-color: rgba(31, 37, 45, 0.85) !important;
        }

        .charcoal-theme .text-gray-900,
        .charcoal-theme .text-blue-900 {
          color: #F8FAFC !important;
        }

        .charcoal-theme .text-gray-700,
        .charcoal-theme .text-gray-600,
        .charcoal-theme .text-gray-500,
        .charcoal-theme .text-gray-400,
        .charcoal-theme .text-blue-800 {
          color: #A7B0BB !important;
        }

        .charcoal-theme .border-gray-200,
        .charcoal-theme .border-gray-300,
        .charcoal-theme .border-green-200 {
          border-color: rgba(107, 120, 132, 0.35) !important;
        }

        .charcoal-theme .bg-gray-50 {
          background-color: rgba(13, 17, 22, 0.8) !important;
        }

        .charcoal-theme .text-green-600,
        .charcoal-theme .hover\\:text-blue-800:hover {
          color: #8dd3c7 !important;
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
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          transform-style: preserve-3d;
        }
        
        .card-hover:hover {
          transform: translateY(-12px) rotateX(2deg) rotateY(-2deg) scale(1.03);
          box-shadow: 0 25px 50px -12px rgba(143, 179, 227, 0.5),
                      0 0 40px rgba(143, 179, 227, 0.3),
                      inset 0 1px 0 rgba(255, 255, 255, 0.9);
        }
        
        .cyber-grid {
          background-image: 
            linear-gradient(rgba(167, 176, 187, 0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(167, 176, 187, 0.08) 1px, transparent 1px);
          background-size: 50px 50px;
        }
        
        .tech-border {
          border: 2px solid rgba(107, 120, 132, 0.4);
        }
        
        .neon-text {
          text-shadow: 0 0 10px currentColor, 0 0 20px currentColor;
        }
        
        .gradient-border {
          position: relative;
          background: rgba(255, 255, 255, 0.75);
        }
        
        .gradient-border::before {
          content: '';
          position: absolute;
          inset: 0;
          padding: 2px;
          background: linear-gradient(135deg, rgba(158, 199, 247, 0.6), rgba(94, 132, 186, 0.55));
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
        }
        
        .sidebar-transition {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .glass-sidebar {
          background: rgba(248, 250, 252, 0.98);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-right: 1px solid rgba(203, 213, 225, 0.8);
          box-shadow: 2px 0 20px rgba(0, 0, 0, 0.05);
          border-radius: 0 24px 24px 0;
        }
        
        .sidebar-header-gradient {
          background: rgba(248, 250, 252, 0.98);
          border-bottom: 2px solid rgba(71, 85, 105, 0.2);
          position: relative;
        }
        
        .sidebar-header-gradient::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 100px;
          height: 2px;
          background: rgba(71, 85, 105, 0.3);
          animation: slide-in-left 0.6s ease-out;
        }
        
        .sidebar-nav-item {
          border-radius: 12px;
          color: #475569;
          position: relative;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .sidebar-nav-item::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 4px;
          background: rgba(71, 85, 105, 0.4);
          opacity: 0;
          transform: scaleY(0);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .sidebar-nav-item:hover {
          background: rgba(241, 245, 249, 0.8);
          color: #1e293b;
          transform: translateX(4px);
        }
        
        .sidebar-nav-item:hover::before {
          opacity: 1;
          transform: scaleY(1);
        }
        
        /* Unified Cool Curved Button Style */
        .cool-button {
          background: rgba(71, 85, 105, 0.9);
          backdrop-filter: blur(40px) saturate(170%);
          -webkit-backdrop-filter: blur(40px) saturate(170%);
          border: 2px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 8px 20px rgba(71, 85, 105, 0.25),
                      inset 0 1px 0 rgba(255, 255, 255, 0.2);
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          position: relative;
          overflow: hidden;
          font-weight: 600;
          color: #fff;
        }
        
        .cool-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.18), transparent);
          transition: left 0.6s;
        }
        
        .cool-button:hover::before {
          left: 100%;
        }
        
        .cool-button:hover {
          background: rgba(51, 65, 85, 0.95);
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 12px 30px rgba(71, 85, 105, 0.35),
                      inset 0 1px 0 rgba(255, 255, 255, 0.3);
        }
        
        .cool-button:active {
          transform: translateY(-1px) scale(0.98);
        }
        
        .cool-button-secondary {
          background: #ffffff;
          border: 2px solid #e2e8f0;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
          font-weight: 600;
          color: #475569;
        }
        
        .cool-button-secondary:hover {
          background: #f8fafc;
          border-color: rgba(71, 85, 105, 0.4);
          color: rgba(51, 65, 85, 0.9);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(71, 85, 105, 0.15);
        }
        
        .cool-button-secondary::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(167, 176, 187, 0.25), transparent);
          transition: left 0.6s;
        }
        
        .cool-button-secondary:hover::before {
          left: 100%;
        }
        
        .cool-button-secondary:hover {
          background: rgba(241, 245, 249, 0.9);
          border-color: rgba(71, 85, 105, 0.4);
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 8px 24px rgba(71, 85, 105, 0.2),
                      inset 0 1px 0 rgba(255, 255, 255, 0.6);
        }
        
        .cool-button-secondary:active {
          transform: translateY(-1px) scale(0.98);
        }
        
        .glass-button {
          background: rgba(241, 245, 249, 0.8);
          backdrop-filter: blur(35px) saturate(140%);
          -webkit-backdrop-filter: blur(35px) saturate(140%);
          border: 1px solid rgba(203, 213, 225, 0.6);
          box-shadow: 0 4px 12px rgba(71, 85, 105, 0.1),
                      inset 0 1px 0 rgba(255, 255, 255, 0.6);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }
        
        .glass-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
          transition: left 0.5s;
        }
        
        .glass-button:hover::before {
          left: 100%;
        }
        
        .glass-button:hover {
          background: rgba(226, 232, 240, 0.9);
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(71, 85, 105, 0.15),
                      inset 0 1px 0 rgba(255, 255, 255, 0.7);
        }
        
        .glass-button-primary {
          background: rgba(71, 85, 105, 0.9);
          border: none;
          border-radius: 12px;
          box-shadow: 0 4px 14px rgba(71, 85, 105, 0.3);
          color: #fff;
          font-weight: 600;
          position: relative;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .glass-button-primary::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
          transition: left 0.5s;
        }
        
        .glass-button-primary:hover::before {
          left: 100%;
        }
        
        .glass-button-primary:hover {
          background: rgba(51, 65, 85, 0.95);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(71, 85, 105, 0.4);
        }
        
        .glass-button-primary:active {
          transform: translateY(0);
        }
        
        .professional-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
          position: relative;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border-radius: 16px;
        }
        
        .professional-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: #3b82f6;
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .professional-card:hover {
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05);
          border-color: #cbd5e1;
          transform: translateY(-4px);
        }
        
        .professional-card:hover::before {
          transform: scaleX(1);
        }
        
        .innovative-border {
          border: none;
          border-left: 4px solid rgba(107, 140, 199, 0.65);
          box-shadow: 0 8px 24px rgba(173, 216, 230, 0.4);
        }
        
        .minimal-rounded {
          border-radius: 12px;
        }
        
        .cool-rounded {
          border-radius: 20px;
        }
        
        /* Innovative Floating Icon Styles */
        .floating-icon-bubble {
          position: relative;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        .floating-icon-bubble:hover {
          transform: scale(1.15) translateY(-4px);
        }
        
        .icon-tooltip {
          position: absolute;
          left: calc(100% + 12px);
          top: 50%;
          transform: translateY(-50%);
          background: rgba(17, 24, 39, 0.95);
          color: white;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 0.875rem;
          white-space: nowrap;
          opacity: 0;
          pointer-events: none;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
          z-index: 50;
        }
        
        .icon-tooltip::before {
          content: '';
          position: absolute;
          right: 100%;
          top: 50%;
          transform: translateY(-50%);
          border: 6px solid transparent;
          border-right-color: rgba(17, 24, 39, 0.95);
        }
        
        .floating-icon-bubble:hover .icon-tooltip {
          opacity: 1;
          transform: translateY(-50%) translateX(0);
        }
        
        /* Connection Line Animation */
        .connection-line {
          position: relative;
          overflow: hidden;
        }
        
        .connection-line::before {
          content: '';
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 2px;
          height: 100%;
          background: linear-gradient(to bottom, 
            rgba(99, 102, 241, 0.3),
            rgba(139, 92, 246, 0.2),
            transparent
          );
          animation: lineGrow 0.6s ease-out forwards;
        }
        
        @keyframes lineGrow {
          from {
            height: 0;
          }
          to {
            height: 100%;
          }
        }
        
        /* Pulse Animation for Active Icons */
        @keyframes iconPulse {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.7);
          }
          50% {
            box-shadow: 0 0 0 8px rgba(99, 102, 241, 0);
          }
        }
        
        .floating-icon-bubble.active {
          animation: iconPulse 2s ease-in-out infinite;
        }
        
        /* Domino Spinner Animation */
        .spinner {
          position: relative;
          width: 60px;
          height: 60px;
          display: flex;
          justify-content: center;
          align-items: center;
          border-radius: 50%;
          margin: 0 auto;
        }
        
        .spinner span {
          position: absolute;
          top: 50%;
          left: var(--left);
          width: 35px;
          height: 7px;
          background: #3b82f6;
          animation: dominos 1s ease infinite;
          box-shadow: 2px 2px 3px 0px rgba(0, 0, 0, 0.2);
          border-radius: 4px;
        }
        
        .spinner span:nth-child(1) {
          --left: 80px;
          animation-delay: 0.125s;
        }
        
        .spinner span:nth-child(2) {
          --left: 70px;
          animation-delay: 0.3s;
        }
        
        .spinner span:nth-child(3) {
          left: 60px;
          animation-delay: 0.425s;
        }
        
        .spinner span:nth-child(4) {
          animation-delay: 0.54s;
          left: 50px;
        }
        
        .spinner span:nth-child(5) {
          animation-delay: 0.665s;
          left: 40px;
        }
        
        .spinner span:nth-child(6) {
          animation-delay: 0.79s;
          left: 30px;
        }
        
        .spinner span:nth-child(7) {
          animation-delay: 0.915s;
          left: 20px;
        }
        
        .spinner span:nth-child(8) {
          left: 10px;
        }
        
        @keyframes dominos {
          50% {
            opacity: 0.7;
          }
          75% {
            -webkit-transform: rotate(90deg);
            transform: rotate(90deg);
          }
          80% {
            opacity: 1;
          }
        }
        
        /* Expanded Label Animation */
        .expanded-label {
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          transform: translateX(-10px);
          opacity: 0;
        }
        
        .floating-icon-bubble:hover .expanded-label {
          transform: translateX(0);
          opacity: 1;
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
          
          .icon-tooltip {
            display: none;
          }
        }
      `}</style>

      <div className="relative min-h-screen w-full">
        {/* Logout Button - Top Right */}
        <div className="fixed top-4 right-4 z-50">
          <LogoutButton onClick={onLogout} text="Logout" />
        </div>


        {/* Main Content - Eventbrite-Inspired Layout - Fixed Position */}
        <div className="fixed inset-0 overflow-y-auto w-full bg-gradient-to-r from-purple-100 via-blue-50 to-purple-100" style={{ left: 0, right: 0, top: 0, bottom: 0, zIndex: 1, paddingBottom: '100px' }}>
          <div className="participant-main-content max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div>
            {/* Home Page - All Events */}
            {activeTab === "home" && (
              <>
                {/* Welcome Message - Professional and Formal Student Style */}
                <div className="mb-12 mt-4 relative w-full" style={{ minHeight: '200px' }}>
                  <div className="relative p-8 md:p-12 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/90 via-purple-50/30 to-blue-50/40 backdrop-blur-sm opacity-80"></div>
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500 opacity-60"></div>
                    {/* Decorative gradient background elements */}
                    <div className="absolute top-0 right-0 w-40 h-40 bg-purple-200 opacity-30 blur-3xl rounded-full"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-200 opacity-30 blur-2xl rounded-full"></div>
                    {/* Innovative corner accents */}
                    <div className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-indigo-500/10 to-transparent" style={{
                      clipPath: 'polygon(0% 0%, 100% 0%, 0% 100%)'
                    }}></div>
                    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-purple-500/10 to-transparent" style={{
                      clipPath: 'polygon(100% 0%, 0% 0%, 100% 100%)'
                    }}></div>
                    <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-blue-500/10 to-transparent" style={{
                      clipPath: 'polygon(0% 0%, 100% 100%, 0% 100%)'
                    }}></div>
                    <div className="absolute bottom-0 right-0 w-20 h-20 bg-gradient-to-tl from-indigo-500/10 to-transparent" style={{
                      clipPath: 'polygon(100% 0%, 100% 100%, 0% 100%)'
                    }}></div>
                    
                    <div className="relative z-10">
                      {(() => {
                        const hour = new Date().getHours();
                        let greeting = "Good day";
                        let formalGreeting = "Welcome";
                        if (hour < 12) {
                          greeting = "Good Morning";
                          formalGreeting = "Welcome";
                        } else if (hour < 17) {
                          greeting = "Good Afternoon";
                          formalGreeting = "Welcome";
                        } else {
                          greeting = "Good Evening";
                          formalGreeting = "Welcome";
                        }
                        
                        // Get user's name from profile or email
                        let userName = "";
                        let fullName = "";
                        if (profile?.name) {
                          fullName = profile.name;
                          userName = profile.name.split(" ")[0]; // First name only
                        } else if (userEmail) {
                          userName = userEmail.split("@")[0]; // Username from email
                          userName = userName.charAt(0).toUpperCase() + userName.slice(1);
                          fullName = userName;
                        }
                        
                        return (
                          <div className="w-full">
                            <div className="mb-6">
                              <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-3">
                                Student Club-Hub Portal
                              </p>
                              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">
                                {greeting}{userName ? `, ${userName}` : ""}
                              </h1>
                              <p className="text-base md:text-lg text-gray-800 font-semibold mb-6">
                                Your space to explore clubs, events, and campus life
                              </p>
                              {/* Primary CTA - Explore Clubs */}
                              <div className="mb-6">
                                <button
                                  onClick={() => setActiveTab("clubs")}
                                  className="ds-button ds-button-primary ds-button-md transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
                                >
                                  Explore Clubs
                                </button>
                              </div>
                            </div>
                            <div className="mb-6 relative">
                              <div className="flex items-center gap-3 flex-wrap">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 animate-pulse"></div>
                                  <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                                  <div className="w-1 h-1 rounded-full bg-gradient-to-r from-purple-400 to-pink-500 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                                </div>
                                <p className="text-sm md:text-base text-gray-800 leading-relaxed font-medium relative inline-block">
                                  <span className="relative z-10">Find upcoming events, join student clubs, and manage your campus activities in one place.</span>
                                  <span className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-200 via-purple-200 to-blue-200 opacity-60 rounded-full transform -skew-x-12"></span>
                                </p>
                                <div className="flex items-center gap-2 ml-auto">
                                  <svg className="w-4 h-4 text-indigo-400 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                  </svg>
                                  <svg className="w-3 h-3 text-purple-400 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-700 mt-4">
                              <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full blur-sm opacity-40 animate-pulse"></div>
                                <svg className="w-5 h-5 text-indigo-600 flex-shrink-0 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <span className="font-semibold relative">
                                Everything happening on campus, in one dashboard
                                <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-indigo-300 to-transparent opacity-50"></span>
                              </span>
                              <div className="ml-auto flex gap-1">
                                <div className="w-1 h-1 rounded-full bg-indigo-400 opacity-60"></div>
                                <div className="w-1 h-1 rounded-full bg-purple-400 opacity-60"></div>
                                <div className="w-1 h-1 rounded-full bg-blue-400 opacity-60"></div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* Campus Engagement Score - Core Feature */}
                {participantStats && (() => {
                  const points = participantStats.points || 0;
                  const eventsAttended = participantStats.events_attended || 0;
                  const currentStreak = participantStats.current_streak || 0;
                  const badgesCount = badges.length;
                  const clubsCount = clubs.filter(c => 
                    Object.values(registeredEvents).some(reg => 
                      allEvents.find(e => e.club_id === c.id && reg.eventId === e.id)
                    )
                  ).length;
                  
                  const engagementScore = Math.min(100, Math.round(
                    (points * 0.3) + 
                    (eventsAttended * 5) + 
                    (currentStreak * 2) + 
                    (badgesCount * 8) + 
                    (clubsCount * 3)
                  ));
                  
                  return (
                    <div className="mb-8 relative">
                      <div className="flex items-center justify-between gap-6">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="relative">
                              <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full blur-sm opacity-40 animate-pulse"></div>
                              <svg className="w-6 h-6 text-indigo-600 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                              </svg>
                            </div>
                            <h3 className="ds-heading-4 text-gray-900 relative">
                              Campus Engagement Score
                              <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-indigo-300 to-transparent opacity-60"></span>
                            </h3>
                          </div>
                          <p className="ds-body-small text-gray-600 ml-9">Your engagement score reflects how active you are on campus.</p>
                        </div>
                        <div className="relative">
                          <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full blur-xl opacity-30 animate-pulse"></div>
                          <span className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 relative z-10">{engagementScore}</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Insight Card - Lightweight personalization */}
                <div className="mb-12">
                  <div className="relative p-4">
                    <div className="absolute inset-0 bg-white/40 backdrop-blur-sm opacity-50"></div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-6 flex-wrap">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          <span className="font-medium">You're part of <span className="text-indigo-600 font-semibold">{clubs.filter(c => registeredEvents && Object.values(registeredEvents).some(reg => allEvents.find(e => e.club_id === c.id && reg.eventId === e.id))).length || 2}</span> clubs</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="font-medium"><span className="text-purple-600 font-semibold">{allEvents.filter(e => {
                            const eventDate = new Date(e.date);
                            const today = new Date();
                            const weekFromNow = new Date(today);
                            weekFromNow.setDate(today.getDate() + 7);
                            return eventDate >= today && eventDate <= weekFromNow;
                          }).length || 3}</span> events happening this week</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Horizontal Scrollable Category Section */}
                <div className="mb-12">
                  <div className="flex gap-8 overflow-x-auto pb-6 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {(() => {
                      const categoryColors = [
                        { bg: 'bg-purple-100', border: 'border-purple-300', text: 'text-purple-700' },
                        { bg: 'bg-teal-100', border: 'border-teal-300', text: 'text-teal-700' },
                        { bg: 'bg-emerald-100', border: 'border-emerald-300', text: 'text-emerald-700' },
                        { bg: 'bg-amber-100', border: 'border-amber-300', text: 'text-amber-700' },
                        { bg: 'bg-rose-100', border: 'border-rose-300', text: 'text-rose-700' },
                        { bg: 'bg-violet-100', border: 'border-violet-300', text: 'text-violet-700' },
                        { bg: 'bg-cyan-100', border: 'border-cyan-300', text: 'text-cyan-700' },
                        { bg: 'bg-fuchsia-100', border: 'border-fuchsia-300', text: 'text-fuchsia-700' },
                      ];
                      
                      // Get unique categories from events (through clubs)
                      const eventCategories = [...new Set(
                        allEvents
                          .map(e => {
                            const club = clubs.find(c => c.id === e.club_id);
                            return club?.category;
                          })
                          .filter(Boolean)
                      )];
                      
                      return (
                        <>
                          <button
                            onClick={() => setHomeSelectedCategory("all")}
                            className={`flex flex-col items-center gap-2 flex-shrink-0 transition-all ${
                              homeSelectedCategory === "all" ? "opacity-100" : "opacity-60 hover:opacity-100"
                            }`}
                          >
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center border-2 ${
                              homeSelectedCategory === "all" 
                                ? "bg-gray-200 border-gray-400" 
                                : "bg-gray-100 border-gray-200"
                            }`}>
                              <svg className={`ds-icon ds-icon-lg ${homeSelectedCategory === "all" ? "text-gray-700" : "text-gray-500"}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                              </svg>
                            </div>
                            <span className="text-xs font-medium text-gray-700">All</span>
                          </button>
                          
                          {eventCategories.slice(0, 8).map((cat, idx) => {
                            const colorScheme = categoryColors[idx % categoryColors.length];
                            return (
                              <button
                                key={cat}
                                onClick={() => setHomeSelectedCategory(cat)}
                                className={`flex flex-col items-center gap-2 flex-shrink-0 transition-all ${
                                  homeSelectedCategory === cat ? "opacity-100" : "opacity-60 hover:opacity-100"
                                }`}
                              >
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center border-2 ${
                                  homeSelectedCategory === cat 
                                    ? `${colorScheme.bg} ${colorScheme.border}` 
                                    : "bg-white border-gray-200"
                                }`}>
                                  <span className={`text-xl font-medium ${
                                    homeSelectedCategory === cat ? colorScheme.text : "text-gray-600"
                                  }`}>
                                    {cat.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <span className="text-xs font-medium text-gray-700 text-center max-w-[60px]">{cat}</span>
                              </button>
                            );
                          })}
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Filter Tabs Section */}
                <div className="mb-8">
                  <div className="flex items-center gap-1 border-b border-gray-200">
                    <button
                      onClick={() => {
                        setHomeActiveFilter("all");
                        setHomeSearchQuery("");
                      }}
                      className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-all duration-150 ${
                        homeActiveFilter === "all"
                          ? "text-gray-900 border-purple-400"
                          : "text-gray-600 hover:text-purple-600 hover:border-purple-400 border-transparent active:scale-[0.98]"
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setHomeActiveFilter("for-you")}
                      className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-all duration-150 ${
                        homeActiveFilter === "for-you"
                          ? "text-gray-900 border-teal-400"
                          : "text-gray-600 hover:text-teal-600 hover:border-teal-400 border-transparent active:scale-[0.98]"
                      }`}
                    >
                      For you
                    </button>
                    <button
                      onClick={() => setHomeActiveFilter("today")}
                      className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-all duration-150 ${
                        homeActiveFilter === "today"
                          ? "text-gray-900 border-emerald-400"
                          : "text-gray-600 hover:text-emerald-600 hover:border-emerald-400 border-transparent active:scale-[0.98]"
                      }`}
                    >
                      Today
                    </button>
                    <button
                      onClick={() => setHomeActiveFilter("weekend")}
                      className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-all duration-150 ${
                        homeActiveFilter === "weekend"
                          ? "text-gray-900 border-amber-400"
                          : "text-gray-600 hover:text-amber-600 hover:border-amber-400 border-transparent active:scale-[0.98]"
                      }`}
                    >
                      This weekend
                    </button>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="mb-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="relative flex-1 max-w-md">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="ds-icon ds-icon-sm text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        placeholder="Search events..."
                        value={homeSearchQuery}
                        onChange={(e) => setHomeSearchQuery(e.target.value)}
                        className="ds-input ds-input-md w-full pl-12 pr-4"
                      />
                    </div>
                    
                    {/* View Mode Toggle */}
                    <div className="flex items-center gap-2 ml-6 p-1 bg-gray-100 rounded-lg">
                      <button
                        onClick={() => setHomeViewMode("grid")}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                          homeViewMode === "grid"
                            ? "bg-white text-gray-900 shadow"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                          </svg>
                          Grid
                        </div>
                      </button>
                      <button
                        onClick={() => setHomeViewMode("swipe")}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                          homeViewMode === "swipe"
                            ? "bg-white text-gray-900 shadow"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                          Swipe
                        </div>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Swipeable Cards Mode */}
                {homeViewMode === "swipe" && swipeableEvents.length > 0 && (
                  <div className="mb-16">
                    <div className="text-center mb-8">
                      <h2 className="ds-heading-2 mb-2">Discover Events</h2>
                      <p className="ds-body text-gray-600">Swipe right to register, swipe left to pass</p>
                      <div className="flex items-center justify-center gap-8 mt-6">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </div>
                          <span className="text-sm font-medium text-gray-700">Pass</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                          </div>
                          <span className="text-sm font-medium text-gray-700">Interested</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="swipe-container mx-auto" style={{ position: 'relative', minHeight: '650px' }}>
                      {swipeableEvents.slice(0, 3).map((event, index) => (
                        <SwipeableEventCard
                          key={event.id}
                          event={event}
                          onSwipeLeft={handleSwipeLeft}
                          onSwipeRight={handleSwipeRight}
                          isTopCard={index === 0}
                          cardIndex={index}
                        />
                      ))}
                      
                      {swipeableEvents.length === 0 && (
                        <div className="swipe-empty-state">
                          <svg className="empty-icon mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <h3 className="empty-title">All Caught Up!</h3>
                          <p className="empty-description">You've seen all available events. Check back later for new ones!</p>
                          <button 
                            onClick={() => setHomeViewMode("grid")}
                            className="ds-button ds-button-primary ds-button-md mt-6"
                          >
                            Browse All Events
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-center mt-8 text-sm text-gray-500">
                      <p>{swipeableEvents.length} events remaining</p>
                    </div>
                  </div>
                )}

                {/* For You Section - Personalized Recommendations */}
                {homeViewMode !== "swipe" && allEvents.length > 0 && (
                  <div className="mb-16">
                    <div className="flex items-center justify-between mb-10">
                      <div>
                        <h2 className="ds-heading-2">For You</h2>
                        <p className="ds-body text-gray-600 mt-2">Events and clubs matched to your interests</p>
                      </div>
                      <button 
                        className="ds-button ds-button-ghost ds-button-sm transition-all duration-150 hover:bg-gray-100 active:scale-[0.98]"
                        onClick={() => {
                          const allEventsSection = document.querySelector('.all-events-section');
                          if (allEventsSection) {
                            allEventsSection.scrollIntoView({ behavior: 'smooth' });
                          }
                        }}
                      >
                        Browse all
                      </button>
                    </div>
                    
                    {/* Horizontal Scrollable Event Cards */}
                    <div className="relative">
                      {allEvents.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                          <p className="ds-body text-gray-600 mb-2">Nothing scheduled for today.</p>
                          <p className="ds-body-small text-gray-500">Explore clubs to find upcoming activities.</p>
                        </div>
                      ) : (
                        <div className="flex overflow-x-auto pb-6 scrollbar-hide gap-8" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                          {allEvents.slice(0, 6).map((event) => {
                            const club = clubs.find(c => c.id === event.club_id);
                            return (
                              <div key={event.id} className="transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]">
                                <TopPickEventCard
                                  event={event}
                                  club={club}
                                  isBookmarked={false}
                                  onBookmark={() => {
                                    console.log('Bookmark toggled for event:', event.id);
                                  }}
                                  onViewDetails={() => handleViewEventFullPage(event)}
                                />
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {/* Navigation Arrow */}
                      <button className="ds-button ds-button-primary ds-button-sm absolute right-0 top-1/2 -translate-y-1/2">
                        <svg className="ds-icon ds-icon-sm ds-icon-inverse" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}

              </>
            )}
            
            {activeTab === "clubs" && !selectedClub && clubs.length > 0 && (
              <>
                {/* Horizontal Scrollable Category Section with Light Colors */}
                <div className="mb-8">
                  <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {(() => {
                      const categoryColors = [
                        { bg: 'bg-purple-100', border: 'border-purple-300', text: 'text-purple-700', icon: 'bg-purple-200' },
                        { bg: 'bg-teal-100', border: 'border-teal-300', text: 'text-teal-700', icon: 'bg-teal-200' },
                        { bg: 'bg-emerald-100', border: 'border-emerald-300', text: 'text-emerald-700', icon: 'bg-emerald-200' },
                        { bg: 'bg-amber-100', border: 'border-amber-300', text: 'text-amber-700', icon: 'bg-amber-200' },
                        { bg: 'bg-rose-100', border: 'border-rose-300', text: 'text-rose-700', icon: 'bg-rose-200' },
                        { bg: 'bg-violet-100', border: 'border-violet-300', text: 'text-violet-700', icon: 'bg-violet-200' },
                        { bg: 'bg-cyan-100', border: 'border-cyan-300', text: 'text-cyan-700', icon: 'bg-cyan-200' },
                        { bg: 'bg-fuchsia-100', border: 'border-fuchsia-300', text: 'text-fuchsia-700', icon: 'bg-fuchsia-200' },
                      ];
                      
                      return (
                        <>
                          <button
                            onClick={() => setSelectedCategory("all")}
                            className={`flex flex-col items-center gap-2 flex-shrink-0 transition-all ${
                              selectedCategory === "all" ? "opacity-100" : "opacity-60 hover:opacity-100"
                            }`}
                          >
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center border-2 transition-all duration-150 ${
                              selectedCategory === "all" 
                                ? "bg-gray-200 border-gray-400 shadow-md" 
                                : "bg-gray-100 border-gray-200"
                            }`}>
                              <svg className={`w-8 h-8 ${selectedCategory === "all" ? "text-gray-700" : "text-gray-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                              </svg>
                            </div>
                            <span className={`text-xs font-medium ${selectedCategory === "all" ? "text-gray-900 font-semibold" : "text-gray-700"}`}>All</span>
                          </button>
                          
                          {[...new Set(clubs.map(c => c.category).filter(Boolean))].slice(0, 8).map((cat, idx) => {
                            const colorScheme = categoryColors[idx % categoryColors.length];
                            return (
                              <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`flex flex-col items-center gap-2 flex-shrink-0 transition-all ${
                                  selectedCategory === cat ? "opacity-100" : "opacity-60 hover:opacity-100"
                                }`}
                              >
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center border-2 transition-all duration-150 ${
                                  selectedCategory === cat 
                                    ? `${colorScheme.bg} ${colorScheme.border} shadow-md` 
                                    : "bg-white border-gray-200"
                                }`}>
                                  <span className={`text-xl font-medium ${
                                    selectedCategory === cat ? colorScheme.text : "text-gray-600"
                                  }`}>
                                    {cat.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <span className={`text-xs font-medium text-center max-w-[60px] ${
                                  selectedCategory === cat ? "text-gray-900 font-semibold" : "text-gray-700"
                                }`}>{cat}</span>
                              </button>
                            );
                          })}
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Filter Tabs Section with Varied Colors */}
                <div className="mb-6">
                  <div className="flex items-center gap-1 border-b border-gray-200">
                    <button
                      onClick={() => setSearchQuery("")}
                      className="px-4 py-3 text-sm font-medium text-gray-900 border-b-2 border-purple-400 -mb-px"
                    >
                      All
                    </button>
                    <button
                      className="px-4 py-3 text-sm font-medium text-gray-600 hover:text-teal-600 hover:border-teal-400 border-b-2 border-transparent -mb-px transition-colors"
                    >
                      For you
                    </button>
                    <button
                      className="px-4 py-3 text-sm font-medium text-gray-600 hover:text-emerald-600 hover:border-emerald-400 border-b-2 border-transparent -mb-px transition-colors"
                    >
                      Today
                    </button>
                    <button
                      className="px-4 py-3 text-sm font-medium text-gray-600 hover:text-amber-600 hover:border-amber-400 border-b-2 border-transparent -mb-px transition-colors"
                    >
                      This weekend
                    </button>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="mb-6">
                  <div className="relative max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="Search clubs..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white/40 backdrop-blur-sm focus:outline-none focus:ring-0 focus:bg-white/60 transition-all rounded-lg relative"
                      style={{ 
                        border: 'none',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                      }}
                    />
                  </div>
                </div>

                {/* Section Title */}
                <div className="mb-10">
                  <h2 className="ds-heading-2">
                    {selectedCategory === "all" ? "All Clubs" : `${selectedCategory} Clubs`}
                  </h2>
                </div>
              </>
            )}

        {/* RSVP Success Modal - Enhanced 2025 UI */}
        {showRsvpSuccess && (
          <div className="fixed inset-0 progressive-blur-modal flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="max-w-md w-full p-10 animate-scaleIn glow-success progressive-blur-card relative">
              <div className="absolute inset-0 bg-gradient-to-br from-white/95 to-gray-50/95 backdrop-blur-xl"></div>
              <div className="relative z-10">
                <div className="text-center mb-10">
                  <div className="relative inline-block mb-6 animate-scaleIn">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full blur-xl opacity-40 animate-pulse"></div>
                    <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-[#8fb3e3] relative z-10">
                      <svg
                        className="ds-icon ds-icon-xl text-white"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  </div>
                  <h2 className="ds-heading-2 mb-6 relative">
                    Registration Successful! 🎉
                    <span className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-64 h-0.5 bg-gradient-to-r from-transparent via-green-300 to-transparent opacity-50"></span>
                  </h2>
                  <p className="ds-body-large text-gray-600">
                    You've successfully RSVP'd for{" "}
                    <span className="font-medium text-gray-900">{showRsvpSuccess.event.title}</span>
                  </p>
                </div>

                <div className="relative p-8 text-center mb-10">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/80 to-gray-50/60"></div>
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-gray-900 via-gray-700 to-gray-900"></div>
                  <div className="relative z-10">
                    <p className="ds-heading-4 mb-6 relative">
                      Your Entry QR Code
                      <span className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-40 h-0.5 bg-gradient-to-r from-transparent via-gray-400 to-transparent opacity-50"></span>
                    </p>
                    <div className="relative inline-block p-6" style={{ marginBottom: '1.5rem' }}>
                      <div className="absolute inset-0 bg-gradient-to-br from-white to-gray-50 opacity-80"></div>
                      <img
                        src={showRsvpSuccess.registration.qrCodeUrl}
                        alt="QR Code"
                        className="w-56 h-56 mx-auto object-contain relative z-10"
                        onLoad={() => console.log("QR code loaded successfully")}
                        onError={(e) => {
                          console.error("QR code failed to load:", showRsvpSuccess.registration.qrCodeUrl);
                          e.target.style.display = "none";
                          const errorDiv = e.target.nextElementSibling;
                          if (errorDiv) errorDiv.style.display = "block";
                        }}
                        crossOrigin="anonymous"
                      />
                      <div style={{ display: "none" }} className="ds-body text-red-600">
                        QR code unavailable. Please refresh or contact support.
                      </div>
                    </div>
                    <div className="mt-8 p-6 relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-white to-gray-50 opacity-60"></div>
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-gray-900 via-gray-700 to-gray-900"></div>
                      <div className="relative z-10">
                        <p className="ds-label mb-3">Registration ID:</p>
                        <p
                          className="ds-heading-3 font-mono cursor-pointer hover:text-green-600 transition"
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
                        <p className="ds-caption mt-3">Click to copy</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowRsvpSuccess(null)}
                className="ds-button ds-button-primary ds-button-lg button-glow w-full"
              >
                <span className="ds-body emoji-inline">Awesome! Got it <span className="emoji-large">🎊</span></span>
              </button>
            </div>
          </div>
        )}

        {/* Event Details Modal - Removed as requested */}

        {activeTab === "clubs" && (
          <div className="space-y-6">
            {!selectedClub ? (
              // Professional Clubs Display - Editorial Style
              <div className={`${mounted ? 'animate-fadeIn delay-400' : 'initial-hidden'}`}>
                {clubs.length === 0 ? (
                  <div className="text-center py-24 ds-card">
                    <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center mx-auto mb-8">
                      <svg className="w-12 h-12 text-purple-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <h2 className="ds-heading-2 mb-4">No clubs available</h2>
                    <p className="ds-body-large text-gray-600 mb-4 max-w-md mx-auto">
                      There are no active clubs on campus right now.
                    </p>
                    <p className="ds-body text-gray-500 mb-12">Create the first club to bring students together.</p>
                    <button
                      onClick={() => navigate("/participant/create-club")}
                      className="ds-button ds-button-primary ds-button-md transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <svg className="ds-icon ds-icon-sm ds-icon-inverse" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      <span className="ds-body">Create First Club</span>
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Recommended for You Section */}
                    {(() => {
                      // Get recommended clubs (popular/recently active)
                      const recommendedClubs = clubs
                        .filter(club => {
                          const clubEvents = allEvents.filter(e => e.club_id === club.id);
                          return clubEvents.length > 0; // Clubs with events
                        })
                        .slice(0, 3);
                      
                      if (recommendedClubs.length === 0) return null;
                      
                      return (
                        <div className="mb-8">
                          <h2 className="ds-heading-3 mb-4 text-gray-900">Recommended for you</h2>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                            {recommendedClubs.map((club, idx) => {
                              const colorSchemes = [
                                { bg: 'bg-purple-50', accent: 'bg-purple-500', text: 'text-purple-600', border: 'border-purple-300' },
                                { bg: 'bg-teal-50', accent: 'bg-teal-500', text: 'text-teal-600', border: 'border-teal-300' },
                                { bg: 'bg-emerald-50', accent: 'bg-emerald-500', text: 'text-emerald-600', border: 'border-emerald-300' },
                              ];
                              const colors = colorSchemes[idx % colorSchemes.length];
                              const clubEvents = allEvents.filter(e => e.club_id === club.id);
                              
                              return (
                                <div
                                  key={club.id}
                                  className="relative p-4 transition-all duration-150 cursor-pointer group"
                                  onClick={() => handleClubSelect(club)}
                                >
                                  <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                  <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-3">
                                      <div className={`w-12 h-12 ${colors.accent} rounded-lg flex items-center justify-center relative`}>
                                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-lg"></div>
                                        <span className="text-xl font-bold text-white relative z-10">
                                          {club.name.charAt(0).toUpperCase()}
                                        </span>
                                      </div>
                                      <div className="flex-1">
                                        <h3 className="ds-heading-4 mb-1 font-semibold text-gray-900 relative">
                                          {club.name}
                                          <span className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-gray-300 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></span>
                                        </h3>
                                        <p className="ds-body-small text-gray-500">{clubEvents.length} events</p>
                                      </div>
                                    </div>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleClubSelect(club);
                                      }}
                                      className="ds-button ds-button-ghost ds-button-sm w-full text-xs transition-all duration-150 hover:bg-gray-100 active:scale-[0.98]"
                                    >
                                      View Club
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Bento Grid Club Cards - Enhanced 2025 UI */}
                    {(() => {
                      const filteredClubs = clubs.filter(club => {
                        const matchesSearch = !searchQuery || 
                          club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (club.description && club.description.toLowerCase().includes(searchQuery.toLowerCase()));
                        const matchesCategory = selectedCategory === "all" || club.category === selectedCategory;
                        return matchesSearch && matchesCategory;
                      });
                      
                      if (filteredClubs.length === 0) {
                        return (
                          <div className="text-center py-16 relative">
                            <div className="relative inline-block mb-4">
                              <div className="absolute inset-0 bg-gradient-to-r from-gray-300 to-gray-400 rounded-full blur-xl opacity-20 animate-pulse"></div>
                              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center relative z-10">
                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                              </div>
                            </div>
                            <p className="ds-heading-3 mb-2 text-gray-900 relative">
                              No clubs match your filters
                              <span className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-48 h-0.5 bg-gradient-to-r from-transparent via-gray-300 to-transparent opacity-50"></span>
                            </p>
                            <p className="ds-body text-gray-600 mb-4">Try adjusting your interests or explore all clubs.</p>
                            <button
                              onClick={() => {
                                setSelectedCategory("all");
                                setSearchQuery("");
                              }}
                              className="ds-button ds-button-ghost ds-button-sm transition-all duration-150 hover:bg-gray-100 active:scale-[0.98]"
                            >
                              Clear filters
                            </button>
                          </div>
                        );
                      }
                      
                      return (
                        <div className="bento-grid">
                          {filteredClubs.map((club, index) => (
                          <div
                            key={club.id}
                            className={`bento-item card-3d-interactive interactive-card story-reveal story-reveal-delay-${Math.min(index % 4, 4)} ${mounted ? 'visible' : ''}`}
                            style={{ animationDelay: `${0.4 + index * 0.05}s` }}
                            onClick={() => handleClubSelect(club)}
                          >
                            {/* Eventbrite-Style Card with Light Colors */}
                            {(() => {
                              const colorSchemes = [
                                { bg: 'bg-purple-50', accent: 'bg-purple-500', text: 'text-purple-600', border: 'border-purple-300' },
                                { bg: 'bg-teal-50', accent: 'bg-teal-500', text: 'text-teal-600', border: 'border-teal-300' },
                                { bg: 'bg-emerald-50', accent: 'bg-emerald-500', text: 'text-emerald-600', border: 'border-emerald-300' },
                                { bg: 'bg-amber-50', accent: 'bg-amber-500', text: 'text-amber-600', border: 'border-amber-300' },
                                { bg: 'bg-rose-50', accent: 'bg-rose-500', text: 'text-rose-600', border: 'border-rose-300' },
                                { bg: 'bg-violet-50', accent: 'bg-violet-500', text: 'text-violet-600', border: 'border-violet-300' },
                                { bg: 'bg-cyan-50', accent: 'bg-cyan-500', text: 'text-cyan-600', border: 'border-cyan-300' },
                                { bg: 'bg-fuchsia-50', accent: 'bg-fuchsia-500', text: 'text-fuchsia-600', border: 'border-fuchsia-300' },
                              ];
                              const colors = colorSchemes[index % colorSchemes.length];
                              
                              return (
                                <div className="tile-3d overflow-hidden gpu-accelerated">
                                  {/* Card Image/Icon Area with Light Colors - 3D Effect */}
                                  <div className={`relative h-48 ${colors.bg} flex items-center justify-center progressive-blur-card`}>
                                    <div className={`w-24 h-24 ${colors.accent} rounded-lg flex items-center justify-center shadow-lg`}>
                                      <span className="text-4xl font-bold text-white">
                                        {club.name.charAt(0).toUpperCase()}
                                      </span>
                                    </div>
                                    {/* Category Badge with Light Color - Clickable */}
                                    {club.category && (
                                      <div className="absolute top-3 right-3">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedCategory(club.category);
                                          }}
                                          className={`relative px-3 py-1.5 text-xs font-medium transition-all duration-150 hover:scale-105 active:scale-95 ${selectedCategory === club.category ? `${colors.text} font-semibold` : `${colors.text} opacity-70`}`}
                                          style={{
                                            background: selectedCategory === club.category 
                                              ? `linear-gradient(135deg, ${colors.border.replace('border-', '')}20, ${colors.border.replace('border-', '')}10)`
                                              : 'transparent',
                                            backdropFilter: 'blur(8px)',
                                            border: 'none',
                                            boxShadow: selectedCategory === club.category ? `0 2px 8px ${colors.border.replace('border-', '')}30` : 'none'
                                          }}
                                        >
                                          {club.category}
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Card Content */}
                                  <div className="p-4">
                                    <h3 className="ds-heading-3 mb-2 line-clamp-2 font-semibold text-gray-900 group-hover:text-gray-700 transition-colors">
                                      {club.name}
                                    </h3>
                                    <p className="ds-body-small text-gray-600 mb-4 line-clamp-2">
                                      {club.description || "No description available."}
                                    </p>
                                    
                                    {/* Club Stats - De-emphasized */}
                                    <div className="flex items-center gap-6 text-xs text-gray-400 mb-4">
                                      <span className="flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                        </svg>
                                        Active
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        Events
                                      </span>
                                    </div>
                                    
                                    {/* Action Button with Glow Effect */}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleClubSelect(club);
                                      }}
                                      className={`ds-button ds-button-primary ds-button-md button-glow w-full ${colors.accent} text-white transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]`}
                                    >
                                      <span className="ds-body font-medium">Explore Events</span>
                                    </button>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        ))}
                        </div>
                      );
                    })()}
                  </>
                )}
              </div>
            ) : (
              // Events List for Selected Club
              <div className="relative p-8">
                <button
                  onClick={handleBackToClubs}
                  className="ds-button ds-button-ghost ds-button-sm mb-10 transition-all duration-150 hover:bg-gray-100 active:scale-[0.98]"
                >
                  <svg className="ds-icon ds-icon-sm ds-icon-secondary" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="ds-body-small">Back to All Clubs</span>
                </button>

                {eventsLoading ? (
                  <div className="text-center py-24 relative">
                    <Loader text="Loading" className="mx-auto mb-8" />
                    <p className="ds-heading-3 text-gray-800 mt-8 relative">
                      Loading Events
                      <span className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-0.5 bg-gradient-to-r from-transparent via-blue-300 to-transparent opacity-50"></span>
                    </p>
                    <p className="ds-body-large text-gray-600 mt-4">Fetching the latest events...</p>
                  </div>
                ) : (
                  events.length === 0 ? (
                    <div className="text-center py-24 relative">
                      <div className="relative inline-block mb-10">
                        <div className="absolute inset-0 bg-gradient-to-r from-gray-300 to-gray-400 rounded-full blur-xl opacity-20 animate-pulse"></div>
                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center relative z-10">
                          <svg className="ds-icon ds-icon-xl text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      </div>
                      <p className="ds-heading-2 mb-6 relative">
                        No events scheduled
                        <span className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-40 h-0.5 bg-gradient-to-r from-transparent via-gray-300 to-transparent opacity-50"></span>
                      </p>
                      <p className="ds-body-large text-gray-600 mb-4">This club hasn't created any events yet.</p>
                      <p className="ds-body text-gray-500">Explore other clubs to find activities happening on campus.</p>
                    </div>
                  ) : (
                    <div className="bento-grid">
                      {events.map((event, index) => {
                        const club = clubs.find(c => c.id === event.club_id);
                        return (
                          <div
                            key={event.id}
                            className={`bento-item card-3d-interactive story-reveal story-reveal-delay-${Math.min(index % 4, 4)} ${mounted ? 'visible' : ''} transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]`}
                            style={{ animationDelay: `${index * 0.1}s` }}
                          >
                            <EventCard
                              event={event}
                              club={club}
                              isRegistered={isRegistered(event.id)}
                              isRegistering={registeringEventId === event.id}
                              onRegister={() => registerForEvent(event.id)}
                              onViewDetails={() => handleViewEventFullPage(event)}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "dashboard" && (
          <div className={`${mounted ? 'animate-fadeIn delay-400' : 'initial-hidden'}`}>
            {/* Welcome Message - Professional and Formal Student Style */}
            <div className="mb-12 mt-4 relative w-full">
              <div className="relative p-8 md:p-12 overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-blue-200 opacity-30 blur-3xl rounded-full"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-200 opacity-30 blur-2xl rounded-full"></div>
                <div className="relative z-10">
                  <div className="mb-6">
                    <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-3">
                      Personal Dashboard
                    </p>
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">
                      My Dashboard
                  </h1>
                    <p className="text-base md:text-lg text-gray-800 font-semibold mb-6">
                    Track your RSVPs, get recommendations, and manage your event registrations.
                  </p>
                  </div>
                  <div className="relative pl-6 py-4">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-600 via-indigo-500 to-blue-600"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-indigo-50/30 opacity-50"></div>
                    <p className="text-sm md:text-base text-gray-800 leading-relaxed relative z-10">
                      View your registered events, access QR codes for check-in, get personalized recommendations, 
                      and track your participation history. Manage your academic and extracurricular commitments in one place.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Recommendations Section - Only show if user has 4+ registrations */}
            {Object.keys(registeredEvents).length >= 4 ? (
            <div className="relative p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="ds-heading-2 mb-4 flex items-center gap-4">
                    <span className="w-12 h-12 bg-sky-500 rounded-lg flex items-center justify-center">
                      <svg className="ds-icon ds-icon-lg text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </span>
                    AI Event Recommendations
                  </h2>
                  <p className="ds-body text-gray-600">Get personalized event suggestions based on your interests</p>
                </div>
                <button
                  onClick={getAIRecommendations}
                  disabled={aiRecommendationsLoading}
                  className="ds-button ds-button-primary ds-button-md button-glow disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
                >
                  {aiRecommendationsLoading ? (
                    <>
                      <div className="spinner">
                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                      <span className="ds-body">Finding Events...</span>
                    </>
                  ) : (
                    <>
                      <svg className="ds-icon ds-icon-sm ds-icon-inverse" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span className="ds-body">Get Recommendations</span>
                    </>
                  )}
                </button>
              </div>

              {aiRecommendations && aiRecommendations.recommendations && (
                <div className="space-y-4">
                  {aiRecommendations.recommendations.length > 0 ? (
                    <>
                      {aiRecommendations.profile_summary && (
                        <div className="relative mb-4 p-4">
                          <div className="absolute inset-0 bg-gradient-to-r from-green-50 to-emerald-50 opacity-50"></div>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                            <p className="text-sm text-gray-700 relative z-10">
                              <span className="font-bold">Based on:</span> {aiRecommendations.profile_summary.past_events} past events • 
                              Interests: {aiRecommendations.profile_summary.interests.length > 0 
                                ? aiRecommendations.profile_summary.interests.join(", ") 
                                : "General"}
                            </p>
                          </div>
                          <div className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-transparent via-green-300 to-transparent opacity-40"></div>
                        </div>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {aiRecommendations.recommendations.map((rec, index) => (
                          <div key={rec.event_id || index} className="group relative p-5 overflow-hidden hover:scale-[1.02] transition-all duration-300">
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 via-emerald-400 to-green-500"></div>
                            <div className="absolute inset-0 bg-gradient-to-br from-white/80 to-gray-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <div className="relative z-10">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h3 className="ds-heading-4 mb-3">{rec.title}</h3>
                                <p className="ds-body-small text-purple-600 font-medium">{rec.club_name}</p>
                                <p className="ds-caption text-gray-500 mt-2">{rec.club_category}</p>
                              </div>
                              <span className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center text-white ds-body font-bold flex-shrink-0">
                                {index + 1}
                              </span>
                            </div>
                            
                            <p className="ds-body-small text-gray-600 mb-6 line-clamp-2">{rec.description || "Join us for an exciting event!"}</p>
                            
                            <div className="space-y-3 mb-6">
                              <div className="flex items-center gap-3 ds-body-small text-gray-600">
                                <svg className="ds-icon ds-icon-xs text-blue-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span>{new Date(rec.date).toLocaleDateString()}</span>
                                <span className="mx-1">•</span>
                                <span>{rec.time}</span>
                              </div>
                              <div className="flex items-center gap-3 ds-body-small text-gray-600">
                                <svg className="ds-icon ds-icon-xs text-purple-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span className="truncate">{rec.location}</span>
                              </div>
                              {rec.popularity > 0 && (
                                <div className="flex items-center gap-3 ds-body-small text-gray-600">
                                  <svg className="ds-icon ds-icon-xs text-green-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                  </svg>
                                  <span>{rec.popularity} registered</span>
                                </div>
                              )}
                            </div>

                            <div className="relative p-6 mb-6">
                              <div className="absolute inset-0 bg-gradient-to-r from-green-50 to-emerald-50 opacity-60"></div>
                              <div className="relative z-10">
                                <p className="ds-body-small font-medium text-blue-900 mb-3">💡 Why we recommend this:</p>
                                <p className="ds-body-small text-green-700">{rec.explanation}</p>
                              </div>
                            </div>

                            <div className="space-y-2">
                              {isRegistered(rec.event_id) ? (
                                <div className="bg-green-500 rounded-lg p-3 text-center text-white font-bold text-sm shadow-md">
                                  ✓ Already Registered
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleRegisterFromRecommendation(rec.event_id)}
                                  disabled={registeringEventId === rec.event_id}
                                  className={`ds-button ds-button-primary ds-button-md w-full ${
                                    registeringEventId === rec.event_id
                                      ? "opacity-50 cursor-not-allowed"
                                      : ""
                                  }`}
                                >
                                  {registeringEventId === rec.event_id ? (
                                    <span className="flex items-center justify-center gap-2">
                                      <div className="spinner" style={{ width: '20px', height: '20px', margin: 0 }}>
                                        <span style={{ width: '8px', height: '3px', background: 'white' }}></span>
                                        <span style={{ width: '8px', height: '3px', background: 'white' }}></span>
                                        <span style={{ width: '8px', height: '3px', background: 'white' }}></span>
                                        <span style={{ width: '8px', height: '3px', background: 'white' }}></span>
                                      </div>
                                      <span className="ds-body">Registering...</span>
                                    </span>
                                  ) : (
                                    <span className="ds-body">Register Now 🎉</span>
                                  )}
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  const event = allEvents.find(e => e.id === rec.event_id) || {
                                    id: rec.event_id,
                                    title: rec.title,
                                    description: rec.description,
                                    date: rec.date,
                                    time: rec.time,
                                    location: rec.location,
                                    club_id: null
                                  };
                                  handleViewEventFullPage(event);
                                }}
                                className="ds-button ds-button-secondary ds-button-md w-full transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
                              >
                                <span className="ds-body">View Details</span>
                              </button>
                            </div>
                          </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12 relative">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <div className="w-1 h-1 rounded-full bg-gray-400 opacity-60"></div>
                        <p className="text-gray-600 font-semibold">No recommendations available at this time</p>
                        <div className="w-1 h-1 rounded-full bg-gray-400 opacity-60"></div>
                      </div>
                      <p className="text-sm text-gray-500 mt-2">Try again later or explore events manually</p>
                      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-48 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent opacity-40"></div>
                    </div>
                  )}
                </div>
              )}

              {!aiRecommendations && !aiRecommendationsLoading && (
                <div className="text-center py-12 relative">
                  <div className="relative inline-block mb-4">
                    <div className="absolute inset-0 bg-gradient-to-r from-sky-400 to-blue-500 rounded-full blur-xl opacity-30 animate-pulse"></div>
                    <div className="w-20 h-20 bg-sky-400 rounded-full flex items-center justify-center relative z-10">
                      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-gray-600 font-semibold mb-2 relative">
                    Ready for Personalized Recommendations
                    <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-64 h-0.5 bg-gradient-to-r from-transparent via-sky-300 to-transparent opacity-50"></span>
                  </p>
                  <p className="text-sm text-gray-500">Click the button above to discover events tailored to your interests</p>
                </div>
              )}
            </div>
            ) : (
              // Show message when user has less than 4 registrations
              <div className="mb-10 relative p-6">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 to-orange-50/30 opacity-50"></div>
                <div className="flex items-start gap-4 relative z-10">
                  <div className="relative flex-shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-500 rounded-lg blur-sm opacity-40 animate-pulse"></div>
                    <div className="w-12 h-12 bg-amber-500 rounded-lg flex items-center justify-center relative z-10">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 relative">
                      AI Recommendations Coming Soon!
                      <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-300 to-transparent opacity-50"></span>
                    </h3>
                    <p className="text-gray-700 mb-3">
                      Register for <span className="font-bold text-amber-700">{4 - Object.keys(registeredEvents).length}</span> more event{4 - Object.keys(registeredEvents).length === 1 ? '' : 's'} to unlock personalized AI recommendations.
                    </p>
                    <div className="relative p-4 mb-4">
                      <div className="absolute inset-0 bg-gradient-to-r from-amber-50 to-orange-50 opacity-60"></div>
                      <div className="flex items-center justify-between mb-2 relative z-10">
                        <span className="text-sm font-semibold text-gray-700">Your Progress:</span>
                        <span className="text-sm font-bold text-amber-700">
                          {Object.keys(registeredEvents).length} / 4 events
                        </span>
                      </div>
                      <div className="w-full bg-amber-100 rounded-full h-3 relative z-10">
                        <div 
                          className="bg-amber-500 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min((Object.keys(registeredEvents).length / 4) * 100, 100)}%` }}
                        ></div>
                      </div>
                      <div className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-300 to-transparent opacity-40"></div>
                    </div>
                    <button
                      onClick={() => setActiveTab("clubs")}
                      className="px-6 py-3 glass-button-primary font-bold minimal-rounded shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center gap-2"
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
                  <div className="text-center py-20 relative">
                    <Loader text="Loading" className="mx-auto" />
                    <p className="text-xl font-bold text-gray-800 mt-6 relative">
                      Loading Your RSVPs
                      <span className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-40 h-0.5 bg-gradient-to-r from-transparent via-blue-300 to-transparent opacity-50"></span>
                    </p>
                    <p className="text-gray-600 mt-2">Fetching your registered events...</p>
                  </div>
                ) : Object.keys(registeredEvents).length === 0 ? (
                  <div className="text-center py-24 relative">
                    <div className="relative inline-block mb-8">
                      <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full blur-xl opacity-30 animate-pulse"></div>
                      <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center relative z-10">
                        <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>
                    <h2 className="ds-heading-2 mb-4 relative">
                      No RSVPs Yet
                      <span className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-0.5 bg-gradient-to-r from-transparent via-green-300 to-transparent opacity-50"></span>
                    </h2>
                    <p className="ds-body-large text-gray-600 mb-4 max-w-md mx-auto">
                      You haven't registered for any events yet. Start exploring clubs and RSVP to events that interest you!
                    </p>
                    <p className="ds-body text-gray-500 mb-12">Your registered events will appear here, making it easy to track your schedule and access QR codes.</p>
                    <button
                      onClick={() => setActiveTab("clubs")}
                      className="ds-button ds-button-primary ds-button-md"
                    >
                      <svg className="ds-icon ds-icon-sm ds-icon-inverse" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span className="ds-body">Explore Clubs</span>
                    </button>
                  </div>
                ) : (
                  <div className="bento-grid">
                    {Object.values(registeredEvents)
                      .filter((reg) => reg.event)
                      .map((reg, index) => (
                        <div
                          key={reg.registrationId}
                          className={`bento-item card-3d-interactive interactive-card story-reveal story-reveal-delay-${Math.min(index % 4, 4)} ${mounted ? 'visible' : ''}`}
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
                            <div className="flex items-center gap-3 text-gray-700 p-3 relative group">
                              <div className="absolute inset-0 bg-gradient-to-r from-green-50 to-emerald-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                              <svg className="w-5 h-5 text-green-600 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span className="font-medium relative z-10">{reg.event.date}</span>
                            </div>
                            <div className="flex items-center gap-3 text-gray-700 p-3 relative group">
                              <div className="absolute inset-0 bg-gradient-to-r from-green-50 to-emerald-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                              <svg className="w-5 h-5 text-green-600 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="font-medium relative z-10">{reg.event.time}</span>
                            </div>
                            <div className="flex items-center gap-3 text-gray-700 p-3 relative group">
                              <div className="absolute inset-0 bg-gradient-to-r from-red-50 to-pink-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                              <svg className="w-5 h-5 text-red-600 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span className="font-medium relative z-10">{reg.event.location}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleViewEventDetails(reg.eventId)}
                            className="ds-button ds-button-primary ds-button-md button-glow w-full"
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
              <div className="text-center py-20 relative">
                <div className="relative inline-block mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-300 to-gray-400 rounded-full blur-xl opacity-20 animate-pulse"></div>
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center relative z-10">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-3 relative">
                  Please Log In
                  <span className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-0.5 bg-gradient-to-r from-transparent via-gray-300 to-transparent opacity-50"></span>
                </h2>
                <p className="text-gray-600 mb-6 text-lg">
                  Sign in to access your personalized dashboard with RSVPs and QR codes.
                </p>
                <button
                  className="px-8 py-4 glass-button-primary minimal-rounded font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                  onClick={() => navigate("/login")}
                >
                  Login Now
                </button>
              </div>
            )}

            {/* Stats Section - Integrated into Dashboard */}
            <div className="mt-12">
              <div className="mb-8">
                <h2 className="ds-heading-2 mb-2">Your Stats</h2>
                <p className="ds-body text-gray-600">Track your participation, achievements, and progress</p>
              </div>

            {loadingStats ? (
              <div className="text-center py-20">
                <Loader text="Loading" className="mx-auto mb-4" />
                <p className="text-gray-600">Loading your stats...</p>
              </div>
            ) : participantStats ? (
              <div className="space-y-6">
                {/* Campus Engagement Score - Core Feature */}
                {(() => {
                  const points = participantStats.points || 0;
                  const eventsAttended = participantStats.events_attended || 0;
                  const currentStreak = participantStats.current_streak || 0;
                  const badgesCount = badges.length;
                  const clubsCount = clubs.filter(c => 
                    Object.values(registeredEvents).some(reg => 
                      allEvents.find(e => e.club_id === c.id && reg.eventId === e.id)
                    )
                  ).length;
                  
                  // Calculate engagement score (0-100)
                  const engagementScore = Math.min(100, Math.round(
                    (points * 0.3) + 
                    (eventsAttended * 5) + 
                    (currentStreak * 2) + 
                    (badgesCount * 8) + 
                    (clubsCount * 3)
                  ));
                  
                  return (
                    <div className="mb-6 relative">
                      <div className="flex items-center justify-between gap-6">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="relative">
                              <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full blur-sm opacity-40 animate-pulse"></div>
                              <svg className="w-6 h-6 text-indigo-600 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                              </svg>
                            </div>
                            <h3 className="ds-heading-3 text-gray-900 relative">
                              Campus Engagement Score
                              <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-indigo-300 to-transparent opacity-60"></span>
                            </h3>
                          </div>
                          <p className="ds-body-small text-gray-600 ml-9">Your engagement score reflects how active you are on campus.</p>
                        </div>
                        <div className="relative">
                          <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full blur-xl opacity-30 animate-pulse"></div>
                          <span className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 relative z-10">{engagementScore}</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Stats Overview Cards - Bento Grid with 3D */}
                <div className="bento-grid">
                  <div className="bento-item card-3d tile-3d bg-gradient-to-br from-blue-500 to-blue-600 p-8 text-white glow-secondary">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="typography-display font-semibold">Total Points</h3>
                      <svg className="ds-icon ds-icon-xl opacity-80 interactive-icon" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="typography-hero text-white mb-4">{participantStats.points || 0}</p>
                    {(() => {
                      const currentPoints = participantStats.points || 0;
                      const nextMilestone = Math.ceil((currentPoints + 50) / 50) * 50;
                      const pointsNeeded = nextMilestone - currentPoints;
                      return (
                        <p className="ds-body-large opacity-90 mt-4">
                          {pointsNeeded > 0 ? `${pointsNeeded} points to reach ${nextMilestone}` : 'Milestone reached'}
                        </p>
                      );
                    })()}
                  </div>

                  <div className="bento-item card-3d tile-3d bg-gradient-to-br from-green-500 to-green-600 p-8 text-white glow-success">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="typography-display font-semibold">Events Attended</h3>
                      <svg className="ds-icon ds-icon-xl opacity-80 interactive-icon" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="typography-hero text-white">{participantStats.events_attended || 0}</p>
                    <p className="ds-body-large opacity-90 mt-4">Great job staying active! <span className="emoji-inline">🎉</span></p>
                  </div>

                  <div className="bento-item card-3d tile-3d bg-gradient-to-br from-purple-500 to-purple-600 p-8 text-white glow-primary">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="typography-display font-semibold">Current Streak</h3>
                      <svg className="ds-icon ds-icon-xl opacity-80 interactive-icon" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <p className="typography-hero text-white">{participantStats.current_streak || 0} days</p>
                    <p className="ds-body-large opacity-90 mt-4">Longest: {participantStats.longest_streak || 0} days <span className="emoji-inline">🔥</span></p>
                  </div>

                  <div className="bento-item card-3d tile-3d bg-gradient-to-br from-orange-500 to-orange-600 p-8 text-white glow-primary">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="typography-display font-semibold">Badges Earned</h3>
                      <svg className="ds-icon ds-icon-xl opacity-80 interactive-icon" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                    </div>
                    <p className="typography-hero text-white">{badges.length}</p>
                    {(() => {
                      const currentBadges = badges.length;
                      const nextMilestone = Math.ceil((currentBadges + 3) / 3) * 3;
                      const badgesNeeded = nextMilestone - currentBadges;
                      return (
                        <p className="ds-body-large opacity-90 mt-4">
                          {badgesNeeded > 0 ? `Next badge unlocks at ${nextMilestone} badges` : 'All milestones reached'}
                        </p>
                      );
                    })()}
                  </div>
                </div>

                {/* Badges Section */}
                {badges.length > 0 && (
                  <div className="relative p-6">
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-50/30 to-amber-50/20 opacity-50"></div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4 relative z-10">
                      Your Badges
                      <span className="absolute -bottom-2 left-0 w-24 h-0.5 bg-gradient-to-r from-yellow-400 to-amber-400 opacity-60"></span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
                      {badges.map((badge) => (
                        <div key={badge.id} className="relative p-4 group">
                          <div className="absolute inset-0 bg-gradient-to-br from-yellow-50/60 to-amber-50/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <div className="flex items-center gap-3 relative z-10">
                            <div className="relative">
                              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-lg blur-sm opacity-40 group-hover:opacity-60 transition-opacity"></div>
                              <div className="w-12 h-12 bg-yellow-400 rounded-lg flex items-center justify-center relative z-10">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                </svg>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-bold text-gray-900 relative">
                                {badge.badge_name}
                                <span className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-yellow-300 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></span>
                              </h4>
                              <p className="text-sm text-gray-600">{badge.badge_description}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="absolute -bottom-2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-300 to-transparent opacity-40"></div>
                  </div>
                )}

                {/* Category Breakdown */}
                {participantStats.favorite_category && (
                  <div className="relative p-6">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-indigo-50/20 opacity-50"></div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4 relative z-10">
                      Your Interests
                      <span className="absolute -bottom-2 left-0 w-32 h-0.5 bg-gradient-to-r from-blue-400 to-indigo-400 opacity-60"></span>
                    </h3>
                    <div className="space-y-3 relative z-10">
                      <div className="flex items-center justify-between p-4 relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-indigo-50 opacity-60 group-hover:opacity-80 transition-opacity"></div>
                        <span className="font-semibold text-gray-900 relative z-10">Favorite Category</span>
                        <span className="px-4 py-2 font-bold relative z-10 text-white" style={{
                          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.8), rgba(99, 102, 241, 0.8))',
                          backdropFilter: 'blur(8px)',
                          border: 'none',
                          boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)'
                        }}>
                          {participantStats.favorite_category}
                        </span>
                      </div>
                      {participantStats.category_breakdown && Object.entries(participantStats.category_breakdown).map(([category, count]) => (
                        <div key={category} className="flex items-center justify-between p-3 relative group">
                          <div className="absolute inset-0 bg-gradient-to-r from-gray-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          <span className="text-gray-700 relative z-10">{category}</span>
                          <span className="font-bold text-gray-900 relative z-10">{count} events</span>
                        </div>
                      ))}
                    </div>
                    <div className="absolute -bottom-2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-300 to-transparent opacity-40"></div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 relative">
                <div className="relative inline-block mb-4">
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-300 to-gray-400 rounded-full blur-xl opacity-20 animate-pulse"></div>
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center relative z-10">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
                <p className="ds-body text-gray-600 mb-2 relative">
                  No stats available yet
                  <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-40 h-0.5 bg-gradient-to-r from-transparent via-gray-300 to-transparent opacity-50"></span>
                </p>
                <p className="ds-body-small text-gray-500">Your statistics will appear here once you start participating in events.</p>
              </div>
            )}
            </div>
          </div>
        )}

        {/* Calendar Tab */}
        {activeTab === "calendar" && (
          <div className={`${mounted ? 'animate-fadeIn delay-400' : 'initial-hidden'}`}>
            {/* Welcome Message - Professional and Formal Student Style */}
            <div className="mb-12 mt-4 relative w-full">
              <div className="relative p-8 md:p-12 overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-200 opacity-30 blur-3xl rounded-full"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-200 opacity-30 blur-2xl rounded-full"></div>
                <div className="relative z-10">
                  <div className="mb-6">
                    <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-3">
                      Event Management System
                    </p>
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">
                      Event Calendar
                  </h1>
                    <p className="text-base md:text-lg text-gray-800 font-semibold mb-6">
                    View all your events in one place and stay on top of important dates.
                  </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative p-6 mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-gray-50/40 opacity-50"></div>
              {/* Calendar Header */}
              <div className="relative z-10">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                  <div className="flex items-center gap-4">
                  <h2 className="ds-heading-3">Calendar View</h2>
                  <button
                    onClick={() => {
                      const newDate = new Date(selectedDate);
                      if (calendarView === "week") {
                        newDate.setDate(newDate.getDate() - 7);
                      } else {
                        newDate.setMonth(newDate.getMonth() - 1);
                      }
                      setSelectedDate(newDate);
                    }}
                    className="p-2 cool-button-secondary minimal-rounded"
                    title={calendarView === "week" ? "Previous week" : "Previous month"}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setSelectedDate(new Date())}
                    className="px-4 py-2 cool-button-secondary minimal-rounded font-semibold text-sm"
                  >
                    Today
                  </button>
                  <button
                    onClick={() => {
                      const newDate = new Date(selectedDate);
                      if (calendarView === "week") {
                        newDate.setDate(newDate.getDate() + 7);
                      } else {
                        newDate.setMonth(newDate.getMonth() + 1);
                      }
                      setSelectedDate(newDate);
                    }}
                    className="p-2 cool-button-secondary minimal-rounded"
                    title={calendarView === "week" ? "Next week" : "Next month"}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  <span className="text-lg font-bold text-gray-900">
                    {calendarView === "week" 
                      ? (() => {
                          const weekStart = new Date(selectedDate);
                          weekStart.setDate(selectedDate.getDate() - selectedDate.getDay());
                          const weekEnd = new Date(weekStart);
                          weekEnd.setDate(weekStart.getDate() + 6);
                          return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
                        })()
                      : selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                    }
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      try {
                        const token = localStorage.getItem("clubhub_token");
                        const url = `${API.defaults.baseURL}/api/participant/events/calendar/export`;
                        const response = await fetch(url, {
                          headers: {
                            'Authorization': `Bearer ${token}`
                          }
                        });
                        const blob = await response.blob();
                        const downloadUrl = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = downloadUrl;
                        a.download = `student-clubhub-events-${new Date().toISOString().split('T')[0]}.ics`;
                        document.body.appendChild(a);
                        a.click();
                        window.URL.revokeObjectURL(downloadUrl);
                        document.body.removeChild(a);
                      } catch (error) {
                        console.error("Error exporting calendar:", error);
                        alert("Failed to export calendar. Please try again.");
                      }
                    }}
                    className="px-4 py-2 cool-button-secondary minimal-rounded font-semibold text-sm flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export iCal
                  </button>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setCalendarView("month")}
                      className={`px-4 py-2 minimal-rounded font-semibold text-sm transition-all duration-150 ${
                        calendarView === "month" ? "cool-button text-white" : "cool-button-secondary opacity-60"
                      }`}
                    >
                      Month
                    </button>
                    <button
                      onClick={() => setCalendarView("week")}
                      className={`px-4 py-2 minimal-rounded font-semibold text-sm transition-all duration-150 ${
                        calendarView === "week" ? "cool-button text-white" : "cool-button-secondary opacity-60"
                      }`}
                    >
                      Week
                    </button>
                    <button
                      disabled
                      className="px-4 py-2 minimal-rounded font-semibold text-sm cool-button-secondary opacity-40 cursor-not-allowed"
                      title="Coming soon"
                    >
                      Agenda
                    </button>
                  </div>
                </div>
                </div>
              </div>

              {/* Today Summary Insight */}
              {(() => {
                const today = new Date().toISOString().split('T')[0];
                const todayEvents = calendarEvents.filter(e => {
                  const eventDate = new Date(e.date).toISOString().split('T')[0];
                  return eventDate === today;
                });
                const upcomingEvents = calendarEvents
                  .filter(e => new Date(e.date) > new Date())
                  .sort((a, b) => new Date(a.date) - new Date(b.date));
                const nextEvent = upcomingEvents[0];
                
                if (todayEvents.length === 0 && !nextEvent) return null;
                
                return (
                  <div className="mb-6 relative p-3">
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-50/60 to-blue-50/30 opacity-50"></div>
                    <div className="flex items-center gap-4 text-sm text-gray-700 relative z-10">
                      {todayEvents.length > 0 && (
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="font-medium">You have <span className="text-blue-600 font-semibold">{todayEvents.length}</span> {todayEvents.length === 1 ? 'event' : 'events'} today</span>
                        </div>
                      )}
                      {nextEvent && (() => {
                        const eventDate = new Date(nextEvent.date);
                        const now = new Date();
                        const diffMs = eventDate - now;
                        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                        if (diffHours < 24) {
                          return (
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="font-medium">Next event starts in <span className="text-purple-600 font-semibold">{diffHours}h {diffMins}m</span></span>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                );
              })()}

              {/* University Calendar Sync */}
              <div className={`relative p-4 mb-6 ${
                universityCalendarSynced 
                  ? "" 
                  : ""
              }`}>
                <div className={`absolute inset-0 opacity-50 ${
                  universityCalendarSynced 
                    ? "bg-gradient-to-r from-green-50 to-emerald-50" 
                    : "bg-gradient-to-r from-blue-50 to-indigo-50"
                }`}></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
                        {universityCalendarSynced ? (
                          <>
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            University Calendar Connected
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Sync with University Calendar
                          </>
                        )}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {universityCalendarSynced 
                          ? "University calendar events are displayed in your calendar."
                          : "Import your university calendar (iCal format) to see all events in one place."}
                      </p>
                      {!universityCalendarSynced && (
                        <div className="mt-2 text-xs text-gray-500">
                          <p className="font-semibold mb-1">How to get your calendar URL:</p>
                          <ul className="list-disc list-inside space-y-0.5">
                            <li>Google Calendar: Settings → Calendars → Public URL (iCal format)</li>
                            <li>Outlook: Calendar Settings → Publish Calendar → iCal link</li>
                            <li>University Portal: Look for "Export Calendar" or "Subscribe" option</li>
                          </ul>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      {universityCalendarSynced ? (
                        <button
                          onClick={async () => {
                            if (window.confirm("Remove university calendar events?")) {
                              try {
                                await API.delete("/api/participant/events/calendar/university-sync");
                                setUniversityCalendarSynced(false);
                                fetchCalendarEvents();
                                alert("University calendar disconnected successfully");
                              } catch (error) {
                                console.error("Error disconnecting calendar:", error);
                                alert("Failed to disconnect calendar");
                              }
                            }
                          }}
                          className="px-4 py-2 text-white minimal-rounded font-semibold text-sm transition-all relative overflow-hidden"
                          style={{
                            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.9), rgba(220, 38, 38, 0.9))',
                            backdropFilter: 'blur(8px)',
                            border: 'none',
                            boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 1), rgba(220, 38, 38, 1))';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.4)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.9), rgba(220, 38, 38, 0.9))';
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(239, 68, 68, 0.3)';
                          }}
                        >
                          Disconnect
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            const url = prompt("Enter your university calendar iCal URL:");
                            if (url) {
                              handleUniversityCalendarSync(url);
                            }
                          }}
                          className="px-4 py-2 cool-button minimal-rounded font-semibold text-sm"
                        >
                          Connect Calendar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <div className={`absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent ${
                  universityCalendarSynced 
                    ? "via-green-300" 
                    : "via-blue-300"
                } to-transparent opacity-40`}></div>
              </div>

              {loadingCalendar ? (
                <div className="text-center py-20">
                  <Loader text="Loading" className="mx-auto mb-4" />
                  <p className="text-gray-600">Loading calendar...</p>
                </div>
              ) : calendarEvents.length === 0 ? (
                <div className="text-center py-24 ds-card">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-8">
                    <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h2 className="ds-heading-2 mb-4">Your Calendar is Empty</h2>
                  <p className="ds-body-large text-gray-600 mb-4 max-w-md mx-auto">
                    No events are scheduled in your calendar yet. Start exploring clubs and register for events to see them here!
                  </p>
                  <p className="ds-body text-gray-500 mb-12">You can also sync your university calendar to see all events in one place.</p>
                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={() => setActiveTab("clubs")}
                      className="ds-button ds-button-primary ds-button-md"
                    >
                      <svg className="ds-icon ds-icon-sm ds-icon-inverse" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span className="ds-body">Explore Events</span>
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <CalendarGrid
                    events={calendarEvents}
                    selectedDate={selectedDate}
                    view={calendarView}
                    onDateClick={(date) => {
                      setSelectedDate(date);
                      setSelectedCalendarDate(date.toISOString().split('T')[0]);
                    }}
                  />
                  
                  {/* Events for Selected Date */}
                  {selectedCalendarDate && (
                    <div className="mt-6 relative p-6">
                      <div className="absolute inset-0 bg-gradient-to-br from-white/80 to-gray-50/60 opacity-60"></div>
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-xl font-bold text-gray-900 relative">
                            Events on {new Date(selectedCalendarDate).toLocaleDateString('en-US', { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                            <span className="absolute -bottom-2 left-0 w-48 h-0.5 bg-gradient-to-r from-gray-400 to-transparent opacity-50"></span>
                          </h3>
                          <button
                            onClick={() => setSelectedCalendarDate(null)}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        <div className="space-y-3">
                          {calendarEvents
                            .filter(e => e.date === selectedCalendarDate)
                            .map((event) => (
                              <div
                                key={event.id}
                                className={`p-4 relative group ${
                                  event.type === "university"
                                    ? ""
                                    : event.is_registered
                                    ? event.has_conflict
                                      ? ""
                                      : ""
                                    : ""
                                }`}
                              >
                                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity ${
                                  event.type === "university"
                                    ? "bg-gradient-to-r from-purple-50 to-violet-50"
                                    : event.is_registered
                                    ? event.has_conflict
                                      ? "bg-gradient-to-r from-red-50 to-pink-50"
                                      : "bg-gradient-to-r from-green-50 to-emerald-50"
                                    : "bg-gradient-to-r from-gray-50 to-slate-50"
                                }`}></div>
                                <div className="relative z-10">
                                  <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-bold text-gray-900">{event.title}</h4>
                                    {event.type === "university" && (
                                      <span className="px-2 py-0.5 bg-purple-500 text-white text-xs font-bold minimal-rounded">
                                        University
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-600 mb-2">{event.club_name}</p>
                                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                                    <span className="flex items-center gap-1">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      {event.time}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                      </svg>
                                      {event.location}
                                    </span>
                                  </div>
                                  {event.description && (
                                    <p className="text-sm text-gray-700 mt-2">{event.description}</p>
                                  )}
                                </div>
                                <div className="flex flex-col items-end gap-2 ml-4">
                                  {event.is_registered && (
                                    <span className="px-3 py-1 bg-green-500 text-white text-xs font-bold minimal-rounded">
                                      Registered
                                    </span>
                                  )}
                                  {event.has_conflict && (
                                    <span className="px-3 py-1 bg-red-500 text-white text-xs font-bold minimal-rounded">
                                      Conflict!
                                    </span>
                                  )}
                                  {event.type !== "university" && !event.is_registered && (
                                    <button
                                      onClick={() => registerForEvent(event.id)}
                                      disabled={registeringEventId === event.id}
                                      className="px-3 py-1 cool-button text-white text-xs font-bold minimal-rounded disabled:opacity-50"
                                    >
                                      Register
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                          ))}
                        {calendarEvents.filter(e => e.date === selectedCalendarDate).length === 0 && (
                          <div className="text-center py-12">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <p className="ds-body-large text-gray-600 mb-2">No events scheduled for this date.</p>
                            <p className="ds-body text-gray-500">Explore clubs to find upcoming activities.</p>
                            <p className="ds-body-small text-gray-500">Check other dates or explore upcoming events from clubs</p>
                          </div>
                        )}
                      </div>
                    </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Friends Tab */}
        {activeTab === "friends" && (
          <div className={`${mounted ? 'animate-fadeIn delay-400' : 'initial-hidden'}`}>
            {/* Welcome Message - Professional and Formal Student Style */}
            <div className="mb-12 mt-4 relative w-full">
              <div className="relative p-8 md:p-12 overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-blue-200 opacity-30 blur-3xl rounded-full"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan-200 opacity-30 blur-2xl rounded-full"></div>
                <div className="relative z-10">
                  <div className="mb-6">
                    <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-3">
                      Social Network
                    </p>
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">
                      Friends
                    </h1>
                    <p className="text-base md:text-lg text-gray-800 font-semibold mb-6">
                      Connect with fellow students, build your network, and discover events through your connections
                    </p>
                  </div>
                  <div className="relative pl-6 py-4">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-600 via-cyan-500 to-blue-600"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-cyan-50/30 opacity-50"></div>
                    <p className="text-sm md:text-base text-gray-800 leading-relaxed relative z-10">
                      The Friends section enables you to build and maintain your social network within the Student Club-Hub platform. 
                      Connect with peers, view their event participation, and discover new opportunities through your connections. 
                      This feature enhances collaboration and helps you stay informed about campus activities through your social circle.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative p-6 mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-gray-50/40 opacity-50"></div>
              <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Friends</h2>
                <button className="cool-button px-4 py-2 minimal-rounded font-semibold text-sm">
                  Add Friend
                </button>
              </div>

              {friends.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {friends.map((friend) => (
                    <div key={friend.id} className="relative p-4 group">
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-slate-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="flex items-center gap-3 relative z-10">
                        <div className="relative">
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-lg blur-sm opacity-40 group-hover:opacity-60 transition-opacity"></div>
                          <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold relative z-10">
                            {friend.name.charAt(0).toUpperCase()}
                          </div>
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 relative">
                            {friend.name}
                            <span className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-gray-300 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></span>
                          </h3>
                          <p className="text-sm text-gray-600">{friend.email}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 relative">
                  <p className="text-gray-600 mb-4 relative">
                    No friends yet. Start connecting!
                    <span className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-48 h-0.5 bg-gradient-to-r from-transparent via-gray-300 to-transparent opacity-50"></span>
                  </p>
                  <button className="cool-button px-6 py-3 minimal-rounded font-semibold">
                    Find Friends
                  </button>
                </div>
              )}
              <div className="absolute -bottom-2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent opacity-40"></div>
              </div>
            </div>
          </div>
        )}

        {/* Collections Tab */}
        {activeTab === "collections" && (
          <div className={`${mounted ? 'animate-fadeIn delay-400' : 'initial-hidden'}`}>
            {/* Welcome Message - Professional and Formal Student Style */}
            <div className="mb-12 mt-4 relative w-full">
              <div className="relative p-8 md:p-12 overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-pink-200 opacity-30 blur-3xl rounded-full"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-rose-200 opacity-30 blur-2xl rounded-full"></div>
                <div className="relative z-10">
                  <div className="mb-6">
                    <p className="text-xs font-semibold text-pink-600 uppercase tracking-wider mb-3">
                      Event Organization System
                    </p>
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">
                      My Collections
                  </h1>
                    <p className="text-base md:text-lg text-gray-800 font-semibold mb-6">
                    Organize and save your favorite events into collections for easy access and better planning
                  </p>
                  </div>
                  <div className="border-l-4 border-pink-600 pl-6 py-4 bg-gradient-to-r from-pink-50 to-rose-50 rounded-r-lg">
                    <p className="text-sm md:text-base text-gray-800 leading-relaxed">
                      Collections enable you to organize events according to your preferences, interests, or academic requirements. 
                      Create custom collections to group related events, making it easier to plan your schedule and track activities 
                      by category. This organizational tool enhances your ability to manage multiple commitments and prioritize your 
                      participation effectively.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative p-6 mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-gray-50/40 opacity-50"></div>
              <div className="flex items-center justify-between mb-6 relative z-10">
                <h2 className="ds-heading-3 relative">
                  Your Collections
                  <span className="absolute -bottom-2 left-0 w-40 h-0.5 bg-gradient-to-r from-pink-400 to-rose-400 opacity-60"></span>
                </h2>
                <button className="cool-button px-4 py-2 minimal-rounded font-semibold text-sm">
                  Create Collection
                </button>
              </div>

              {collections.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {collections.map((collection) => (
                    <div
                      key={collection.id}
                      className="relative p-6 group"
                      style={{ backgroundColor: `${collection.color}08` }}
                    >
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: `${collection.color}15` }}></div>
                      <div className="absolute top-0 left-0 right-0 h-1" style={{ background: `linear-gradient(90deg, ${collection.color}, ${collection.color}88)` }}></div>
                      <div className="relative z-10">
                        <h3 className="font-bold text-gray-900 text-xl mb-2 relative">
                          {collection.name}
                          <span className="absolute -bottom-1 left-0 w-24 h-0.5 opacity-50" style={{ background: `linear-gradient(90deg, ${collection.color}, transparent)` }}></span>
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">{collection.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-gray-700">
                            {collection.event_count} events
                          </span>
                          <button className="text-sm font-semibold relative" style={{ color: collection.color }}>
                            View →
                            <span className="absolute -bottom-0.5 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: `linear-gradient(90deg, ${collection.color}, transparent)` }}></span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-24 relative">
                  <div className="relative inline-block mb-8">
                    <div className="absolute inset-0 bg-gradient-to-r from-pink-400 to-rose-500 rounded-full blur-xl opacity-30 animate-pulse"></div>
                    <div className="w-24 h-24 bg-gradient-to-br from-pink-100 to-pink-200 rounded-full flex items-center justify-center relative z-10">
                      <svg className="w-12 h-12 text-pink-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                    </div>
                  </div>
                  <h2 className="ds-heading-2 mb-4 relative">
                    No Collections Yet
                    <span className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-40 h-0.5 bg-gradient-to-r from-transparent via-pink-300 to-transparent opacity-50"></span>
                  </h2>
                  <p className="ds-body-large text-gray-600 mb-4 max-w-md mx-auto">
                    Collections help you organize and save your favorite events for easy access later.
                  </p>
                  <p className="ds-body text-gray-500 mb-12">Create collections by category, interest, or any theme that matters to you!</p>
                  <button className="ds-button ds-button-primary ds-button-md">
                    <svg className="ds-icon ds-icon-sm ds-icon-inverse" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="ds-body">Create Your First Collection</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className={`space-y-6 ${mounted ? 'animate-fadeIn delay-400' : 'initial-hidden'}`}>
            {profileLoading ? (
              <div className="text-center py-20">
                <Loader text="Loading" className="mx-auto mb-4" />
                <p className="text-gray-600">Loading your profile...</p>
              </div>
            ) : (
              <>
                {/* Welcome Message - Professional and Formal Student Style */}
                <div className="mb-12 mt-4 relative w-full">
                  <div className="relative p-8 md:p-12 overflow-hidden">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-200 opacity-30 blur-3xl rounded-full"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-200 opacity-30 blur-2xl rounded-full"></div>
                    <div className="relative z-10">
                      <div className="mb-6">
                        <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-3">
                          Personal Information Management
                        </p>
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">
                          My Profile
                      </h1>
                        <p className="text-base md:text-lg text-gray-800 font-semibold mb-6">
                        Manage your personal information, track your event participation, and view your registration history all in one place
                      </p>
                      </div>
                      <div className="relative pl-6 py-4">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-600 via-purple-500 to-indigo-600"></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/50 to-purple-50/30 opacity-50"></div>
                        <p className="text-sm md:text-base text-gray-800 leading-relaxed relative z-10">
                          Your profile serves as your personal identity within the Student Club-Hub platform. Update your information, 
                          manage your profile image, and review your complete event participation history. This section provides a 
                          comprehensive overview of your engagement with campus activities and serves as your academic and extracurricular 
                          activity record.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Profile Card - Instagram Style */}
                <div className="relative overflow-hidden p-8">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/90 to-gray-50/70"></div>
                  <div className="relative z-10">
                  {/* Profile Header Section - Horizontal Layout */}
                  <div className="flex flex-col md:flex-row gap-8 mb-8">
                    {/* Left: Profile Picture */}
                    <div className="flex-shrink-0 flex justify-center md:justify-start">
                      <div className="relative">
                        {/* Profile Image */}
                        <div className="w-28 h-28 md:w-32 md:h-32 rounded-full border-4 border-gray-300 shadow-xl overflow-hidden bg-blue-500 flex items-center justify-center">
                          {getProfileImageUrl() ? (
                            <img
                              src={getProfileImageUrl()}
                              alt="Profile"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-3xl md:text-4xl font-bold text-white">{getInitials()}</span>
                          )}
                        </div>
                        
                        {/* Note/Story Icon Overlay */}
                        <div className="absolute -top-1 -left-1 w-8 h-8 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center shadow-lg">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        
                        {/* Upload Button */}
                        <label className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center cursor-pointer shadow-lg transition transform hover:scale-110 border-2 border-white">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleProfileImageUpload}
                            className="hidden"
                            disabled={profileUploading}
                          />
                          {profileUploading ? (
                            <div className="spinner" style={{ width: '20px', height: '20px', margin: 0 }}>
                              <span style={{ width: '8px', height: '3px', background: 'white' }}></span>
                              <span style={{ width: '8px', height: '3px', background: 'white' }}></span>
                              <span style={{ width: '8px', height: '3px', background: 'white' }}></span>
                              <span style={{ width: '8px', height: '3px', background: 'white' }}></span>
                            </div>
                          ) : (
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          )}
                        </label>
                      </div>
                    </div>

                    {/* Right: Profile Info */}
                    <div className="flex-1">
                      {/* Username and Settings */}
                      <div className="flex items-center gap-4 mb-4">
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">{profile?.email?.split('@')[0] || "user"}</h2>
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </button>
                      </div>

                      {/* Full Name */}
                      <div className="mb-4">
                        <p className="text-lg font-semibold text-gray-900">{profile?.name || "User"}</p>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-6 mb-4">
                        <div className="text-center">
                          <span className="block text-lg font-bold text-gray-900">{profile?.stats?.total_registrations || 0}</span>
                          <span className="text-sm text-gray-600">events</span>
                        </div>
                        <div className="text-center">
                          <span className="block text-lg font-bold text-gray-900">{profile?.stats?.events_attended || 0}</span>
                          <span className="text-sm text-gray-600">attended</span>
                        </div>
                        <div className="text-center">
                          <span className="block text-lg font-bold text-gray-900">{profile?.stats?.upcoming_events || 0}</span>
                          <span className="text-sm text-gray-600">upcoming</span>
                        </div>
                      </div>

                      {/* Email/Bio */}
                      <div className="mb-4">
                        <p className="text-gray-700">{profile?.email}</p>
                        {profile?.bio && (
                          <p className="text-gray-700 mt-2">{profile.bio}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <button
                      onClick={() => setProfileEditMode(!profileEditMode)}
                      className="flex-1 px-4 py-2.5 text-gray-900 font-semibold transition-all text-sm relative overflow-hidden group"
                      style={{
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.6), rgba(249,250,251,0.4))',
                        backdropFilter: 'blur(8px)',
                        border: 'none',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.8), rgba(249,250,251,0.6))';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.6), rgba(249,250,251,0.4))';
                      }}
                    >
                      {profileEditMode ? "Cancel" : "Edit profile"}
                    </button>
                    <button
                      onClick={() => setShowRegistrations(!showRegistrations)}
                      className="flex-1 px-4 py-2.5 text-gray-900 font-semibold transition-all text-sm relative overflow-hidden group"
                      style={{
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.6), rgba(249,250,251,0.4))',
                        backdropFilter: 'blur(8px)',
                        border: 'none',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.8), rgba(249,250,251,0.6))';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.6), rgba(249,250,251,0.4))';
                      }}
                    >
                      View archive
                    </button>
                  </div>

                  {/* Edit Mode Form */}
                  {profileEditMode && (
                    <div className="mb-6 p-6 relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-50/60 to-white/40 backdrop-blur-sm opacity-70 rounded-lg"></div>
                      <div className="space-y-4 relative z-10">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                          <input
                            type="text"
                            value={profileFormData.name}
                            onChange={(e) => setProfileFormData({ ...profileFormData, name: e.target.value })}
                            className="w-full px-4 py-2.5 bg-white/50 backdrop-blur-sm focus:outline-none focus:bg-white/70 transition-all rounded-lg relative z-10"
                            style={{
                              border: 'none',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                            }}
                            placeholder="Enter your name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Bio</label>
                          <textarea
                            value={profileFormData.bio}
                            onChange={(e) => setProfileFormData({ ...profileFormData, bio: e.target.value })}
                            className="w-full px-4 py-2.5 bg-white/50 backdrop-blur-sm focus:outline-none focus:bg-white/70 transition-all rounded-lg relative z-10"
                            style={{
                              border: 'none',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                            }}
                            placeholder="Tell us about yourself..."
                            rows="4"
                            maxLength="500"
                          />
                          <p className="text-xs text-gray-500 mt-1">{profileFormData.bio.length}/500 characters</p>
                        </div>
                        <button
                          onClick={handleSaveProfile}
                          disabled={profileSaving}
                          className="w-full px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition disabled:opacity-50"
                        >
                          {profileSaving ? "Saving..." : "Save Changes"}
                        </button>
                      </div>
                    </div>
                  )}

                    {/* Create Club and Proposals Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      {/* Create Club Card */}
                      <div className="relative overflow-hidden hover:scale-[1.02] transition-all duration-300 group">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 via-emerald-400 to-green-500"></div>
                        <div className="absolute inset-0 bg-gradient-to-br from-white/90 to-gray-50/70 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="p-6 relative z-10">
                          <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">🚀 Create Club</h3>
                            <p className="text-gray-600 text-sm">Submit your club proposal to bring your vision to campus</p>
                          </div>

                          <button
                            onClick={() => navigate("/participant/create-club")}
                            className="w-full py-3 text-white font-bold transition-all duration-300 flex items-center justify-center gap-2 text-sm transform hover:scale-105 relative overflow-hidden group"
                            style={{
                              background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.9), rgba(16, 185, 129, 0.9))',
                              backdropFilter: 'blur(8px)',
                              border: 'none',
                              boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(34, 197, 94, 1), rgba(16, 185, 129, 1))';
                              e.currentTarget.style.boxShadow = '0 6px 16px rgba(34, 197, 94, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(34, 197, 94, 0.9), rgba(16, 185, 129, 0.9))';
                              e.currentTarget.style.boxShadow = '0 4px 12px rgba(34, 197, 94, 0.3)';
                            }}
                          >
                            <span>Create New Club</span>
                            <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                          </button>

                          <div className="mt-4 p-4 relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-green-50 to-emerald-50 opacity-60"></div>
                            <h4 className="font-bold text-gray-900 mb-2 text-sm flex items-center gap-2 relative z-10">
                              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              What you'll need:
                            </h4>
                            <ul className="space-y-1 text-xs text-gray-700">
                              <li>• Club name and description</li>
                              <li>• Category selection</li>
                              <li>• Contact information</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      {/* My Proposals Card */}
                      <div className="relative overflow-hidden hover:scale-[1.02] transition-all duration-300 group">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-400 via-violet-400 to-purple-500"></div>
                        <div className="absolute inset-0 bg-gradient-to-br from-white/90 to-gray-50/70 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="p-6 relative z-10">
                          <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                              </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">📋 My Proposals</h3>
                            <p className="text-gray-600 text-sm">Track the status of your club creation requests</p>
                          </div>

                          <button
                            onClick={() => navigate("/participant/proposals")}
                            className="w-full py-3 text-white font-bold transition-all duration-300 flex items-center justify-center gap-2 text-sm transform hover:scale-105 relative overflow-hidden group"
                            style={{
                              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.9), rgba(139, 92, 246, 0.9))',
                              backdropFilter: 'blur(8px)',
                              border: 'none',
                              boxShadow: '0 4px 12px rgba(168, 85, 247, 0.3)'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(168, 85, 247, 1), rgba(139, 92, 246, 1))';
                              e.currentTarget.style.boxShadow = '0 6px 16px rgba(168, 85, 247, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(168, 85, 247, 0.9), rgba(139, 92, 246, 0.9))';
                              e.currentTarget.style.boxShadow = '0 4px 12px rgba(168, 85, 247, 0.3)';
                            }}
                          >
                            <span>View All Proposals</span>
                            <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                          </button>

                          <div className="mt-4 p-4 relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-50 to-violet-50 opacity-60"></div>
                            <h4 className="font-bold text-gray-900 mb-2 text-sm flex items-center gap-2 relative z-10">
                              <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Status Guide:
                            </h4>
                            <div className="space-y-1 text-xs text-gray-700">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                <span>Pending - Under review</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span>Approved - Club active</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                <span>Rejected - Needs revision</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Registration History */}
                    <div className="pt-6 relative">
                      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent opacity-40"></div>
                      <button
                        onClick={() => setShowRegistrations(!showRegistrations)}
                        className="w-full flex items-center justify-between p-4 transition-all relative group"
                        style={{
                          background: 'linear-gradient(135deg, rgba(219, 234, 254, 0.6), rgba(191, 219, 254, 0.4))',
                          backdropFilter: 'blur(8px)',
                          border: 'none',
                          boxShadow: '0 2px 8px rgba(59, 130, 246, 0.1)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(219, 234, 254, 0.8), rgba(191, 219, 254, 0.6))';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(219, 234, 254, 0.6), rgba(191, 219, 254, 0.4))';
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          <span className="font-bold text-gray-900">Registration History</span>
                          <span className="text-sm text-gray-500">({profileRegistrations.length} events)</span>
                        </div>
                        <svg
                          className={`w-5 h-5 text-gray-600 transition-transform ${showRegistrations ? 'transform rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {showRegistrations && (
                        <div className="mt-4 space-y-3 max-h-96 overflow-y-auto">
                          {profileRegistrations.length === 0 ? (
                            <div className="text-center py-12">
                              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                              </div>
                              <p className="ds-body-large text-gray-600 mb-2">No registrations yet</p>
                              <p className="ds-body-small text-gray-500">Start exploring events and register to see your history here</p>
                            </div>
                          ) : (
                            profileRegistrations.map((reg) => (
                              <div
                                key={reg.registration_id}
                                className="relative p-4 group hover:scale-[1.01] transition-all duration-200"
                              >
                                <div className="absolute inset-0 bg-gradient-to-br from-white/80 to-gray-50/60 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="relative z-10">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <h4 className="font-bold text-gray-900 mb-1">{reg.event_title}</h4>
                                      <p className="text-sm text-gray-600 mb-2">{reg.club_name}</p>
                                      <div className="flex flex-wrap gap-2 text-xs">
                                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                                          {reg.event_date}
                                        </span>
                                        {reg.checked_in && (
                                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full">
                                            ✓ Attended
                                          </span>
                                        )}
                                        {reg.cancelled && (
                                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full">
                                            Cancelled
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    {reg.qr_code_url && (
                                      <a
                                        href={`http://localhost:5000${reg.qr_code_url}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="ml-4 p-2 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                                        title="View QR Code"
                                      >
                                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                                        </svg>
                                      </a>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div className={`space-y-6 ${mounted ? 'animate-fadeIn delay-400' : 'initial-hidden'}`}>
            {/* Welcome Message - Professional and Formal Student Style */}
            <div className="mb-12 mt-4 relative w-full">
              <div className="relative p-8 md:p-12 overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-gray-200 opacity-30 blur-3xl rounded-full"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-slate-200 opacity-30 blur-2xl rounded-full"></div>
                <div className="relative z-10">
                  <div className="mb-6">
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">
                      Account Configuration
                    </p>
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">
                      Settings
                  </h1>
                    <p className="text-base md:text-lg text-gray-800 font-semibold mb-6">
                    Manage your account preferences, privacy settings, and customize your Club-Hub experience
                  </p>
                  </div>
                  <div className="relative pl-6 py-4">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-gray-600 via-slate-500 to-gray-600"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-50/50 to-slate-50/30 opacity-50"></div>
                    <p className="text-sm md:text-base text-gray-800 leading-relaxed relative z-10">
                      The settings section allows you to configure your account preferences, manage privacy controls, and personalize 
                      your platform experience. Adjust notification preferences, update security settings, and customize display options 
                      to optimize your interaction with the Student Club-Hub system according to your individual needs and preferences.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative p-8">
              <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-gray-50/40 opacity-50"></div>
              <div className="relative z-10">

              <div className="space-y-6">
                {/* Account Settings */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="ds-heading-4 mb-4">Account Settings</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-gray-50 to-slate-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div>
                        <p className="ds-body font-medium text-gray-900 relative z-10">Email Notifications</p>
                        <p className="ds-body-small text-gray-600 relative z-10">Receive email updates about events and registrations</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer z-10">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-gray-50 to-slate-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div>
                        <p className="ds-body font-medium text-gray-900 relative z-10">Push Notifications</p>
                        <p className="ds-body-small text-gray-600 relative z-10">Get instant notifications for event reminders</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer z-10">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Privacy Settings */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="ds-heading-4 mb-4">Privacy</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-gray-50 to-slate-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div>
                        <p className="ds-body font-medium text-gray-900 relative z-10">Profile Visibility</p>
                        <p className="ds-body-small text-gray-600 relative z-10">Allow others to see your profile and activity</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer z-10">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Data & Export */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="ds-heading-4 mb-4">Data & Export</h3>
                  <div className="space-y-4">
                    <button className="w-full flex items-center justify-between p-4 relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-gray-50 to-slate-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="text-left relative z-10">
                        <p className="ds-body font-medium text-gray-900">Export My Data</p>
                        <p className="ds-body-small text-gray-600">Download all your data in a portable format</p>
                      </div>
                      <svg className="w-5 h-5 text-gray-600 relative z-10" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Danger Zone */}
                <div className="border-t border-red-200 pt-6">
                  <h3 className="ds-heading-4 mb-4 text-red-600">Danger Zone</h3>
                  <div className="space-y-4">
                    <button 
                      onClick={onLogout}
                      className="w-full flex items-center justify-between p-4 bg-red-50 rounded-lg hover:bg-red-100 transition border-2 border-red-200"
                    >
                      <div className="text-left">
                        <p className="ds-body font-medium text-red-900">Logout</p>
                        <p className="ds-body-small text-red-700">Sign out of your account</p>
                      </div>
                      <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              </div>
            </div>
          </div>
        )}

        {/* Help Desk Tab */}
        {activeTab === "help-desk" && (
          <div className={`space-y-6 ${mounted ? 'animate-fadeIn delay-400' : 'initial-hidden'}`}>
              {/* Welcome Message - Professional and Formal Student Style */}
              <div className="mb-12 mt-4 relative w-full">
                <div className="relative p-8 md:p-12 overflow-hidden">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-amber-200 opacity-30 blur-3xl rounded-full"></div>
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-yellow-200 opacity-30 blur-2xl rounded-full"></div>
                  <div className="relative z-10">
                    <div className="mb-6">
                      <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-3">
                        Support & Assistance
                      </p>
                      <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">
                        Help Desk
                      </h1>
                      <p className="text-base md:text-lg text-gray-800 font-semibold mb-6">
                        Get assistance, find answers to common questions, and access support resources
                      </p>
                    </div>
                    <div className="relative pl-6 py-4">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-600 via-yellow-500 to-amber-600"></div>
                      <div className="absolute inset-0 bg-gradient-to-r from-amber-50/50 to-yellow-50/30 opacity-50"></div>
                      <p className="text-sm md:text-base text-gray-800 leading-relaxed relative z-10">
                        The Help Desk provides comprehensive support for all your questions and concerns regarding the Student Club-Hub platform. 
                        Access frequently asked questions, troubleshooting guides, and contact information for technical support. 
                        Our support team is available to assist you with any issues or inquiries you may have regarding platform functionality, 
                        event management, or account-related matters.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative p-8">
                <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-gray-50/40 opacity-50"></div>
                <div className="relative z-10">
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-12 h-12 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">Help Desk Coming Soon</h2>
                  <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
                    We're currently building a comprehensive help and support system. In the meantime, please contact your system administrator for assistance.
                  </p>
                  <div className="space-y-4 max-w-md mx-auto">
                    <div className="relative p-4 text-left">
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-50/60 to-white/40 backdrop-blur-sm opacity-70 rounded-lg"></div>
                      <h3 className="font-semibold text-gray-900 mb-2">Common Questions</h3>
                      <ul className="space-y-2 text-sm text-gray-600">
                        <li>• How do I register for an event?</li>
                        <li>• How can I create a club?</li>
                        <li>• Where can I find my QR codes?</li>
                        <li>• How do I update my profile?</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Floating Components - Always Visible */}
        <FloatingContextDock 
          activeTab={activeTab}
          onNavigate={handleNavigate}
          menuItems={menuItems}
        />
        <GeminiChatbot 
          onNavigate={handleNavigate}
          onLogout={onLogout}
          onSearch={(query) => {
            setSearchQuery(query);
            setActiveTab("home");
          }}
          onRegisterEvent={async (eventId) => {
            try {
              await registerForEvent(eventId);
            } catch (error) {
              console.error("Failed to register for event:", error);
            }
          }}
          onViewEvent={(eventId) => {
            const event = [...allEvents, ...events].find(e => e.id === eventId);
            if (event) {
              handleViewEventFullPage(event);
            }
          }}
          events={[...allEvents, ...events]}
          clubs={clubs}
        />
        </div>
      </div>
    </div>
  </div>
</div>
);
}
