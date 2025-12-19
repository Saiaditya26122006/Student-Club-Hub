import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api";
import Loader from "../../components/Loader";
import "../../styles/DesignSystem.css";

export default function LeaderMyProfile({ onLogout }) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    bio: ""
  });
  const [previewImage, setPreviewImage] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await API.get("/api/profile/");
      setProfile(res.data);
      setFormData({
        name: res.data.name || "",
        bio: res.data.bio || ""
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      alert("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
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
      setUploading(true);
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
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const res = await API.put("/api/profile/", formData);
      setProfile(res.data.user);
      setEditMode(false);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert(error.response?.data?.error || "Failed to update profile");
    } finally {
      setSaving(false);
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
    return "L";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader text="" className="mx-auto mb-4" />
          <p className="text-gray-600 font-semibold">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50">
      <style>{`
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
      {/* Colorful Header */}
      <div className="bg-indigo-500 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/leader")}
                className="p-2 hover:bg-white/20 rounded-lg transition text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <h1 className="text-3xl font-extrabold text-white">👤 My Profile</h1>
            </div>
            <button
              onClick={onLogout}
              className="px-5 py-2.5 bg-white text-red-600 hover:bg-red-50 font-bold rounded-xl transition shadow-md"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Card - Instagram Style */}
        <div className={`bg-white rounded-3xl shadow-xl overflow-hidden border-2 border-gray-200 p-8 ${mounted ? 'animate-fadeIn' : ''}`}>
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
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                  {uploading ? (
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
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
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">{profile?.email?.split('@')[0] || "leader"}</h2>
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
                <p className="text-sm font-semibold text-purple-600 uppercase tracking-wide mt-1">Club Leader</p>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-6 mb-4">
                <div className="text-center">
                  <span className="block text-lg font-bold text-gray-900">{profile?.stats?.total_clubs || 0}</span>
                  <span className="text-sm text-gray-600">clubs</span>
                </div>
                <div className="text-center">
                  <span className="block text-lg font-bold text-gray-900">{profile?.stats?.total_events || 0}</span>
                  <span className="text-sm text-gray-600">events</span>
                </div>
                <div className="text-center">
                  <span className="block text-lg font-bold text-gray-900">{profile?.stats?.total_registrations || 0}</span>
                  <span className="text-sm text-gray-600">registrations</span>
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
              onClick={() => setEditMode(!editMode)}
              className="flex-1 px-4 py-2.5 bg-white border-2 border-gray-300 hover:bg-gray-50 text-gray-900 font-semibold rounded-lg transition text-sm"
            >
              {editMode ? "Cancel" : "Edit profile"}
            </button>
            <button
              onClick={() => navigate("/leader")}
              className="flex-1 px-4 py-2.5 bg-white border-2 border-gray-300 hover:bg-gray-50 text-gray-900 font-semibold rounded-lg transition text-sm"
            >
              View dashboard
            </button>
          </div>

          {/* Edit Mode Form */}
          {editMode && (
            <div className="mb-6 p-6 bg-gray-50 rounded-2xl border-2 border-gray-200">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500"
                    placeholder="Enter your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Bio</label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500"
                    placeholder="Tell us about yourself..."
                    rows="4"
                    maxLength="500"
                  />
                  <p className="text-xs text-gray-500 mt-1">{formData.bio.length}/500 characters</p>
                </div>
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="w-full px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          )}

          {/* Leader Actions Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Create Event Card */}
            <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300">
              <div className="h-2 bg-green-500"></div>
              <div className="p-6">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">🎉 Create Event</h3>
                  <p className="text-gray-600 text-sm">Organize and manage your club events</p>
                </div>

                <button
                  onClick={() => navigate("/leader/create")}
                  className="w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 text-sm shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <span>Create New Event</span>
                  <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>

                <div className="mt-4 p-4 bg-green-50 rounded-xl border border-green-200">
                  <h4 className="font-bold text-gray-900 mb-2 text-sm flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Quick Tips:
                  </h4>
                  <ul className="space-y-1 text-xs text-gray-700">
                    <li>• Add event details and schedule</li>
                    <li>• Set registration limits</li>
                    <li>• Generate QR codes for check-in</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* QR Check-In Card */}
            <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300">
              <div className="h-2 bg-purple-500"></div>
              <div className="p-6">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">📱 QR Check-In</h3>
                  <p className="text-gray-600 text-sm">Scan QR codes to check in participants</p>
                </div>

                <button
                  onClick={() => navigate("/leader/checkin")}
                  className="w-full py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 text-sm shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <span>Open QR Scanner</span>
                  <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>

                <div className="mt-4 p-4 bg-purple-50 rounded-xl border border-purple-200">
                  <h4 className="font-bold text-gray-900 mb-2 text-sm flex items-center gap-2">
                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Features:
                  </h4>
                  <div className="space-y-1 text-xs text-gray-700">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span>Real-time check-in tracking</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span>Attendance management</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span>Export attendance reports</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          {profile?.stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-purple-50 rounded-2xl p-6 text-center border-2 border-purple-200">
                <div className="text-3xl font-bold text-purple-600 mb-2">{profile.stats.total_clubs || 0}</div>
                <div className="text-sm font-bold text-purple-800">Clubs</div>
              </div>
              <div className="bg-blue-50 rounded-2xl p-6 text-center border-2 border-blue-200">
                <div className="text-3xl font-bold text-blue-600 mb-2">{profile.stats.total_events || 0}</div>
                <div className="text-sm font-bold text-blue-800">Events</div>
              </div>
              <div className="bg-green-50 rounded-2xl p-6 text-center border-2 border-green-200">
                <div className="text-3xl font-bold text-green-600 mb-2">{profile.stats.total_registrations || 0}</div>
                <div className="text-sm font-bold text-green-800">Registrations</div>
              </div>
              <div className="bg-cyan-50 rounded-2xl p-6 text-center border-2 border-cyan-200">
                <div className="text-3xl font-bold text-cyan-600 mb-2">{profile.stats.total_attendees || 0}</div>
                <div className="text-sm font-bold text-cyan-800">Attendees</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

