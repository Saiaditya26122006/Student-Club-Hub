import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api";

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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("proposals");

  const userEmail = localStorage.getItem("clubhub_user_email");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (activeTab === "proposals") {
      fetchRequests();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, activeTab]);

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
      fetchRequests();
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

  const menuItems = [
    {
      id: "proposals",
      label: "Club Proposals",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      id: "clubs",
      label: "Manage Clubs",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      action: () => navigate("/university/clubs"),
    },
    {
      id: "profile",
      label: "My Profile",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      action: () => navigate("/university/profile"),
    },
  ];

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === "pending").length,
    approved: requests.filter(r => r.status === "approved").length,
    rejected: requests.filter(r => r.status === "rejected").length,
  };

  if (loading && activeTab === "proposals") {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin h-20 w-20 border-4 border-gray-200 border-t-green-600 minimal-rounded mx-auto mb-6"></div>
            <div className="absolute inset-0 animate-ping h-20 w-20 border-4 border-green-400 minimal-rounded mx-auto opacity-20"></div>
          </div>
          <p className="text-2xl font-bold text-gray-800 mb-2">Loading Proposals</p>
          <p className="text-gray-600">Fetching club requests...</p>
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
        
        .minimal-rounded {
          border-radius: 8px;
        }
      `}</style>

      <div className="flex min-h-screen">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="md:hidden fixed top-4 left-4 z-50 p-3 glass-effect minimal-rounded shadow-md hover:shadow-lg transition-all duration-300"
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
                className="p-2 hover:bg-green-50 minimal-rounded transition-all duration-300 ml-auto hidden md:block"
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
                      if (window.innerWidth < 768) {
                        setSidebarOpen(false);
                      }
                    }}
                    className={`w-full flex items-center gap-4 px-4 py-3 minimal-rounded font-semibold transition-all duration-300 ${
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

          {/* User Section with Logout */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            {sidebarOpen && userEmail ? (
              <div className="animate-fadeIn">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-green-600 minimal-rounded flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {userEmail.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">University Admin</p>
                    <p className="text-xs text-gray-600 truncate">{userEmail}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
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
                  onClick={handleLogout}
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
        <div className={`flex-1 overflow-y-auto transition-all duration-300 ${sidebarOpen ? 'md:ml-72' : 'md:ml-20'}`}>
          <div className="p-6 md:p-8 max-w-7xl mx-auto mt-16 md:mt-0">
            {/* Header */}
            <div className={`mb-10 ${mounted ? 'animate-fadeInUp' : 'initial-hidden'}`}>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-3">
            <span className="text-green-600">
              Campus Governance Hub
            </span>
          </h1>
          <p className="text-base sm:text-lg text-gray-600">
            Empower student initiatives - review proposals, cultivate communities, shape campus culture
          </p>
            </div>

            {/* Stats Cards */}
            <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 ${mounted ? 'animate-slideInRight delay-100' : 'initial-hidden'}`}>
              <div className="relative group">
                <div className="professional-card minimal-rounded p-6 card-hover">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-14 h-14 bg-green-600 minimal-rounded flex items-center justify-center shadow-md">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 font-semibold mb-1">Total Proposals</p>
                  <p className="text-4xl font-bold text-green-600">
                    {stats.total}
                  </p>
                </div>
              </div>

              <div className="relative group">
                <div className="professional-card minimal-rounded p-6 card-hover">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-14 h-14 bg-green-600 minimal-rounded flex items-center justify-center shadow-md">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 font-semibold mb-1">Pending Review</p>
                  <p className="text-4xl font-bold text-green-600">
                    {stats.pending}
                  </p>
                </div>
              </div>

              <div className="relative group">
                <div className="professional-card minimal-rounded p-6 card-hover">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-14 h-14 bg-green-600 minimal-rounded flex items-center justify-center shadow-md">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 font-semibold mb-1">Approved</p>
                  <p className="text-4xl font-bold text-green-600">
                    {stats.approved}
                  </p>
                </div>
              </div>

              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-pink-600 minimal-rounded blur opacity-25 group-hover:opacity-40 transition"></div>
                <div className="relative glass-effect minimal-rounded p-6 card-hover">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-pink-600 minimal-rounded flex items-center justify-center shadow-lg">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 font-semibold mb-1">Rejected</p>
                  <p className="text-4xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
                    {stats.rejected}
                  </p>
                </div>
              </div>
            </div>

            {/* Status Filter */}
            <div className={`glass-effect minimal-rounded shadow-lg p-6 mb-8 ${mounted ? 'animate-scaleIn delay-200' : 'initial-hidden'}`}>
              <div className="flex flex-wrap items-center gap-4">
                <span className="text-sm font-bold text-gray-900">
                  Filter by Status:
                </span>
                {["pending", "approved", "rejected"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-6 py-3 minimal-rounded font-bold transition-all duration-300 transform hover:scale-105 ${
                      statusFilter === status
                        ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg"
                        : "bg-white text-gray-700 hover:bg-gray-50 shadow-md border border-gray-200"
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)} ({requests.filter((r) => r.status === status).length})
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 minimal-rounded p-4 mb-6 animate-fadeIn">
                <p className="text-sm text-red-800 font-semibold">{error}</p>
              </div>
            )}

            {/* Proposals List */}
            {requests.length === 0 ? (
              <div className="glass-effect minimal-rounded p-12 text-center shadow-xl">
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
                        className={`px-4 py-2 rounded-full text-xs font-bold shadow-md ${
                          request.status === "pending"
                            ? "bg-gradient-to-r from-yellow-400 to-orange-500 text-white"
                            : request.status === "approved"
                            ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white"
                            : "bg-gradient-to-r from-red-500 to-pink-600 text-white"
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
                            ? "bg-green-50 border-green-300"
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
                          className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white minimal-rounded font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95"
                        >
                          Review & Decide
                        </button>
                      )}
                    </div>
                  </div>
                ))}
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
                            className={`px-6 py-4 minimal-rounded font-bold transition-all duration-300 transform hover:scale-105 ${
                              decisionForm.decision === "approved"
                                ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg"
                                : "bg-green-50 text-green-700 border-2 border-green-300 hover:bg-green-100"
                            }`}
                          >
                            ✅ Approve
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setDecisionForm({ ...decisionForm, decision: "rejected" })
                            }
                            className={`px-6 py-4 minimal-rounded font-bold transition-all duration-300 transform hover:scale-105 ${
                              decisionForm.decision === "rejected"
                                ? "bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-lg"
                                : "bg-red-50 text-red-700 border-2 border-red-300 hover:bg-red-100"
                            }`}
                          >
                            ❌ Reject
                          </button>
                        </div>
                      </div>

                      {/* Leader Credentials (required if approved) */}
                      {decisionForm.decision === "approved" && (
                        <div className="space-y-4 p-6 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 minimal-rounded">
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
                          className={`flex-1 px-6 py-4 minimal-rounded font-bold text-white text-lg transition-all duration-300 shadow-lg transform hover:scale-105 active:scale-95 ${
                            submitting || !decisionForm.decision
                              ? "bg-gray-400 cursor-not-allowed"
                              : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 hover:shadow-xl"
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
