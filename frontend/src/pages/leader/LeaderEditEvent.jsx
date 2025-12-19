import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../../api";
import "../../styles/DarkPattern.css";
import "../../styles/DesignSystem.css";

export default function LeaderEditEvent() {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [clubs, setClubs] = useState([]);
  const [loadingClubs, setLoadingClubs] = useState(true);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [form, setForm] = useState({
    club_id: "",
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
    poster_image: "",
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [mounted, setMounted] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [showCanvaModal, setShowCanvaModal] = useState(false);
  const [canvaDesignUrl, setCanvaDesignUrl] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function loadClubs() {
      try {
        setLoadingClubs(true);
        const res = await API.get("/api/clubs");
        const list = Array.isArray(res.data) ? res.data : [];
        setClubs(list);
      } catch (err) {
        console.error("Error loading clubs:", err);
        alert("Could not load clubs. Make sure you are logged in and backend is running.");
      } finally {
        setLoadingClubs(false);
      }
    }
    loadClubs();
  }, []);

  useEffect(() => {
    async function loadEvent() {
      try {
        setLoadingEvent(true);
        const res = await API.get(`/api/events/${eventId}`);
        const event = res.data;
        setForm({
          club_id: String(event.club_id),
          title: event.title,
          description: event.description || "",
          date: event.date,
          time: event.time?.slice(0, 5) || "",
          location: event.location,
          poster_image: event.poster_image || "",
        });
      } catch (err) {
        console.error("Error loading event:", err);
        alert("Unable to load event details.");
        navigate("/leader");
      } finally {
        setLoadingEvent(false);
      }
    }
    loadEvent();
  }, [eventId, navigate]);

  const validate = () => {
    if (!form.title || form.title.trim().length < 3) return "Title must be at least 3 characters.";
    if (!form.date) return "Please select a date.";
    if (!form.time) return "Please select a time.";
    if (!form.location) return "Please add a location.";
    return null;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setMsg("");
  };

  const handleFileSelect = async (file) => {
    if (!file) return;
    
    // Validate file type
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setMsg("Invalid file type. Please upload PNG, JPG, JPEG, GIF, or WEBP images.");
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMsg("File size too large. Please upload an image smaller than 5MB.");
      return;
    }
    
    setSelectedFile(file);
    setMsg("");
    
    // Upload file immediately
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await API.post("/api/events/upload-poster", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      
      // Set the image URL in the form
      const imageUrl = response.data.url;
      setForm((prev) => ({ ...prev, poster_image: imageUrl }));
      setMsg("Poster uploaded successfully!");
    } catch (err) {
      console.error("Upload error:", err);
      setMsg(err.response?.data?.error || "Failed to upload poster. Please try again.");
      setSelectedFile(null);
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    const validation = validate();
    if (validation) {
      setMsg(validation);
      return;
    }
    try {
      setSaving(true);
      const payload = {
        club_id: Number(form.club_id),
        title: form.title.trim(),
        description: form.description.trim(),
        date: form.date,
        time: form.time,
        location: form.location.trim(),
        poster_image: form.poster_image || null,
      };
      await API.put(`/api/events/${eventId}`, payload);
      alert("Event updated successfully.");
      navigate("/leader");
    } catch (err) {
      console.error("Edit event error:", err);
      const backendMsg =
        err.response?.data?.error ||
        err.response?.data?.msg ||
        "Failed to update event. Ensure it's at least a day away.";
      setMsg(backendMsg);
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem("clubhub_token");
        localStorage.removeItem("clubhub_role");
        navigate("/login");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loadingEvent) {
    return (
      <div className="container min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin h-20 w-20 border-4 border-gray-200 border-t-green-600 rounded-full mx-auto mb-6"></div>
            <div className="absolute inset-0 animate-ping h-20 w-20 border-4 border-green-400 rounded-full mx-auto opacity-20"></div>
          </div>
          <p className="text-2xl font-bold text-white mb-2">Loading Event</p>
          <p className="text-gray-300">Fetching event details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container min-h-screen">
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
            transform: translateY(0);
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
        
        .glass-effect {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(229, 231, 235, 0.3);
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03);
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
        
        .innovative-border {
          border: none;
          border-left: 4px solid #16a34a;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        
        .minimal-rounded {
          border-radius: 8px;
        }
      `}</style>

      <div className="max-w-4xl mx-auto p-6 md:p-8">
        {/* Header */}
        <div className={`mb-8 ${mounted ? 'animate-fadeInUp' : 'initial-hidden'}`}>
          <button
            onClick={() => navigate("/leader")}
            className="mb-6 text-green-600 hover:text-green-700 font-semibold flex items-center gap-2 transition-all duration-300 hover:gap-3"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>
          <div className="flex items-center gap-4 mb-3">
            <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold text-gray-900">
                Edit Event
              </h1>
              <p className="text-base sm:text-lg text-gray-600 mt-1">
                Update your event details and keep your community informed
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className={`professional-card minimal-rounded p-8 ${mounted ? 'animate-scaleIn delay-100' : 'initial-hidden'}`}>
          {/* Club Selection */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Select Club
            </label>
            {loadingClubs ? (
              <div className="text-sm text-gray-500 p-3 bg-gray-50 rounded-lg">Loading clubs...</div>
            ) : (
              <select
                name="club_id"
                value={form.club_id}
                onChange={handleChange}
                className="w-full p-4 border border-gray-300 minimal-rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-300 font-medium bg-white"
                required
              >
                <option value="">-- Choose a club --</option>
                {clubs.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.category ? `(${c.category})` : ""}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Event Title */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              Event Title
            </label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              className="w-full p-4 border-2 border-green-200 rounded-xl focus:ring-4 focus:ring-green-200 focus:border-green-500 transition-all duration-300 font-medium"
              placeholder="AI Workshop: Introduction to Machine Learning"
              required
            />
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
              Description
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={4}
              className="w-full p-4 border-2 border-green-200 rounded-xl focus:ring-4 focus:ring-green-200 focus:border-green-500 transition-all duration-300 font-medium"
              placeholder="Brief description of what participants can expect..."
            />
          </div>

          {/* Event Poster (Optional) */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Event Poster (Optional)
            </label>
            
            {/* Poster Creation Options */}
            <div className="mb-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setShowCanvaModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white minimal-rounded font-semibold transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Create with Canva
              </button>
              <span className="text-sm text-gray-500 flex items-center">or</span>
              <span className="text-sm text-gray-600 font-medium">Upload your own poster</span>
            </div>
            
            {/* File Upload Area */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed minimal-rounded p-8 text-center transition-all duration-300 ${
                dragActive
                  ? "border-green-500 bg-green-50 scale-[1.02]"
                  : "border-gray-300 bg-gray-50 hover:border-green-400 hover:bg-green-50"
              } ${uploading ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                onChange={handleFileInputChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={uploading}
                id="poster-upload-edit"
              />
              
              {uploading ? (
                <div className="flex flex-col items-center gap-3">
                  <svg className="animate-spin h-8 w-8 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="text-sm font-semibold text-green-700">Uploading poster...</p>
                </div>
              ) : selectedFile || form.poster_image ? (
                <div className="flex flex-col items-center gap-3">
                  <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {selectedFile ? selectedFile.name : "Poster uploaded"}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">Click to change image</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Drop your poster here or click to browse
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      PNG, JPG, JPEG, GIF, or WEBP (max 5MB)
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Alternative: URL Input */}
            <div className="mt-4">
              <p className="text-xs text-gray-500 mb-2 text-center">Or enter image URL:</p>
              <input
                name="poster_image"
                value={form.poster_image}
                onChange={handleChange}
                type="url"
                className="w-full p-3 border border-gray-300 minimal-rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-300 text-sm bg-white"
                placeholder="https://example.com/poster.jpg"
                onFocus={() => setSelectedFile(null)}
              />
            </div>

            {/* Preview */}
            {form.poster_image && (
              <div className="mt-4 p-4 bg-white minimal-rounded innovative-border shadow-sm">
                <p className="text-xs font-semibold text-green-900 mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Poster Preview:
                </p>
                <img 
                  src={form.poster_image.startsWith('/') ? `http://localhost:5000${form.poster_image}` : form.poster_image} 
                  alt="Event poster preview" 
                  className="w-full h-64 object-cover rounded-lg shadow-lg"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    const errorMsg = e.target.nextElementSibling;
                    if (errorMsg) errorMsg.style.display = 'block';
                  }}
                />
                <p className="text-xs text-red-600 mt-2 hidden">Invalid image - Please check the URL or upload a new file</p>
              </div>
            )}
          </div>

          {/* Date, Time, Location Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Date
              </label>
              <input
                name="date"
                value={form.date}
                onChange={handleChange}
                type="date"
                className="w-full p-4 border border-gray-300 minimal-rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-300 font-medium bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Time
              </label>
              <input
                name="time"
                value={form.time}
                onChange={handleChange}
                type="time"
                className="w-full p-4 border-2 border-orange-200 rounded-xl focus:ring-4 focus:ring-orange-200 focus:border-orange-500 transition-all duration-300 font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Location
              </label>
              <input
                name="location"
                value={form.location}
                onChange={handleChange}
                className="w-full p-4 border-2 border-red-200 rounded-xl focus:ring-4 focus:ring-red-200 focus:border-red-500 transition-all duration-300 font-medium"
                placeholder="Room 204, Main Campus"
                required
              />
            </div>
          </div>

          {/* Error Message */}
          {msg && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-700 font-semibold animate-fadeIn">
              {msg}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-4">
            <button
              type="submit"
              className={`flex-1 py-4 rounded-xl font-bold text-white text-lg transition-all duration-300 shadow-lg transform hover:scale-105 active:scale-95 ${
                saving
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700 hover:shadow-lg"
              }`}
              disabled={saving}
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving Changes...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save Changes
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate("/leader")}
              className="px-8 py-4 rounded-xl border-2 border-gray-300 font-bold text-gray-700 hover:bg-white hover:border-gray-400 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
            >
              Cancel
            </button>
          </div>
        </form>

        {/* Canva Modal */}
        {showCanvaModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fadeIn backdrop-blur-sm">
            <div className="glass-effect minimal-rounded shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-scaleIn border border-gray-200">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 minimal-rounded flex items-center justify-center">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Create Poster with Canva</h2>
                  </div>
                  <button
                    onClick={() => {
                      setShowCanvaModal(false);
                      setCanvaDesignUrl("");
                    }}
                    className="p-2 hover:bg-gray-100 minimal-rounded transition"
                  >
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Instructions */}
                  <div className="bg-blue-50 border-2 border-blue-200 minimal-rounded p-4">
                    <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      How to Create Your Poster
                    </h3>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
                      <li>Click the button below to open Canva in a new window</li>
                      <li>Create your event poster using Canva's design tools</li>
                      <li>When finished, download your design as PNG or JPG</li>
                      <li>Return here and upload the downloaded file</li>
                    </ol>
                  </div>

                  {/* Canva Link Button */}
                  <div className="text-center">
                    <a
                      href="https://www.canva.com/create/posters/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white minimal-rounded font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Open Canva Design Editor
                    </a>
                    <p className="text-xs text-gray-500 mt-2">Opens in a new window</p>
                  </div>

                  {/* Alternative: Canva Template Links */}
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="font-bold text-gray-900 mb-4 text-center">Quick Start Templates</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { name: "Event Poster", url: "https://www.canva.com/templates/EAE8xJ1b5F8-event-poster/" },
                        { name: "Workshop Flyer", url: "https://www.canva.com/templates/EAE8xJ1b5F8-event-poster/" },
                        { name: "Conference Banner", url: "https://www.canva.com/templates/EAE8xJ1b5F8-event-poster/" }
                      ].map((template, idx) => (
                        <a
                          key={idx}
                          href={template.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-4 border-2 border-gray-200 minimal-rounded hover:border-purple-400 hover:shadow-md transition-all duration-300 text-center group"
                        >
                          <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 minimal-rounded mx-auto mb-2 flex items-center justify-center group-hover:from-purple-200 group-hover:to-pink-200 transition-colors">
                            <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <p className="text-sm font-semibold text-gray-900">{template.name}</p>
                          <p className="text-xs text-gray-500 mt-1">Use template</p>
                        </a>
                      ))}
                    </div>
                  </div>

                  {/* Upload Area for Canva Design */}
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="font-bold text-gray-900 mb-4">Upload Your Canva Design</h3>
                    <div
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                      className={`relative border-2 border-dashed minimal-rounded p-8 text-center transition-all duration-300 ${
                        dragActive
                          ? "border-purple-500 bg-purple-50 scale-[1.02]"
                          : "border-gray-300 bg-gray-50 hover:border-purple-400 hover:bg-purple-50"
                      } ${uploading ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                        onChange={handleFileInputChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={uploading}
                        id="canva-upload-edit"
                      />
                      
                      {uploading ? (
                        <div className="flex flex-col items-center gap-3">
                          <svg className="animate-spin h-8 w-8 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <p className="text-sm font-semibold text-purple-700">Uploading design...</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-3">
                          <svg className="w-12 h-12 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              Drop your Canva design here or click to browse
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                              PNG or JPG format (recommended: 1080x1920px or 1920x1080px)
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {form.poster_image && (
                      <div className="mt-4 p-4 bg-green-50 border-2 border-green-200 minimal-rounded">
                        <p className="text-sm font-semibold text-green-900 mb-2 flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Design uploaded successfully!
                        </p>
                        <img 
                          src={form.poster_image.startsWith('/') ? `http://localhost:5000${form.poster_image}` : form.poster_image} 
                          alt="Canva design preview" 
                          className="w-full h-48 object-contain rounded-lg shadow-md mt-2"
                        />
                      </div>
                    )}
                  </div>

                  {/* Close Button */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => {
                        setShowCanvaModal(false);
                        setCanvaDesignUrl("");
                      }}
                      className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 minimal-rounded font-semibold transition-colors"
                    >
                      Done
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Warning Notice */}
        <div className={`mt-8 glass-effect rounded-2xl p-6 shadow-lg border-l-4 border-yellow-500 ${mounted ? 'animate-fadeIn delay-200' : 'initial-hidden'}`}>
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h3 className="font-bold text-yellow-900 mb-2 text-lg">Important Notes</h3>
              <ul className="text-sm text-yellow-800 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-yellow-600 font-bold">•</span>
                  <span>Events can only be edited until the day before they start</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-600 font-bold">•</span>
                  <span>Changing the date or time will notify all registered participants</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-600 font-bold">•</span>
                  <span>All existing registrations will remain valid after editing</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
