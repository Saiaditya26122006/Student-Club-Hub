import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api";

export default function ParticipantMyProposals() {
  const navigate = useNavigate();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchProposals() {
      try {
        setLoading(true);
        const response = await API.get("/api/club-requests/mine");
        setProposals(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        console.error("Error fetching proposals:", err);
        setError("Failed to load your proposals. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    fetchProposals();
  }, []);

  const getStatusBadge = (status) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
      approved: "bg-green-100 text-green-800 border-green-300",
      rejected: "bg-red-100 text-red-800 border-red-300",
    };
    return (
      <span
        className={`px-3 py-1 minimal-rounded text-xs font-semibold border ${
          styles[status] || "bg-gray-100 text-gray-800 border-gray-300"
        }`}
      >
        {status.toUpperCase()}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <div className="inline-block animate-spin minimal-rounded h-12 w-12 border-b-2 border-green-600"></div>
            <p className="mt-4 text-gray-600">Loading your proposals...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <style>{`
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
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => navigate("/participant")}
            className="text-green-600 hover:text-green-800 mb-4 flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Dashboard
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">
                My Club Proposals
              </h1>
              <p className="text-gray-600">
                Track the status of your club proposals
              </p>
            </div>
            <button
              onClick={() => navigate("/participant/create-club")}
              className="px-6 py-3 bg-green-600 text-white minimal-rounded font-semibold hover:bg-green-700 transition shadow-md"
            >
              + New Proposal
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-600 border border-red-200 minimal-rounded p-4 mb-6">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {proposals.length === 0 ? (
          <div className="professional-card minimal-rounded p-12 text-center">
            <div className="w-24 h-24 bg-gray-100 minimal-rounded flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-12 h-12 text-gray-400"
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
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              No Proposals Yet
            </h3>
            <p className="text-gray-600 mb-6">
              You haven't submitted any club proposals yet.
            </p>
            <button
              onClick={() => navigate("/participant/create-club")}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition"
            >
              Create Your First Proposal
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {proposals.map((proposal) => (
              <div
                key={proposal.id}
                className="professional-card minimal-rounded p-6 hover:shadow-lg transition"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-2xl font-bold text-gray-800">
                        {proposal.name}
                      </h3>
                      {getStatusBadge(proposal.status)}
                    </div>
                    {proposal.category && (
                      <p className="text-sm text-gray-500 mb-2">
                        Category: {proposal.category}
                      </p>
                    )}
                    <p className="text-gray-600">{proposal.description}</p>
                  </div>
                </div>

                {/* Additional Details */}
                {(proposal.mission ||
                  proposal.target_audience ||
                  proposal.activities_plan) && (
                  <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                    {proposal.mission && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-1">
                          Mission:
                        </h4>
                        <p className="text-sm text-gray-600">
                          {proposal.mission}
                        </p>
                      </div>
                    )}
                    {proposal.target_audience && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-1">
                          Target Audience:
                        </h4>
                        <p className="text-sm text-gray-600">
                          {proposal.target_audience}
                        </p>
                      </div>
                    )}
                    {proposal.activities_plan && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-1">
                          Planned Activities:
                        </h4>
                        <p className="text-sm text-gray-600">
                          {proposal.activities_plan}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Decision Message (if available) */}
                {proposal.decision_message && (
                  <div
                    className={`mt-4 p-4 minimal-rounded border-l-4 border ${
                      proposal.status === "approved"
                        ? "bg-green-50 border-green-200"
                        : "bg-red-50 border-red-200"
                    }`}
                  >
                    <h4 className="text-sm font-semibold mb-2">
                      {proposal.status === "approved"
                        ? "🎉 Congratulations! Your Club Has Been Approved!"
                        : "❌ Rejection Message:"}
                    </h4>
                    <p className="text-sm mb-3">{proposal.decision_message}</p>
                    
                    {/* Show leader credentials if approved */}
                    {proposal.status === "approved" && proposal.leader_email && (
                      <div className="mt-4 p-4 bg-green-50 border-l-4 border-green-600 border border-green-200 minimal-rounded">
                        <h5 className="text-sm font-bold text-green-900 mb-3">
                          🔑 Your Leader Dashboard Credentials
                        </h5>
                        <div className="space-y-2 mb-3">
                          <div className="flex items-start gap-2">
                            <span className="text-sm font-semibold text-gray-700 min-w-[80px]">
                              Email:
                            </span>
                            <span className="text-sm text-gray-900 font-mono bg-white px-2 py-1 rounded border">
                              {proposal.leader_email}
                            </span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="text-sm font-semibold text-gray-700 min-w-[80px]">
                              Password:
                            </span>
                            <span className="text-sm text-gray-900 font-mono bg-white px-2 py-1 rounded border">
                              {proposal.leader_password}
                            </span>
                          </div>
                        </div>
                        <div className="bg-yellow-50 border border-yellow-300 rounded p-3">
                          <p className="text-xs text-yellow-800">
                            <strong>⚠️ Important:</strong> Please save these credentials safely. 
                            Use them to login as a Club Leader and start managing your club!
                          </p>
                        </div>
                        <button
                          onClick={() => navigate("/login")}
                          className="w-full mt-3 px-4 py-2 bg-green-600 text-white minimal-rounded font-semibold hover:bg-green-700 transition shadow-sm"
                        >
                          Login as Club Leader
                        </button>
                      </div>
                    )}
                    
                    {proposal.decided_at && (
                      <p className="text-xs text-gray-500 mt-2">
                        Decided on: {formatDate(proposal.decided_at)}
                      </p>
                    )}
                  </div>
                )}

                {/* Status Info */}
                <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between text-sm text-gray-500">
                  <span>Submitted: {formatDate(proposal.created_at)}</span>
                  {proposal.status === "pending" && (
                    <span className="text-yellow-600 font-medium">
                      ⏳ Under Review (Decision available after 5 days)
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

