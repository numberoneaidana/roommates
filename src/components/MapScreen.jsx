import React, { useState } from 'react';

const MapScreen = () => {
  const [selectedPerson, setSelectedPerson] = useState(0);
  const [filterChips, setFilterChips] = useState({ 'All nearby': true });

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

  const people = [
    { init: 'AZ', name: 'Aizat Zhumagali', loc: 'Медеу · 0.4 km away', tags: ['Early bird', 'Non-smoker'], age: 25, info: 'Student', score: '94%', mutual: true, posX: '32%', posY: '46%' },
    { init: 'TB', name: 'Timur Bekzhanov', loc: 'Алмалы · 1.2 km away', tags: ['WFH', 'Night owl'], age: 28, info: 'Developer', score: '88%', mutual: false, posX: '48%', posY: '38%' },
    { init: 'ZN', name: 'Zarina Nurpeissova', loc: 'Бостандық · 1.8 km away', tags: ['Minimalist', 'Pets ok'], age: 23, info: 'Designer', score: '82%', mutual: false, posX: '22%', posY: '63%' },
    { init: 'DK', name: 'Dauren Kossymbayev', loc: 'Esentai · 2.4 km away', tags: ['Gym', 'Non-smoker'], age: 30, info: 'Engineer', score: '79%', mutual: false, posX: '67%', posY: '30%' },
    { init: 'MK', name: 'Malika Karimova', loc: 'Наурызбай · 3.1 km away', tags: ['Studious', 'Early bird'], age: 22, info: 'Student', score: '76%', mutual: false, posX: '57%', posY: '60%' },
  ];

  const styles = `
    .map-container {
      height: calc(100vh - 49px);
      display: grid;
      grid-template-columns: 380px 1fr;
      grid-template-rows: 60px 1fr;
      position: relative;
      background: ${colors.cream};
    }

    .map-topbar {
      grid-column: 1 / -1;
      background: ${colors.white};
      border-bottom: 1px solid ${colors.matchaLight};
      display: flex;
      align-items: center;
      padding: 0 20px;
      gap: 12px;
    }

    .map-topbar-logo {
      font-family: 'Cormorant Garamond', serif;
      font-size: 1.1rem;
      font-weight: 600;
      color: ${colors.ink};
      display: flex;
      align-items: center;
      gap: 8px;
      padding-right: 16px;
      margin-right: 4px;
      border-right: 1px solid ${colors.matchaLight};
      white-space: nowrap;
    }

    .map-topbar-logo span {
      color: ${colors.matcha};
    }

    .map-logo-mark {
      width: 26px;
      height: 26px;
      border-radius: 8px;
      background: ${colors.matcha};
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .map-search-bar {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 8px;
      background: ${colors.matchaMist};
      border: 1.5px solid ${colors.matchaLight};
      border-radius: 10px;
      padding: 0 14px;
      max-width: 420px;
    }

    .map-search-bar input {
      flex: 1;
      border: none;
      outline: none;
      background: transparent;
      font-family: 'Geologica', sans-serif;
      font-size: 0.82rem;
      font-weight: 300;
      color: ${colors.ink};
      padding: 9px 0;
    }

    .map-search-bar input::placeholder {
      color: ${colors.ink30};
    }

    .map-filter-chips {
      display: flex;
      gap: 6px;
      overflow-x: auto;
      padding: 0 4px;
    }

    .map-filter-chips::-webkit-scrollbar {
      display: none;
    }

    .mchip {
      padding: 6px 14px;
      border-radius: 100px;
      border: 1.5px solid ${colors.matchaLight};
      background: ${colors.white};
      font-family: 'Geologica', sans-serif;
      font-size: 0.72rem;
      font-weight: 400;
      color: ${colors.ink60};
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .mchip:hover {
      border-color: ${colors.matcha};
      color: ${colors.ink};
    }

    .mchip.active {
      background: ${colors.matcha};
      border-color: ${colors.matcha};
      color: ${colors.white};
    }

    .map-topbar-actions {
      display: flex;
      gap: 8px;
      margin-left: auto;
      flex-shrink: 0;
    }

    .map-icon-btn {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      border: 1.5px solid ${colors.matchaLight};
      background: ${colors.white};
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
      position: relative;
    }

    .map-icon-btn:hover {
      background: ${colors.matchaMist};
      border-color: ${colors.matcha};
    }

    .map-notif-badge {
      position: absolute;
      top: -4px;
      right: -4px;
      width: 14px;
      height: 14px;
      background: ${colors.matcha};
      border-radius: 50%;
      border: 2px solid ${colors.white};
      font-size: 0.55rem;
      color: ${colors.white};
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
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

    .map-sidebar {
      background: ${colors.white};
      border-right: 1px solid ${colors.matchaLight};
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .map-sidebar-header {
      padding: 16px 20px 12px;
      border-bottom: 1px solid ${colors.matchaLight};
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .map-results-count {
      font-size: 0.78rem;
      font-weight: 300;
      color: ${colors.ink60};
    }

    .map-results-count strong {
      color: ${colors.ink};
      font-weight: 500;
    }

    .map-sort-btn {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 0.72rem;
      font-weight: 400;
      color: ${colors.matcha};
      background: ${colors.matchaPale};
      border: 1px solid ${colors.matchaLight};
      border-radius: 100px;
      padding: 5px 12px;
      cursor: pointer;
    }

    .map-sidebar-list {
      flex: 1;
      overflow-y: auto;
      padding: 12px;
    }

    .map-sidebar-list::-webkit-scrollbar {
      width: 3px;
    }

    .map-sidebar-list::-webkit-scrollbar-thumb {
      background: ${colors.matchaLight};
      border-radius: 2px;
    }

    .mlcard {
      display: flex;
      gap: 12px;
      padding: 14px;
      border: 1.5px solid ${colors.matchaLight};
      border-radius: 16px;
      margin-bottom: 10px;
      cursor: pointer;
      transition: all 0.22s;
      background: ${colors.white};
    }

    .mlcard:hover,
    .mlcard.selected {
      border-color: ${colors.matcha};
      background: ${colors.matchaMist};
      box-shadow: 0 4px 16px rgba(122,158,126,0.12);
    }

    .mlcard.selected {
      border-color: ${colors.matcha};
    }

    .mlcard-img {
      width: 76px;
      height: 76px;
      border-radius: 12px;
      overflow: hidden;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .mlcard-img-1 {
      background: linear-gradient(145deg, ${colors.matchaPale}, ${colors.matchaLight});
    }

    .mlcard-img-2 {
      background: linear-gradient(145deg, #EFF6EE, ${colors.matchaPale});
    }

    .mlcard-img-3 {
      background: linear-gradient(145deg, ${colors.matchaMist}, #DCF0DC);
    }

    .mlcard-body {
      flex: 1;
      min-width: 0;
    }

    .mlcard-title {
      font-family: 'Cormorant Garamond', serif;
      font-size: 0.95rem;
      font-weight: 600;
      color: ${colors.ink};
      line-height: 1.2;
      margin-bottom: 3px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .mlcard-loc {
      font-size: 0.68rem;
      font-weight: 300;
      color: ${colors.ink60};
      display: flex;
      align-items: center;
      gap: 3px;
      margin-bottom: 7px;
    }

    .mlcard-tags {
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
      margin-bottom: 8px;
    }

    .mlcard-tag {
      font-size: 0.6rem;
      padding: 2px 8px;
      border-radius: 100px;
      background: ${colors.matchaPale};
      color: ${colors.matcha};
      border: 1px solid ${colors.matchaLight};
    }

    .mlcard-bottom {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .mlcard-score {
      display: flex;
      align-items: center;
      gap: 4px;
      background: ${colors.matcha};
      color: ${colors.white};
      border-radius: 100px;
      padding: 2px 9px;
      font-size: 0.68rem;
      font-weight: 500;
    }

    .map-canvas {
      position: relative;
      overflow: hidden;
      background: #E8F2E8;
    }

    .map-bg {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .map-overlay {
      position: absolute;
      inset: 0;
    }

    .map-pin {
      position: absolute;
      transform: translate(-50%, -100%);
      cursor: pointer;
      transition: transform 0.2s;
    }

    .map-pin:hover {
      transform: translate(-50%, -100%) scale(1.15);
    }

    .map-controls {
      position: absolute;
      right: 16px;
      top: 50%;
      transform: translateY(-50%);
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .map-ctrl-btn {
      width: 36px;
      height: 36px;
      background: ${colors.white};
      border: 1px solid ${colors.matchaLight};
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
      box-shadow: 0 2px 8px rgba(28,43,30,0.07);
      font-size: 1rem;
      color: ${colors.ink60};
    }

    .map-ctrl-btn:hover {
      background: ${colors.matchaMist};
      border-color: ${colors.matcha};
    }

    .map-detail-panel {
      position: absolute;
      bottom: 20px;
      right: 60px;
      width: 310px;
      background: ${colors.white};
      border: 1.5px solid ${colors.matchaLight};
      border-radius: 24px;
      padding: 20px;
      box-shadow: 0 16px 48px rgba(28,43,30,0.12);
    }

    .mdp-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 14px;
    }

    .mdp-close {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: ${colors.matchaPale};
      border: 1px solid ${colors.matchaLight};
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: ${colors.ink60};
      font-size: 0.7rem;
      flex-shrink: 0;
    }

    .mdp-title {
      font-family: 'Cormorant Garamond', serif;
      font-size: 1.05rem;
      font-weight: 600;
      color: ${colors.ink};
      margin-bottom: 3px;
    }

    .mdp-loc {
      font-size: 0.7rem;
      font-weight: 300;
      color: ${colors.ink60};
      display: flex;
      align-items: center;
      gap: 3px;
      margin-bottom: 10px;
    }

    .mdp-stats {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 6px;
      margin-bottom: 14px;
    }

    .mdp-stat {
      background: ${colors.matchaMist};
      border-radius: 10px;
      padding: 8px 10px;
      text-align: center;
    }

    .mdp-stat-val {
      font-family: 'Cormorant Garamond', serif;
      font-size: 0.95rem;
      font-weight: 600;
      color: ${colors.matcha};
    }

    .mdp-stat-label {
      font-size: 0.6rem;
      font-weight: 300;
      color: ${colors.ink60};
    }

    .mdp-actions {
      display: flex;
      gap: 8px;
    }

    .mdp-btn-like {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: ${colors.matchaPale};
      border: 1.5px solid ${colors.matchaLight};
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
      flex-shrink: 0;
    }

    .mdp-btn-like:hover {
      background: ${colors.matcha};
    }

    .mdp-btn-view {
      flex: 1;
      background: ${colors.ink};
      color: ${colors.white};
      border: none;
      border-radius: 10px;
      font-family: 'Geologica', sans-serif;
      font-size: 0.8rem;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }

    .mdp-btn-view:hover {
      background: ${colors.matcha};
    }

    @media (max-width: 1024px) {
      .map-container {
        grid-template-columns: 1fr;
      }

      .map-sidebar {
        display: none;
      }
    }
  `;

  const handleChipClick = (chipName) => {
    setFilterChips(prev => ({
      ...prev,
      [chipName]: !prev[chipName]
    }));
  };

  return (
    <div>
      <style>{styles}</style>
      <div className="map-container">
        {/* TOP BAR */}
        <div className="map-topbar">
          <div className="map-topbar-logo">
            <div className="map-logo-mark">
              <svg width="14" height="14" viewBox="0 0 17 17" fill="none">
                <path d="M8.5 2L14 6.8V15H10.5V11H6.5V15H3V6.8L8.5 2Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
              </svg>
            </div>
            Roomate<span>.kz</span>
          </div>

          <div className="map-filter-chips">
            {['All nearby', '90%+ match', 'Early bird', 'Night owl', 'Non-smoker', 'Pets ok', 'WFH'].map(chip => (
              <div
                key={chip}
                className={`mchip ${filterChips[chip] ? 'active' : ''}`}
                onClick={() => handleChipClick(chip)}
              >
                {chip === 'All nearby' && (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1.2" />
                  </svg>
                )}
                {chip}
              </div>
            ))}
          </div>

          <div className="map-topbar-actions">
            <div className="map-icon-btn">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 1L10 5.5H15L11.5 8.5L12.5 13L8 10.5L3.5 13L4.5 8.5L1 5.5H6L8 1Z" stroke={colors.matcha} strokeWidth="1.3" />
              </svg>
              <div className="map-notif-badge">3</div>
            </div>
            <div className="map-icon-btn">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 4H14M4 8H12M6 12H10" stroke={colors.matcha} strokeWidth="1.3" strokeLinecap="round" />
              </svg>
            </div>
            <div className="map-avi">AN</div>
          </div>
        </div>

        {/* SIDEBAR */}
        <div className="map-sidebar">
          <div className="map-sidebar-header">
            <div className="map-results-count"><strong>18 people</strong> near you</div>
            <div className="map-sort-btn">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M2 3H8M3.5 5.5H6.5M5 8H5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              Best match
            </div>
          </div>

          <div className="map-sidebar-list">
            {people.map((person, idx) => (
              <div
                key={idx}
                className={`mlcard ${selectedPerson === idx ? 'selected' : ''}`}
                onClick={() => setSelectedPerson(idx)}
              >
                <div className={`mlcard-img mlcard-img-${(idx % 3) + 1}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '50%',
                    background: colors.white,
                    border: `2px solid ${colors.matchaLight}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: colors.matcha,
                  }}>
                    {person.init}
                  </div>
                </div>
                <div className="mlcard-body">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px' }}>
                    <div className="mlcard-title">{person.name}</div>
                    {person.mutual && <span style={{ fontSize: '0.58rem', background: colors.matcha, color: colors.white, borderRadius: '100px', padding: '2px 6px', flexShrink: 0 }}>Mutual</span>}
                  </div>
                  <div className="mlcard-loc">
                    <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                      <circle cx="4.5" cy="3.5" r="2" stroke={colors.matcha} strokeWidth="1" />
                      <path d="M4.5 5.5V8" stroke={colors.matcha} strokeWidth="1" strokeLinecap="round" />
                    </svg>
                    {person.loc}
                  </div>
                  <div className="mlcard-tags">
                    {person.tags.map((tag, i) => (
                      <span key={i} className="mlcard-tag">{tag}</span>
                    ))}
                  </div>
                  <div className="mlcard-bottom">
                    <span style={{ fontSize: '0.68rem', fontWeight: '300', color: colors.ink60 }}>{person.age} · {person.info}</span>
                    <span className="mlcard-score">
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                        <path d="M4 1L5 3H7L5.5 4.5L6 6.5L4 5.5L2 6.5L2.5 4.5L1 3H3L4 1Z" fill="white" />
                      </svg>
                      {person.score}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* MAP AREA */}
        <div className="map-canvas">
          <svg className="map-bg" viewBox="0 0 900 600" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
            <rect width="900" height="600" fill="#E8F2E8" />
            {/* City blocks */}
            <rect x="60" y="40" width="120" height="80" rx="3" fill="#D8EBD6" stroke="#C8DEC4" strokeWidth="0.5" />
            <rect x="60" y="140" width="120" height="100" rx="3" fill="#D8EBD6" stroke="#C8DEC4" strokeWidth="0.5" />
            <rect x="200" y="40" width="180" height="90" rx="3" fill="#D8EBD6" stroke="#C8DEC4" strokeWidth="0.5" />
            <rect x="200" y="150" width="180" height="90" rx="3" fill="#D8EBD6" stroke="#C8DEC4" strokeWidth="0.5" />
            <rect x="400" y="40" width="160" height="100" rx="3" fill="#D8EBD6" stroke="#C8DEC4" strokeWidth="0.5" />
            <rect x="580" y="40" width="140" height="160" rx="3" fill="#D8EBD6" stroke="#C8DEC4" strokeWidth="0.5" />
            <rect x="740" y="40" width="120" height="120" rx="3" fill="#D8EBD6" stroke="#C8DEC4" strokeWidth="0.5" />

            {/* Park */}
            <rect x="200" y="500" width="360" height="80" rx="4" fill="#C8DEC4" stroke="#A8C5A0" strokeWidth="0.5" />

            {/* Main roads */}
            <line x1="0" y1="130" x2="900" y2="130" stroke="white" strokeWidth="8" />
            <line x1="0" y1="250" x2="900" y2="250" stroke="white" strokeWidth="6" />
            <line x1="180" y1="0" x2="180" y2="600" stroke="white" strokeWidth="8" />
            <line x1="390" y1="0" x2="390" y2="600" stroke="white" strokeWidth="6" />
          </svg>

          <div className="map-overlay">
            {/* Person pins */}
            {people.map((person, idx) => (
              <div
                key={idx}
                className="map-pin"
                style={{ left: person.posX, top: person.posY }}
                onClick={() => setSelectedPerson(idx)}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                  <div style={{
                    background: person.mutual ? colors.matcha : colors.white,
                    border: `2.5px solid ${person.mutual ? colors.white : colors.matcha}`,
                    borderRadius: '50%',
                    width: person.mutual ? '44px' : '40px',
                    height: person.mutual ? '44px' : '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    color: person.mutual ? colors.white : colors.matcha,
                    boxShadow: person.mutual ? `0 4px 14px rgba(122,158,126,0.5)` : `0 3px 10px rgba(28,43,30,0.12)`,
                    cursor: 'pointer',
                  }}>
                    {person.init}
                  </div>
                  <div style={{
                    background: person.mutual ? colors.matcha : colors.white,
                    color: person.mutual ? colors.white : colors.matcha,
                    border: person.mutual ? 'none' : `1px solid ${colors.matchaLight}`,
                    fontSize: '0.58rem',
                    fontWeight: '500',
                    padding: '2px 7px',
                    borderRadius: '100px',
                    boxShadow: person.mutual ? `0 2px 8px rgba(122,158,126,0.4)` : `0 2px 6px rgba(28,43,30,0.08)`,
                    whiteSpace: 'nowrap',
                  }}>
                    {person.mutual ? `${person.score} · Mutual` : person.score}
                  </div>
                </div>
              </div>
            ))}

            {/* Map controls */}
            <div className="map-controls">
              <div className="map-ctrl-btn">＋</div>
              <div className="map-ctrl-btn">－</div>
              <div className="map-ctrl-btn">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="2" stroke={colors.matcha} strokeWidth="1.2" />
                  <path d="M7 1V3M7 11V13M1 7H3M11 7H13" stroke={colors.matcha} strokeWidth="1.2" strokeLinecap="round" />
                </svg>
              </div>
            </div>

            {/* Detail panel */}
            {selectedPerson !== null && (
              <div className="map-detail-panel">
                <div className="mdp-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: '50%',
                      background: colors.matchaPale,
                      border: `2px solid ${colors.matchaLight}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: "'Cormorant Garamond', serif",
                      fontSize: '1.1rem',
                      fontWeight: '600',
                      color: colors.matcha,
                      flexShrink: 0,
                    }}>
                      {people[selectedPerson].init}
                    </div>
                    <div>
                      <div style={{
                        fontSize: '0.62rem',
                        color: colors.matcha,
                        fontWeight: '500',
                        letterSpacing: '1.5px',
                        textTransform: 'uppercase',
                        marginBottom: '3px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                      }}>
                        <span style={{
                          background: people[selectedPerson].mutual ? colors.matcha : colors.matchaPale,
                          color: people[selectedPerson].mutual ? colors.white : colors.matcha,
                          borderRadius: '100px',
                          padding: '1px 7px',
                          fontSize: '0.58rem',
                        }}>
                          {people[selectedPerson].mutual ? '💚 Mutual match' : '🔍 ' + people[selectedPerson].score + ' match'}
                        </span>
                      </div>
                      <div className="mdp-title">{people[selectedPerson].name}</div>
                      <div className="mdp-loc">
                        <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                          <circle cx="4.5" cy="3.5" r="2" stroke={colors.matcha} strokeWidth="1" />
                          <path d="M4.5 5.5V8" stroke={colors.matcha} strokeWidth="1" strokeLinecap="round" />
                        </svg>
                        {people[selectedPerson].loc}
                      </div>
                    </div>
                  </div>
                  <div className="mdp-close">✕</div>
                </div>

                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '12px' }}>
                  {people[selectedPerson].tags.map((tag, i) => (
                    <span key={i} style={{
                      fontSize: '0.62rem',
                      padding: '3px 9px',
                      borderRadius: '100px',
                      background: colors.matchaPale,
                      color: colors.matcha,
                      border: `1px solid ${colors.matchaLight}`,
                    }}>
                      {tag}
                    </span>
                  ))}
                  <span style={{
                    fontSize: '0.62rem',
                    padding: '3px 9px',
                    borderRadius: '100px',
                    background: colors.white,
                    color: colors.ink60,
                    border: `1px solid ${colors.ink10}`,
                  }}>
                    Verified ✓
                  </span>
                </div>

                <div className="mdp-stats">
                  <div className="mdp-stat">
                    <div className="mdp-stat-val">{people[selectedPerson].score}</div>
                    <div className="mdp-stat-label">match score</div>
                  </div>
                  <div className="mdp-stat">
                    <div className="mdp-stat-val">{people[selectedPerson].age}</div>
                    <div className="mdp-stat-label">age</div>
                  </div>
                  <div className="mdp-stat">
                    <div className="mdp-stat-val">KazNU</div>
                    <div className="mdp-stat-label">university</div>
                  </div>
                </div>

                <div className="mdp-actions">
                  <div className="mdp-btn-like">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M8 13.5S2 9.5 2 5.5C2 3.5 3.5 2 5.5 2C6.5 2 7.5 2.5 8 3.5C8.5 2.5 9.5 2 10.5 2C12.5 2 14 3.5 14 5.5C14 9.5 8 13.5 8 13.5Z" fill="#E08080" stroke="#E08080" strokeWidth="0.8" />
                    </svg>
                  </div>
                  <button className="mdp-btn-view">
                    View full profile
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6H10M10 6L7 3M10 6L7 9" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapScreen;
