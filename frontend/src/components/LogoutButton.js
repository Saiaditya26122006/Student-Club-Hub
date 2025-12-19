import React from "react";
import "../styles/LogoutButton.css";

/**
 * LogoutButton - Animated logout button that expands on hover
 * 
 * @param {function} onClick - Click handler function
 * @param {string} text - Button text (default: "Logout")
 * @param {string} className - Additional CSS classes
 */
export default function LogoutButton({ onClick, text = "Logout", className = "" }) {
  return (
    <button
      className={`Btn ${className}`}
      onClick={onClick}
      type="button"
      aria-label={text}
    >
      <div className="sign">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <div className="text">{text}</div>
    </button>
  );
}

