import React, { useEffect, useState } from "react";
import API from "../api";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch clubs from backend
  useEffect(() => {
    async function fetchClubs() {
      try {
        const res = await API.get("/api/clubs");
        setClubs(res.data);
      } catch (error) {
        console.error("❌ Error loading clubs:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchClubs();
  }, []);

  if (loading) {
    return (
      <div className="p-6 text-center min-h-[60vh] flex items-center justify-center">
        <div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg font-semibold text-gray-700">Loading clubs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Explore Clubs</h1>
        <p className="text-gray-600 text-lg">
          Discover student-driven communities across your campus
        </p>
      </div>

      {/* If No Clubs */}
      {clubs.length === 0 ? (
        <div className="text-center py-16">
          <svg
            className="mx-auto h-24 w-24 text-gray-400 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5V4H2v16h15zm0 0v-2a2 2 0 012-2h3"
            />
          </svg>
          <h2 className="text-gray-700 text-2xl font-semibold mb-2">
            No clubs found
          </h2>
          <p className="text-gray-500 text-md">
            Ask your administrator or club leaders to create one!
          </p>
        </div>
      ) : (
        /* Club Cards Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {clubs.map((club) => (
            <div
              key={club.id}
              className="bg-white shadow-md p-6 rounded-2xl border border-gray-200 hover:shadow-xl transition-all duration-300"
            >
              <h2 className="text-2xl font-bold text-gray-800 mb-3">
                {club.name}
              </h2>

              <p className="text-gray-700 mb-4 line-clamp-3">
                {club.description || "No description available."}
              </p>

              <p className="text-gray-600 text-sm mb-4">
                <span className="font-medium text-gray-800">Category:</span>{" "}
                {club.category || "Not specified"}
              </p>

              <button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold transition-all"
                onClick={() => navigate("/participant")}
              >
                View Events
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
