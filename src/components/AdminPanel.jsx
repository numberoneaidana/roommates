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

      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
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
            🔐 Admin Verification
          </h1>
          <p style={{ fontSize: '15px', color: 'rgba(28, 43, 30, 0.6)', margin: '8px 0 0' }}>
            Approve or reject profile verifications
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

        {/* Profiles Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${colors.matchaLight}` }}>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: colors.ink, fontSize: '14px' }}>Name</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: colors.ink, fontSize: '14px' }}>Region</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: colors.ink, fontSize: '14px' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600, color: colors.ink, fontSize: '14px' }}>Document</th>
                <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600, color: colors.ink, fontSize: '14px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredProfiles.map((profile, idx) => (
                <tr
                  key={profile.id}
                  style={{
                    borderBottom: `1px solid ${colors.matchaLight}`,
                    background: idx % 2 === 0 ? colors.white : colors.cream,
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = colors.matchaMist}
                  onMouseLeave={e => e.currentTarget.style.background = (idx % 2 === 0 ? colors.white : colors.cream)}
                >
                  <td style={{ padding: '16px 12px', fontWeight: 500, color: colors.ink }}>{profile.full_name}</td>
                  <td style={{ padding: '16px 12px', color: 'rgba(28, 43, 30, 0.7)', fontSize: '14px' }}>
                    {(profile.region || '—').split(',')[0]}
                  </td>
                  <td style={{ padding: '16px 12px' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 10px',
                      borderRadius: '100px',
                      fontSize: '12px',
                      fontWeight: 600,
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
                          : '#92400E'
                    }}>
                      {profile.verification_status === 'approved'
                        ? '✓ Approved'
                        : profile.verification_status === 'rejected'
                        ? '✗ Rejected'
                        : '⏳ Pending'}
                    </span>
                  </td>
                  <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                    {profile.id_document_url ? (
                      <a
                        href={`/api/verify/file/${profile.id_document_url.split('/').pop()}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: colors.matcha,
                          textDecoration: 'none',
                          fontWeight: 600,
                          fontSize: '14px',
                          cursor: 'pointer'
                        }}
                      >
                        📸 View
                      </a>
                    ) : (
                      <span style={{ color: 'rgba(28, 43, 30, 0.3)', fontSize: '14px' }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                    {profile.verification_status === 'pending' ? (
                      <button
                        onClick={() => setSelectedProfile(profile)}
                        style={{
                          padding: '8px 16px',
                          background: colors.matcha,
                          color: colors.white,
                          border: 'none',
                          borderRadius: '8px',
                          fontFamily: "'Geologica', sans-serif",
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => e.target.style.background = '#5a8f6f'}
                        onMouseLeave={e => e.target.style.background = colors.matcha}
                      >
                        Review
                      </button>
                    ) : (
                      <span style={{ color: 'rgba(28, 43, 30, 0.3)', fontSize: '12px' }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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

      {/* Modal - Simple Approval/Rejection */}
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
            borderRadius: '20px',
            width: '100%',
            maxWidth: '400px',
            padding: '32px',
            boxShadow: '0 25px 80px rgba(122, 158, 126, 0.25)'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: '1.4rem',
                fontWeight: 600,
                color: colors.ink,
                margin: 0
              }}>
                {selectedProfile.full_name}
              </h2>
              <button
                onClick={() => setSelectedProfile(null)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: colors.matchaPale,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              >
                ✕
              </button>
            </div>

            {/* Info */}
            <div style={{ marginBottom: '24px', padding: '16px', background: colors.matchaMist, borderRadius: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(28, 43, 30, 0.6)', textTransform: 'uppercase' }}>Age</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: colors.ink }}>{selectedProfile.age}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(28, 43, 30, 0.6)', textTransform: 'uppercase' }}>Gender</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: colors.ink }}>{selectedProfile.gender}</div>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(28, 43, 30, 0.6)', textTransform: 'uppercase' }}>Region</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: colors.ink }}>{(selectedProfile.region || '—').split(',')[0]}</div>
                </div>
              </div>
            </div>

            {/* Rejection Reason Input */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 600,
                color: colors.ink,
                marginBottom: '8px',
                textTransform: 'uppercase'
              }}>
                Rejection Reason (if rejecting)
              </label>
              <textarea
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                placeholder="Optional: explain why..."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: `1px solid ${colors.matchaLight}`,
                  borderRadius: '8px',
                  fontFamily: "'Geologica', sans-serif",
                  fontSize: '13px',
                  color: colors.ink,
                  background: colors.matchaMist,
                  outline: 'none',
                  resize: 'vertical',
                  minHeight: '60px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => handleVerify(selectedProfile.id, true)}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: colors.matchaPale,
                  color: colors.matcha,
                  border: 'none',
                  borderRadius: '10px',
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
                  borderRadius: '10px',
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
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
