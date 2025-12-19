import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api";
import Loader from "../../components/Loader";
import LogoutButton from "../../components/LogoutButton";
import "../../styles/DarkPattern.css";
import "../../styles/DesignSystem.css";

export default function UniversityDashboard() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [decisionForm, setDecisionForm] = useState({
    decision: "",
    message: "",
    leader_email: "",
    leader_password: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const [activeTab, setActiveTab] = useState("proposals");
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [calendarView, setCalendarView] = useState("month");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(null);
  const [loadingCalendar, setLoadingCalendar] = useState(false);
  const [universityCalendars, setUniversityCalendars] = useState([]);
  const [uploadingCalendar, setUploadingCalendar] = useState(false);
  const [calendarUploadFile, setCalendarUploadFile] = useState(null);
  const [calendarUploadName, setCalendarUploadName] = useState("University Calendar");

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

  // Handle sidebar hover for desktop
  const handleSidebarMouseEnter = () => {
    if (window.innerWidth >= 768) {
      setSidebarHovered(true);
    }
  };

  const handleSidebarMouseLeave = () => {
    if (window.innerWidth >= 768) {
      setSidebarHovered(false);
    }
  };

  useEffect(() => {
    if (activeTab === "proposals") {
      fetchRequests();
    } else if (activeTab === "calendar") {
      fetchCalendarEvents();
      fetchUniversityCalendars();
    } else if (activeTab === "profile") {
      fetchProfileData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, activeTab]);

  async function fetchUniversityCalendars() {
    try {
      const response = await API.get("/api/university/calendar");
      setUniversityCalendars(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Error fetching university calendars:", err);
      setUniversityCalendars([]);
    }
  }

  async function handleCalendarUpload() {
    if (!calendarUploadFile) {
      alert("Please select a calendar file (.ics)");
      return;
    }

    if (!calendarUploadFile.name.toLowerCase().endsWith('.ics')) {
      alert("Please select a valid .ics (iCal) file");
      return;
    }

    try {
      setUploadingCalendar(true);
      const formData = new FormData();
      formData.append('calendar_file', calendarUploadFile);
      formData.append('calendar_name', calendarUploadName);

      const response = await API.post("/api/university/calendar/upload", formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      alert(`Calendar uploaded successfully! Found ${response.data.events_found} events.`);
      setCalendarUploadFile(null);
      setCalendarUploadName("University Calendar");
      // Reset file input
      const fileInput = document.getElementById('calendar-file-input');
      if (fileInput) fileInput.value = '';
      await fetchUniversityCalendars();
      await fetchCalendarEvents();
    } catch (err) {
      console.error("Error uploading calendar:", err);
      const errorMsg = err.response?.data?.error || "Failed to upload calendar. Please try again.";
      alert(errorMsg);
    } finally {
      setUploadingCalendar(false);
    }
  }

  useEffect(() => {
    if (activeTab === "calendar") {
      fetchCalendarEvents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, calendarView]);

  async function fetchCalendarEvents() {
    try {
      setLoadingCalendar(true);
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      
      const startDate = firstDay.toISOString().split('T')[0];
      const endDate = lastDay.toISOString().split('T')[0];
      
      const response = await API.get(
        `/api/university/events/calendar?start_date=${startDate}&end_date=${endDate}`
      );
      setCalendarEvents(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Error fetching calendar events:", err);
      setCalendarEvents([]);
    } finally {
      setLoadingCalendar(false);
    }
  }

  // Auto-refresh data every 30 seconds to keep it synchronized
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      if (activeTab === "proposals") {
        fetchRequests();
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(refreshInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, statusFilter]);

  async function fetchRequests() {
    try {
      setLoading(true);
      const response = await API.get(
        `/api/university/club-requests?status=${statusFilter}`
      );
      setRequests(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Error fetching requests:", err);
      if (err.response?.status === 403) {
        setError("You don't have permission to access this page.");
      } else {
        setError("Failed to load club requests. Please try again.");
      }
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }

  const handleDecision = async (requestId) => {
    if (!decisionForm.decision) {
      setError("Please select a decision (Approve or Reject)");
      return;
    }

    if (decisionForm.decision === "approved" && (!decisionForm.leader_email || !decisionForm.leader_password)) {
      setError("Leader email and password are required for approval");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      await API.post(
        `/api/university/club-requests/${requestId}/decision`,
        decisionForm
      );
      alert(
        `Request ${decisionForm.decision} successfully! The proposer will be notified.`
      );
      setSelectedRequest(null);
      setDecisionForm({ decision: "", message: "", leader_email: "", leader_password: "" });
      // Refresh requests to ensure data consistency
      await fetchRequests();
    } catch (err) {
      const errorMsg =
        err.response?.data?.error || "Failed to submit decision.";
      setError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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
    return "U";
  };

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
                const universityEvents = dayEvents.filter(e => e.type === "university");
                const clubEvents = dayEvents.filter(e => e.type !== "university");
                
                return (
                  <div
                    key={dateKey}
                    onClick={() => onDateClick && onDateClick(new Date(dateKey))}
                    className={`${view === "week" ? "min-h-[120px]" : "aspect-square"} minimal-rounded border-2 p-2 cursor-pointer transition-all hover:shadow-md ${
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
        
        {/* Legend */}
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

  // Organize menu items by sections
  const menuSections = {
    main: [
      {
        id: "proposals",
        label: "Club Proposals",
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        ),
      },
    ],
    features: [
      {
        id: "calendar",
        label: "Event Calendar",
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        ),
      },
    ],
    general: [
      {
        id: "clubs",
        label: "Manage Clubs",
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        ),
        action: () => navigate("/university/clubs"),
      },
      {
        id: "profile",
        label: "My Profile",
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        ),
      },
    ],
  };

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === "pending").length,
    approved: requests.filter(r => r.status === "approved").length,
    rejected: requests.filter(r => r.status === "rejected").length,
  };

  if (loading && activeTab === "proposals") {
    return (
      <div className="container flex justify-center items-center min-h-screen">
        <div className="text-center">
          <Loader text="Loading" className="mx-auto mb-6" />
          <p className="text-2xl font-bold text-white mb-2">Loading Proposals</p>
          <p className="text-gray-300">Fetching club requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container min-h-screen relative overflow-hidden">
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
        
        .card-hover {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .card-hover:hover {
          transform: translateY(-8px) scale(1.02);
        }
        
        /* Unified Cool Curved Button Style */
        .cool-button {
          background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 50%, #60a5fa 100%);
          backdrop-filter: blur(40px) saturate(180%);
          -webkit-backdrop-filter: blur(40px) saturate(180%);
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 20px;
          box-shadow: 0 8px 32px 0 rgba(14, 165, 233, 0.3),
                      0 4px 16px 0 rgba(59, 130, 246, 0.2),
                      inset 0 1px 0 rgba(255, 255, 255, 0.4),
                      inset 0 -1px 0 rgba(255, 255, 255, 0.2);
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          position: relative;
          overflow: hidden;
          font-weight: 600;
          color: white;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }
        
        .cool-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
          transition: left 0.6s;
        }
        
        .cool-button:hover::before {
          left: 100%;
        }
        
        .cool-button:hover {
          background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 50%, #0ea5e9 100%);
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 16px 48px 0 rgba(14, 165, 233, 0.4),
                      0 8px 24px 0 rgba(59, 130, 246, 0.3),
                      inset 0 1px 0 rgba(255, 255, 255, 0.5);
        }
        
        .cool-button:active {
          transform: translateY(-1px) scale(0.98);
        }
        
        .cool-button-secondary {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(40px) saturate(180%);
          -webkit-backdrop-filter: blur(40px) saturate(180%);
          border: 2px solid rgba(14, 165, 233, 0.3);
          border-radius: 20px;
          box-shadow: 0 8px 32px 0 rgba(14, 165, 233, 0.15),
                      inset 0 1px 0 rgba(255, 255, 255, 0.9),
                      inset 0 -1px 0 rgba(255, 255, 255, 0.5);
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          position: relative;
          overflow: hidden;
          font-weight: 600;
          color: #0ea5e9;
        }
        
        .cool-button-secondary::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(14, 165, 233, 0.2), transparent);
          transition: left 0.6s;
        }
        
        .cool-button-secondary:hover::before {
          left: 100%;
        }
        
        .cool-button-secondary:hover {
          background: rgba(255, 255, 255, 0.95);
          border-color: rgba(14, 165, 233, 0.5);
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 16px 48px 0 rgba(14, 165, 233, 0.25),
                      inset 0 1px 0 rgba(255, 255, 255, 1);
        }
        
        .cool-button-secondary:active {
          transform: translateY(-1px) scale(0.98);
        }
        
        .glass-effect {
          background: rgba(248, 250, 252, 0.98);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-right: 1px solid rgba(203, 213, 225, 0.8);
          box-shadow: 2px 0 20px rgba(0, 0, 0, 0.05);
        }
        
        .sidebar-transition {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .sidebar-header-gradient {
          background: linear-gradient(135deg, rgba(14, 165, 233, 0.2) 0%, rgba(59, 130, 246, 0.15) 100%);
          border-bottom: 2px solid rgba(14, 165, 233, 0.2);
        }
        
        .sidebar-nav-item {
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        .sidebar-nav-item:hover {
          transform: translateX(5px);
        }
        
        .glass-sidebar {
          background: rgba(248, 250, 252, 0.98);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-right: 1px solid rgba(203, 213, 225, 0.8);
          box-shadow: 2px 0 20px rgba(0, 0, 0, 0.05);
        }
        
        .professional-card {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border: 1px solid rgba(14, 165, 233, 0.2);
          box-shadow: 0 1px 3px 0 rgba(14, 165, 233, 0.1), 0 1px 2px 0 rgba(59, 130, 246, 0.08);
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
          background: linear-gradient(90deg, #0ea5e9 0%, #3b82f6 50%, #60a5fa 100%);
        }
        
        .professional-card:hover {
          box-shadow: 0 4px 6px -1px rgba(14, 165, 233, 0.2), 0 2px 4px -1px rgba(59, 130, 246, 0.15);
          border-color: #0ea5e9;
        }
        
        .innovative-border {
          border: none;
          border-left: 4px solid #0ea5e9;
          box-shadow: 0 1px 3px 0 rgba(14, 165, 233, 0.2), 0 1px 2px 0 rgba(59, 130, 246, 0.15);
        }
        
        .minimal-rounded {
          border-radius: 20px;
        }
        
        .text-primary {
          color: #1e293b;
        }
      `}</style>

      <div className="relative min-h-screen w-full">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="md:hidden fixed top-4 left-4 z-50 p-3 cool-button-secondary minimal-rounded shadow-md hover:shadow-lg transition-all duration-300"
        >
          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {sidebarOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>

        {/* Backdrop Overlay for all screen sizes */}
        {(sidebarOpen || sidebarHovered) && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-md z-30 animate-fadeIn transition-all duration-300"
            onClick={() => {
              setSidebarOpen(false);
              setSidebarHovered(false);
            }}
            style={{ 
              pointerEvents: sidebarHovered ? 'none' : 'auto',
            }}
          />
        )}

        {/* Sidebar - Always Overlay */}
        <div 
          className={`sidebar-transition glass-sidebar shadow-2xl flex flex-col fixed top-0 left-0 h-screen z-40
            ${sidebarOpen || sidebarHovered ? 'w-72' : 'w-20'} 
            ${(sidebarOpen || sidebarHovered) ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            ${mounted ? 'animate-slideInRight' : 'initial-hidden'}`}
          onMouseEnter={handleSidebarMouseEnter}
          onMouseLeave={handleSidebarMouseLeave}
        >
          
        {/* Sidebar Header */}
        <div className="p-6 sidebar-header-gradient">
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
                  <p className="text-xs text-gray-500">University Dashboard</p>
                </div>
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="sidebar-toggle-btn p-2 cool-button-secondary minimal-rounded transition-all duration-300 ml-auto hidden md:block hover:scale-110"
            >
              <svg className={`w-5 h-5 text-gray-600 transition-transform duration-300 ${!sidebarOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
          </div>
        </div>

          {/* Modern Minimal Box Navigation */}
          <nav className="sidebar-content flex-1 p-4 overflow-y-auto">
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
                      setActiveTab(item.id);
                      setSidebarOpen(false);
                    }}
                    className={`
                    w-full group relative
                    ${(sidebarOpen || sidebarHovered) ? 'px-4 py-3' : 'px-3 py-3'}
                    transition-all duration-300 ease-out
                    ${activeTab === item.id
                      ? 'bg-white border-l-4 border-indigo-500 shadow-lg rounded-r-lg'
                      : 'bg-transparent hover:bg-white/50 border-l-4 border-transparent hover:border-indigo-300 rounded-r-lg hover:shadow-md'
                    }
                  `}
                    title={!sidebarOpen && !sidebarHovered ? item.label : ''}
                  >
                    {/* Left Border Indicator */}
                    <div className={`
                      absolute left-0 top-0 bottom-0 w-1 rounded-r-full
                      transition-all duration-300
                      ${activeTab === item.id
                        ? 'bg-gradient-to-b from-indigo-500 to-purple-500 opacity-100'
                        : 'bg-gradient-to-b from-indigo-300 to-purple-300 opacity-0 group-hover:opacity-50'
                      }
                    `}></div>
                    
                    {/* Content */}
                    <div className="relative flex items-center gap-3">
                      {/* Icon */}
                      <div className={`
                        flex-shrink-0 transition-all duration-300
                        ${activeTab === item.id
                          ? 'text-indigo-600 scale-110'
                          : 'text-gray-500 group-hover:text-indigo-500 group-hover:scale-110'
                        }
                      `}>
                        <div className="w-5 h-5">
                          {item.icon}
                        </div>
                      </div>
                      
                      {/* Label */}
                      {(sidebarOpen || sidebarHovered) && (
                        <div className="flex-1 min-w-0 text-left flex items-center justify-between">
                          <span className={`
                            block font-medium text-sm transition-colors duration-300
                            ${activeTab === item.id 
                              ? 'text-gray-900 font-semibold' 
                              : 'text-gray-600 group-hover:text-gray-900'
                            }
                          `}>
                            {item.label}
                          </span>
                        </div>
                      )}
                      
                      {/* Active Checkmark */}
                      {activeTab === item.id && (sidebarOpen || sidebarHovered) && (
                        <div className="flex-shrink-0">
                          <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center">
                            <svg className="w-3 h-3 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Tooltip for Collapsed State */}
                    {!sidebarOpen && !sidebarHovered && (
                      <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-50 shadow-xl">
                        {item.label}
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                      </div>
                    )}
                    
                    {/* Background Glow on Active */}
                    {activeTab === item.id && (
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
                      setActiveTab(item.id);
                      setSidebarOpen(false);
                    }}
                    className={`
                    w-full group relative
                    ${(sidebarOpen || sidebarHovered) ? 'px-4 py-3' : 'px-3 py-3'}
                    transition-all duration-300 ease-out
                    ${activeTab === item.id
                      ? 'bg-white border-l-4 border-indigo-500 shadow-lg rounded-r-lg'
                      : 'bg-transparent hover:bg-white/50 border-l-4 border-transparent hover:border-indigo-300 rounded-r-lg hover:shadow-md'
                    }
                  `}
                    title={!sidebarOpen && !sidebarHovered ? item.label : ''}
                  >
                    <div className={`
                      absolute left-0 top-0 bottom-0 w-1 rounded-r-full
                      transition-all duration-300
                      ${activeTab === item.id
                        ? 'bg-gradient-to-b from-indigo-500 to-purple-500 opacity-100'
                        : 'bg-gradient-to-b from-indigo-300 to-purple-300 opacity-0 group-hover:opacity-50'
                      }
                    `}></div>
                    
                    <div className="relative flex items-center gap-3">
                      <div className={`
                        flex-shrink-0 transition-all duration-300
                        ${activeTab === item.id
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
                            ${activeTab === item.id 
                              ? 'text-gray-900 font-semibold' 
                              : 'text-gray-600 group-hover:text-gray-900'
                            }
                          `}>
                            {item.label}
                          </span>
                        </div>
                      )}
                      
                      {activeTab === item.id && (sidebarOpen || sidebarHovered) && (
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
                    
                    {activeTab === item.id && (
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
                      } else {
                        setActiveTab(item.id);
                      }
                      setSidebarOpen(false);
                    }}
                    className={`
                    w-full group relative
                    ${(sidebarOpen || sidebarHovered) ? 'px-4 py-3' : 'px-3 py-3'}
                    transition-all duration-300 ease-out
                    ${activeTab === item.id
                      ? 'bg-white border-l-4 border-indigo-500 shadow-lg rounded-r-lg'
                      : 'bg-transparent hover:bg-white/50 border-l-4 border-transparent hover:border-indigo-300 rounded-r-lg hover:shadow-md'
                    }
                  `}
                    title={!sidebarOpen && !sidebarHovered ? item.label : ''}
                  >
                    <div className={`
                      absolute left-0 top-0 bottom-0 w-1 rounded-r-full
                      transition-all duration-300
                      ${activeTab === item.id
                        ? 'bg-gradient-to-b from-indigo-500 to-purple-500 opacity-100'
                        : 'bg-gradient-to-b from-indigo-300 to-purple-300 opacity-0 group-hover:opacity-50'
                      }
                    `}></div>
                    
                    <div className="relative flex items-center gap-3">
                      <div className={`
                        flex-shrink-0 transition-all duration-300
                        ${activeTab === item.id
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
                            ${activeTab === item.id 
                              ? 'text-gray-900 font-semibold' 
                              : 'text-gray-600 group-hover:text-gray-900'
                            }
                          `}>
                            {item.label}
                          </span>
                        </div>
                      )}
                      
                      {activeTab === item.id && (sidebarOpen || sidebarHovered) && (
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
                    
                    {activeTab === item.id && (
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
                      <p className="text-sm font-bold text-white truncate">University Admin</p>
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
          <div className="p-6 md:p-8 max-w-7xl mx-auto mt-16 md:mt-0">
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
                    
                    // Get user's name from email
                    let userName = "";
                    if (userEmail) {
                      userName = userEmail.split("@")[0];
                      userName = userName.charAt(0).toUpperCase() + userName.slice(1);
                    }
                    
                    return (
                      <div>
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-2">
                          {greeting}{userName ? `, ${userName}` : ""}! 👋
                        </h1>
                        <p className="text-lg md:text-xl text-gray-600">
                          Empower student initiatives - review proposals, cultivate communities, shape campus culture
                        </p>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            {activeTab === "proposals" && (
            <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 ${mounted ? 'animate-slideInRight delay-100' : 'initial-hidden'}`}>
              <div className="relative group">
                <div className="professional-card minimal-rounded p-6 card-hover">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-sky-500 to-blue-600 minimal-rounded flex items-center justify-center shadow-sm">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 font-semibold mb-1">Total Proposals</p>
                  <p className="text-4xl font-bold text-accent-600">
                    {stats.total}
                  </p>
                </div>
              </div>

              <div className="relative group">
                <div className="professional-card minimal-rounded p-6 card-hover">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-sky-500 to-blue-600 minimal-rounded flex items-center justify-center shadow-sm">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 font-semibold mb-1">Pending Review</p>
                  <p className="text-4xl font-bold text-accent-600">
                    {stats.pending}
                  </p>
                </div>
              </div>

              <div className="relative group">
                <div className="professional-card minimal-rounded p-6 card-hover">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-sky-500 to-blue-600 minimal-rounded flex items-center justify-center shadow-sm">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 font-semibold mb-1">Approved</p>
                  <p className="text-4xl font-bold text-accent-600">
                    {stats.approved}
                  </p>
                </div>
              </div>

              <div className="relative group">
                <div className="relative glass-effect minimal-rounded p-6 card-hover">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-sky-500 to-blue-600 minimal-rounded flex items-center justify-center shadow-sm">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 font-semibold mb-1">Rejected</p>
                  <p className="text-4xl font-bold text-red-600">
                    {stats.rejected}
                  </p>
                </div>
              </div>
            </div>
            )}

            {/* Status Filter */}
            {activeTab === "proposals" && (
            <div className={`glass-effect minimal-rounded shadow-lg p-6 mb-8 ${mounted ? 'animate-scaleIn delay-200' : 'initial-hidden'}`}>
              <div className="flex flex-wrap items-center gap-4">
                <span className="text-sm font-bold text-gray-900">
                  Filter by Status:
                </span>
                {["pending", "approved", "rejected"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-6 py-3 minimal-rounded font-semibold transition-colors ${
                      statusFilter === status
                        ? "bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-lg"
                        : "bg-white text-gray-700 hover:bg-gray-50 shadow-sm border border-gray-200"
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)} ({requests.filter((r) => r.status === status).length})
                  </button>
                ))}
              </div>
            </div>
            )}

            {error && activeTab === "proposals" && (
              <div className="bg-red-50 border-2 border-red-200 minimal-rounded p-4 mb-6 animate-fadeIn">
                <p className="text-sm text-red-800 font-semibold">{error}</p>
              </div>
            )}

            {/* Calendar Tab */}
            {activeTab === "calendar" && (
              <div className={`${mounted ? 'animate-fadeIn delay-400' : 'initial-hidden'}`}>
                {/* Calendar Upload Section */}
                <div className="bg-white minimal-rounded shadow-xl p-6 border border-gray-100 mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Upload University Calendar</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-2">
                        Calendar Name
                      </label>
                      <input
                        type="text"
                        value={calendarUploadName}
                        onChange={(e) => setCalendarUploadName(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 minimal-rounded focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all duration-300"
                        placeholder="University Calendar"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-2">
                        Calendar File (.ics)
                      </label>
                      <input
                        id="calendar-file-input"
                        type="file"
                        accept=".ics"
                        onChange={(e) => setCalendarUploadFile(e.target.files[0])}
                        className="w-full px-4 py-3 border-2 border-gray-200 minimal-rounded focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all duration-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      <p className="text-xs text-gray-600 mt-2">
                        Select a .ics (iCal) file from your system. The calendar events will be automatically parsed and added to your calendar.
                      </p>
                      {calendarUploadFile && (
                        <p className="text-sm text-green-600 mt-2 font-semibold">
                          Selected: {calendarUploadFile.name}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={handleCalendarUpload}
                      disabled={uploadingCalendar || !calendarUploadFile}
                      className="px-6 py-3 cool-button font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {uploadingCalendar ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Uploading...
                        </span>
                      ) : (
                        "Upload & Sync Calendar"
                      )}
                    </button>
                  </div>
                  
                  {/* Uploaded Calendars List */}
                  {universityCalendars.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h3 className="text-lg font-bold text-gray-900 mb-3">Uploaded Calendars</h3>
                      <div className="space-y-2">
                        {universityCalendars.map((cal) => (
                          <div key={cal.id} className="p-4 bg-blue-50 minimal-rounded border border-blue-200">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-bold text-gray-900">{cal.calendar_name}</h4>
                                <p className="text-sm text-gray-600">
                                  {cal.events_count} events • Last synced: {new Date(cal.last_synced).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-white minimal-rounded shadow-xl p-6 border border-gray-100 mb-6">
                  {/* Calendar Header */}
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                    <div className="flex items-center gap-4">
                      <h2 className="text-2xl font-bold text-gray-900">University Event Calendar</h2>
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
                                      {event.club_name && (
                                        <p className="text-sm text-gray-600 mb-2">{event.club_name}</p>
                                      )}
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
                                        <span className="flex items-center gap-1">
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                          </svg>
                                          {event.registration_count} registrations
                                        </span>
                                      </div>
                                      {event.description && (
                                        <p className="text-sm text-gray-700 mt-2">{event.description}</p>
                                      )}
                                    </div>
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

            {/* Proposals List */}
            {activeTab === "proposals" && (
              <>
            {requests.length === 0 ? (
              <div className="glass-effect minimal-rounded p-12 text-center shadow-xl">
                <div className="w-24 h-24 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg
                    className="w-12 h-12 text-indigo-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  No {statusFilter} Requests
                </h3>
                <p className="text-gray-600">
                  There are no {statusFilter} club requests at this time.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {requests.map((request, index) => (
                  <div
                    key={request.id}
                    className={`glass-effect minimal-rounded shadow-lg p-6 border-2 border-gray-100 card-hover ${mounted ? 'animate-scaleIn' : 'initial-hidden'}`}
                    style={{ animationDelay: `${0.3 + index * 0.1}s` }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                          {request.name}
                        </h3>
                        {request.category && (
                          <span className="inline-block px-3 py-1 text-xs font-bold bg-indigo-100 text-indigo-700 rounded-full">
                            {request.category}
                          </span>
                        )}
                      </div>
                      <span
                        className={`px-4 py-2 rounded-full text-xs font-bold shadow-sm ${
                          request.status === "pending"
                            ? "bg-yellow-500 text-white"
                            : request.status === "approved"
                            ? "bg-gradient-to-r from-sky-500 to-blue-600 text-white"
                            : "bg-gradient-to-r from-sky-500 to-blue-600 text-white"
                        }`}
                      >
                        {request.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">
                        <strong className="text-gray-900">Proposer:</strong> {request.proposer_name || "N/A"}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">{request.proposer_email || "N/A"}</p>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 mb-1">
                          Description:
                        </h4>
                        <p className="text-sm text-gray-700 line-clamp-3">{request.description}</p>
                      </div>

                      {request.mission && (
                        <div>
                          <h4 className="text-sm font-bold text-gray-900 mb-1">
                            Mission:
                          </h4>
                          <p className="text-sm text-gray-700 line-clamp-2">{request.mission}</p>
                        </div>
                      )}
                    </div>

                    {request.decision_message && (
                      <div
                        className={`mb-4 p-4 minimal-rounded border-2 ${
                          request.status === "approved"
                            ? "bg-accent-50 border-accent-300"
                            : "bg-red-50 border-red-300"
                        }`}
                      >
                        <p className="text-sm font-bold mb-1">Decision Message:</p>
                        <p className="text-sm">{request.decision_message}</p>
                        {request.decided_at && (
                          <p className="text-xs text-gray-500 mt-2">
                            Decided: {formatDate(request.decided_at)}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="pt-4 border-t border-gray-200">
                      <p className="text-xs text-gray-500 mb-3">
                        Submitted: {formatDate(request.created_at)}
                      </p>

                      {request.status === "pending" && (
                        <button
                          onClick={() => setSelectedRequest(request)}
                          className="w-full px-6 py-3 cool-button font-semibold"
                        >
                          Review & Decide
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            </>
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
                            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">{profile?.email?.split('@')[0] || userEmail?.split('@')[0] || "admin"}</h2>
                            <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            </button>
                          </div>

                          {/* Full Name */}
                          <div className="mb-4">
                            <p className="text-lg font-semibold text-gray-900">{profile?.name || "University Admin"}</p>
                          </div>

                          {/* Stats */}
                          <div className="flex items-center gap-6 mb-4">
                            <div className="text-center">
                              <span className="block text-lg font-bold text-gray-900">{stats.total || 0}</span>
                              <span className="text-sm text-gray-600">proposals</span>
                            </div>
                            <div className="text-center">
                              <span className="block text-lg font-bold text-gray-900">{stats.approved || 0}</span>
                              <span className="text-sm text-gray-600">approved</span>
                            </div>
                            <div className="text-center">
                              <span className="block text-lg font-bold text-gray-900">{stats.pending || 0}</span>
                              <span className="text-sm text-gray-600">pending</span>
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

            {/* Decision Modal */}
            {selectedRequest && (
              <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fadeIn backdrop-blur-sm">
                <div className="glass-effect minimal-rounded shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scaleIn">
                  <div className="p-8">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-3xl font-bold text-gray-900">
                        Review Club Proposal
                      </h2>
                      <button
                        onClick={() => {
                          setSelectedRequest(null);
                          setDecisionForm({ decision: "", message: "", leader_email: "", leader_password: "" });
                          setError("");
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                      >
                        <svg
                          className="w-6 h-6 text-gray-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>

                    <div className="space-y-4 mb-6">
                      <div className="p-4 bg-indigo-50 minimal-rounded border border-indigo-200">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          {selectedRequest.name}
                        </h3>
                        <p className="text-sm text-gray-700">
                          <strong>Proposer:</strong> {selectedRequest.proposer_name}{" "}
                          ({selectedRequest.proposer_email})
                        </p>
                      </div>

                      <div className="p-4 bg-gray-50 minimal-rounded">
                        <h4 className="text-sm font-bold text-gray-900 mb-2">
                          Description:
                        </h4>
                        <p className="text-sm text-gray-700">
                          {selectedRequest.description}
                        </p>
                      </div>

                      {selectedRequest.mission && (
                        <div className="p-4 bg-gray-50 minimal-rounded">
                          <h4 className="text-sm font-bold text-gray-900 mb-2">
                            Mission:
                          </h4>
                          <p className="text-sm text-gray-700">
                            {selectedRequest.mission}
                          </p>
                        </div>
                      )}

                      {selectedRequest.target_audience && (
                        <div className="p-4 bg-gray-50 minimal-rounded">
                          <h4 className="text-sm font-bold text-gray-900 mb-2">
                            Target Audience:
                          </h4>
                          <p className="text-sm text-gray-700">
                            {selectedRequest.target_audience}
                          </p>
                        </div>
                      )}

                      {selectedRequest.activities_plan && (
                        <div className="p-4 bg-gray-50 minimal-rounded">
                          <h4 className="text-sm font-bold text-gray-900 mb-2">
                            Planned Activities:
                          </h4>
                          <p className="text-sm text-gray-700">
                            {selectedRequest.activities_plan}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-bold text-gray-900 mb-3">
                          Decision <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                          <button
                            type="button"
                            onClick={() =>
                              setDecisionForm({ ...decisionForm, decision: "approved" })
                            }
                            className={`px-6 py-4 minimal-rounded font-semibold transition-colors ${
                              decisionForm.decision === "approved"
                                ? "bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-lg"
                                : "bg-accent-50 text-accent-700 border-2 border-accent-300 hover:bg-accent-100"
                            }`}
                          >
                            ✅ Approve
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setDecisionForm({ ...decisionForm, decision: "rejected" })
                            }
                            className={`px-6 py-4 minimal-rounded font-semibold transition-colors ${
                              decisionForm.decision === "rejected"
                                ? "bg-red-600 text-white shadow-sm"
                                : "bg-red-50 text-red-700 border-2 border-red-300 hover:bg-red-100"
                            }`}
                          >
                            ❌ Reject
                          </button>
                        </div>
                      </div>

                      {/* Leader Credentials (required if approved) */}
                      {decisionForm.decision === "approved" && (
                        <div className="space-y-4 p-6 bg-blue-50 border-2 border-blue-200 minimal-rounded">
                          <p className="text-sm font-bold text-blue-900 mb-3 flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Leader Account Credentials (will be shown to proposer)
                          </p>
                          <div>
                            <label className="block text-sm font-bold text-gray-900 mb-2">
                              Leader Email <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="email"
                              value={decisionForm.leader_email}
                              onChange={(e) =>
                                setDecisionForm({
                                  ...decisionForm,
                                  leader_email: e.target.value,
                                })
                              }
                              className="w-full px-4 py-3 border-2 border-blue-200 minimal-rounded focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all duration-300"
                              placeholder="leader@example.com"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-gray-900 mb-2">
                              Leader Password <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={decisionForm.leader_password}
                              onChange={(e) =>
                                setDecisionForm({
                                  ...decisionForm,
                                  leader_password: e.target.value,
                                })
                              }
                              className="w-full px-4 py-3 border-2 border-blue-200 minimal-rounded focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all duration-300"
                              placeholder="Enter a secure password"
                              required
                            />
                            <p className="text-xs text-blue-700 mt-2">
                              This will be the password the leader uses to login
                            </p>
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">
                          Decision Message (Optional)
                        </label>
                        <textarea
                          value={decisionForm.message}
                          onChange={(e) =>
                            setDecisionForm({
                              ...decisionForm,
                              message: e.target.value,
                            })
                          }
                          rows={3}
                          className="w-full px-4 py-3 border-2 border-gray-200 minimal-rounded focus:ring-4 focus:ring-indigo-200 focus:border-indigo-500 transition-all duration-300"
                          placeholder="Add a message to the proposer (optional)"
                        />
                      </div>

                      {error && (
                        <div className="bg-red-50 border-2 border-red-200 minimal-rounded p-4 animate-fadeIn">
                          <p className="text-sm text-red-800 font-semibold">{error}</p>
                        </div>
                      )}

                      <div className="flex items-center gap-4 pt-4">
                        <button
                          onClick={() => handleDecision(selectedRequest.id)}
                          disabled={submitting || !decisionForm.decision}
                          className={`flex-1 px-6 py-4 minimal-rounded font-semibold text-white text-lg transition-colors shadow-sm ${
                            submitting || !decisionForm.decision
                              ? "bg-gray-400 cursor-not-allowed"
                              : "bg-accent-600 hover:bg-accent-700"
                          }`}
                        >
                          {submitting ? (
                            <span className="flex items-center justify-center gap-2">
                              <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Processing...
                            </span>
                          ) : "Submit Decision"}
                        </button>
                        <button
                          onClick={() => {
                            setSelectedRequest(null);
                            setDecisionForm({ decision: "", message: "", leader_email: "", leader_password: "" });
                            setError("");
                          }}
                          className="px-6 py-4 border-2 border-gray-300 minimal-rounded font-bold text-gray-700 hover:bg-white transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
                        >
                          Cancel
                        </button>
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
