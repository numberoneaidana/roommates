import React from 'react';
import { useLanguage, LanguageSwitcher } from '../i18n';

const DashboardLayout = ({
  auth,
  tab,
  setTab,
  connected,
  onLogout,
  children
}) => {
  const { t } = useLanguage();

  const colors = {
    primary: '#7A9E7E',
    primaryDark: '#5a8f6f',
    primaryLight: '#8fb896',
    mist: '#b8ccb8',
    pale: '#e8f5f0',
    dark: '#1e4a36',
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
      gap: '12px',
      alignItems: 'center',
    },
    connectionIndicator: {
      width: 10,
      height: 10,
      borderRadius: '50%',
      background: connected ? colors.success : colors.warning,
      boxShadow: connected ? `0 0 8px rgba(76,175,80,.7)` : 'none',
      transition: 'all .4s',
      flexShrink: 0,
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
      fontFamily: "'Geologica', sans-serif",
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
      flexShrink: 0,
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
      fontFamily: "'Geologica', sans-serif",
    }),
    contentWrapper: {
      minHeight: 'calc(100vh - 140px)',
      animation: 'fadeIn 0.4s ease-in-out',
    },
  };

  const tabs = [
    { id: 'browse', icon: '🔍', labelKey: 'dashboard.browse' },
    { id: 'swipe',  icon: '❤️', labelKey: 'dashboard.swipe' },
    { id: 'map',    icon: '📍', labelKey: 'dashboard.map' },
    { id: 'matches',icon: '⭐', labelKey: 'dashboard.matches' },
    { id: 'profile',icon: '👤', labelKey: 'dashboard.profile' },
  ];

  return (
    <div style={styles.container}>
      {/* Global Styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700;800&family=Geologica:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0%   { background-position: -1000px 0; }
          100% { background-position:  1000px 0; }
        }

        html { scroll-behavior: smooth; }
        ::selection { background-color: rgba(122,158,126,0.2); color: #1e4a36; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: #f1f1f1; }
        ::-webkit-scrollbar-thumb { background: #7A9E7E; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #5a8f6f; }

        button { font-family: 'Geologica', sans-serif; }
        input, select, textarea { font-family: 'Geologica', sans-serif; }
        a { color: ${colors.primaryDark}; text-decoration: none; transition: all 0.2s; }
        a:hover { color: ${colors.primary}; }

        .skeleton {
          background: linear-gradient(90deg, #f8f9fa 25%, #e8f5f0 50%, #f8f9fa 75%);
          background-size: 1000px 100%;
          animation: shimmer 2s infinite;
          border-radius: 8px;
        }
      `}</style>

      {/* Header */}
      <header style={styles.header}>
        <div style={styles.logo}>🏡 Roomate.kz</div>

        <div style={styles.headerRight}>
          {/* Language Switcher */}
          <LanguageSwitcher variant="pill" dark={false} />

          {/* Connection dot */}
          <div
            style={styles.connectionIndicator}
            title={connected ? t('dashboard.connected') : t('dashboard.reconnecting')}
          />

          {/* Logout */}
          <button
            style={styles.logoutBtn}
            onClick={onLogout}
            onMouseEnter={(e) => {
              e.target.style.borderColor = colors.danger;
              e.target.style.color = colors.danger;
              e.target.style.background = 'rgba(255,107,107,0.05)';
            }}
            onMouseLeave={(e) => {
              e.target.style.borderColor = colors.border;
              e.target.style.color = colors.subtext;
              e.target.style.background = 'transparent';
            }}
            title={t('nav.logout')}
          >
            {t('nav.logout')}
          </button>

          {/* Avatar */}
          <div style={styles.avatar}>
            {auth?.initials || '👤'}
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav style={styles.navWrapper}>
        {tabs.map(({ id, icon, labelKey }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            style={styles.navItem(tab === id)}
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
            <span>{t(labelKey)}</span>
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
