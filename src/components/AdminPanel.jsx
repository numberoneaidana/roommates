import React, { useState } from 'react';

const AdminPanel = ({ allProfiles, onVerify }) => {
  const [filter, setFilter] = useState('pending');
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const colors = {
    matcha: '#7A9E7E',
    matchaLight: '#C8DEC4',
    matchaPale: '#E4F0E0',
    matchaMist: '#F2F8F1',
    ink: '#1C2B1E',
    white: '#FFFFFF',
    cream: '#FAFDF9',
  };

  const filteredProfiles = allProfiles.filter(p => {
    if (filter === 'pending') return p.verification_status === 'pending';
    if (filter === 'approved') return p.verification_status === 'approved';
    if (filter === 'rejected') return p.verification_status === 'rejected';
    return true;
  });

  const handleVerify = (profileId, approved) => {
    onVerify(profileId, approved ? 'approved' : 'rejected', rejectionReason);
    setSelectedProfile(null);
    setRejectionReason('');
  };

  const tabs = [
    { id: 'pending', label: `⏳ Pending (${allProfiles.filter(p => p.verification_status === 'pending').length})` },
    { id: 'approved', label: `✓ Verified (${allProfiles.filter(p => p.verification_status === 'approved').length})` },
    { id: 'rejected', label: `✗ Rejected (${allProfiles.filter(p => p.verification_status === 'rejected').length})` },
  ];

  return (
    <div style={{ background: colors.cream, minHeight: '100vh', padding: '40px' }}>
      <style>{`
        .admin-card {
          animation: slideIn 0.4s ease both;
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .admin-card:hover {
          box-shadow: 0 8px 24px rgba(122, 158, 126, 0.2);
          transform: translateY(-4px);
        }
      `}</style>

      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: '2.4rem',
            fontWeight: 600,
            color: colors.ink,
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            🔍 Verification Dashboard
          </h1>
          <p style={{ fontSize: '15px', color: 'rgba(28, 43, 30, 0.6)', margin: '8px 0 0' }}>
            Review and verify user profiles
          </p>
        </div>

        {/* Filter Tabs */}
        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '32px',
          borderBottom: `2px solid ${colors.matchaLight}`,
          paddingBottom: '16px',
          flexWrap: 'wrap'
        }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              style={{
                padding: '10px 18px',
                borderRadius: '12px',
                border: 'none',
                background: filter === tab.id ? colors.matcha : 'transparent',
                color: filter === tab.id ? colors.white : colors.ink,
                fontFamily: "'Geologica', sans-serif",
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Profiles Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '20px',
          marginBottom: '40px'
        }}>
          {filteredProfiles.map(profile => (
            <div
              key={profile.id}
              className="admin-card"
              style={{
                background: colors.white,
                border: `1px solid ${colors.matchaLight}`,
                borderRadius: '20px',
                overflow: 'hidden',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                transition: 'all 0.2s',
                cursor: 'pointer'
              }}
            >
              {/* Profile Header with Status Badge */}
              <div style={{
                height: '180px',
                background: profile.photos?.[0]?.startsWith('http')
                  ? `url(${profile.photos[0]}) center/cover`
                  : `linear-gradient(135deg, ${colors.matcha} 0%, #5a8f6f 100%)`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background:
                    profile.verification_status === 'approved'
                      ? colors.matchaPale
                      : profile.verification_status === 'rejected'
                      ? '#FEE2E2'
                      : '#FEF3C7',
                  color:
                    profile.verification_status === 'approved'
                      ? colors.matcha
                      : profile.verification_status === 'rejected'
                      ? '#DC2626'
                      : '#92400E',
                  padding: '6px 12px',
                  borderRadius: '100px',
                  fontSize: '12px',
                  fontWeight: 600
                }}>
                  {profile.verification_status === 'approved'
                    ? '✓'
                    : profile.verification_status === 'rejected'
                    ? '✗'
                    : '⏳'}
                </div>
              </div>

              {/* Profile Info */}
              <div style={{ padding: '16px' }}>
                <h3 style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  color: colors.ink,
                  margin: '0 0 4px 0'
                }}>
                  {profile.full_name}
                </h3>
                <div style={{ fontSize: '13px', color: 'rgba(28, 43, 30, 0.6)', marginBottom: '12px' }}>
                  📍 {(profile.region || '—').split(',')[0]}
                </div>
                <button
                  onClick={() => setSelectedProfile(profile)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background:
                      profile.verification_status === 'pending'
                        ? `linear-gradient(135deg, ${colors.matcha} 0%, #5a8f6f 100%)`
                        : colors.matchaPale,
                    color:
                      profile.verification_status === 'pending'
                        ? colors.white
                        : colors.matcha,
                    border: 'none',
                    borderRadius: '12px',
                    fontFamily: "'Geologica', sans-serif",
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {profile.verification_status === 'pending' ? '🔍 Review' : '👁️ View'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredProfiles.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>✓</div>
            <h2 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: '1.6rem',
              fontWeight: 600,
              color: colors.ink
            }}>
              No profiles found
            </h2>
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedProfile && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(28, 43, 30, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '20px'
          }}
          onClick={e => e.target === e.currentTarget && setSelectedProfile(null)}
        >
          <div style={{
            background: colors.white,
            borderRadius: '28px',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 25px 80px rgba(122, 158, 126, 0.25)'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '24px',
              borderBottom: `1px solid ${colors.matchaLight}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <h2 style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: '1.6rem',
                fontWeight: 600,
                color: colors.ink,
                margin: 0
              }}>
                {selectedProfile.full_name}
              </h2>
              <button
                onClick={() => setSelectedProfile(null)}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: colors.matchaPale,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '18px',
                  fontWeight: 'bold'
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px' }}>
              {/* Profile Info */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: colors.ink,
                  marginBottom: '12px'
                }}>
                  ℹ️ Information
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {[
                    { label: 'Age', value: selectedProfile.age },
                    { label: 'Gender', value: selectedProfile.gender },
                    { label: 'Region', value: (selectedProfile.region || '—').split(',')[0] },
                    { label: 'Budget', value: selectedProfile.budget ? `₸${selectedProfile.budget}` : '-' }
                  ].map((item, i) => (
                    <div key={i} style={{ background: colors.matchaMist, borderRadius: '12px', padding: '12px' }}>
                      <div style={{ fontSize: '12px', color: 'rgba(28, 43, 30, 0.6)', marginBottom: '4px' }}>
                        {item.label}
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: colors.ink }}>
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ID Document */}
              {selectedProfile.id_document_url && (
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: colors.ink,
                    marginBottom: '12px'
                  }}>
                    📸 Uploaded Document
                  </h3>
                  <img
                    src={`/api/verify/file/${selectedProfile.id_document_url.split('/').pop()}`}
                    alt="ID Document"
                    style={{
                      width: '100%',
                      borderRadius: '12px',
                      border: `1px solid ${colors.matchaLight}`,
                      maxHeight: '300px',
                      objectFit: 'contain',
                      cursor: 'pointer'
                    }}
                    loading="lazy"
                  />
                </div>
              )}

              {/* Rejection Reason (for pending) */}
              {selectedProfile.verification_status === 'pending' && (
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: colors.ink,
                    marginBottom: '12px'
                  }}>
                    💬 Rejection Reason (if rejecting)
                  </h3>
                  <textarea
                    value={rejectionReason}
                    onChange={e => setRejectionReason(e.target.value)}
                    placeholder="Enter reason..."
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      border: `1px solid ${colors.matchaLight}`,
                      borderRadius: '12px',
                      fontFamily: "'Geologica', sans-serif",
                      fontSize: '13px',
                      color: colors.ink,
                      background: colors.matchaMist,
                      outline: 'none',
                      resize: 'vertical',
                      minHeight: '70px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              )}

              {/* Rejection Reason Display (for already rejected) */}
              {selectedProfile.verification_status === 'rejected' && selectedProfile.rejection_reason && (
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: colors.ink,
                    marginBottom: '12px'
                  }}>
                    💬 Rejection Reason
                  </h3>
                  <div style={{
                    background: '#FEE2E2',
                    border: '1px solid #FECACA',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    fontSize: '13px',
                    color: '#DC2626'
                  }}>
                    {selectedProfile.rejection_reason}
                  </div>
                </div>
              )}

              {/* Action Buttons (for pending) */}
              {selectedProfile.verification_status === 'pending' && (
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => handleVerify(selectedProfile.id, true)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: colors.matchaPale,
                      color: colors.matcha,
                      border: 'none',
                      borderRadius: '12px',
                      fontFamily: "'Geologica', sans-serif",
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => e.target.style.background = '#D0E8C8'}
                    onMouseLeave={e => e.target.style.background = colors.matchaPale}
                  >
                    ✓ Approve
                  </button>
                  <button
                    onClick={() => handleVerify(selectedProfile.id, false)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: '#FEE2E2',
                      color: '#DC2626',
                      border: 'none',
                      borderRadius: '12px',
                      fontFamily: "'Geologica', sans-serif",
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => e.target.style.background = '#FED7D7'}
                    onMouseLeave={e => e.target.style.background = '#FEE2E2'}
                  >
                    ✗ Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
