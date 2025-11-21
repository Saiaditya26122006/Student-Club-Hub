import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api";

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
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white minimal-rounded shadow-lg p-8 text-center border border-gray-200">
            <div className="mb-6">
              <div className="w-20 h-20 bg-green-100 minimal-rounded flex items-center justify-center mx-auto mb-4 border-l-4 border-green-600">
                <svg
                  className="w-10 h-10 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                Proposal Submitted!
              </h2>
              <p className="text-gray-600">
                Your club proposal has been submitted successfully.
              </p>
            </div>
            <div className="bg-green-50 border-l-4 border-green-600 border border-green-200 minimal-rounded p-4 mb-6">
              <p className="text-sm text-green-800">
                <strong>Next Steps:</strong> The university will review your
                proposal within 5 days. You'll be notified of the decision once
                it's available.
              </p>
            </div>
            <button
              onClick={() => navigate("/participant/proposals")}
              className="px-6 py-3 bg-green-600 text-white minimal-rounded font-semibold hover:bg-green-700 transition shadow-md"
            >
              View My Proposals
            </button>
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
      <div className="max-w-4xl mx-auto">
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
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Create a New Club
          </h1>
          <p className="text-gray-600">
            Submit a detailed proposal for your club. The university will review
            it within 5 days.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="professional-card minimal-rounded p-8 space-y-6"
        >
          {/* Club Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Club Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 minimal-rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="e.g., AI Innovation Club"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Minimum 3 characters
            </p>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Category
            </label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 minimal-rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 minimal-rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Brief description of your club's purpose and activities..."
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Minimum 10 characters
            </p>
          </div>

          {/* Mission */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Mission Statement
            </label>
            <textarea
              name="mission"
              value={form.mission}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 minimal-rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="What is your club's mission? What do you aim to achieve?"
            />
          </div>

          {/* Target Audience */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Target Audience
            </label>
            <textarea
              name="target_audience"
              value={form.target_audience}
              onChange={handleChange}
              rows={2}
              className="w-full px-4 py-3 border border-gray-300 minimal-rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Who is this club for? (e.g., All students, Engineering students, etc.)"
            />
          </div>

          {/* Activities Plan */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Planned Activities
            </label>
            <textarea
              name="activities_plan"
              value={form.activities_plan}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 minimal-rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="What activities, events, or programs do you plan to organize? (e.g., Workshops, Competitions, Guest Lectures, etc.)"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-600 border border-red-200 minimal-rounded p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex items-center gap-4 pt-4">
            <button
              type="submit"
              disabled={submitting}
              className={`px-8 py-3 minimal-rounded font-semibold text-white transition shadow-md ${
                submitting
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {submitting ? "Submitting..." : "Submit Proposal"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/participant")}
              className="px-6 py-3 border border-gray-300 minimal-rounded font-semibold text-gray-700 hover:bg-gray-50 transition shadow-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

