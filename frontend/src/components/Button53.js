import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Button53.css";

/**
 * Button53 - Animated button with sliding text effect
 * 
 * @param {string} to - Route path for navigation (optional)
 * @param {string} children - Button text content
 * @param {function} onClick - Click handler function (optional)
 * @param {boolean} disabled - Whether button is disabled
 * @param {string} className - Additional CSS classes
 * @param {object} ...props - Other button props
 */
export default function Button53({ 
  to, 
  children, 
  onClick, 
  disabled = false, 
  className = "",
  ...props 
}) {
  const navigate = useNavigate();
  
  // Split text into individual letters for animation
  const text = typeof children === 'string' ? children : '';
  const letters = text.split('').map((letter, index) => (
    <span key={index} style={{ transitionDelay: `${index * 0.05}s` }}>
      {letter === ' ' ? '\u00A0' : letter}
    </span>
  ));

  const handleClick = (e) => {
    if (disabled) return;
    
    if (onClick) {
      onClick(e);
    }
    
    if (to && !e.defaultPrevented) {
      navigate(to);
    }
  };

  return (
    <button
      className={`btn-53 ${className}`}
      onClick={handleClick}
      disabled={disabled}
      {...props}
    >
      <span className="original">{text}</span>
      <span className="letters">{letters}</span>
    </button>
  );
}

