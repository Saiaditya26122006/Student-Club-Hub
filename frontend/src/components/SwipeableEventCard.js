import React, { useState, useRef, useEffect } from 'react';
import '../styles/SwipeableCard.css';

export default function SwipeableEventCard({ 
  event, 
  onSwipeLeft, 
  onSwipeRight, 
  isTopCard,
  cardIndex 
}) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const cardRef = useRef(null);

  const handleMouseDown = (e) => {
    if (!isTopCard) return;
    setIsDragging(true);
    setStartPos({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !isTopCard) return;
    const newX = e.clientX - startPos.x;
    const newY = e.clientY - startPos.y;
    const newRotation = newX / 20;
    
    setPosition({ x: newX, y: newY });
    setRotation(newRotation);
  };

  const handleMouseUp = () => {
    if (!isDragging || !isTopCard) return;
    setIsDragging(false);

    // Swipe threshold
    if (Math.abs(position.x) > 150) {
      if (position.x > 0) {
        // Swipe right - Like
        animateSwipe('right');
      } else {
        // Swipe left - Pass
        animateSwipe('left');
      }
    } else {
      // Reset position
      setPosition({ x: 0, y: 0 });
      setRotation(0);
    }
  };

  const animateSwipe = (direction) => {
    const multiplier = direction === 'right' ? 1 : -1;
    setPosition({ x: multiplier * 1000, y: -200 });
    setRotation(multiplier * 45);
    
    setTimeout(() => {
      if (direction === 'right') {
        onSwipeRight(event);
      } else {
        onSwipeLeft(event);
      }
      setPosition({ x: 0, y: 0 });
      setRotation(0);
    }, 300);
  };

  const handleLikeClick = () => {
    if (isTopCard) {
      animateSwipe('right');
    }
  };

  const handlePassClick = () => {
    if (isTopCard) {
      animateSwipe('left');
    }
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, position]);

  const getSwipeIndicator = () => {
    if (position.x > 50) return 'like';
    if (position.x < -50) return 'nope';
    return null;
  };

  const swipeIndicator = getSwipeIndicator();
  const opacity = Math.min(Math.abs(position.x) / 100, 1);

  return (
    <div 
      ref={cardRef}
      className={`swipeable-card ${isTopCard ? 'top-card' : ''} ${isDragging ? 'dragging' : ''}`}
      style={{
        transform: `translate(${position.x}px, ${position.y}px) rotate(${rotation}deg) scale(${isTopCard ? 1 : 0.95 - cardIndex * 0.05})`,
        zIndex: isTopCard ? 100 : 100 - cardIndex,
        opacity: isTopCard ? 1 : 0.8 - cardIndex * 0.2,
        cursor: isTopCard ? (isDragging ? 'grabbing' : 'grab') : 'default',
        pointerEvents: isTopCard ? 'auto' : 'none',
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Swipe Indicators */}
      {swipeIndicator === 'like' && (
        <div className="swipe-indicator like-indicator" style={{ opacity }}>
          <div className="indicator-content">
            <svg className="indicator-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span className="indicator-text">INTERESTED</span>
          </div>
        </div>
      )}
      
      {swipeIndicator === 'nope' && (
        <div className="swipe-indicator nope-indicator" style={{ opacity }}>
          <div className="indicator-content">
            <svg className="indicator-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span className="indicator-text">PASS</span>
          </div>
        </div>
      )}

      {/* Event Image */}
      <div className="card-image-container">
        <img 
          src={event.image || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800'} 
          alt={event.title}
          className="card-image"
        />
        <div className="card-gradient-overlay"></div>
      </div>

      {/* Event Info */}
      <div className="card-info">
        <div className="card-header">
          <h2 className="event-title">{event.title}</h2>
          <span className="event-category">{event.category || 'Event'}</span>
        </div>
        
        <div className="event-details">
          <div className="detail-item">
            <svg className="detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
          
          <div className="detail-item">
            <svg className="detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{event.time || '6:00 PM'}</span>
          </div>
          
          <div className="detail-item">
            <svg className="detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{event.location || 'Campus Hall'}</span>
          </div>
        </div>

        <p className="event-description">{event.description}</p>

        {/* Club Badge */}
        <div className="club-badge">
          <div className="club-avatar">
            {event.club_name ? event.club_name[0].toUpperCase() : 'C'}
          </div>
          <span className="club-name">{event.club_name || 'Student Club'}</span>
        </div>
      </div>

      {/* Action Buttons (visible on hover or always for top card) */}
      {isTopCard && (
        <div className="card-actions">
          <button 
            className="action-button pass-button"
            onClick={handlePassClick}
            aria-label="Pass"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <button 
            className="action-button like-button"
            onClick={handleLikeClick}
            aria-label="Like"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
