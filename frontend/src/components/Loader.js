import React from "react";
import "../styles/NewtonsCradle.css";

/**
 * Loader Component - Newton's Cradle loading animation
 * 
 * @param {string} text - Optional loading text (default: "Loading")
 * @param {string} className - Additional CSS classes
 * @param {string} color - Color of the animation (default: "#474554")
 * @param {string} size - Size of the animation (default: "50px")
 */
export default function Loader({ 
  text = "Loading", 
  className = "", 
  color = "#474554",
  size = "50px" 
}) {
  return (
    <div className={`newtons-cradle-container ${className}`}>
      <div className="newtons-cradle-wrapper">
        <div 
          className="newtons-cradle" 
          style={{ 
            '--uib-color': color,
            '--uib-size': size 
          }}
        >
          <div className="newtons-cradle__dot"></div>
          <div className="newtons-cradle__dot"></div>
          <div className="newtons-cradle__dot"></div>
          <div className="newtons-cradle__dot"></div>
        </div>
        {text && <div className="newtons-cradle-text">{text}</div>}
      </div>
    </div>
  );
}

