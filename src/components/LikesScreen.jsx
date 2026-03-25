import React, { useState, useMemo } from 'react';
import { KZ_REGIONS } from '../logic/constants';

const LikesScreen = ({ 
  allProfiles = [], 
  liked = new Set(), 
  onSelectProfile = () => {},
  onLike = () => {},
  matchedProfiles = [],
  conversations = {},
  onSendMessage = () => {},
  activeChat = null,
  setActiveChat = () => {}
}) => {
  const [activeFilters, setActiveFilters] = useState({ 'All saved': true });
  const [chatMessageText, setChatMessageText] = useState("");

  const colors = {
    matcha: '#7A9E7E',
    matchaMid: '#A8C5A0',
    matchaLight: '#C8DEC4',
    matchaPale: '#E4F0E0',
    matchaMist: '#F2F8F1',
    white: '#FFFFFF',
    cream: '#FAFDF9',
    ink: '#1C2B1E',
    ink60: 'rgba(28,43,30,0.6)',
    ink30: 'rgba(28,43,30,0.3)',
    ink10: 'rgba(28,43,30,0.08)',
  };

  // Get liked people from database
  const likedPeople = useMemo(() => {
    return allProfiles.filter(p => liked.has(p.id)).sort((a, b) => b.age - a.age);
  }, [allProfiles, liked]);

  // Filter matched profiles to show only those with housing (есть жилье)
  const matchedWithHousing = useMemo(() => {
    return (matchedProfiles || []).filter(p => {
      const tags = p.tags || [];
      // Check if they have housing-related tags
      return tags.some(tag => 
        typeof tag === 'string' && (
          tag.toLowerCase().includes('жилье') ||
          tag.toLowerCase().includes('housing') ||
          tag.toLowerCase().includes('apartment') ||
          tag.toLowerCase().includes('room') ||
          tag.toLowerCase().includes('квартир')
        )
      );
    });
  }, [matchedProfiles]);

  // Get region name by ID
  const getRegionName = (regionId) => {
    const region = KZ_REGIONS.find(r => r.id === regionId);
    return region?.name || regionId || "Almaty";
  };

  // Get initials from name
  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(' ')
      .slice(0, 2)
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  const styles = `
    .likes-container {
      min-height: calc(100vh - 49px);
      background: ${colors.cream};
    }

    .likes-topbar {
      background: ${colors.white};
      border-bottom: 1px solid ${colors.matchaLight};
      padding: 0 52px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 64px;
      position: sticky;
      top: 49px;
      z-index: 50;
    }

    .likes-topbar-left {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .likes-topbar-logo {
      font-family: 'Cormorant Garamond', serif;
      font-size: 1.3rem;
      font-weight: 600;
      color: ${colors.ink};
      display: flex;
      align-items: center;
      gap: 8px;
      padding-right: 20px;
      border-right: 1px solid ${colors.matchaLight};
    }

    .likes-topbar-logo span {
      color: ${colors.matcha};
    }

    .likes-page-title {
      font-family: 'Cormorant Garamond', serif;
      font-size: 1.1rem;
      font-weight: 600;
      color: ${colors.ink};
    }

    .likes-topbar-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .likes-btn-sm {
      padding: 8px 18px;
      border-radius: 100px;
      border: 1.5px solid ${colors.matchaLight};
      background: transparent;
      font-family: 'Geologica', sans-serif;
      font-size: 0.78rem;
      font-weight: 400;
      color: ${colors.ink60};
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .likes-btn-sm:hover {
      border-color: ${colors.matcha};
      color: ${colors.ink};
    }

    .map-avi {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: ${colors.matchaPale};
      border: 2px solid ${colors.matchaLight};
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Cormorant Garamond', serif;
      font-size: 0.85rem;
      font-weight: 600;
      color: ${colors.matcha};
      cursor: pointer;
    }

    .likes-body {
      padding: 40px 52px;
    }

    .likes-section-hd {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      margin-bottom: 28px;
    }

    .likes-section-eyebrow {
      font-size: 0.7rem;
      font-weight: 500;
      letter-spacing: 3px;
      text-transform: uppercase;
      color: ${colors.matcha};
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .likes-section-eyebrow::before {
      content: '';
      width: 16px;
      height: 1px;
      background: ${colors.matcha};
    }

    .likes-section-title {
      font-family: 'Cormorant Garamond', serif;
      font-size: 2rem;
      font-weight: 600;
      color: ${colors.ink};
      letter-spacing: -0.5px;
      line-height: 1;
    }

    .likes-count-badge {
      background: ${colors.matcha};
      color: ${colors.white};
      border-radius: 100px;
      padding: 4px 14px;
      font-size: 0.78rem;
      font-weight: 500;
    }

    .mutual-strip {
      background: ${colors.ink};
      border-radius: 24px;
      padding: 28px 32px;
      margin-bottom: 40px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      overflow: hidden;
      position: relative;
    }

    .mutual-strip-left {
      position: relative;
      z-index: 1;
    }

    .mutual-strip-eyebrow {
      font-size: 0.65rem;
      font-weight: 500;
      letter-spacing: 3px;
      text-transform: uppercase;
      color: ${colors.matchaMid};
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 7px;
    }

    .mutual-strip-eyebrow::before {
      content: '';
      width: 14px;
      height: 1px;
      background: ${colors.matchaMid};
    }

    .mutual-strip-title {
      font-family: 'Cormorant Garamond', serif;
      font-size: 1.8rem;
      font-weight: 600;
      color: ${colors.white};
      letter-spacing: -0.5px;
      line-height: 1.1;
      margin-bottom: 6px;
    }

    .mutual-strip-title em {
      font-style: italic;
      color: ${colors.matchaMid};
    }

    .mutual-strip-sub {
      font-size: 0.8rem;
      font-weight: 300;
      color: rgba(255,255,255,0.4);
    }

    .mutual-strip-avatars {
      position: relative;
      z-index: 1;
      display: flex;
      align-items: center;
    }

    .ms-avi {
      width: 52px;
      height: 52px;
      border-radius: 50%;
      border: 3px solid ${colors.ink};
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Cormorant Garamond', serif;
      font-size: 1rem;
      font-weight: 600;
    }

    .ms-avi:nth-child(2) {
      margin-left: -14px;
    }

    .ms-avi:nth-child(3) {
      margin-left: -14px;
    }

    .ms-avi-1 {
      background: ${colors.matchaPale};
      color: ${colors.matcha};
    }

    .ms-avi-2 {
      background: ${colors.matcha};
      color: ${colors.white};
    }

    .ms-avi-3 {
      background: ${colors.matchaMid};
      color: ${colors.white};
    }

    .ms-more {
      width: 52px;
      height: 52px;
      border-radius: 50%;
      border: 3px solid ${colors.ink};
      background: rgba(255,255,255,0.08);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.72rem;
      font-weight: 400;
      color: rgba(255,255,255,0.5);
      margin-left: -14px;
    }

    .mutual-strip-btn {
      position: relative;
      z-index: 1;
      background: ${colors.matcha};
      color: ${colors.white};
      border: none;
      padding: 12px 24px;
      border-radius: 100px;
      font-family: 'Geologica', sans-serif;
      font-size: 0.82rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .mutual-strip-btn:hover {
      background: ${colors.matchaMid};
      transform: translateY(-2px);
    }

    .likes-filter-row {
      display: flex;
      gap: 8px;
      margin-bottom: 32px;
      flex-wrap: wrap;
    }

    .lf-chip {
      padding: 8px 18px;
      border-radius: 100px;
      border: 1.5px solid ${colors.matchaLight};
      background: ${colors.white};
      font-family: 'Geologica', sans-serif;
      font-size: 0.76rem;
      font-weight: 400;
      color: ${colors.ink60};
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .lf-chip:hover {
      border-color: ${colors.matcha};
      color: ${colors.ink};
    }

    .lf-chip.active {
      background: ${colors.matcha};
      border-color: ${colors.matcha};
      color: ${colors.white};
    }

    .likes-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 20px;
      margin-bottom: 48px;
    }

    .lp-card {
      background: ${colors.white};
      border: 1.5px solid ${colors.matchaLight};
      border-radius: 24px;
      overflow: hidden;
      transition: transform 0.25s, box-shadow 0.25s;
      cursor: pointer;
      position: relative;
    }

    .lp-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 16px 48px rgba(122,158,126,0.15);
    }

    .lp-card-visual {
      height: 160px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
    }

    .lpv1 {
      background: linear-gradient(145deg, ${colors.matchaPale}, ${colors.matchaLight});
    }

    .lpv2 {
      background: linear-gradient(145deg, #EFF8EE, ${colors.matchaPale});
    }

    .lpv3 {
      background: linear-gradient(145deg, ${colors.matchaMist}, #E0EDD0);
    }

    .lpv4 {
      background: linear-gradient(145deg, #E5F2E5, ${colors.matchaLight});
    }

    .lp-avi-large {
      width: 68px;
      height: 68px;
      border-radius: 50%;
      background: ${colors.white};
      border: 3px solid rgba(255,255,255,0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Cormorant Garamond', serif;
      font-size: 1.4rem;
      font-weight: 600;
      color: ${colors.matcha};
      box-shadow: 0 4px 16px rgba(28,43,30,0.1);
    }

    .lp-mutual-badge {
      position: absolute;
      top: 12px;
      left: 12px;
      background: ${colors.matcha};
      color: ${colors.white};
      border-radius: 100px;
      padding: 4px 10px;
      font-size: 0.62rem;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .lp-like-btn {
      position: absolute;
      top: 12px;
      right: 12px;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: rgba(255,255,255,0.85);
      border: 1.5px solid ${colors.matchaLight};
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
    }

    .lp-like-btn.liked {
      background: #FFE8E8;
      border-color: #E8A0A0;
    }

    .lp-like-btn:hover {
      transform: scale(1.1);
    }

    .lp-card-body {
      padding: 16px 18px 18px;
    }

    .lp-name {
      font-family: 'Cormorant Garamond', serif;
      font-size: 1.05rem;
      font-weight: 600;
      color: ${colors.ink};
      margin-bottom: 2px;
    }

    .lp-meta {
      font-size: 0.7rem;
      font-weight: 300;
      color: ${colors.ink60};
      display: flex;
      align-items: center;
      gap: 4px;
      margin-bottom: 10px;
    }

    .lp-meta-dot {
      width: 2px;
      height: 2px;
      border-radius: 50%;
      background: ${colors.ink30};
    }

    .lp-tags {
      display: flex;
      gap: 5px;
      flex-wrap: wrap;
      margin-bottom: 12px;
    }

    .lp-tag {
      font-size: 0.62rem;
      padding: 3px 9px;
      border-radius: 100px;
      background: ${colors.matchaPale};
      color: ${colors.matcha};
      border: 1px solid ${colors.matchaLight};
    }

    .lp-tag.soft {
      background: ${colors.white};
      color: ${colors.ink60};
      border-color: ${colors.ink10};
    }

    .lp-compat-bar {
      background: ${colors.matchaMist};
      border-radius: 10px;
      padding: 10px 12px;
      margin-bottom: 12px;
    }

    .lp-compat-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 6px;
    }

    .lp-compat-label {
      font-size: 0.65rem;
      font-weight: 300;
      color: ${colors.ink60};
    }

    .lp-compat-val {
      font-family: 'Cormorant Garamond', serif;
      font-size: 0.95rem;
      font-weight: 600;
      color: ${colors.matcha};
    }

    .lp-bar-track {
      height: 4px;
      background: ${colors.matchaLight};
      border-radius: 2px;
    }

    .lp-bar-fill {
      height: 100%;
      border-radius: 2px;
      background: ${colors.matcha};
    }

    .lp-card-actions {
      display: flex;
      gap: 8px;
    }

    .lp-btn-msg {
      flex: 1;
      padding: 10px;
      background: ${colors.ink};
      color: ${colors.white};
      border: none;
      border-radius: 10px;
      font-family: 'Geologica', sans-serif;
      font-size: 0.76rem;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
    }

    .lp-btn-msg:hover {
      background: ${colors.matcha};
    }

    .lp-btn-profile {
      padding: 10px 14px;
      background: ${colors.matchaPale};
      border: 1.5px solid ${colors.matchaLight};
      border-radius: 10px;
      font-family: 'Geologica', sans-serif;
      font-size: 0.76rem;
      font-weight: 400;
      color: ${colors.matcha};
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .lp-btn-profile:hover {
      background: ${colors.matcha};
      color: ${colors.white};
      border-color: ${colors.matcha};
    }

    .liked-rooms-section {
      margin-top: 48px;
    }

    .liked-rooms-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 16px;
    }

    .lr-card {
      background: ${colors.white};
      border: 1.5px solid ${colors.matchaLight};
      border-radius: 20px;
      overflow: hidden;
      cursor: pointer;
      transition: all 0.22s;
    }

    .lr-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 10px 32px rgba(122,158,126,0.12);
    }

    .lr-card-img {
      height: 120px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }

    .lrv1 {
      background: linear-gradient(145deg, ${colors.matchaPale}, ${colors.matchaLight});
    }

    .lrv2 {
      background: linear-gradient(145deg, #EFF6EE, ${colors.matchaPale});
    }

    .lrv3 {
      background: linear-gradient(145deg, ${colors.matchaMist}, #DCF0DC);
    }

    .lrv4 {
      background: linear-gradient(145deg, #E8F5E8, ${colors.matchaPale});
    }

    .lr-price {
      position: absolute;
      top: 10px;
      right: 10px;
      background: ${colors.white};
      border: 1px solid ${colors.matchaLight};
      border-radius: 100px;
      padding: 3px 10px;
      font-family: 'Cormorant Garamond', serif;
      font-size: 0.78rem;
      font-weight: 600;
      color: ${colors.matcha};
    }

    .lr-card-body {
      padding: 12px 14px 14px;
    }

    .lr-title {
      font-family: 'Cormorant Garamond', serif;
      font-size: 0.9rem;
      font-weight: 600;
      color: ${colors.ink};
      margin-bottom: 3px;
    }

    .lr-loc {
      font-size: 0.65rem;
      font-weight: 300;
      color: ${colors.ink60};
      margin-bottom: 8px;
    }

    .lr-actions {
      display: flex;
      gap: 6px;
    }

    .lr-btn {
      flex: 1;
      padding: 7px;
      font-family: 'Geologica', sans-serif;
      font-size: 0.68rem;
      font-weight: 400;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.18s;
    }

    .lr-btn-view {
      background: ${colors.matchaPale};
      border: 1px solid ${colors.matchaLight};
      color: ${colors.matcha};
    }

    .lr-btn-view:hover {
      background: ${colors.matcha};
      color: ${colors.white};
    }

    .lr-btn-unlike {
      background: ${colors.white};
      border: 1px solid ${colors.ink10};
      color: ${colors.ink60};
    }

    .lr-btn-unlike:hover {
      background: #FFF0F0;
      border-color: #E8A0A0;
      color: #C06060;
    }

    @media (max-width: 1024px) {
      .likes-body {
        padding: 24px 20px;
      }

      .likes-topbar {
        padding: 0 20px;
      }
    }
  `;

  return (
    <div>
      <style>{styles}</style>
      <div className="likes-container">
        {/* TOP BAR */}
        <div className="likes-topbar">
          <div className="likes-topbar-left">
            <div className="likes-topbar-logo">
              <div style={{
                width: '26px',
                height: '26px',
                borderRadius: '8px',
                background: colors.matcha,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <svg width="14" height="14" viewBox="0 0 17 17" fill="none">
                  <path d="M8.5 2L14 6.8V15H10.5V11H6.5V15H3V6.8L8.5 2Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
                </svg>
              </div>
              Roomate<span>.kz</span>
            </div>
            <div className="likes-page-title">Saved</div>
          </div>
          <div className="likes-topbar-right">
            <button className="likes-btn-sm">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M1 3H11M3 6H9M5 9H7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              Filter
            </button>
            <button className="likes-btn-sm">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 1V11M1 6H11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              Browse more
            </button>
            <div className="map-avi">AN</div>
          </div>
        </div>

        <div className="likes-body">
          {/* MUTUAL MATCHES SECTION */}
          {matchedProfiles && matchedProfiles.length > 0 && (
            <div style={{ marginBottom: '40px' }}>
              <div className="mutual-strip">
                <div className="mutual-strip-left">
                  <div className="mutual-strip-eyebrow">Mutual matches</div>
                  <div className="mutual-strip-title">They liked you <em>back</em></div>
                  <div className="mutual-strip-sub">{matchedProfiles.length} {matchedProfiles.length === 1 ? 'person has' : 'people have'} also liked your profile — start a conversation</div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '28px', position: 'relative', zIndex: '1' }}>
                  <div className="mutual-strip-avatars">
                    {matchedProfiles.slice(0, 3).map((p, idx) => (
                      <div key={p.id} className={`ms-avi ms-avi-${(idx % 3) + 1}`}>{getInitials(p.name)}</div>
                    ))}
                    {matchedProfiles.length > 3 && (
                      <div className="ms-more">+{matchedProfiles.length - 3}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* MATCHED PROFILES GRID - Show all matched profiles */}
              <div style={{ marginBottom: '40px' }}>
                <div className="likes-section-hd">
                  <div>
                    <div className="likes-section-eyebrow">Your matches</div>
                    <div className="likes-section-title">People who matched with you</div>
                  </div>
                  <div className="likes-count-badge">{matchedProfiles.length} match{matchedProfiles.length !== 1 ? 'es' : ''}</div>
                </div>

                <div className="likes-grid">
                  {matchedProfiles.map((person, idx) => (
                    <div key={person.id} className="lp-card" style={{ position: 'relative' }}>
                      <div className={`lp-card-visual lpv${(idx % 4) + 1}`}>
                        <div className="lp-avi-large">{getInitials(person.name)}</div>
                        <div className="lp-mutual-badge">✓ Matched</div>
                        {/* Show housing badge if they have housing */}
                        {(person.tags || []).some(tag => typeof tag === 'string' && (tag.toLowerCase().includes('жилье') || tag.toLowerCase().includes('housing') || tag.toLowerCase().includes('квартир'))) && (
                          <div style={{
                            position: 'absolute',
                            bottom: '12px',
                            left: '12px',
                            background: '#fff',
                            color: colors.matcha,
                            borderRadius: '100px',
                            padding: '4px 10px',
                            fontSize: '0.62rem',
                            fontWeight: '500',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            🏠 Has housing
                          </div>
                        )}
                        <div className="lp-like-btn liked">
                          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                            <path d="M6.5 11S1.5 7.5 1.5 4.5C1.5 2.8 2.8 1.5 4.5 1.5C5.2 1.5 6 1.9 6.5 2.6C7 1.9 7.8 1.5 8.5 1.5C10.2 1.5 11.5 2.8 11.5 4.5C11.5 7.5 6.5 11 6.5 11Z" fill="#E08080" stroke="#E08080" strokeWidth="0.8" />
                          </svg>
                        </div>
                      </div>
                      <div className="lp-card-body">
                        <div className="lp-name">{person.name}, {person.age}</div>
                        <div className="lp-meta">
                          {getRegionName(person.region)}
                          <div className="lp-meta-dot"></div>
                          {person.occupation || 'N/A'}
                        </div>
                        <div className="lp-tags">
                          {(person.tags || []).slice(0, 3).map((tag, i) => (
                            <span key={i} className="lp-tag">{tag}</span>
                          ))}
                        </div>
                        <div className="lp-card-actions">
                          <button 
                            className="lp-btn-msg"
                            onClick={() => setActiveChat(person.id)}
                          >
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                              <path d="M2 1H10C10.6 1 11 1.4 11 2V8C11 8.6 10.6 9 10 9H3L1 11V2C1 1.4 1.4 1 2 1Z" fill="currentColor" />
                            </svg>
                            Message
                          </button>
                          <button 
                            className="lp-btn-profile"
                            onClick={() => onSelectProfile(person)}
                          >
                            Profile →
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* PEOPLE WITH HOUSING SECTION - Those who can offer accommodation */}
              {matchedWithHousing.length > 0 && (
                <div style={{ marginBottom: '40px' }}>
                  <div className="likes-section-hd">
                    <div>
                      <div className="likes-section-eyebrow">On the map</div>
                      <div className="likes-section-title">People with housing available</div>
                    </div>
                    <div className="likes-count-badge">{matchedWithHousing.length} with housing</div>
                  </div>
                  <div style={{
                    background: colors.matchaMist,
                    borderRadius: '16px',
                    padding: '24px',
                    marginBottom: '40px'
                  }}>
                    <p style={{ fontSize: '0.9rem', color: colors.ink60, marginBottom: '16px' }}>
                      These matched people have indicated they have housing/apartments available. They can be viewed on the map with their locations.
                    </p>
                    <div style={{
                      display: 'flex',
                      gap: '12px',
                      flexWrap: 'wrap'
                    }}>
                      {matchedWithHousing.map(person => (
                        <div key={person.id} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          background: colors.white,
                          borderRadius: '12px',
                          padding: '12px 16px',
                          border: `1px solid ${colors.matchaLight}`
                        }}>
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background: colors.matchaPale,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: colors.matcha,
                            fontFamily: "'Cormorant Garamond', serif"
                          }}>
                            {getInitials(person.name)}
                          </div>
                          <div>
                            <div style={{ fontSize: '0.9rem', fontWeight: '600', color: colors.ink }}>
                              {person.name}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: colors.ink60 }}>
                              {getRegionName(person.region)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* CHAT VIEW FOR ACTIVE CHAT */}
              {activeChat && matchedProfiles.find(p => p.id === activeChat) && (
                <div style={{
                  background: colors.white,
                  borderRadius: '16px',
                  border: `1px solid ${colors.matchaLight}`,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '600px',
                  marginBottom: '40px'
                }}>
                  {/* Chat Header */}
                  <div style={{
                    padding: '16px 20px',
                    borderBottom: `1px solid ${colors.matchaLight}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: colors.matchaPale,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '16px',
                        fontWeight: '600',
                        color: colors.matcha,
                        fontFamily: "'Cormorant Garamond', serif"
                      }}>
                        {getInitials(matchedProfiles.find(p => p.id === activeChat)?.name || '')}
                      </div>
                      <div>
                        <div style={{ fontSize: '1rem', fontWeight: '600', color: colors.ink }}>
                          {matchedProfiles.find(p => p.id === activeChat)?.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: colors.ink60 }}>
                          {getRegionName(matchedProfiles.find(p => p.id === activeChat)?.region || '')}
                        </div>
                      </div>
                    </div>
                    <button onClick={() => setActiveChat(null)} style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '20px',
                      cursor: 'pointer',
                      color: colors.ink30
                    }}>✕</button>
                  </div>

                  {/* Chat Messages */}
                  <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '16px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    backgroundColor: colors.matchaMist
                  }}>
                    {conversations[activeChat] && conversations[activeChat].length > 0 ? (
                      conversations[activeChat].map((msg, idx) => (
                        <div key={idx} style={{
                          display: 'flex',
                          justifyContent: msg.mine ? 'flex-end' : 'flex-start',
                          marginBottom: '8px'
                        }}>
                          <div style={{
                            maxWidth: '60%',
                            padding: '10px 14px',
                            borderRadius: '14px',
                            background: msg.mine ? colors.matcha : colors.white,
                            color: msg.mine ? colors.white : colors.ink,
                            fontSize: '0.9rem',
                            lineHeight: '1.4',
                            wordBreak: 'break-word',
                            boxShadow: msg.mine ? 'none' : `0 1px 3px rgba(0,0,0,0.1)`
                          }}>
                            {msg.text}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        color: colors.ink30,
                        fontSize: '0.9rem'
                      }}>
                        Start the conversation
                      </div>
                    )}
                  </div>

                  {/* Chat Input */}
                  <div style={{
                    padding: '12px 16px',
                    borderTop: `1px solid ${colors.matchaLight}`,
                    display: 'flex',
                    gap: '8px'
                  }}>
                    <input
                      type="text"
                      placeholder="Type a message..."
                      value={chatMessageText}
                      onChange={(e) => setChatMessageText(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && chatMessageText.trim()) {
                          onSendMessage(activeChat, chatMessageText);
                          setChatMessageText('');
                        }
                      }}
                      style={{
                        flex: 1,
                        border: `1px solid ${colors.matchaLight}`,
                        borderRadius: '10px',
                        padding: '10px 12px',
                        fontSize: '0.9rem',
                        fontFamily: "'Geologica', sans-serif",
                        outline: 'none',
                        transition: 'border-color 0.2s'
                      }}
                      onFocus={(e) => e.target.style.borderColor = colors.matcha}
                      onBlur={(e) => e.target.style.borderColor = colors.matchaLight}
                    />
                    <button
                      onClick={() => {
                        if (chatMessageText.trim()) {
                          onSendMessage(activeChat, chatMessageText);
                          setChatMessageText('');
                        }
                      }}
                      style={{
                        padding: '10px 16px',
                        background: colors.matcha,
                        color: colors.white,
                        border: 'none',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: '500',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.background = '#6a8e6e'}
                      onMouseLeave={(e) => e.target.style.background = colors.matcha}
                    >
                      Send
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* FILTER CHIPS */}
          <div className="likes-filter-row">
            {['All saved (12)', 'People (8)', 'Rooms (4)', 'High match only', 'Near metro', 'Under ₸70k'].map((chip, idx) => (
              <div
                key={idx}
                className={`lf-chip ${activeFilters[chip] ? 'active' : ''}`}
                onClick={() => setActiveFilters(prev => ({ ...prev, [chip]: !prev[chip] }))}
              >
                {chip === 'High match only' && (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M5 1L6 3.5H8.5L6.5 5L7 8L5 6.5L3 8L3.5 5L1.5 3.5H4L5 1Z" stroke="currentColor" strokeWidth="1" />
                  </svg>
                )}
                {chip}
              </div>
            ))}
          </div>

          {/* LIKED PEOPLE SECTION */}
          <div className="likes-section-hd">
            <div>
              <div className="likes-section-eyebrow">Saved profiles</div>
              <div className="likes-section-title">People you liked</div>
            </div>
            <div className="likes-count-badge">{likedPeople.length} people</div>
          </div>

          <div className="likes-grid">
            {likedPeople.length > 0 ? (
              likedPeople.map((person, idx) => (
                <div key={person.id} className="lp-card">
                  <div className={`lp-card-visual lpv${(idx % 4) + 1}`}>
                    <div className="lp-avi-large">{getInitials(person.name)}</div>
                    <div className="lp-like-btn liked">
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                        <path d="M6.5 11S1.5 7.5 1.5 4.5C1.5 2.8 2.8 1.5 4.5 1.5C5.2 1.5 6 1.9 6.5 2.6C7 1.9 7.8 1.5 8.5 1.5C10.2 1.5 11.5 2.8 11.5 4.5C11.5 7.5 6.5 11 6.5 11Z" fill="#E08080" stroke="#E08080" strokeWidth="0.8" />
                      </svg>
                    </div>
                  </div>
                  <div className="lp-card-body">
                    <div className="lp-name">{person.name}, {person.age}</div>
                    <div className="lp-meta">
                      {getRegionName(person.region)}
                      <div className="lp-meta-dot"></div>
                      {person.occupation || 'N/A'}
                    </div>
                    <div className="lp-tags">
                      {(person.tags || []).slice(0, 3).map((tag, i) => (
                        <span key={i} className="lp-tag">{tag}</span>
                      ))}
                      {person.verification_status === 'approved' && (
                        <span className="lp-tag" style={{background: '#E4F0E0', color: '#7A9E7E', border: '1px solid #C8DEC4'}}>✓ Верифицирован</span>
                      )}
                      {person.verification_status === 'pending' && (
                        <span className="lp-tag" style={{background: '#FEF3C7', color: '#92400E', border: '1px solid rgba(146,64,14,0.2)'}}>⏳ На проверке</span>
                      )}
                    </div>
                    <div className="lp-card-actions">
                      <button 
                        className="lp-btn-profile"
                        onClick={() => onSelectProfile(person)}
                      >
                        View profile →
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: colors.ink60 }}>
                <p style={{ fontSize: '1rem', marginBottom: '8px' }}>No liked profiles yet</p>
                <p style={{ fontSize: '0.85rem' }}>Start liking people on the map to save them here!</p>
              </div>
            )}
          </div>

          {/* LIKED ROOMS SECTION - Coming soon */}
          {/* Room listings will be added here in the future */}
        </div>
      </div>
    </div>
  );
};

export default LikesScreen;
