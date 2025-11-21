import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api";

export default function UniversityClubManagement() {
  const navigate = useNavigate();
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedClub, setSelectedClub] = useState(null);
  const [actionType, setActionType] = useState(""); // "delete" or "revoke"
  const [processing, setProcessing] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    fetchClubs();
  }, []);

  async function fetchClubs() {
    try {
      setLoading(true);
      const response = await API.get("/api/university/clubs");
      setClubs(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Error fetching clubs:", err);
      if (err.response?.status === 403) {
        setError("You don't have permission to access this page.");
      } else {
        setError("Failed to load clubs. Please try again.");
      }
      setClubs([]);
    } finally {
      setLoading(false);
    }
  }

  const handleDeleteClub = async (clubId) => {
    try {
      setProcessing(true);
      await API.delete(`/api/university/clubs/${clubId}`);
      alert("Club deleted successfully!");
      setSelectedClub(null);
      setActionType("");
      fetchClubs();
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Failed to delete club.";
      alert(errorMsg);
    } finally {
      setProcessing(false);
    }
  };

  const handleRevokeLeader = async (clubId) => {
    try {
      setProcessing(true);
      console.log("Revoking leader for club ID:", clubId);
      const response = await API.post(`/api/university/clubs/${clubId}/revoke-leader`);
      console.log("Response:", response.data);
      alert(response.data.message || "Leader access revoked successfully!");
      setSelectedClub(null);
      setActionType("");
      fetchClubs();
    } catch (err) {
      console.error("Error revoking leader:", err);
      console.error("Error response:", err.response);
      const errorMsg = err.response?.data?.error || "Failed to revoke leader access.";
      alert(errorMsg);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin h-20 w-20 border-4 border-indigo-200 border-t-indigo-600 rounded-full mx-auto mb-6"></div>
            <div className="absolute inset-0 animate-ping h-20 w-20 border-4 border-indigo-400 rounded-full mx-auto opacity-20"></div>
          </div>
          <p className="text-2xl font-bold text-gray-800 mb-2">Loading Clubs</p>
          <p className="text-gray-600">Fetching club data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
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
        
        .card-hover {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .card-hover:hover {
          transform: translateY(-8px) scale(1.02);
        }
        
        .glass-effect {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
      `}</style>

      <div className="max-w-7xl mx-auto p-6 md:p-8">
        {/* Header */}
        <div className={`mb-8 ${mounted ? 'animate-fadeInUp' : 'initial-hidden'}`}>
          <button
            onClick={() => navigate("/university")}
            className="mb-6 text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-2 transition-all duration-300 hover:gap-3"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-3">
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Club Oversight Center
            </span>
          </h1>
          <p className="text-base sm:text-lg text-gray-600">
            Supervise active organizations, manage leadership transitions, maintain campus standards
          </p>
        </div>

        {error && (
          <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-xl p-4 mb-6 animate-fadeIn">
            <p className="text-sm text-red-800 font-semibold">{error}</p>
          </div>
        )}

        {/* Clubs List */}
        {clubs.length === 0 ? (
          <div className="glass-effect rounded-2xl p-12 text-center shadow-xl">
            <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
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
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              No Clubs Yet
            </h3>
            <p className="text-gray-600">
              No clubs have been created yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clubs.map((club, index) => (
              <div
                key={club.id}
                className={`glass-effect rounded-2xl shadow-lg p-6 border-2 border-gray-100 card-hover ${mounted ? 'animate-scaleIn' : 'initial-hidden'}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                    {club.name.charAt(0)}
                  </div>
                  {club.category && (
                    <span className="px-3 py-1 text-xs font-bold bg-indigo-100 text-indigo-700 rounded-full">
                      {club.category}
                    </span>
                  )}
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {club.name}
                </h3>

                <p className="text-sm text-gray-600 mb-4 line-clamp-2 min-h-[2.5rem]">
                  {club.description || "No description"}
                </p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg">
                    <span className="text-sm font-semibold text-gray-700">Events:</span>
                    <span className="text-lg font-bold text-indigo-600">{club.event_count}</span>
                  </div>
                  {club.leader_email ? (
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-gray-700">Leader:</span>
                        <span className="px-2 py-1 bg-green-200 text-green-800 text-xs font-bold rounded-full">
                          Active
                        </span>
                      </div>
                      <p className="text-xs text-gray-700 font-semibold">{club.leader_name}</p>
                      <p className="text-xs text-gray-600 font-mono">{club.leader_email}</p>
                    </div>
                  ) : (
                    <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-700">Leader:</span>
                        <span className="px-2 py-1 bg-red-200 text-red-800 text-xs font-bold rounded-full">
                          No Leader
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  {club.leader_email && (
                    <button
                      onClick={() => {
                        setSelectedClub(club);
                        setActionType("revoke");
                      }}
                      className="w-full px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 active:scale-95"
                    >
                      Revoke Leader Access
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setSelectedClub(club);
                      setActionType("delete");
                    }}
                    className="w-full px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 active:scale-95"
                  >
                    Delete Club
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Confirmation Modal */}
        {selectedClub && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fadeIn backdrop-blur-sm">
            <div className="glass-effect rounded-2xl shadow-2xl max-w-md w-full p-8 animate-scaleIn">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                {actionType === "delete" ? "Delete Club?" : "Revoke Leader Access?"}
              </h2>

              {actionType === "delete" ? (
                <div className="mb-6">
                  <p className="text-gray-700 mb-4 text-lg">
                    Are you sure you want to delete <strong className="text-gray-900">{selectedClub.name}</strong>?
                  </p>
                  <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-300 rounded-xl p-5">
                    <p className="text-sm font-bold text-red-900 mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      Warning: This will permanently delete:
                    </p>
                    <ul className="text-sm text-red-800 space-y-2 ml-6">
                      <li className="flex items-start gap-2">
                        <span>•</span>
                        <span>The club</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span>•</span>
                        <span>All {selectedClub.event_count} events</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span>•</span>
                        <span>All event registrations</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span>•</span>
                        <span>All participant QR codes</span>
                      </li>
                    </ul>
                    <p className="text-sm font-bold text-red-900 mt-3">
                      ⚠️ This action cannot be undone.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mb-6">
                  <p className="text-gray-700 mb-4 text-lg">
                    Are you sure you want to revoke leader access for{" "}
                    <strong className="text-gray-900">{selectedClub.name}</strong>?
                  </p>
                  <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-300 rounded-xl p-5">
                    <p className="text-sm font-bold text-orange-900 mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      This will:
                    </p>
                    <ul className="text-sm text-orange-800 space-y-2 ml-6">
                      <li className="flex items-start gap-2">
                        <span>•</span>
                        <span>Remove leader from the club</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span>•</span>
                        <span>Convert leader to participant if they have proposals</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span>•</span>
                        <span>Delete leader account if no proposals exist</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span>•</span>
                        <span>Leader won't be able to manage this club</span>
                      </li>
                    </ul>
                    <p className="text-sm font-bold text-orange-900 mt-3">
                      ℹ️ The club and its events will remain intact.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    if (actionType === "delete") {
                      handleDeleteClub(selectedClub.id);
                    } else {
                      handleRevokeLeader(selectedClub.id);
                    }
                  }}
                  disabled={processing}
                  className={`flex-1 px-6 py-4 rounded-xl font-bold text-white text-lg transition-all duration-300 shadow-lg transform hover:scale-105 active:scale-95 ${
                    processing
                      ? "bg-gray-400 cursor-not-allowed"
                      : actionType === "delete"
                      ? "bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 hover:shadow-xl"
                      : "bg-gradient-to-r from-orange-600 to-yellow-600 hover:from-orange-700 hover:to-yellow-700 hover:shadow-xl"
                  }`}
                >
                  {processing ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : actionType === "delete"
                    ? "Yes, Delete Club"
                    : "Yes, Revoke Access"}
                </button>
                <button
                  onClick={() => {
                    setSelectedClub(null);
                    setActionType("");
                  }}
                  disabled={processing}
                  className="px-6 py-4 border-2 border-gray-300 rounded-xl font-bold text-gray-700 hover:bg-white transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
