import React, { useState } from "react";
import "../styles/EventCard.css";

/**
 * EventCard - Modern card design with purple gradient header
 * 
 * @param {object} event - Event object with title, description, date, time, location
 * @param {object} club - Club object with name and category
 * @param {boolean} isRegistered - Whether user is registered for this event
 * @param {boolean} isRegistering - Whether registration is in progress
 * @param {function} onRegister - Function to call when registering
 * @param {function} onViewDetails - Function to call when viewing details
 * @param {function} onBookmark - Function to call when bookmarking
 * @param {boolean} isBookmarked - Whether event is bookmarked
 * @param {string} className - Additional CSS classes
 */
export default function EventCard({ 
  event, 
  club = null,
  isRegistered = false, 
  isRegistering = false, 
  onRegister,
  onViewDetails,
  onBookmark,
  isBookmarked = false,
  className = "",
  style = {}
}) {
  const [bookmarked, setBookmarked] = useState(isBookmarked);

  const handleBookmark = (e) => {
    e.stopPropagation();
    setBookmarked(!bookmarked);
    if (onBookmark) {
      onBookmark();
    }
  };

  const handleCardClick = (e) => {
    // Don't navigate if clicking on buttons
    if (e.target.closest('button')) {
      return;
    }
    if (onViewDetails) {
      onViewDetails();
    }
  };

  // Format date to match "Mon, Nov 24 · 1:41 PM" format
  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      const options = { weekday: 'short', month: 'short', day: 'numeric' };
      const timeOptions = { hour: 'numeric', minute: '2-digit', hour12: true };
      const dateStr = date.toLocaleDateString('en-US', options);
      const timeStr = date.toLocaleTimeString('en-US', timeOptions);
      return `${dateStr} · ${timeStr}`;
    } catch (e) {
      return dateString;
    }
  };

  // Get rating (default to 4.6 if not available)
  const rating = event.rating || 4.6;
  
  // Get attendees count (default to 41 if not available)
  const attendeesCount = event.attendees_count || event.registered_count || 41;

  // Generate avatar colors for attendees
  const avatarColors = ['bg-purple-400', 'bg-pink-400', 'bg-teal-400'];

  return (
    <div 
      className={`event-card-modern ${className} ${onViewDetails ? 'cursor-pointer' : ''}`} 
      style={style}
      onClick={onViewDetails ? handleCardClick : undefined}
    >
      {/* Purple Gradient Header */}
      <div className="event-card-header">
        <div className="event-card-header-content">
          <h3 className="event-card-title-header">{event.title}</h3>
          {club && (
            <p className="event-card-club-header">{club.category?.toUpperCase() || 'CLUB'}</p>
          )}
        </div>
        <button
          className="event-card-bookmark"
          onClick={handleBookmark}
          aria-label="Bookmark event"
        >
          <svg 
            className={`w-5 h-5 ${bookmarked ? 'fill-white' : 'fill-none'}`} 
            stroke="currentColor" 
            strokeWidth={2} 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </button>
      </div>

      {/* White Content Section */}
      <div className="event-card-content">
        {/* Date and Time */}
        <p className="event-card-date">
          {formatDate(event.date) || `${event.date || ''} · ${event.time || ''}`}
        </p>

        {/* Title */}
        <h3 className="event-card-title">{event.title}</h3>

        {/* Creator and Rating */}
        <div className="event-card-meta">
          {club && (
            <span className="event-card-creator">by {club.name?.toUpperCase() || 'CLUB'}</span>
          )}
          <span className="event-card-rating">
            · {rating.toFixed(1)}
            <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </span>
        </div>

        {/* Attendees */}
        <div className="event-card-attendees">
          <div className="event-card-avatars">
            {avatarColors.map((color, index) => (
              <div 
                key={index} 
                className={`event-card-avatar ${color}`}
                style={{ marginLeft: index > 0 ? '-8px' : '0' }}
              />
            ))}
          </div>
          <span className="event-card-attendees-count">{attendeesCount} attendees</span>
        </div>

        {/* Action Buttons */}
        <div className="event-card-actions">
          {isRegistered ? (
            <div className="event-card-status-registered">
              ✓ Registered
            </div>
          ) : (
            <button
              className="event-card-register-btn"
              onClick={(e) => {
                e.stopPropagation();
                if (onRegister) onRegister();
              }}
              disabled={isRegistering}
            >
              {isRegistering ? "Registering..." : "Register"}
            </button>
          )}
          {onViewDetails && (
            <button
              className="event-card-view-btn"
              onClick={(e) => {
                e.stopPropagation();
                if (onViewDetails) onViewDetails();
              }}
            >
              View Details
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
