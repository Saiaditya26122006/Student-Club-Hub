import React from "react";
import { Link, useLocation } from "react-router-dom";
import Button53 from "./Button53";

export default function Navbar({ onLogout, role }) {
  const location = useLocation();
  const isLeader = role === "leader";
  const isUniversity = role === "university";
  const isParticipant = role === "participant";
  const isAuthenticated = !!onLogout;

  const quickLinks = [
    {
      id: "participant",
      label: "Participant Suite",
      href: "/participant",
      visible: isParticipant,
    },
    {
      id: "leader",
      label: "Leader Control",
      href: "/leader",
      visible: isLeader,
    },
    {
      id: "university",
      label: "University Ops",
      href: "/university",
      visible: isUniversity,
    },
  ];

  return (
    <nav className="ai-nav text-white flex flex-wrap items-center justify-between gap-6">
      <Link to="/" className="ai-nav__logo group">
        <div className="ai-nav__indicator group-hover:shadow-ai-glow transition-all duration-300">
          <svg className="w-6 h-6 text-[#A7B0BB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
              d="M12 8c1.657 0 3-1.79 3-4s-1.343-4-3-4-3 1.79-3 4 1.343 4 3 4zM4 22c0-3.314 2.686-6 6-6h4c3.314 0 6 2.686 6 6"
            />
          </svg>
        </div>
        <div>
          <p className="text-lg font-semibold tracking-wide">Student Club-Hub Intelligence</p>
          <p className="text-[0.7rem] uppercase tracking-[0.4em] text-gray-300">
            AI-first operations
          </p>
        </div>
      </Link>

      {isAuthenticated && (
        <div className="flex flex-wrap items-center gap-3">
          {quickLinks
            .filter((item) => item.visible)
            .map((item) => (
              <Button53
                key={item.id}
                to={item.href}
                className={`compact ${location.pathname === item.href ? "active" : ""}`}
              >
                {item.label}
              </Button53>
            ))}
        </div>
      )}
    </nav>
  );
}
