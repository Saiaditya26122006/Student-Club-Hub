import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api";
import "../../styles/DarkPattern.css";
import "../../styles/DesignSystem.css";

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
      <div className="container min-h-screen py-16 px-4">
        <div className="ds-container max-w-6xl">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-lg h-12 w-12 border-b-2 border-green-600"></div>
            <p className="ds-body-large mt-8 text-white">Loading your proposals...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container min-h-screen py-16 px-4">
      <div className="ds-container max-w-6xl">
        <div className="ds-spacing-section">
          <button
            onClick={() => navigate("/participant")}
            className="ds-button ds-button-ghost ds-button-sm mb-8"
          >
            <svg
              className="ds-icon ds-icon-sm ds-icon-secondary"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            <span className="ds-body-small">Back to Dashboard</span>
          </button>
          {/* Welcome Header - Enhanced 2025 UI */}
          <div className="relative progressive-blur-card light-ray rounded-2xl p-8 md:p-12 border-2 border-purple-200/50 glow-primary overflow-hidden mb-12 story-reveal">
            <div className="absolute top-0 right-0 w-40 h-40 bg-purple-200 opacity-30 blur-3xl progressive-blur"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-pink-200 opacity-30 blur-2xl progressive-blur"></div>
            <div className="relative z-10 flex items-center justify-between flex-wrap gap-6">
              <div>
                <h1 className="typography-hero mb-6 emoji-inline">
                  My Club Proposals <span className="emoji-xl">📋</span>
                </h1>
                <p className="typography-display text-gray-600">
                  Track the status of your club proposals
                </p>
              </div>
              <button
                onClick={() => navigate("/participant/create-club")}
                className="ds-button ds-button-primary ds-button-md button-glow"
              >
                <span className="ds-body emoji-inline">+ New Proposal <span className="emoji-large">✨</span></span>
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="ds-card bg-red-50 border-l-4 border-red-600 p-6 mb-12">
            <p className="ds-body text-red-800">{error}</p>
          </div>
        )}

        {proposals.length === 0 ? (
          <div className="ds-card progressive-blur-card p-16 text-center story-reveal illustration-container">
            <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-10 illustration-3d float-animation">
              <svg
                className="ds-icon ds-icon-xl ds-icon-tertiary"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="typography-display mb-6 emoji-inline">
              No Proposals Yet <span className="emoji-xl">📝</span>
            </h3>
            <p className="ds-body-large mb-12">
              You haven't submitted any club proposals yet.
            </p>
            <button
              onClick={() => navigate("/participant/create-club")}
              className="ds-button ds-button-primary ds-button-lg button-glow"
            >
              <span className="ds-body emoji-inline">Create Your First Proposal <span className="emoji-large">🚀</span></span>
            </button>
          </div>
        ) : (
          <div className="bento-grid">
            {proposals.map((proposal, index) => (
              <div
                key={proposal.id}
                className={`bento-item card-3d-interactive progressive-blur-card story-reveal story-reveal-delay-${Math.min(index % 4, 4)} p-10`}
              >
                <div className="flex items-start justify-between mb-8">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4 flex-wrap">
                      <h3 className="typography-display">
                        {proposal.name}
                      </h3>
                      {getStatusBadge(proposal.status)}
                    </div>
                    {proposal.category && (
                      <p className="ds-body-small mb-4">
                        Category: {proposal.category}
                      </p>
                    )}
                    <p className="ds-body-large">{proposal.description}</p>
                  </div>
                </div>

                {/* Additional Details */}
                {(proposal.mission ||
                  proposal.target_audience ||
                  proposal.activities_plan) && (
                  <div className="mt-8 pt-8 border-t border-gray-200 space-y-6">
                    {proposal.mission && (
                      <div>
                        <h4 className="ds-heading-4 mb-3">
                          Mission:
                        </h4>
                        <p className="ds-body">
                          {proposal.mission}
                        </p>
                      </div>
                    )}
                    {proposal.target_audience && (
                      <div>
                        <h4 className="ds-heading-4 mb-3">
                          Target Audience:
                        </h4>
                        <p className="ds-body">
                          {proposal.target_audience}
                        </p>
                      </div>
                    )}
                    {proposal.activities_plan && (
                      <div>
                        <h4 className="ds-heading-4 mb-3">
                          Planned Activities:
                        </h4>
                        <p className="ds-body">
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
                          className="ds-button ds-button-primary ds-button-md button-glow w-full mt-3"
                        >
                          <span className="ds-body emoji-inline">Login as Club Leader <span className="emoji-large">🔑</span></span>
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
                <div className="mt-8 pt-8 border-t border-gray-200 flex items-center justify-between ds-body-small">
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

