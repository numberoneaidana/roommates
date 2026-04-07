import React from 'react';

const DashboardLayout = ({ 
  auth, 
  tab, 
  setTab, 
  connected, 
  onLogout, 
  children 
}) => {
  const colors = {
    primary: '#7A9E7E',      // Matcha green
    primaryDark: '#5a8f6f',  // Darker matcha
    primaryLight: '#8fb896', // Lighter matcha
    mist: '#b8ccb8',         // Mist green
    pale: '#e8f5f0',         // Pale green
    dark: '#1e4a36',         // Dark forest
    lightGray: '#f8f9fa',
    border: '#e0e0e0',
    text: '#333',
    subtext: '#666',
    success: '#4caf50',
    warning: '#f59e0b',
    danger: '#ff6b6b',
  };

  const styles = {
    container: {
      minHeight: '100vh',
      background: colors.lightGray,
      fontFamily: "'Geologica', sans-serif",
    },
    header: {
      background: '#fff',
      borderBottom: `1px solid ${colors.border}`,
      padding: '16px 40px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    },
    logo: {
      fontSize: '24px',
      fontWeight: '800',
      color: colors.primaryDark,
      fontFamily: "'Cormorant Garamond', serif",
      letterSpacing: '-1px',
    },
    headerRight: {
      display: 'flex',
      gap: '16px',
      alignItems: 'center',
    },
    connectionIndicator: {
      width: 10,
      height: 10,
      borderRadius: '50%',
      background: connected ? colors.success : colors.warning,
      boxShadow: connected ? `0 0 8px rgba(76,175,80,.7)` : 'none',
      transition: 'all .4s',
      title: connected ? '✓ Подключено' : '⟳ Переподключение...',
    },
    logoutBtn: {
      padding: '10px 18px',
      background: 'transparent',
      border: `1.5px solid ${colors.border}`,
      borderRadius: '8px',
      color: colors.subtext,
      fontSize: '13px',
      fontWeight: '700',
      cursor: 'pointer',
      transition: 'all 0.2s',
      letterSpacing: '0.3px',
    },
    avatar: {
      width: '44px',
      height: '44px',
      borderRadius: '50%',
      background: `linear-gradient(135deg, ${colors.primaryDark} 0%, ${colors.primary} 100%)`,
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: '700',
      fontSize: '15px',
      boxShadow: `0 2px 8px rgba(122,158,126,0.2)`,
    },
    navWrapper: {
      background: '#fff',
      borderBottom: `2px solid ${colors.border}`,
      padding: '0',
      display: 'flex',
      justifyContent: 'center',
      gap: '0',
      zIndex: 40,
      position: 'sticky',
      top: '68px',
      overflowX: 'auto',
      overflowY: 'hidden',
    },
    navItem: (isActive) => ({
      padding: '16px 32px',
      background: 'transparent',
      border: 'none',
      color: isActive ? colors.primaryDark : colors.subtext,
      fontSize: '14px',
      fontWeight: isActive ? '700' : '600',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      borderBottom: isActive ? `3px solid ${colors.primaryDark}` : `3px solid transparent`,
      marginBottom: '-2px',
      position: 'relative',
      whiteSpace: 'nowrap',
    }),
    contentWrapper: {
      minHeight: 'calc(100vh - 140px)',
      animation: 'fadeIn 0.4s ease-in-out',
    },
    badge: {
      background: colors.danger,
      color: '#fff',
      borderRadius: '10px',
      padding: '3px 8px',
      fontSize: '11px',
      fontWeight: '700',
      marginLeft: '6px',
    },
  };

  const tabs = [
    { id: 'browse', label: 'Обзор' },
    { id: 'swipe',label: 'Свайп' },
    { id: 'map',label: 'Карта' },
    { id: 'matches', label: 'Избранное' },
    { id: 'profile', label: 'Профиль' },
  ];

  return (
    <div style={styles.container}>
      {/* Global Styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700;800&family=Geologica:wght@400;500;600;700;800&display=swap');

        * { 
          box-sizing: border-box; 
        }

        @keyframes fadeIn {
          from { 
            opacity: 0; 
            transform: translateY(8px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }

        @keyframes slideInRight {
          from { 
            opacity: 0; 
            transform: translateX(16px); 
          }
          to { 
            opacity: 1; 
            transform: translateX(0); 
          }
        }

        @keyframes scaleInGently {
          from { 
            opacity: 0; 
            transform: scale(0.95); 
          }
          to { 
            opacity: 1; 
            transform: scale(1); 
          }
        }

        @keyframes pulse {
          0%, 100% { 
            transform: scale(1); 
          }
          50% { 
            transform: scale(1.05); 
          }
        }

        @keyframes shimmer {
          0% { 
            background-position: -1000px 0; 
          }
          100% { 
            background-position: 1000px 0; 
          }
        }

        /* Smooth scrolling */
        html {
          scroll-behavior: smooth;
        }

        /* Selection color */
        ::selection {
          background-color: rgba(122, 158, 126, 0.2);
          color: #1e4a36;
        }

        /* Scrollbar styling */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        ::-webkit-scrollbar-track {
          background: #f1f1f1;
        }

        ::-webkit-scrollbar-thumb {
          background: #7A9E7E;
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #5a8f6f;
        }

        /* Button base styles */
        button {
          font-family: 'Geologica', sans-serif;
        }

        /* Input base styles */
        input, select, textarea {
          font-family: 'Geologica', sans-serif;
        }

        /* Link styles */
        a {
          color: ${colors.primaryDark};
          text-decoration: none;
          transition: all 0.2s;
        }

        a:hover {
          color: ${colors.primary};
        }

        /* Loading skeleton */
        .skeleton {
          background: linear-gradient(90deg, ${colors.lightGray} 25%, ${colors.pale} 50%, ${colors.lightGray} 75%);
          background-size: 1000px 100%;
          animation: shimmer 2s infinite;
          border-radius: 8px;
        }

        /* Smooth transitions */
        .smooth-transition {
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        /* Hover lift effect */
        .hover-lift:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12);
        }
      `}</style>

      {/* Header */}
      <header style={styles.header}>
        <div style={styles.logo}>🏡 Roomate.kz</div>
        <div style={styles.headerRight}>
          <div 
            style={styles.connectionIndicator}
            title={connected ? '✓ Подключено' : '⟳ Переподключение...'}
          />
          <button
            style={styles.logoutBtn}
            onClick={onLogout}
            onMouseEnter={(e) => {
              e.target.style.borderColor = colors.danger;
              e.target.style.color = colors.danger;
              e.target.style.background = 'rgba(255, 107, 107, 0.05)';
            }}
            onMouseLeave={(e) => {
              e.target.style.borderColor = colors.border;
              e.target.style.color = colors.subtext;
              e.target.style.background = 'transparent';
            }}
            title="Выйти из аккаунта"
          >
            🚪 Выход
          </button>
          <div style={styles.avatar}>
            {auth?.initials || '👤'}
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav style={styles.navWrapper}>
        {tabs.map(({ id, icon, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            style={{
              ...styles.navItem(tab === id),
            }}
            onMouseEnter={(e) => {
              if (tab !== id) {
                e.currentTarget.style.color = colors.primaryDark;
                e.currentTarget.style.background = colors.pale;
              }
            }}
            onMouseLeave={(e) => {
              if (tab !== id) {
                e.currentTarget.style.color = colors.subtext;
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            <span style={{ fontSize: '18px' }}>{icon}</span>
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {/* Content Area */}
      <main style={styles.contentWrapper}>
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
