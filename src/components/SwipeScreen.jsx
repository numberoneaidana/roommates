import React, { useState, useEffect, useMemo } from 'react';
import { KZ_REGIONS } from '../logic/constants';
import './SwipeScreen.css';

const getRegionName = (regionId) => {
  if (!regionId) return 'Unknown';
  const region = KZ_REGIONS.find(r => r.id === regionId);
  return region ? region.name : 'Unknown';
};

const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.split(' ');
  return (parts[0]?.[0] || '') + (parts[1]?.[0] || '');
};

const SwipeScreen = ({ allProfiles = [], liked = new Set(), onSelectProfile = () => {}, onLike = () => {}, auth = {} }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState(null);
  const [mouseDown, setMouseDown] = useState(null);

  // Filter out already liked profiles and current user
  const availableProfiles = useMemo(() => {
    return allProfiles.filter(p => p.id !== auth.id && !liked.has(p.id));
  }, [allProfiles, liked, auth.id]);

  const currentProfile = availableProfiles[currentIndex];

  const handleSwipeRight = () => {
    if (!currentProfile) return;
    setSwipeDirection('right');
    setTimeout(() => {
      onLike(currentProfile);
      setCurrentIndex(prev => Math.min(prev + 1, availableProfiles.length - 1));
      setSwipeDirection(null);
    }, 300);
  };

  const handleSwipeLeft = () => {
    setSwipeDirection('left');
    setTimeout(() => {
      setCurrentIndex(prev => Math.min(prev + 1, availableProfiles.length - 1));
      setSwipeDirection(null);
    }, 300);
  };

  const handleMouseDown = (e) => {
    setMouseDown({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = (e) => {
    if (!mouseDown) return;
    const diffX = e.clientX - mouseDown.x;
    const diffY = e.clientY - mouseDown.y;
    
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
      if (diffX > 0) {
        handleSwipeRight();
      } else {
        handleSwipeLeft();
      }
    }
    setMouseDown(null);
  };

  if (availableProfiles.length === 0) {
    return (
      <div className="swipe-screen">
        <div className="swipe-empty-state">
          <div className="empty-icon">💚</div>
          <h2>No more profiles</h2>
          <p>You've seen everyone in your area. Check back later for new matches!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="swipe-screen">
      <div className="swipe-header">
        <h1>Find your <em>perfect</em> roommate</h1>
        <p>Swipe right to like, left to skip</p>
      </div>

      <div className="swipe-container">
        <div
          className={`swipe-card ${swipeDirection ? `swipe-${swipeDirection}` : ''}`}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onClick={() => onSelectProfile(currentProfile)}
        >
          {currentProfile && (
            <>
              <div className="card-header">
                <div className="card-avatar">
                  {getInitials(currentProfile.name)}
                </div>
                <div className="card-name-info">
                  <div className="card-name">{currentProfile.name}</div>
                  <div className="card-location">
                    📍 {getRegionName(currentProfile.region)}
                  </div>
                </div>
              </div>

              <div className="card-tags">
                {currentProfile.tags && currentProfile.tags.slice(0, 3).map((tag, idx) => (
                  <span key={idx} className="card-tag">{tag}</span>
                ))}
                {currentProfile.verification_status === 'approved' && (
                  <span className="card-tag" style={{background: '#E4F0E0', color: '#7A9E7E', border: '1px solid #C8DEC4'}}>
                    ✓ Верифицирован
                  </span>
                )}
                {currentProfile.verification_status === 'pending' && (
                  <span className="card-tag" style={{background: '#FEF3C7', color: '#92400E', border: '1px solid rgba(146,64,14,0.2)'}}>
                    ⏳ На проверке
                  </span>
                )}
              </div>

              <div className="card-details">
                <div className="detail-row">
                  <span className="label">Age:</span>
                  <span className="value">{currentProfile.age}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Occupation:</span>
                  <span className="value">{currentProfile.occupation || 'Not specified'}</span>
                </div>
              </div>

              <div className="card-bio">
                {currentProfile.bio || 'No bio yet'}
              </div>

              <div className="card-footer">
                <div className="match-score">
                  <span className="score-label">Match Score</span>
                  <span className="score-value">
                    {Math.round(Math.random() * 30 + 70)}%
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="swipe-actions">
          <button
            className="action-btn pass-btn"
            onClick={handleSwipeLeft}
            title="Skip (Left)"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M19 5L5 19M5 5L19 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>

          <div className="progress-info">
            <span className="progress-text">
              {currentIndex + 1} of {availableProfiles.length}
            </span>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${((currentIndex + 1) / availableProfiles.length) * 100}%` }}
              ></div>
            </div>
          </div>

          <button
            className="action-btn like-btn"
            onClick={handleSwipeRight}
            title="Like (Right)"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="swipe-instructions">
        <p>💬 Click card to view full profile</p>
        <p>👈 ➡️ Drag to swipe or use buttons</p>
      </div>
    </div>
  );
};

export default SwipeScreen;
