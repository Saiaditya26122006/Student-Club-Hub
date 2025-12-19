import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/AnimatedButton53.css";

/**
 * AnimatedButton53 - Button with letter-by-letter animation on hover
 * 
 * @param {string} to - Route to navigate to (optional)
 * @param {string} children - Button text content
 * @param {function} onClick - Optional click handler
 * @param {boolean} disabled - Whether button is disabled
 * @param {string} className - Additional CSS classes
 * @param {object} ...props - Other button props
 */
export default function AnimatedButton53({
  to,
  children,
  onClick,
  disabled = false,
  className = "",
  active = false,
  ...props
}) {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if current route matches
  const isActive = active || (to && location.pathname === to);

  const handleClick = (e) => {
    if (disabled) return;
    
    if (onClick) {
      onClick(e);
    }
    
    if (to && !e.defaultPrevented) {
      navigate(to);
    }
  };

  // Split text into individual letters for animation
  const text = typeof children === "string" ? children : "";
  const letters = text.split("");

  return (
    <button
      className={`btn-53 ${isActive ? "active" : ""} ${className}`}
      onClick={handleClick}
      disabled={disabled}
      {...props}
    >
      <span className="original">{text}</span>
      <span className="letters">
        {letters.map((letter, index) => (
          <span key={index} style={{ transitionDelay: `${index * 0.05}s` }}>
            {letter === " " ? "\u00A0" : letter}
          </span>
        ))}
      </span>
    </button>
  );
}

