import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/AnimatedButton.css";

/**
 * AnimatedButton - A beautiful animated button with loading state for navigation
 * 
 * @param {string} to - The path to navigate to (e.g., "/dashboard", "/login")
 * @param {string} children - Button text content
 * @param {function} onClick - Optional custom click handler (will be called before navigation)
 * @param {number} delay - Delay in milliseconds before navigation (default: 500)
 * @param {boolean} disabled - Whether the button is disabled
 * @param {string} className - Additional CSS classes
 * @param {object} ...props - Other button props
 */
export default function AnimatedButton({
  to,
  children,
  onClick,
  delay = 500,
  disabled = false,
  className = "",
  ...props
}) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleClick = async (e) => {
    if (disabled || loading) return;

    e.preventDefault();
    setLoading(true);

    // Call custom onClick handler if provided
    if (onClick) {
      try {
        await onClick(e);
      } catch (error) {
        console.error("Error in onClick handler:", error);
        setLoading(false);
        return;
      }
    }

    // Wait for the delay to show loading animation
    setTimeout(() => {
      if (to) {
        navigate(to);
      }
      // Reset loading state after navigation
      setTimeout(() => setLoading(false), 100);
    }, delay);
  };

  return (
    <button
      className={`button ${loading ? "loading" : ""} ${className}`}
      onClick={handleClick}
      disabled={disabled || loading}
      {...props}
    >
      <div className="dots_border"></div>
      
      <div className="sparkle">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            className="path"
            d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            className="path"
            d="M19 3L19.5 5.5L22 6L19.5 6.5L19 9L18.5 6.5L16 6L18.5 5.5L19 3Z"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            className="path"
            d="M5 19L5.5 21.5L8 22L5.5 22.5L5 25L4.5 22.5L2 22L4.5 21.5L5 19Z"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      
      <span className="text_button">{children}</span>
    </button>
  );
}

