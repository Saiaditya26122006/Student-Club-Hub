import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api";
import Loader from "../../components/Loader";
import LogoutButton from "../../components/LogoutButton";
import "../../styles/DarkPattern.css";
import "../../styles/DesignSystem.css";
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard"); // dashboard, events, analytics
  const [aiInsights, setAiInsights] = useState(null);
  const [aiInsightsLoading, setAiInsightsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClub, setSelectedClub] = useState("all");
  const [viewMode, setViewMode] = useState("grid"); // "grid" or "list"
  const [selectedEvents, setSelectedEvents] = useState(new Set()); // For bulk actions
  const [calendarView, setCalendarView] = useState("month"); // "month" or "week"
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [loadingCalendar, setLoadingCalendar] = useState(false);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportType, setExportType] = useState("csv");
  const [showParticipantModal, setShowParticipantModal] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderEvent, setReminderEvent] = useState(null);
  const [reminderMessage, setReminderMessage] = useState("");
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [resources, setResources] = useState([]);
  const [eventStatusFilter, setEventStatusFilter] = useState("all"); // "all", "draft", "published", "cancelled"

  useEffect(() => {
    setMounted(true);
  }, []);

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

  // Fetch analytics from backend
  useEffect(() => {
    loadAnalytics();
    loadLeaderEvents();
    if (activeTab === "calendar") {
      loadCalendarEvents();
    }
    if (activeTab === "profile") {
      fetchProfileData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeTab === "calendar") {
      loadCalendarEvents();
    }
    if (activeTab === "profile") {
      fetchProfileData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate, calendarView, activeTab]);

  const loadCalendarEvents = async () => {
    try {
      setLoadingCalendar(true);
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      
      const startDate = firstDay.toISOString().split('T')[0];
      const endDate = lastDay.toISOString().split('T')[0];
      
      const response = await API.get(
        `/api/leader/calendar?start_date=${startDate}&end_date=${endDate}`
      );
      setCalendarEvents(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Error loading calendar events:", err);
      setCalendarEvents([]);
    } finally {
      setLoadingCalendar(false);
    }
  };

  // Auto-refresh data every 30 seconds to keep it synchronized
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      loadLeaderEvents();
      loadAnalytics();
      // Refresh event details if modal is open
      if (selectedEventDetails?.event?.id) {
        viewEventDetails(selectedEventDetails.event.id);
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(refreshInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEventDetails]);

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
      // Refresh data after deletion to ensure consistency
      await loadLeaderEvents();
      await loadAnalytics();
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

  // Profile states
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileUploading, setProfileUploading] = useState(false);
  const [profileEditMode, setProfileEditMode] = useState(false);
  const [profileFormData, setProfileFormData] = useState({
    name: "",
    bio: ""
  });
  const [previewImage, setPreviewImage] = useState(null);

  const handleLogout = () => {
    localStorage.removeItem("clubhub_token");
    localStorage.removeItem("clubhub_role");
    localStorage.removeItem("clubhub_user_email");
    navigate("/login");
  };

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
    if (userEmail) {
      return userEmail.charAt(0).toUpperCase();
    }
    return "L";
  };

  // Helper functions for new features
  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) {
      alert("No data to export");
      return;
    }
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(","),
      ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(","))
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  const exportRegistrations = async (eventId, format = "csv") => {
    try {
      const res = await API.get(`/api/leader/registrations/${eventId}`);
      const registrations = res.data.registrations || [];
      if (registrations.length === 0) {
        alert("No registrations to export");
        return;
      }
      const exportData = registrations.map(reg => ({
        Name: reg.participant_name || reg.email,
        Email: reg.email,
        "Registration Date": new Date(reg.timestamp).toLocaleDateString(),
        "Registration ID": reg.id
      }));
      exportToCSV(exportData, `event-${eventId}-registrations.csv`);
      alert(`Exported ${registrations.length} registrations successfully!`);
    } catch (err) {
      console.error("Export error:", err);
      alert("Failed to export registrations");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedEvents.size === 0) {
      alert("Please select events to delete");
      return;
    }
    const confirmDelete = window.confirm(
      `Delete ${selectedEvents.size} selected event(s)? This action cannot be undone.`
    );
    if (!confirmDelete) return;

    try {
      const deletePromises = Array.from(selectedEvents).map(eventId => 
        API.delete(`/api/events/${eventId}`).catch(err => {
          console.error(`Failed to delete event ${eventId}:`, err);
          return null;
        })
      );
      await Promise.all(deletePromises);
      setSelectedEvents(new Set());
      // Refresh data after bulk deletion to ensure consistency
      await loadLeaderEvents();
      await loadAnalytics();
      alert("Selected events deleted successfully");
    } catch (err) {
      console.error("Bulk delete error:", err);
      alert("Some events could not be deleted");
    }
  };

  const handleBulkStatusUpdate = async (newStatus) => {
    if (selectedEvents.size === 0) {
      alert("Please select events to update");
      return;
    }
    try {
      const updatePromises = Array.from(selectedEvents).map(eventId =>
        API.patch(`/api/events/${eventId}`, { status: newStatus }).catch(err => {
          console.error(`Failed to update event ${eventId}:`, err);
          return null;
        })
      );
      await Promise.all(updatePromises);
      const updatedCount = selectedEvents.size;
      setSelectedEvents(new Set());
      // Refresh data after bulk update to ensure consistency
      await loadLeaderEvents();
      await loadAnalytics();
      alert(`Updated ${updatedCount} event(s) status to ${newStatus}`);
    } catch (err) {
      console.error("Bulk update error:", err);
      alert("Failed to update events");
    }
  };

  const sendReminder = async (eventId, message) => {
    try {
      // This would call a backend endpoint to send reminders
      // For now, we'll simulate it
      alert(`Reminder sent to all registered participants for this event!`);
      setShowReminderModal(false);
      setReminderMessage("");
    } catch (err) {
      console.error("Send reminder error:", err);
      alert("Failed to send reminder");
    }
  };

  const toggleEventSelection = (eventId) => {
    const newSelected = new Set(selectedEvents);
    if (newSelected.has(eventId)) {
      newSelected.delete(eventId);
    } else {
      newSelected.add(eventId);
    }
    setSelectedEvents(newSelected);
  };

  const selectAllEvents = () => {
    const filteredEvents = events.filter(event => {
      const matchesSearch = !searchQuery || 
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (event.description && event.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesClub = selectedClub === "all" || event.club_name === selectedClub;
      const matchesStatus = eventStatusFilter === "all" || (event.status || "published") === eventStatusFilter;
      return matchesSearch && matchesClub && matchesStatus;
    });
    setSelectedEvents(new Set(filteredEvents.map(e => e.id)));
  };

  const clearSelection = () => {
    setSelectedEvents(new Set());
  };

  // Calendar Grid Component (same as participant)
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
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
      
      const calendarDays = [];
      for (let i = 0; i < startingDayOfWeek; i++) {
        calendarDays.push(null);
      }
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
      for (let i = 0; i < calendarDays.length; i += 7) {
        weeks.push(calendarDays.slice(i, i + 7));
      }
    } else if (view === "week") {
      const currentDate = new Date(year, month, day);
      const dayOfWeek = currentDate.getDay();
      const weekStart = new Date(currentDate);
      weekStart.setDate(currentDate.getDate() - dayOfWeek);
      
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
      <div className="calendar-container w-full">
        <div className={`grid grid-cols-7 gap-1 mb-2`}>
          {dayNames.map(day => (
            <div key={day} className="p-2 text-center font-bold text-gray-700 text-sm bg-gray-50 minimal-rounded">
              {day}
            </div>
          ))}
        </div>
        
        <div className={`grid grid-cols-7 gap-1`}>
          {weeks.map((week, weekIndex) => (
            <React.Fragment key={weekIndex}>
              {week.map((dayData, dayIndex) => {
                if (!dayData) {
                  return <div key={`empty-${dayIndex}`} className={`${view === "week" ? "min-h-[120px]" : "min-h-[100px]"} bg-gray-50 minimal-rounded border border-gray-100`}></div>;
                }
                
                const { day, dateKey, events: dayEvents, isToday, dayName } = dayData;
                const universityEvents = dayEvents.filter(e => e.type === "university");
                const clubEvents = dayEvents.filter(e => e.type !== "university");
                
                return (
                  <div
                    key={dateKey}
                    onClick={() => onDateClick && onDateClick(new Date(dateKey))}
                    className={`${view === "week" ? "min-h-[120px]" : "min-h-[100px]"} minimal-rounded border-2 p-2 cursor-pointer transition-all hover:shadow-md ${
                      isToday
                        ? 'bg-blue-100 border-blue-400'
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
                        {clubEvents.length > 0 && (
                          <div className="text-xs px-1.5 py-1 bg-blue-500 text-white minimal-rounded" title={clubEvents[0].title}>
                            {clubEvents[0].title}
                          </div>
                        )}
                        {universityEvents.length > 0 && clubEvents.length === 0 && (
                          <div className="text-xs px-1.5 py-1 bg-purple-500 text-white minimal-rounded" title={universityEvents[0].title}>
                            {universityEvents[0].title}
                          </div>
                        )}
                        {clubEvents.length > 1 && (
                          <div className="text-xs text-blue-600 px-1">
                            +{clubEvents.length - 1} more
                          </div>
                        )}
                        {universityEvents.length > 1 && (
                          <div className="text-xs text-purple-600 px-1">
                            +{universityEvents.length - 1} Uni
                          </div>
                        )}
                        {view === "week" && dayEvents.length > 0 && (
                          <div className="space-y-1 mt-1">
                            {dayEvents.slice(0, 3).map((event, idx) => (
                              <div
                                key={idx}
                                className={`text-xs px-1.5 py-0.5 minimal-rounded truncate ${
                                  event.type === "university"
                                    ? "bg-purple-100 text-purple-700"
                                    : "bg-blue-100 text-blue-700"
                                }`}
                                title={event.title}
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
        
        <div className="mt-6 flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 minimal-rounded"></div>
            <span>Club Event</span>
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

  const menuItems = [
    // MAIN MENU
    {
      id: "events",
      label: "My Events",
      section: "main",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      id: "dashboard",
      label: "Dashboard",
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
      id: "participants",
      label: "Participants",
      section: "features",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
    {
      id: "resources",
      label: "Resources",
      section: "features",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
    },
    // GENERAL
    {
      id: "profile",
      label: "Profile",
      section: "general",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

  if (loading) {
    return (
      <div className="container flex justify-center items-center min-h-screen">
        <div className="text-center">
          <Loader text="Loading" className="mx-auto mb-6" />
          <p className="text-2xl font-bold text-white mb-2">Loading Analytics</p>
          <p className="text-gray-300">Preparing your insights...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container min-h-screen relative overflow-hidden">
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
        
        @keyframes grid-move {
          0% {
            transform: translate(0, 0);
          }
          100% {
            transform: translate(50px, 50px);
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
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
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
        
        .hover-lift {
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        
        .hover-lift:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 20px 40px -12px rgba(0, 0, 0, 0.15);
        }
        
        .magnetic-effect {
          transition: transform 0.2s ease-out;
        }
        
        .magnetic-effect:hover {
          transform: scale(1.02);
        }
        
        .initial-hidden {
          opacity: 0;
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
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
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
        
        /* Unified Cool Curved Button Style */
        .cool-button {
          background: rgba(71, 85, 105, 0.9);
          backdrop-filter: blur(40px) saturate(170%);
          -webkit-backdrop-filter: blur(40px) saturate(170%);
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 20px;
          box-shadow: 0 8px 20px rgba(71, 85, 105, 0.25),
                      inset 0 1px 0 rgba(255, 255, 255, 0.2);
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          position: relative;
          overflow: hidden;
          font-weight: 600;
          color: white;
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
          border-radius: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
          font-weight: 600;
          color: #475569;
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
          background: #f8fafc;
          border-color: rgba(71, 85, 105, 0.4);
          color: rgba(51, 65, 85, 0.9);
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 8px 24px rgba(71, 85, 105, 0.2),
                      inset 0 1px 0 rgba(255, 255, 255, 0.6);
        }
        
        .cool-button-secondary:active {
          transform: translateY(-1px) scale(0.98);
        }
        
        .glass-effect {
          background: rgba(241, 245, 249, 0.8);
          backdrop-filter: blur(60px) saturate(180%);
          -webkit-backdrop-filter: blur(60px) saturate(180%);
          border: 2px solid rgba(203, 213, 225, 0.6);
          box-shadow: 0 4px 12px rgba(71, 85, 105, 0.1),
                      inset 0 1px 0 rgba(255, 255, 255, 0.6);
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
          background: rgba(71, 85, 105, 0.4);
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
          border-left: 4px solid rgba(71, 85, 105, 0.4);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
        }
        
        .geometric-card {
          clip-path: polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 0 100%);
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(203, 213, 225, 0.6);
        }
        
        .minimal-rounded {
          border-radius: 20px;
        }
        
        .asymmetric-card {
          border-radius: 0 20px 20px 0;
          border-left: 4px solid rgba(71, 85, 105, 0.4);
        }
        
        /* Hide scrollbar but keep functionality */
        .scrollbar-hide {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;  /* Chrome, Safari and Opera */
        }
        
        /* Text Color Classes */
        .text-gradient {
          color: #0f172a;
          font-weight: 700;
        }
        
        .text-primary {
          color: #1e293b;
        }
        
        .text-secondary {
          color: #475569;
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
      `}</style>

      <div className="flex min-h-screen relative z-10">
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

        {/* Backdrop Overlay - Blur effect when sidebar is open/hovered */}
        {(sidebarOpen || sidebarHovered) && (
          <div 
            className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-30 transition-all duration-300 ${
              sidebarHovered ? 'pointer-events-none' : ''
            }`}
            onClick={() => {
              if (window.innerWidth < 768) {
                setSidebarOpen(false);
              }
            }}
          />
        )}

        {/* Sidebar - Always Overlay */}
        <div 
          className={`sidebar-transition glass-sidebar shadow-2xl flex flex-col fixed top-0 left-0 h-screen z-40
            ${sidebarOpen || sidebarHovered ? 'w-72' : 'w-20'} 
            ${sidebarOpen || sidebarHovered ? 'translate-x-0' : '-translate-x-full'}
            ${mounted ? 'animate-slideInRight' : 'initial-hidden'}`}
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
          <div className="p-6 sidebar-header-gradient flex-shrink-0">
            <div className="flex items-center justify-between">
              {(sidebarOpen || sidebarHovered) && (
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 cool-button minimal-rounded flex items-center justify-center shadow-lg relative group">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-primary">
                      Club-Hub
                    </h2>
                    <p className="text-xs text-gray-500">Leader Dashboard</p>
                  </div>
                </div>
              )}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="sidebar-toggle-btn p-2 cool-button-secondary minimal-rounded transition-all duration-300 ml-auto hidden md:block hover:scale-110"
              >
                <svg className={`w-5 h-5 text-gray-600 transition-transform duration-300 ${!sidebarOpen && !sidebarHovered ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="sidebar-content flex-1 p-4 overflow-y-auto overflow-x-hidden scrollbar-hide min-h-0">
            <ul className="space-y-2">
              {/* MAIN MENU Section */}
              {(sidebarOpen || sidebarHovered) && (
                <li className="mb-3">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider px-4">MAIN MENU</h3>
                </li>
              )}
              {menuSections.main.map((item, index) => (
                <li 
                  key={item.id} 
                  className={`${mounted ? 'animate-fadeIn' : 'initial-hidden'}`} 
                  style={{ animationDelay: `${0.1 + index * 0.05}s` }}
                >
                  <button
                    onClick={() => {
                      if (item.action) {
                        item.action();
                      } else {
                        setActiveTab(item.id);
                      }
                      setSidebarOpen(false);
                    }}
                    className={`
                      w-full group relative
                      ${(sidebarOpen || sidebarHovered) ? 'px-4 py-3' : 'px-3 py-3'}
                      transition-all duration-300 ease-out
                      ${activeTab === item.id && !item.action
                        ? 'bg-white border-l-4 border-indigo-500 shadow-lg rounded-r-lg'
                        : 'bg-transparent hover:bg-white/50 border-l-4 border-transparent hover:border-indigo-300 rounded-r-lg hover:shadow-md'
                      }
                    `}
                    title={!sidebarOpen && !sidebarHovered ? item.label : ''}
                  >
                    <div className={`
                      absolute left-0 top-0 bottom-0 w-1 rounded-r-full
                      transition-all duration-300
                      ${activeTab === item.id && !item.action
                        ? 'bg-gradient-to-b from-indigo-500 to-purple-500 opacity-100'
                        : 'bg-gradient-to-b from-indigo-300 to-purple-300 opacity-0 group-hover:opacity-50'
                      }
                    `}></div>
                    
                    <div className="relative flex items-center gap-3">
                      <div className={`
                        flex-shrink-0 transition-all duration-300
                        ${activeTab === item.id && !item.action
                          ? 'text-indigo-600 scale-110'
                          : 'text-gray-500 group-hover:text-indigo-500 group-hover:scale-110'
                        }
                      `}>
                        <div className="w-5 h-5">
                          {item.icon}
                        </div>
                      </div>
                      
                      {(sidebarOpen || sidebarHovered) && (
                        <div className="flex-1 min-w-0 text-left flex items-center justify-between">
                          <span className={`
                            block font-medium text-sm transition-colors duration-300
                            ${activeTab === item.id && !item.action
                              ? 'text-gray-900 font-semibold' 
                              : 'text-gray-600 group-hover:text-gray-900'
                            }
                          `}>
                            {item.label}
                          </span>
                        </div>
                      )}
                      
                      {activeTab === item.id && !item.action && (sidebarOpen || sidebarHovered) && (
                        <div className="flex-shrink-0">
                          <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center">
                            <svg className="w-3 h-3 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {!sidebarOpen && !sidebarHovered && (
                      <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-50 shadow-xl">
                        {item.label}
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                      </div>
                    )}
                    
                    {activeTab === item.id && !item.action && (
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 rounded-r-lg -z-10"></div>
                    )}
                  </button>
                </li>
              ))}

              {/* FEATURES Section */}
              {(sidebarOpen || sidebarHovered) && (
                <li className="mt-6 mb-3">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider px-4">FEATURES</h3>
                </li>
              )}
              {menuSections.features.map((item, index) => (
                <li 
                  key={item.id} 
                  className={`${mounted ? 'animate-fadeIn' : 'initial-hidden'}`} 
                  style={{ animationDelay: `${0.1 + (menuSections.main.length + index) * 0.05}s` }}
                >
                  <button
                    onClick={() => {
                      if (item.action) {
                        item.action();
                      } else {
                        setActiveTab(item.id);
                      }
                      setSidebarOpen(false);
                    }}
                    className={`
                      w-full group relative
                      ${(sidebarOpen || sidebarHovered) ? 'px-4 py-3' : 'px-3 py-3'}
                      transition-all duration-300 ease-out
                      ${activeTab === item.id && !item.action
                        ? 'bg-white border-l-4 border-indigo-500 shadow-lg rounded-r-lg'
                        : 'bg-transparent hover:bg-white/50 border-l-4 border-transparent hover:border-indigo-300 rounded-r-lg hover:shadow-md'
                      }
                    `}
                    title={!sidebarOpen && !sidebarHovered ? item.label : ''}
                  >
                    <div className={`
                      absolute left-0 top-0 bottom-0 w-1 rounded-r-full
                      transition-all duration-300
                      ${activeTab === item.id && !item.action
                        ? 'bg-gradient-to-b from-indigo-500 to-purple-500 opacity-100'
                        : 'bg-gradient-to-b from-indigo-300 to-purple-300 opacity-0 group-hover:opacity-50'
                      }
                    `}></div>
                    
                    <div className="relative flex items-center gap-3">
                      <div className={`
                        flex-shrink-0 transition-all duration-300
                        ${activeTab === item.id && !item.action
                          ? 'text-indigo-600 scale-110'
                          : 'text-gray-500 group-hover:text-indigo-500 group-hover:scale-110'
                        }
                      `}>
                        <div className="w-5 h-5">
                          {item.icon}
                        </div>
                      </div>
                      
                      {(sidebarOpen || sidebarHovered) && (
                        <div className="flex-1 min-w-0 text-left flex items-center justify-between">
                          <span className={`
                            block font-medium text-sm transition-colors duration-300
                            ${activeTab === item.id && !item.action
                              ? 'text-gray-900 font-semibold' 
                              : 'text-gray-600 group-hover:text-gray-900'
                            }
                          `}>
                            {item.label}
                          </span>
                        </div>
                      )}
                      
                      {activeTab === item.id && !item.action && (sidebarOpen || sidebarHovered) && (
                        <div className="flex-shrink-0">
                          <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center">
                            <svg className="w-3 h-3 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {!sidebarOpen && !sidebarHovered && (
                      <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-50 shadow-xl">
                        {item.label}
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                      </div>
                    )}
                    
                    {activeTab === item.id && !item.action && (
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 rounded-r-lg -z-10"></div>
                    )}
                  </button>
                </li>
              ))}

              {/* GENERAL Section */}
              {(sidebarOpen || sidebarHovered) && (
                <li className="mt-6 mb-3">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider px-4">GENERAL</h3>
                </li>
              )}
              {menuSections.general.map((item, index) => (
                <li 
                  key={item.id} 
                  className={`${mounted ? 'animate-fadeIn' : 'initial-hidden'}`} 
                  style={{ animationDelay: `${0.1 + (menuSections.main.length + menuSections.features.length + index) * 0.05}s` }}
                >
                  <button
                    onClick={() => {
                      if (item.action) {
                        item.action();
                      } else if (item.id === "help-desk") {
                        alert("Help Desk - Coming soon!");
                        return;
                      } else if (item.id === "settings") {
                        alert("Settings - Coming soon!");
                        return;
                      } else {
                        setActiveTab(item.id);
                      }
                      setSidebarOpen(false);
                    }}
                    className={`
                      w-full group relative
                      ${(sidebarOpen || sidebarHovered) ? 'px-4 py-3' : 'px-3 py-3'}
                      transition-all duration-300 ease-out
                      ${activeTab === item.id && !item.action
                        ? 'bg-white border-l-4 border-indigo-500 shadow-lg rounded-r-lg'
                        : 'bg-transparent hover:bg-white/50 border-l-4 border-transparent hover:border-indigo-300 rounded-r-lg hover:shadow-md'
                      }
                    `}
                    title={!sidebarOpen && !sidebarHovered ? item.label : ''}
                  >
                    <div className={`
                      absolute left-0 top-0 bottom-0 w-1 rounded-r-full
                      transition-all duration-300
                      ${activeTab === item.id && !item.action
                        ? 'bg-gradient-to-b from-indigo-500 to-purple-500 opacity-100'
                        : 'bg-gradient-to-b from-indigo-300 to-purple-300 opacity-0 group-hover:opacity-50'
                      }
                    `}></div>
                    
                    <div className="relative flex items-center gap-3">
                      <div className={`
                        flex-shrink-0 transition-all duration-300
                        ${activeTab === item.id && !item.action
                          ? 'text-indigo-600 scale-110'
                          : 'text-gray-500 group-hover:text-indigo-500 group-hover:scale-110'
                        }
                      `}>
                        <div className="w-5 h-5">
                          {item.icon}
                        </div>
                      </div>
                      
                      {(sidebarOpen || sidebarHovered) && (
                        <div className="flex-1 min-w-0 text-left flex items-center justify-between">
                          <span className={`
                            block font-medium text-sm transition-colors duration-300
                            ${activeTab === item.id && !item.action
                              ? 'text-gray-900 font-semibold' 
                              : 'text-gray-600 group-hover:text-gray-900'
                            }
                          `}>
                            {item.label}
                          </span>
                        </div>
                      )}
                      
                      {activeTab === item.id && !item.action && (sidebarOpen || sidebarHovered) && (
                        <div className="flex-shrink-0">
                          <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center">
                            <svg className="w-3 h-3 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {!sidebarOpen && !sidebarHovered && (
                      <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-50 shadow-xl">
                        {item.label}
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                      </div>
                    )}
                    
                    {activeTab === item.id && !item.action && (
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 rounded-r-lg -z-10"></div>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* User Profile Section - Innovative Design */}
          <div className="p-4 border-t border-gray-200/50 bg-gradient-to-t from-gray-50/50 to-transparent">
            {sidebarOpen && userEmail ? (
              <div className="animate-fadeIn">
                <div className="relative bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-4 mb-3 shadow-lg cursor-pointer hover:scale-105 transition-transform duration-300 group">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg backdrop-blur-sm group-hover:rotate-12 transition-transform">
                        {userEmail.charAt(0).toUpperCase()}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">Leader</p>
                      <p className="text-xs text-indigo-100 truncate">{userEmail}</p>
                    </div>
                  </div>
                </div>
                <div className="flex justify-center">
                  <LogoutButton onClick={handleLogout} text="Logout" />
                </div>
              </div>
            ) : (
              <div className="flex justify-center">
                <div className="relative group">
                  <div 
                    onClick={handleLogout}
                    className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center cursor-pointer shadow-lg hover:scale-110 transition-transform duration-300"
                    title="Logout"
                  >
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </div>
                  {!sidebarOpen && !sidebarHovered && (
                    <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-50 shadow-xl">
                      Logout
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content - Fixed Position */}
        <div className="fixed inset-0 overflow-y-auto w-full bg-gradient-to-r from-purple-100 via-blue-50 to-purple-100" style={{ left: 0, right: 0, top: 0, bottom: 0, zIndex: 1 }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 mt-16 md:mt-0">
            {/* Welcome Message */}
            <div className="mb-8 relative overflow-hidden">
              <div className="relative bg-gradient-to-r from-purple-100 via-blue-50 to-purple-100 p-6 md:p-8 border border-purple-200">
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200 opacity-20 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-200 opacity-20 blur-2xl"></div>
                
                <div className="relative z-10">
                  {(() => {
                    const hour = new Date().getHours();
                    let greeting = "Hello";
                    if (hour < 12) greeting = "Good Morning";
                    else if (hour < 17) greeting = "Good Afternoon";
                    else greeting = "Good Evening";
                    
                    // Get user's name from profile or email
                    let userName = "";
                    if (profile?.name) {
                      userName = profile.name.split(" ")[0];
                    } else if (userEmail) {
                      userName = userEmail.split("@")[0];
                      userName = userName.charAt(0).toUpperCase() + userName.slice(1);
                    }
                    
                    return (
                      <div>
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-2">
                          {greeting}{userName ? `, ${userName}` : ""}! 👋
                        </h1>
                        <p className="text-lg md:text-xl text-gray-600">
                          {activeTab === "dashboard" 
                            ? "Track your events and get AI-powered insights to improve engagement"
                            : activeTab === "events"
                            ? "Create, edit, and manage your events with ease"
                            : activeTab === "calendar"
                            ? "Visual timeline of all your events"
                            : activeTab === "participants"
                            ? "Manage and communicate with event participants"
                            : activeTab === "resources"
                            ? "Upload and share event materials with participants"
                            : "Welcome to your leader dashboard"}
                        </p>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
            
            {/* Content Section */}
            <div className="relative z-10">


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
                        ? "bg-white text-primary border border-slate-200 shadow-sm"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    Bar
                  </button>
                  <button
                    onClick={() => setActiveChart("line")}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
                      activeChart === "line"
                        ? "bg-white text-primary shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Line
                  </button>
                  <button
                    onClick={() => setActiveChart("area")}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
                      activeChart === "area"
                        ? "bg-white text-primary shadow-sm"
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
          <div className="relative overflow-hidden minimal-rounded bg-gradient-to-r from-sky-500 to-blue-600 p-8 md:p-12 shadow-lg mb-8 border-l-4 border-sky-400/50">
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
                  className="px-6 py-3 bg-white text-primary font-semibold rounded-lg shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 whitespace-nowrap"
                >
                  {aiInsightsLoading ? (
                    <>
                      <div className="spinner" style={{ width: '24px', height: '24px', margin: 0 }}>
                        <span style={{ width: '10px', height: '4px', background: 'currentColor' }}></span>
                        <span style={{ width: '10px', height: '4px', background: 'currentColor' }}></span>
                        <span style={{ width: '10px', height: '4px', background: 'currentColor' }}></span>
                        <span style={{ width: '10px', height: '4px', background: 'currentColor' }}></span>
                      </div>
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
                    <div className="w-14 h-14 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg">
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
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Key Insights
                  </h3>
                  <ul className="space-y-3">
                    {aiInsights.key_insights.map((insight, index) => (
                      <li key={index} className="flex items-start gap-3 p-3 bg-blue-50 minimal-rounded border-l-4 border-blue-500 hover:shadow-sm transition">
                        <span className="w-8 h-8 bg-gradient-to-br from-sky-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 text-white text-sm font-bold shadow-sm">
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
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Actionable Recommendations
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {aiInsights.recommendations.map((rec, index) => (
                      <div key={index} className="flex items-start gap-3 p-4 bg-white minimal-rounded border-l-4 border-blue-500 shadow-sm hover:shadow-md transition">
                        <span className="w-8 h-8 bg-gradient-to-br from-sky-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 text-white text-sm font-bold shadow-sm">
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
              <div className="w-24 h-24 bg-gradient-to-br from-sky-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-md">
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
              <Loader text="Loading" className="mx-auto" />
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
                className="px-8 py-4 cool-button font-bold"
              >
                Create First Event
              </button>
            </div>
          ) : (
            <>
              {/* Enhanced Search and Filter Bar */}
              <div className="mb-8 space-y-4">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                  {/* Search Bar */}
                  <div className="relative flex-1 max-w-md w-full">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="Search events by title or description..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-200 minimal-rounded focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all text-slate-900"
                    />
                  </div>

                  {/* Club Filter */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <button
                      onClick={() => setSelectedClub("all")}
                      className={`px-4 py-2 minimal-rounded font-semibold transition-colors ${
                        selectedClub === "all"
                            ? "cool-button text-white shadow-lg"
                            : "cool-button-secondary"
                      }`}
                    >
                      All Clubs
                    </button>
                    {[...new Set(events.map(e => e.club_name).filter(Boolean))].map((clubName) => (
                      <button
                        key={clubName}
                        onClick={() => setSelectedClub(clubName)}
                        className={`px-4 py-2 minimal-rounded font-semibold transition-colors ${
                          selectedClub === clubName
                            ? "cool-button text-white shadow-lg"
                            : "cool-button-secondary"
                        }`}
                      >
                        {clubName}
                      </button>
                    ))}
                  </div>

                  {/* Status Filter */}
                  <div className="flex items-center gap-2">
                    <select
                      value={eventStatusFilter}
                      onChange={(e) => setEventStatusFilter(e.target.value)}
                      className="px-4 py-2 bg-white border-2 border-slate-200 minimal-rounded font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                    >
                      <option value="all">All Status</option>
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  {/* View Mode Toggle */}
                  <div className="flex items-center gap-2 bg-white border-2 border-gray-200 minimal-rounded p-1">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-2 minimal-rounded transition-colors ${
                        viewMode === "grid" ? "cool-button text-white" : "cool-button-secondary"
                      }`}
                      title="Grid View"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`p-2 minimal-rounded transition-colors ${
                        viewMode === "list" ? "cool-button text-white" : "cool-button-secondary"
                      }`}
                      title="List View"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Bulk Actions Bar */}
                <div className="flex items-center justify-between mb-4">
                  {selectedEvents.size > 0 ? (
                    <div className="bg-slate-50 border-2 border-slate-200 minimal-rounded p-4 flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-slate-800">
                          {selectedEvents.size} event(s) selected
                        </span>
                        <button
                          onClick={clearSelection}
                          className="text-sm text-slate-600 hover:text-slate-700 font-semibold"
                        >
                          Clear
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleBulkStatusUpdate("published")}
                          className="px-4 py-2 cool-button font-semibold text-sm"
                        >
                          Publish
                        </button>
                        <button
                          onClick={() => handleBulkStatusUpdate("cancelled")}
                          className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white minimal-rounded font-semibold text-sm transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleBulkDelete}
                          className="px-4 py-2 cool-button font-semibold text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={selectAllEvents}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 minimal-rounded font-semibold text-sm transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Select All
                    </button>
                  )}
                </div>

                {/* Results Count */}
                <div className="text-sm text-gray-600">
                  Showing <span className="font-semibold text-gray-900">
                    {events.filter(event => {
                      const matchesSearch = !searchQuery || 
                        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (event.description && event.description.toLowerCase().includes(searchQuery.toLowerCase()));
                      const matchesClub = selectedClub === "all" || event.club_name === selectedClub;
                      const matchesStatus = eventStatusFilter === "all" || (event.status || "published") === eventStatusFilter;
                      return matchesSearch && matchesClub && matchesStatus;
                    }).length}
                  </span> of {events.length} events
                </div>
              </div>

              {/* Enhanced Events Display */}
              {viewMode === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {events
                    .filter(event => {
                      const matchesSearch = !searchQuery || 
                        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (event.description && event.description.toLowerCase().includes(searchQuery.toLowerCase()));
                      const matchesClub = selectedClub === "all" || event.club_name === selectedClub;
                      const matchesStatus = eventStatusFilter === "all" || (event.status || "published") === eventStatusFilter;
                      return matchesSearch && matchesClub && matchesStatus;
                    })
                    .map((event, index) => (
                      <div
                        key={event.id}
                        className={`group relative professional-card minimal-rounded overflow-hidden card-hover ${mounted ? 'animate-scaleIn' : 'initial-hidden'} ${selectedEvents.has(event.id) ? 'ring-2 ring-slate-500' : ''}`}
                        style={{ animationDelay: `${0.1 + index * 0.05}s` }}
                      >
                        {/* Decorative Top Accent */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500"></div>
                        
                        <div className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-start gap-3 flex-1">
                              {/* Bulk Selection Checkbox */}
                              <input
                                type="checkbox"
                                checked={selectedEvents.has(event.id)}
                                onChange={() => toggleEventSelection(event.id)}
                                className="mt-1 w-5 h-5 text-primary border-gray-300 rounded focus:ring-slate-500"
                              />
                              <div className="flex-1">
                                <h3 className="text-xl font-bold text-gradient mb-1 line-clamp-2 group-hover:scale-105 transition-transform duration-300 inline-block">
                                  {event.title}
                                </h3>
                                <div className="flex items-center gap-2 mt-2">
                                  <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-md border border-blue-200">
                                    {event.club_name || "Uncategorized"}
                                  </span>
                                  <span className={`px-3 py-1 text-xs font-bold rounded-md border ${
                                    (event.status || "published") === "published" ? "bg-green-100 text-green-800 border-green-200" :
                                    (event.status || "published") === "draft" ? "bg-gray-100 text-gray-800 border-gray-200" :
                                    "bg-red-100 text-red-800 border-red-200"
                                  }`}>
                                    {(event.status || "published").toUpperCase()}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2 ml-3">
                              <span className="px-3 py-1 text-xs bg-green-100 text-green-700 minimal-rounded font-bold border border-green-200 shadow-sm">
                                {event.registration_count || 0} 👥
                              </span>
                              <span className="px-3 py-1 text-xs bg-gray-100 text-gray-700 minimal-rounded font-bold border border-gray-200 shadow-sm">
                                {event.view_count || 0} 👁️
                              </span>
                            </div>
                          </div>

                          {event.description && (
                            <p className="text-gray-700 mb-4 line-clamp-2 text-sm leading-relaxed">
                              {event.description}
                            </p>
                          )}

                          <div className="space-y-2 mb-4">
                            <div className="flex items-center gap-2 text-slate-700 bg-blue-50 p-2.5 minimal-rounded border border-blue-200">
                              <svg className="w-4 h-4 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span className="text-sm font-medium">{event.date}</span>
                              <span className="text-gray-400">•</span>
                              <span className="text-sm font-medium">{displayTime(event.time)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-700 bg-blue-50 p-2.5 minimal-rounded border border-blue-200">
                              <svg className="w-4 h-4 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              </svg>
                              <span className="text-sm font-medium truncate">{event.location}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => viewEventDetails(event.id)}
                                className="text-primary font-semibold hover:text-slate-700 transition flex items-center gap-1 text-sm group-hover:gap-2"
                              >
                                View Details
                                <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </button>
                              <button
                                onClick={() => {
                                  setReminderEvent(event);
                                  setShowReminderModal(true);
                                }}
                                className="text-primary font-semibold hover:text-slate-700 transition text-sm"
                                title="Send Reminder"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                              </button>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => exportRegistrations(event.id)}
                                className="px-3 py-1.5 bg-blue-100 text-blue-700 hover:bg-blue-200 minimal-rounded font-semibold text-xs transition-all duration-300 border border-blue-200"
                                title="Export Registrations"
                              >
                                Export
                              </button>
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
                      </div>
                    ))}
                </div>
              ) : (
                // List View
                <div className="space-y-4">
                  {events
                    .filter(event => {
                      const matchesSearch = !searchQuery || 
                        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (event.description && event.description.toLowerCase().includes(searchQuery.toLowerCase()));
                      const matchesClub = selectedClub === "all" || event.club_name === selectedClub;
                      const matchesStatus = eventStatusFilter === "all" || (event.status || "published") === eventStatusFilter;
                      return matchesSearch && matchesClub && matchesStatus;
                    })
                    .map((event, index) => (
                      <div
                        key={event.id}
                        className={`group professional-card minimal-rounded p-6 card-hover ${mounted ? 'animate-fadeInUp' : 'initial-hidden'}`}
                        style={{ animationDelay: `${0.1 + index * 0.05}s` }}
                      >
                        <div className="flex items-center gap-6">
                          {/* Bulk Selection Checkbox */}
                          <input
                            type="checkbox"
                            checked={selectedEvents.has(event.id)}
                            onChange={() => toggleEventSelection(event.id)}
                            className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-slate-500"
                          />
                          
                          {/* Event Icon */}
                          <div className="relative flex-shrink-0">
                            <div className="w-20 h-20 bg-blue-500 minimal-rounded flex items-center justify-center text-white text-3xl font-bold shadow-md group-hover:scale-110 transition-transform duration-300">
                              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          </div>

                          {/* Event Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="text-2xl font-bold text-gradient group-hover:scale-105 transition-transform duration-300 inline-block mb-1">
                                  {event.title}
                                </h3>
                                <div className="flex items-center gap-2">
                                  <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-md border border-blue-200">
                                    {event.club_name || "Uncategorized"}
                                  </span>
                                  <span className={`px-3 py-1 text-xs font-bold rounded-md border ${
                                    (event.status || "published") === "published" ? "bg-green-100 text-green-800 border-green-200" :
                                    (event.status || "published") === "draft" ? "bg-gray-100 text-gray-800 border-gray-200" :
                                    "bg-red-100 text-red-800 border-red-200"
                                  }`}>
                                    {(event.status || "published").toUpperCase()}
                                  </span>
                                </div>
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
                              <p className="text-gray-600 mb-4 line-clamp-2 leading-relaxed">
                                {event.description}
                              </p>
                            )}
                            <div className="flex items-center gap-6 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span className="font-semibold">{event.date} • {displayTime(event.time)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                </svg>
                                <span className="font-semibold truncate">{event.location}</span>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex-shrink-0 flex flex-col gap-2">
                            <div className="flex gap-2">
                              <button
                                onClick={() => viewEventDetails(event.id)}
                                className="px-4 py-2 bg-accent-600 hover:bg-accent-700 text-white minimal-rounded font-semibold transition-colors shadow-sm text-sm whitespace-nowrap"
                              >
                                View Details
                              </button>
                              <button
                                onClick={() => {
                                  setReminderEvent(event);
                                  setShowReminderModal(true);
                                }}
                                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white minimal-rounded font-semibold transition-colors shadow-sm text-sm"
                                title="Send Reminder"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                              </button>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => exportRegistrations(event.id)}
                                className="px-3 py-1.5 bg-blue-100 text-blue-700 hover:bg-blue-200 minimal-rounded font-semibold text-xs transition-all duration-300 border border-blue-200"
                                title="Export Registrations"
                              >
                                Export
                              </button>
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
                      </div>
                    ))}
                </div>
              )}
            </>
          )}
        </div>
        )}

        {/* Calendar View */}
        {activeTab === "calendar" && (
          <div className={`mb-10 ${mounted ? 'animate-fadeIn delay-200' : 'initial-hidden'}`}>
            <div className="professional-card minimal-rounded p-6">
              {/* Calendar Header */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-bold text-gray-900">Event Calendar</h2>
                  <button
                    onClick={() => {
                      const newDate = new Date(currentDate);
                      if (calendarView === "week") {
                        newDate.setDate(newDate.getDate() - 7);
                      } else {
                        newDate.setMonth(newDate.getMonth() - 1);
                      }
                      setCurrentDate(newDate);
                    }}
                    className="p-2 cool-button-secondary minimal-rounded"
                    title={calendarView === "week" ? "Previous week" : "Previous month"}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setCurrentDate(new Date())}
                    className="px-4 py-2 cool-button-secondary minimal-rounded font-semibold text-sm"
                  >
                    Today
                  </button>
                  <button
                    onClick={() => {
                      const newDate = new Date(currentDate);
                      if (calendarView === "week") {
                        newDate.setDate(newDate.getDate() + 7);
                      } else {
                        newDate.setMonth(newDate.getMonth() + 1);
                      }
                      setCurrentDate(newDate);
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
                          const weekStart = new Date(currentDate);
                          weekStart.setDate(currentDate.getDate() - currentDate.getDay());
                          const weekEnd = new Date(weekStart);
                          weekEnd.setDate(weekStart.getDate() + 6);
                          return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
                        })()
                      : currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                    }
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCalendarView(calendarView === "month" ? "week" : "month")}
                    className={`px-4 py-2 minimal-rounded font-semibold ${calendarView === "month" ? "cool-button text-white" : "cool-button-secondary"}`}
                  >
                    {calendarView === "month" ? "Month" : "Week"}
                  </button>
                </div>
              </div>

              {loadingCalendar ? (
                <div className="text-center py-20">
                  <Loader text="Loading" className="mx-auto mb-4" />
                  <p className="text-gray-600">Loading calendar...</p>
                        </div>
              ) : calendarEvents.length === 0 ? (
                <div className="text-center py-20">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-600 text-lg font-semibold mb-2">No events found</p>
                  <p className="text-gray-500">Create events to see them on the calendar</p>
                </div>
              ) : (
                <>
                  <CalendarGrid
                    events={calendarEvents}
                    selectedDate={currentDate}
                    view={calendarView}
                    onDateClick={(date) => {
                      setCurrentDate(date);
                      setSelectedCalendarDate(date.toISOString().split('T')[0]);
                    }}
                  />
                  
                  {/* Events for Selected Date */}
                  {selectedCalendarDate && (
                    <div className="mt-6 bg-white minimal-rounded shadow-lg p-6 border border-gray-200">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-gray-900">
                          Events on {new Date(selectedCalendarDate).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
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
                              className={`p-4 minimal-rounded border-2 ${
                                event.type === "university"
                                  ? "bg-purple-50 border-purple-300"
                                  : "bg-blue-50 border-blue-300"
                          }`}
                        >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-bold text-gray-900">{event.title}</h4>
                                    {event.type === "university" && (
                                      <span className="px-2 py-0.5 bg-purple-500 text-white text-xs font-bold minimal-rounded">
                                        University
                                      </span>
                                    )}
                                    {event.club_category && (
                                      <span className="px-2 py-0.5 bg-blue-500 text-white text-xs font-bold minimal-rounded">
                                        {event.club_category}
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
                                    {event.registration_count !== undefined && (
                                      <span className="flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                        {event.registration_count} registrations
                                      </span>
                                    )}
                                </div>
                                  {event.description && (
                                    <p className="text-sm text-gray-700 mt-2">{event.description}</p>
                                  )}
                                </div>
                                {event.type !== "university" && (
                                  <div className="flex flex-col items-end gap-2 ml-4">
                              <button
                                      onClick={() => viewEventDetails(event.id)}
                                      className="px-3 py-1 cool-button text-white text-xs font-bold minimal-rounded"
                              >
                                      View Details
                              </button>
                                  </div>
                            )}
                          </div>
                      </div>
                    ))}
                        {calendarEvents.filter(e => e.date === selectedCalendarDate).length === 0 && (
                          <p className="text-center text-gray-500 py-8">No events on this date</p>
                                  )}
                  </div>
                </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Participant Management */}
        {activeTab === "participants" && (
          <div className={`mb-10 ${mounted ? 'animate-fadeIn delay-200' : 'initial-hidden'}`}>
            <div className="professional-card minimal-rounded p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">All Participants</h2>
              {events.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">No events yet. Create events to see participants.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {events.map(event => (
                    <div key={event.id} className="border border-gray-200 minimal-rounded p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-bold text-gray-900">{event.title}</h3>
                        <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-semibold minimal-rounded">
                          {event.registration_count || 0} participants
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          viewEventDetails(event.id);
                          setShowParticipantModal(true);
                        }}
                        className="text-accent-600 hover:text-accent-700 font-semibold text-sm flex items-center gap-1"
                      >
                        View Participants
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Advanced Analytics */}
        {activeTab === "analytics" && (
          <div className={`mb-10 ${mounted ? 'animate-fadeIn delay-200' : 'initial-hidden'}`}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Conversion Rate Card */}
              <div className="professional-card minimal-rounded p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Conversion Rate</h3>
                <div className="space-y-4">
                  {eventChartData.map(event => (
                    <div key={event.fullName} className="border-l-4 border-accent-600 pl-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-gray-900">{event.name}</span>
                        <span className="text-accent-600 font-bold">{event.conversionRate}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-accent-600 h-2 rounded-full"
                          style={{ width: `${Math.min(parseFloat(event.conversionRate), 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Engagement Metrics */}
              <div className="professional-card minimal-rounded p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Engagement Metrics</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 minimal-rounded border border-green-200">
                    <span className="font-semibold text-gray-900">Total Registrations</span>
                    <span className="text-2xl font-bold text-green-600">{totalRegistrations}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-blue-50 minimal-rounded border border-blue-200">
                    <span className="font-semibold text-gray-900">Total Views</span>
                    <span className="text-2xl font-bold text-blue-600">{totalViews}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-purple-50 minimal-rounded border border-purple-200">
                    <span className="font-semibold text-gray-900">Average per Event</span>
                    <span className="text-2xl font-bold text-purple-600">
                      {events.length > 0 ? (totalRegistrations / events.length).toFixed(1) : 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Best Performing Events */}
            <div className="professional-card minimal-rounded p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Best Performing Events</h3>
              <div className="space-y-3">
                {[...eventChartData]
                  .sort((a, b) => b.registrations - a.registrations)
                  .slice(0, 5)
                  .map((event, index) => (
                    <div key={event.fullName} className="flex items-center gap-4 p-4 bg-gray-50 minimal-rounded border border-gray-200">
                      <div className="w-10 h-10 bg-accent-600 minimal-rounded flex items-center justify-center text-white font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{event.fullName}</p>
                        <p className="text-sm text-gray-600">{event.registrations} registrations • {event.views} views</p>
                      </div>
                      <div className="text-right">
                        <p className="text-accent-600 font-bold">{event.conversionRate}%</p>
                        <p className="text-xs text-gray-500">conversion</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Resources Library */}
        {activeTab === "resources" && (
          <div className={`mb-10 ${mounted ? 'animate-fadeIn delay-200' : 'initial-hidden'}`}>
            <div className="professional-card minimal-rounded p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Resource Library</h2>
                <button
                  onClick={() => setShowResourceModal(true)}
                  className="px-4 py-2 bg-accent-600 hover:bg-accent-700 text-white minimal-rounded font-semibold transition-colors"
                >
                  Upload Resource
                </button>
              </div>
              {resources.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-300 minimal-rounded">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-gray-600 mb-2">No resources uploaded yet</p>
                  <p className="text-sm text-gray-500">Upload materials to share with event participants</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {resources.map((resource, index) => (
                    <div key={index} className="border border-gray-200 minimal-rounded p-4 hover:shadow-md transition">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-accent-100 minimal-rounded flex items-center justify-center">
                          <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{resource.name}</p>
                          <p className="text-xs text-gray-500">{resource.size}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="px-3 py-1 bg-accent-100 text-accent-700 minimal-rounded text-sm font-semibold hover:bg-accent-200 transition-colors">
                          Share
                        </button>
                        <button className="px-3 py-1 bg-gray-100 text-gray-700 minimal-rounded text-sm font-semibold hover:bg-gray-200 transition-colors">
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">
                    Registrations ({selectedEventDetails.registrations.length})
                  </h3>
                  <button
                    onClick={() => exportRegistrations(selectedEventDetails.event.id)}
                    className="px-4 py-2 bg-accent-600 hover:bg-accent-700 text-white minimal-rounded font-semibold text-sm transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export CSV
                  </button>
                </div>
                {detailsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader text="Loading" />
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
                        <div className="flex items-center gap-4 flex-1">
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
                          <div className="flex-1">
                            <p className="font-bold text-gray-900">
                              {reg.participant_name || reg.email}
                            </p>
                            <p className="text-sm text-gray-600">{reg.email}</p>
                            {reg.participant_bio && (
                              <p className="text-xs text-gray-500 mt-1 line-clamp-1">{reg.participant_bio}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-xs text-gray-500">Registered</p>
                            <p className="text-sm font-semibold text-gray-700">
                              {new Date(reg.timestamp).toLocaleDateString()}
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedParticipant(reg);
                              setShowParticipantModal(true);
                            }}
                            className="px-3 py-1.5 bg-blue-100 text-blue-700 hover:bg-blue-200 minimal-rounded text-xs font-semibold transition-colors"
                            title="View Profile"
                          >
                            Profile
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Reminder Modal */}
        {showReminderModal && reminderEvent && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fadeIn backdrop-blur-sm">
            <div className="glass-effect minimal-rounded shadow-2xl max-w-md w-full p-6 animate-scaleIn border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Send Reminder</h3>
                <button
                  onClick={() => {
                    setShowReminderModal(false);
                    setReminderEvent(null);
                    setReminderMessage("");
                  }}
                  className="p-2 hover:bg-gray-100 minimal-rounded transition"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Send a reminder to all registered participants for: <span className="font-semibold">{reminderEvent.title}</span>
              </p>
              <textarea
                value={reminderMessage}
                onChange={(e) => setReminderMessage(e.target.value)}
                placeholder="Enter reminder message (optional - default message will be sent if left empty)..."
                className="w-full p-3 border-2 border-gray-200 minimal-rounded mb-4 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                rows="4"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    sendReminder(reminderEvent.id, reminderMessage);
                  }}
                  className="flex-1 px-4 py-2 bg-accent-600 hover:bg-accent-700 text-white minimal-rounded font-semibold transition-colors"
                >
                  Send Reminder
                </button>
                <button
                  onClick={() => {
                    setShowReminderModal(false);
                    setReminderEvent(null);
                    setReminderMessage("");
                  }}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 minimal-rounded font-semibold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Resource Upload Modal */}
        {showResourceModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fadeIn backdrop-blur-sm">
            <div className="glass-effect minimal-rounded shadow-2xl max-w-md w-full p-6 animate-scaleIn border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Upload Resource</h3>
                <button
                  onClick={() => setShowResourceModal(false)}
                  className="p-2 hover:bg-gray-100 minimal-rounded transition"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="border-2 border-dashed border-gray-300 minimal-rounded p-8 text-center">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-gray-600 mb-2">Drag and drop files here</p>
                <p className="text-sm text-gray-500 mb-4">or</p>
                <input
                  type="file"
                  className="hidden"
                  id="resource-upload"
                  onChange={(e) => {
                    // Handle file upload
                    const file = e.target.files[0];
                    if (file) {
                      setResources([...resources, { name: file.name, size: (file.size / 1024).toFixed(2) + ' KB' }]);
                      setShowResourceModal(false);
                    }
                  }}
                />
                <label
                  htmlFor="resource-upload"
                  className="inline-block px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white minimal-rounded font-semibold cursor-pointer transition-colors shadow-lg"
                >
                  Browse Files
                </label>
              </div>
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
                {/* Profile Card - Instagram Style */}
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden border-2 border-gray-200 p-8">
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
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
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
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">{profile?.email?.split('@')[0] || userEmail?.split('@')[0] || "leader"}</h2>
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </button>
                      </div>

                      {/* Full Name */}
                      <div className="mb-4">
                        <p className="text-lg font-semibold text-gray-900">{profile?.name || "Leader"}</p>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-6 mb-4">
                        <div className="text-center">
                          <span className="block text-lg font-bold text-gray-900">{events.length || 0}</span>
                          <span className="text-sm text-gray-600">events</span>
                        </div>
                        <div className="text-center">
                          <span className="block text-lg font-bold text-gray-900">{overview?.total_registrations || 0}</span>
                          <span className="text-sm text-gray-600">registrations</span>
                        </div>
                        <div className="text-center">
                          <span className="block text-lg font-bold text-gray-900">{overview?.total_events || 0}</span>
                          <span className="text-sm text-gray-600">total</span>
                        </div>
                      </div>

                      {/* Email/Bio */}
                      <div className="mb-4">
                        <p className="text-gray-700">{profile?.email || userEmail}</p>
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
                      className="flex-1 px-4 py-2.5 bg-white border-2 border-gray-300 hover:bg-gray-50 text-gray-900 font-semibold rounded-lg transition text-sm"
                    >
                      {profileEditMode ? "Cancel" : "Edit profile"}
                    </button>
                  </div>

                  {/* Edit Mode Form */}
                  {profileEditMode && (
                    <div className="mb-6 p-6 bg-gray-50 rounded-2xl border-2 border-gray-200">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                          <input
                            type="text"
                            value={profileFormData.name}
                            onChange={(e) => setProfileFormData({ ...profileFormData, name: e.target.value })}
                            className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500"
                            placeholder="Enter your name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Bio</label>
                          <textarea
                            value={profileFormData.bio}
                            onChange={(e) => setProfileFormData({ ...profileFormData, bio: e.target.value })}
                            className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500"
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
                </div>
              </>
            )}
          </div>
        )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
