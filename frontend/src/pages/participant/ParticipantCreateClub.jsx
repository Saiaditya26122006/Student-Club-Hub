import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api";
import "../../styles/DesignSystem.css";

export default function ParticipantCreateClub() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "",
    mission: "",
    target_audience: "",
    activities_plan: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const categories = [
    "Technology",
    "Sports",
    "Arts & Culture",
    "Academic",
    "Social",
    "Community Service",
    "Entrepreneurship",
    "Other",
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    // Validation
    if (form.name.trim().length < 3) {
      setError("Club name must be at least 3 characters.");
      setSubmitting(false);
      return;
    }
    if (form.description.trim().length < 10) {
      setError("Description must be at least 10 characters.");
      setSubmitting(false);
      return;
    }

    try {
      console.log("Submitting club proposal:", form);
      const response = await API.post("/api/club-requests", form);
      console.log("Response:", response.data);
      setSuccess(true);
      setTimeout(() => {
        navigate("/participant/proposals");
      }, 2000);
    } catch (err) {
      console.error("Error submitting club proposal:", err);
      console.error("Error response:", err.response);
      const errorMsg =
        err.response?.data?.error ||
        err.message ||
        "Failed to submit club proposal. Please try again.";
      setError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 py-16 px-4">
        <div className="ds-container max-w-2xl">
          <div className="ds-card progressive-blur-card light-ray glow-success text-center story-reveal">
            <div className="ds-spacing-large">
              <div className="w-24 h-24 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-8 border-l-4 border-green-600 interactive-icon float-animation">
                <svg
                  className="ds-icon ds-icon-xl text-green-600"
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
              <h2 className="typography-hero mb-8 emoji-inline">
                Proposal Submitted! <span className="emoji-xl">🎉</span>
              </h2>
              <p className="typography-display text-gray-600">
                Your club proposal has been submitted successfully.
              </p>
            </div>
            <div className="ds-card progressive-blur-card bg-green-50 border-l-4 border-green-600 p-8 mb-12 glow-success">
              <p className="ds-body-large">
                <strong>Next Steps:</strong> The university will review your
                proposal within 5 days. You'll be notified of the decision once
                it's available.
              </p>
            </div>
            <button
              onClick={() => navigate("/participant/proposals")}
              className="ds-button ds-button-primary ds-button-lg button-glow"
            >
              <span className="ds-body emoji-inline">View My Proposals <span className="emoji-large">📋</span></span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-16 px-4">
      <div className="ds-container max-w-4xl">
        {/* Welcome Header - Enhanced 2025 UI */}
        <div className="ds-spacing-section story-reveal">
          <div className="relative progressive-blur-card light-ray rounded-2xl p-8 md:p-12 border-2 border-purple-200/50 glow-primary overflow-hidden mb-12">
            <div className="absolute top-0 right-0 w-40 h-40 bg-purple-200 opacity-30 blur-3xl progressive-blur"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-200 opacity-30 blur-2xl progressive-blur"></div>
            <div className="relative z-10">
              <button
                onClick={() => navigate("/participant")}
                className="ds-button ds-button-ghost ds-button-sm mb-8 interactive-icon"
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
              <h1 className="typography-hero mb-6 emoji-inline">
                Create a New Club <span className="emoji-xl">🚀</span>
              </h1>
              <p className="typography-display text-gray-600">
                Submit a detailed proposal for your club. The university will review
                it within 5 days.
              </p>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="ds-card progressive-blur-card space-y-8 story-reveal story-reveal-delay-1"
        >
          {/* Club Name */}
          <div className="ds-form-group">
            <label className="ds-form-label">
              Club Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              className="ds-input ds-input-md"
              placeholder="e.g., AI Innovation Club"
              required
            />
            <p className="ds-form-help">
              Minimum 3 characters
            </p>
          </div>

          {/* Category */}
          <div className="ds-form-group">
            <label className="ds-form-label">
              Category
            </label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              className="ds-input ds-input-md"
            >
              <option value="">Select a category (optional)</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="ds-form-group">
            <label className="ds-form-label">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={4}
              className="ds-input ds-input-md"
              placeholder="Brief description of your club's purpose and activities..."
              required
            />
            <p className="ds-form-help">
              Minimum 10 characters
            </p>
          </div>

          {/* Mission */}
          <div className="ds-form-group">
            <label className="ds-form-label">
              Mission Statement
            </label>
            <textarea
              name="mission"
              value={form.mission}
              onChange={handleChange}
              rows={3}
              className="ds-input ds-input-md"
              placeholder="What is your club's mission? What do you aim to achieve?"
            />
          </div>

          {/* Target Audience */}
          <div className="ds-form-group">
            <label className="ds-form-label">
              Target Audience
            </label>
            <textarea
              name="target_audience"
              value={form.target_audience}
              onChange={handleChange}
              rows={2}
              className="ds-input ds-input-md"
              placeholder="Who is this club for? (e.g., All students, Engineering students, etc.)"
            />
          </div>

          {/* Activities Plan */}
          <div className="ds-form-group">
            <label className="ds-form-label">
              Planned Activities
            </label>
            <textarea
              name="activities_plan"
              value={form.activities_plan}
              onChange={handleChange}
              rows={4}
              className="ds-input ds-input-md"
              placeholder="What activities, events, or programs do you plan to organize? (e.g., Workshops, Competitions, Guest Lectures, etc.)"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="ds-card bg-red-50 border-l-4 border-red-600 p-6">
              <p className="ds-body text-red-800">{error}</p>
            </div>
          )}

          {/* Submit Button - Enhanced with Glow */}
          <div className="flex items-center gap-6 pt-8">
            <button
              type="submit"
              disabled={submitting}
              className="ds-button ds-button-primary ds-button-lg button-glow"
            >
              {submitting ? (
                <span className="ds-body">Submitting...</span>
              ) : (
                <span className="ds-body emoji-inline">Submit Proposal <span className="emoji-large">✨</span></span>
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate("/participant")}
              className="ds-button ds-button-secondary ds-button-lg"
            >
              <span className="ds-body">Cancel</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

