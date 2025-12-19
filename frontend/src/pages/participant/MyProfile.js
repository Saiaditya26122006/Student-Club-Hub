import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api";
import Loader from "../../components/Loader";
import "../../styles/DesignSystem.css";

export default function MyProfile({ onLogout }) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [registrations, setRegistrations] = useState([]);
  const [showRegistrations, setShowRegistrations] = useState(false);
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
    fetchRegistrations();
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

  const fetchRegistrations = async () => {
    try {
      const res = await API.get("/api/profile/registrations");
      setRegistrations(res.data);
    } catch (error) {
      console.error("Error fetching registrations:", error);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      alert("Please select a valid image file (PNG, JPG, GIF, or WEBP)");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size must be less than 5MB");
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload to server
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
      // If it's already a full URL, return as is, otherwise construct it
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

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader text="" className="mx-auto mb-8" />
          <p className="ds-body-large text-gray-600 font-medium">Loading your profile...</p>
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
      {/* Colorful Header - Enhanced 2025 UI */}
      <div className="bg-indigo-500 shadow-lg progressive-blur-card light-ray glow-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/participant")}
                className="ds-button ds-button-ghost ds-button-sm text-white interactive-icon"
              >
                <svg className="ds-icon ds-icon-md ds-icon-inverse" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <h1 className="typography-hero text-white emoji-inline">
                My Profile <span className="emoji-xl">👤</span>
              </h1>
            </div>
            <button
              onClick={onLogout}
              className="ds-button ds-button-secondary ds-button-md button-glow"
            >
              <span className="ds-body">Logout</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Card - Enhanced 2025 UI */}
        <div className={`ds-card card-3d progressive-blur-card light-ray glow-primary overflow-hidden story-reveal ${mounted ? 'visible' : ''}`}>
          {/* Profile Header - 3D Effect */}
          <div className="bg-indigo-500 h-32 relative progressive-blur">
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2">
              <div className="relative">
                {/* Profile Image - 3D Tile */}
                <div className="w-32 h-32 rounded-full border-4 border-white shadow-2xl overflow-hidden bg-blue-500 flex items-center justify-center tile-3d interactive-icon">
                  {getProfileImageUrl() ? (
                    <img
                      src={getProfileImageUrl()}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl font-bold text-white">{getInitials()}</span>
                  )}
                </div>
                
                {/* Upload Button - Interactive Icon */}
                <label className="absolute bottom-0 right-0 w-12 h-12 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center cursor-pointer shadow-lg glow-secondary interactive-icon">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                  {uploading ? (
                    <div className="spinner" style={{ width: '20px', height: '20px', margin: 0 }}>
                      <span style={{ width: '8px', height: '3px', background: 'white' }}></span>
                      <span style={{ width: '8px', height: '3px', background: 'white' }}></span>
                      <span style={{ width: '8px', height: '3px', background: 'white' }}></span>
                      <span style={{ width: '8px', height: '3px', background: 'white' }}></span>
                    </div>
                  ) : (
                    <svg className="ds-icon ds-icon-sm text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </label>
              </div>
            </div>
          </div>

          {/* Profile Content */}
          <div className="pt-20 pb-8 px-8">
            {/* Name and Email */}
            <div className="text-center mb-6">
              {editMode ? (
                <div className="space-y-4">
                  <div className="ds-form-group">
                    <label className="ds-label">Full Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="ds-input ds-input-md"
                      placeholder="Enter your name"
                    />
                  </div>
                  <div className="ds-form-group">
                    <label className="ds-label">Bio</label>
                    <textarea
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      className="ds-input ds-input-md"
                      placeholder="Tell us about yourself..."
                      rows="4"
                      maxLength="500"
                    />
                    <p className="ds-caption mt-2">{formData.bio.length}/500 characters</p>
                  </div>
                  <div className="flex gap-4 justify-center mt-8">
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="ds-button ds-button-primary ds-button-md disabled:opacity-50"
                    >
                      <span className="ds-body">{saving ? "Saving..." : "Save Changes"}</span>
                    </button>
                    <button
                      onClick={() => {
                        setEditMode(false);
                        setFormData({
                          name: profile?.name || "",
                          bio: profile?.bio || ""
                        });
                      }}
                      className="ds-button ds-button-secondary ds-button-md"
                    >
                      <span className="ds-body">Cancel</span>
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="typography-hero mb-6">{profile?.name || "User"}</h2>
                  <p className="typography-display text-gray-600 mb-8">{profile?.email}</p>
                  {profile?.bio && (
                    <p className="ds-body-large text-gray-700 max-w-2xl mx-auto mb-10">{profile.bio}</p>
                  )}
                  <button
                    onClick={() => setEditMode(true)}
                    className="ds-button ds-button-primary ds-button-md button-glow inline-flex items-center gap-3"
                  >
                    <svg className="ds-icon ds-icon-sm ds-icon-inverse interactive-icon" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span className="ds-body emoji-inline">Edit Profile <span className="emoji-large">✏️</span></span>
                  </button>
                </>
              )}
            </div>

            {/* Stats - Bento Grid with 3D */}
            {profile?.stats && (
              <div className="bento-grid mb-12">
                <div className="bento-item card-3d tile-3d bg-blue-50 border-2 border-blue-200 p-8 text-center glow-secondary story-reveal story-reveal-delay-1">
                  <div className="typography-hero text-blue-600 mb-6">{profile.stats.total_registrations || 0}</div>
                  <div className="ds-body-large font-medium text-blue-800 emoji-inline">Total Events <span className="emoji-large">📅</span></div>
                </div>
                <div className="bento-item card-3d tile-3d bg-green-50 border-2 border-green-200 p-8 text-center glow-success story-reveal story-reveal-delay-2">
                  <div className="typography-hero text-green-600 mb-6">{profile.stats.events_attended || 0}</div>
                  <div className="ds-body-large font-medium text-green-800 emoji-inline">Attended <span className="emoji-large">✅</span></div>
                </div>
                <div className="bento-item card-3d tile-3d bg-purple-50 border-2 border-purple-200 p-8 text-center glow-primary story-reveal story-reveal-delay-3">
                  <div className="typography-hero text-purple-600 mb-6">{profile.stats.upcoming_events || 0}</div>
                  <div className="ds-body-large font-medium text-purple-800 emoji-inline">Upcoming <span className="emoji-large">🔜</span></div>
                </div>
              </div>
            )}

            {/* Create Club and Proposals Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Create Club Card */}
              <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300">
                <div className="h-2 bg-green-500"></div>
                <div className="p-6">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <svg className="ds-icon ds-icon-lg text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <h3 className="ds-heading-2 mb-4">🚀 Create Club</h3>
                    <p className="ds-body text-gray-600">Submit your club proposal to bring your vision to campus</p>
                  </div>

                  <button
                    onClick={() => navigate("/participant/create-club")}
                    className="ds-button ds-button-primary ds-button-md button-glow w-full"
                  >
                    <span className="ds-body emoji-inline">Create New Club <span className="emoji-large">🚀</span></span>
                    <svg className="ds-icon ds-icon-sm ds-icon-inverse interactive-icon transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>

                  <div className="mt-4 p-4 bg-green-50 rounded-xl border border-green-200">
                    <h4 className="font-bold text-gray-900 mb-2 text-sm flex items-center gap-2">
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
              <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300">
                <div className="h-2 bg-purple-500"></div>
                <div className="p-6">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <svg className="ds-icon ds-icon-lg text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                    </div>
                    <h3 className="ds-heading-2 mb-4">📋 My Proposals</h3>
                    <p className="ds-body text-gray-600">Track the status of your club creation requests</p>
                  </div>

                  <button
                    onClick={() => navigate("/participant/proposals")}
                    className="ds-button ds-button-primary ds-button-md button-glow w-full"
                  >
                    <span className="ds-body emoji-inline">View All Proposals <span className="emoji-large">📋</span></span>
                    <svg className="ds-icon ds-icon-sm ds-icon-inverse interactive-icon transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>

                  <div className="mt-4 p-4 bg-purple-50 rounded-xl border border-purple-200">
                    <h4 className="font-bold text-gray-900 mb-2 text-sm flex items-center gap-2">
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
            <div className="border-t-2 border-gray-200 pt-6">
              <button
                onClick={() => setShowRegistrations(!showRegistrations)}
                className="w-full flex items-center justify-between p-4 bg-blue-50 hover:bg-blue-100 rounded-2xl transition border-2 border-blue-200"
              >
                <div className="flex items-center gap-3">
                  <svg className="ds-icon ds-icon-md ds-icon-secondary" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span className="ds-body font-medium text-gray-900">Registration History</span>
                  <span className="ds-body-small text-gray-500">({registrations.length} events)</span>
                </div>
                <svg
                  className={`ds-icon ds-icon-sm ds-icon-secondary transition-transform ${showRegistrations ? 'transform rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showRegistrations && (
                <div className="mt-4 space-y-3 max-h-96 overflow-y-auto">
                  {registrations.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No registrations yet</p>
                  ) : (
                    registrations.map((reg) => (
                      <div
                        key={reg.registration_id}
                        className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:shadow-md transition"
                      >
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
                              <svg className="ds-icon ds-icon-sm text-blue-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                              </svg>
                            </a>
                          )}
                        </div>
                      </div>
                    ))
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

