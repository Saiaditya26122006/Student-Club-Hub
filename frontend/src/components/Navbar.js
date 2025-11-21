import React from "react";
import { Link } from "react-router-dom";

export default function Navbar({ onLogout, role }) {
  const isLeader = role === "leader";
  const isUniversity = role === "university";
  const isParticipant = role === "participant";
  const isAuthenticated = !!onLogout;
  
  return (
    <nav className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between shadow-lg">
      {/* Logo */}
      <div className="text-2xl font-semibold tracking-wide cursor-pointer">
        ClubHub
      </div>

      {/* Links - Only show when authenticated */}
      {isAuthenticated && (
        <div className="space-x-6 text-lg flex items-center">
          {isParticipant && (
            <Link 
              className="hover:text-yellow-400 transition" 
              to="/participant"
            >
              Dashboard
            </Link>
          )}

          {isLeader && (
            <Link 
              className="hover:text-yellow-400 transition" 
              to="/leader"
            >
              Dashboard
            </Link>
          )}

          {isUniversity && (
            <Link 
              className="hover:text-yellow-400 transition" 
              to="/university"
            >
              Dashboard
            </Link>
          )}

          <button
            onClick={onLogout}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition text-white"
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}
