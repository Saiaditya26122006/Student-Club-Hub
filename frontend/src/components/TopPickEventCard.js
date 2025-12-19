import React from "react";
import "../styles/TopPickEventCard.css";

/**
 * TopPickEventCard - Featured event card for "Top picks for you" section
 * 
 * @param {object} event - Event object with title, description, date, time, location, poster_image
 * @param {object} club - Club object with name, category
 * @param {boolean} isBookmarked - Whether event is bookmarked
 * @param {function} onBookmark - Function to toggle bookmark
 * @param {function} onViewDetails - Function to view event details
 */
export default function TopPickEventCard({ 
  event, 
  club,
  isBookmarked = false,
  onBookmark,
  onViewDetails 
}) {
  // Format date and time
  const formatDateTime = () => {
    if (!event.date) return '';
    try {
      const date = new Date(event.date);
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      const dayName = days[date.getDay()];
      const monthName = months[date.getMonth()];
      const day = date.getDate();
      
      let timeStr = '';
      if (event.time) {
        // Format time to show only hour and minute
        const timeParts = event.time.split(':');
        if (timeParts.length >= 2) {
          const hour = parseInt(timeParts[0]);
          const minute = timeParts[1];
          const period = hour >= 12 ? 'PM' : 'AM';
          const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
          timeStr = ` · ${displayHour}:${minute} ${period}`;
        } else {
          timeStr = ` · ${event.time}`;
        }
      }
      
      return `${dayName}, ${monthName} ${day}${timeStr}`;
    } catch {
      return event.date;
    }
  };

  // Get attendee count (placeholder - would come from API)
  const attendeeCount = Math.floor(Math.random() * 100) + 10;
  const rating = (4 + Math.random()).toFixed(1); // Random rating between 4.0 and 5.0

  return (
    <div className="top-pick-event-card">
      {/* Main Card */}
      <div 
        className="top-pick-event-card__container"
        onClick={() => onViewDetails && onViewDetails()}
      >
        {/* Bookmark Icon */}
        {onBookmark && (
          <button
            className="top-pick-event-card__bookmark"
            onClick={(e) => {
              e.stopPropagation();
              onBookmark();
            }}
          >
            <svg 
              className="w-5 h-5" 
              fill={isBookmarked ? "white" : "none"} 
              stroke="white" 
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
        )}

        {/* Event Image/Visual */}
        {event.poster_image ? (
          <div className="top-pick-event-card__image">
            <img
              src={event.poster_image.startsWith('http') ? event.poster_image : `http://localhost:5000${event.poster_image}`}
              alt={event.title}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextElementSibling.style.display = 'flex';
              }}
            />
            <div className="top-pick-event-card__image-placeholder" style={{ display: 'none' }}>
              <div className="top-pick-event-card__placeholder-content">
                <h3 className="top-pick-event-card__placeholder-title">{event.title}</h3>
                {club && (
                  <p className="top-pick-event-card__placeholder-org">{club.name}</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="top-pick-event-card__image-placeholder">
            <div className="top-pick-event-card__placeholder-content">
              <h3 className="top-pick-event-card__placeholder-title">{event.title}</h3>
              {club && (
                <p className="top-pick-event-card__placeholder-org">{club.name}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Metadata Below Card */}
      <div className="top-pick-event-card__metadata">
        <p className="top-pick-event-card__datetime">{formatDateTime()}</p>
        <h3 className="top-pick-event-card__title">{event.title}</h3>
        {club && (
          <p className="top-pick-event-card__organizer">
            by {club.name} · {rating} ⭐
          </p>
        )}
        
        <div className="top-pick-event-card__attendees">
          <div className="top-pick-event-card__avatar-group">
            {[1, 2, 3].map((i) => (
              <div 
                key={i} 
                className="top-pick-event-card__avatar"
                style={{
                  background: `linear-gradient(135deg, ${['#a855f7', '#ec4899', '#3b82f6'][i - 1]}, ${['#ec4899', '#3b82f6', '#10b981'][i - 1]})`
                }}
              />
            ))}
          </div>
          <span className="top-pick-event-card__attendee-count">{attendeeCount} attendees</span>
        </div>
      </div>
    </div>
  );
}

