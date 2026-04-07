import React, { useState, useEffect } from 'react';
import { useLanguage, LanguageSwitcher } from '../i18n';
import {TRANSLATIONS} from './components/translations.js'
import { useLanguage } from './languageContext';

function HomePage({ onGetStarted }) {
  const { t } = useLanguage();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
      document.querySelectorAll('.reveal').forEach(el => {
        if (el.getBoundingClientRect().top < window.innerHeight * 0.9) {
          el.classList.add('visible');
        }
      });
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  const globalStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400;1,600&family=Geologica:wght@300;400;500;600&display=swap');
    
    html { scroll-behavior: smooth; }
    body { font-family: 'Geologica', sans-serif; background: ${colors.cream}; color: ${colors.ink}; overflow-x: hidden; }
    
    @keyframes softUp {
      from { opacity: 0; transform: translateY(22px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes floatA { 0%,100%{transform:translateY(0) rotate(-1deg)} 50%{transform:translateY(-10px) rotate(-1deg)} }
    @keyframes floatB { 0%,100%{transform:translateY(0) rotate(1.5deg)} 50%{transform:translateY(-8px) rotate(1.5deg)} }
    @keyframes floatC { 0%,100%{transform:translateY(0) rotate(-0.5deg)} 50%{transform:translateY(-12px) rotate(-0.5deg)} }
    
    .reveal { opacity: 0; transform: translateY(26px); transition: opacity 0.7s ease, transform 0.7s ease; }
    .reveal.visible { opacity: 1; transform: none; }
    
    .float-a { animation: floatA 6s ease-in-out infinite; }
    .float-b { animation: floatB 6s ease-in-out infinite; }
    .float-c { animation: floatC 6s ease-in-out infinite; }

    .nav-link:hover { color: ${colors.ink} !important; }
    .cta-primary:hover { background: #1a2a1c !important; transform: scale(1.02); }
    .btn-outline:hover { border-color: ${colors.matcha} !important; background: ${colors.matchaPale} !important; }
    .btn-filled:hover { background: #6B8E6F !important; transform: scale(1.02); }
  `;

  const features = t('home.featureList');

  return (
    <>
      <style>{globalStyles}</style>
      <div style={{ background: colors.cream, minHeight: '100vh', fontFamily: "'Geologica', sans-serif" }}>

        {/* ── NAV ── */}
        <nav style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 52px', height: '68px',
          background: 'rgba(250,253,249,0.92)', backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${colors.matchaLight}`,
          transition: 'box-shadow 0.3s',
          boxShadow: scrolled ? '0 4px 24px rgba(0,0,0,0.06)' : 'none',
        }}>
          <a href="#!" role="button" onClick={(e) => e.preventDefault()}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', fontFamily: "'Cormorant Garamond', serif", fontSize: '1.5rem', fontWeight: 600, color: colors.ink, textDecoration: 'none', letterSpacing: '0.2px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: colors.matcha, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
                <path d="M8.5 2L14 6.8V15H10.5V11H6.5V15H3V6.8L8.5 2Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
                <path d="M5.5 5C7 3.2 10 2.8 11.5 4.5C9.5 4.5 7.5 6 7.5 8" stroke="rgba(255,255,255,0.7)" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            </div>
            Roomate<span style={{ color: colors.matcha }}>.kz</span>
          </a>

          <ul style={{ display: 'flex', gap: '36px', listStyle: 'none', margin: 0, padding: 0 }}>
            {[
              { key: 'nav.map' },
              { key: 'nav.likes' },
              { key: 'nav.profile' },
              { key: 'nav.home' },
            ].map(({ key }) => (
              <li key={key}>
                <a href="#!" role="button" className="nav-link" onClick={(e) => e.preventDefault()}
                  style={{ textDecoration: 'none', color: colors.ink60, fontSize: '0.84rem', fontWeight: 400, transition: 'color 0.2s', letterSpacing: '0.2px' }}>
                  {t(key)}
                </a>
              </li>
            ))}
          </ul>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Language Switcher */}
            <LanguageSwitcher variant="pill" dark={false} />

            <button onClick={onGetStarted} className="btn-outline"
              style={{ padding: '9px 22px', borderRadius: '100px', border: `1.5px solid ${colors.matchaLight}`, background: 'transparent', color: colors.ink, fontFamily: "'Geologica', sans-serif", fontSize: '0.83rem', fontWeight: 400, cursor: 'pointer', transition: 'all 0.2s' }}>
              {t('auth.login')}
            </button>
            <button onClick={onGetStarted} className="btn-filled"
              style={{ padding: '9px 24px', borderRadius: '100px', background: colors.matcha, color: 'white', border: 'none', fontFamily: "'Geologica', sans-serif", fontSize: '0.83rem', fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s' }}>
              {t('auth.register')}
            </button>
          </div>
        </nav>

        {/* ── HERO ── */}
        <section style={{ minHeight: '100vh', paddingTop: '68px', background: colors.cream, position: 'relative', display: 'grid', gridTemplateColumns: '1fr 1fr', overflow: 'hidden' }}>
          {/* Decorative blobs */}
          <div style={{ position: 'absolute', width: '600px', height: '600px', borderRadius: '50%', background: 'rgba(168,197,160,0.22)', top: '-100px', right: '-100px', filter: 'blur(90px)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(200,222,196,0.18)', bottom: 0, left: '20%', filter: 'blur(90px)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', width: '280px', height: '280px', borderRadius: '50%', background: 'rgba(122,158,126,0.12)', top: '30%', left: '8%', filter: 'blur(90px)', pointerEvents: 'none' }} />

          <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '80px 56px 80px 72px' }}>
            {/* Badge */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: colors.matchaPale, border: `1px solid ${colors.matchaLight}`, padding: '6px 14px', borderRadius: '100px', width: 'fit-content', marginBottom: '36px', fontSize: '0.76rem', fontWeight: 500, color: colors.matcha, letterSpacing: '0.3px', animation: 'softUp 0.8s ease both' }}>
              <span style={{ width: '5px', height: '5px', background: colors.matcha, borderRadius: '50%' }} />
              {t('home.madeInKazakhstan')}
            </div>

            {/* Hero heading */}
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(3rem, 5vw, 5rem)', fontWeight: 600, lineHeight: 1.0, letterSpacing: '-1.5px', color: colors.ink, marginBottom: '28px', animation: 'softUp 0.8s 0.1s ease both' }}>
              {t('home.heroTitle')}<br />
              <em style={{ fontStyle: 'italic', color: colors.matcha }}>{t('home.heroTitleItalic')}</em><br />
              {t('home.heroTitleEnd')}
            </h1>

            <p style={{ fontSize: '1rem', fontWeight: 300, color: colors.ink60, lineHeight: 1.8, maxWidth: '420px', marginBottom: '44px', animation: 'softUp 0.8s 0.2s ease both' }}>
              {t('home.heroSubtitle')}
            </p>

            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', animation: 'softUp 0.8s 0.3s ease both' }}>
              <button onClick={onGetStarted} className="cta-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: colors.ink, color: 'white', padding: '16px 32px', borderRadius: '100px', fontFamily: "'Geologica', sans-serif", fontSize: '0.92rem', fontWeight: 500, border: 'none', cursor: 'pointer', transition: 'all 0.25s' }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="5" stroke="white" strokeWidth="1.4" /><path d="M11 11L14 14" stroke="white" strokeWidth="1.4" strokeLinecap="round" /></svg>
                {t('home.viewProfiles')}
              </button>
            </div>

            {/* Stats row */}
            <div style={{ display: 'flex', gap: 0, marginTop: '60px', paddingTop: '44px', borderTop: `1px solid ${colors.matchaLight}`, animation: 'softUp 0.8s 0.4s ease both' }}>
              {[
                { n: '4,200', s: '+', lKey: 'home.stats.users' },
                { n: '17', s: '', lKey: 'home.stats.cities' },
                { n: '92', s: '%', lKey: 'home.stats.satisfaction' },
              ].map((stat, i) => (
                <div key={i} style={{ flex: 1, paddingRight: i < 2 ? '24px' : 0, paddingLeft: i > 0 ? '24px' : 0, borderRight: i < 2 ? `1px solid ${colors.matchaLight}` : 'none' }}>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '2.4rem', fontWeight: 600, color: colors.ink, letterSpacing: '-1px', lineHeight: 1, marginBottom: '4px' }}>
                    {stat.n}<span style={{ color: colors.matcha }}>{stat.s}</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 300, color: colors.ink60, letterSpacing: '0.3px' }}>{t(stat.lKey)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right side — decorative cards */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 72px 80px 40px' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: '340px' }}>
              <div className="float-a" style={{ background: colors.white, borderRadius: '20px', padding: '20px', boxShadow: '0 20px 60px rgba(122,158,126,0.18)', border: `1px solid ${colors.matchaLight}`, marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: colors.matchaPale, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Cormorant Garamond', serif", fontSize: '1rem', fontWeight: 600, color: colors.matcha }}>АМ</div>
                  <div>
                    <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1rem', fontWeight: 600, color: colors.ink }}>Айгерим М.</div>
                    <div style={{ fontSize: '0.72rem', color: colors.ink60 }}>📍 Алматы</div>
                  </div>
                  <div style={{ marginLeft: 'auto', background: colors.matchaPale, color: colors.matcha, padding: '4px 10px', borderRadius: '100px', fontSize: '0.72rem', fontWeight: 600 }}>94%</div>
                </div>
              </div>
              <div className="float-b" style={{ background: colors.white, borderRadius: '20px', padding: '20px', boxShadow: '0 20px 60px rgba(122,158,126,0.18)', border: `1px solid ${colors.matchaLight}`, marginLeft: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Cormorant Garamond', serif", fontSize: '1rem', fontWeight: 600, color: '#92400E' }}>ДС</div>
                  <div>
                    <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1rem', fontWeight: 600, color: colors.ink }}>Данияр С.</div>
                    <div style={{ fontSize: '0.72rem', color: colors.ink60 }}>📍 Астана</div>
                  </div>
                  <div style={{ marginLeft: 'auto', background: '#FEF3C7', color: '#92400E', padding: '4px 10px', borderRadius: '100px', fontSize: '0.72rem', fontWeight: 600 }}>87%</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section style={{ padding: '100px 72px', background: colors.white, borderTop: `1px solid ${colors.matchaLight}` }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '64px' }}>
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 500, letterSpacing: '3px', textTransform: 'uppercase', color: colors.matcha, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '20px', height: '1px', background: colors.matcha }} />
                  {t('home.features')}
                </div>
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(2rem, 3.5vw, 3rem)', fontWeight: 600, letterSpacing: '-0.5px', lineHeight: 1.08, color: colors.ink }}>{t('home.whyChoose')}</h2>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
              {Array.isArray(features) && features.map((feature, i) => (
                <div key={i} className="reveal" style={{ background: colors.cream, border: `1px solid ${colors.matchaLight}`, borderRadius: '24px', padding: '32px 28px', textAlign: 'center', transition: 'all 0.3s', cursor: 'default' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = colors.matchaPale; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(122,158,126,0.15)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = colors.cream; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
                  <div style={{ fontSize: '2.8rem', marginBottom: '16px' }}>{feature.icon}</div>
                  <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.1rem', fontWeight: 600, color: colors.ink, marginBottom: '8px' }}>{feature.title}</h3>
                  <p style={{ fontSize: '0.85rem', fontWeight: 300, color: colors.ink60, lineHeight: 1.6 }}>{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── TRUST / VERIFICATION ── */}
        <section style={{ padding: '100px 72px', background: colors.cream }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center', marginBottom: '64px' }}>
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 500, letterSpacing: '3px', textTransform: 'uppercase', color: colors.matcha, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '20px', height: '1px', background: colors.matcha }} />
                  {t('home.features')}
                </div>
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(2rem, 3.5vw, 3rem)', fontWeight: 600, lineHeight: 1.08, color: colors.ink, marginBottom: '20px' }}>
                  {t('home.compatibleRoommates')}
                </h2>
                <p style={{ fontSize: '0.95rem', fontWeight: 300, color: colors.ink60, lineHeight: 1.75 }}>
                  {t('home.heroSubtitle')}
                </p>
              </div>
              <div className="reveal" style={{ background: colors.white, borderRadius: '28px', padding: '32px', border: `1px solid ${colors.matchaLight}`, boxShadow: '0 12px 40px rgba(122,158,126,0.1)' }}>
                <div style={{ fontSize: '3.2rem', marginBottom: '14px' }}>✓</div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.4rem', fontWeight: 600, color: colors.ink, marginBottom: '8px' }}>{t('home.verified')}</div>
                <div style={{ fontSize: '0.85rem', color: colors.ink60, marginBottom: '20px', lineHeight: 1.6 }}>{t('home.exploreProfiles')}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {['ID проверка', 'Номер подтвержден', 'Анкета подтверждена'].map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: colors.ink60 }}>
                      <span style={{ color: colors.matcha, fontWeight: 600 }}>✓</span> {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
              {[
                { stat: '100%', labelKey: 'home.stats.satisfaction', emoji: '✓' },
                { stat: '<24ч', labelKey: 'home.stats.users', emoji: '⏱️' },
                { stat: '0%', labelKey: 'home.stats.cities', emoji: '🔒' },
              ].map((item, i) => (
                <div key={i} className="reveal"
                  style={{ background: colors.matchaMist, border: `1px solid ${colors.matchaLight}`, borderRadius: '24px', padding: '32px 24px', textAlign: 'center', transition: 'all 0.3s', cursor: 'pointer' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = colors.matchaLight}
                  onMouseLeave={(e) => e.currentTarget.style.background = colors.matchaMist}>
                  <div style={{ fontSize: '2.4rem', marginBottom: '12px' }}>{item.emoji}</div>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '2rem', fontWeight: 600, color: colors.matcha, marginBottom: '8px' }}>{item.stat}</div>
                  <div style={{ fontSize: '0.85rem', color: colors.ink60, fontWeight: 300 }}>{t(item.labelKey)}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section style={{ padding: '80px 72px', background: colors.matchaMist }}>
          <div className="reveal" style={{ background: colors.matcha, borderRadius: '32px', padding: '80px 72px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '320px', height: '320px', background: 'rgba(255,255,255,0.08)', borderRadius: '50%' }} />
            <div style={{ position: 'absolute', bottom: '-60px', left: '30%', width: '200px', height: '200px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
            <div>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(2.2rem, 3.5vw, 3.2rem)', fontWeight: 600, lineHeight: 1.08, letterSpacing: '-0.5px', color: 'white', marginBottom: '16px' }}>
                {t('home.readyToFind')}<br />
                <em style={{ fontStyle: 'italic', color: 'rgba(255,255,255,0.7)' }}>{t('home.yourPerson')}</em>
              </h2>
              <p style={{ fontSize: '0.95rem', fontWeight: 300, color: 'rgba(255,255,255,0.72)', lineHeight: 1.75 }}>
                {t('home.ctaSubtitle')}
              </p>
            </div>
            <div style={{ position: 'relative' }}>
              <button onClick={onGetStarted}
                style={{ width: '100%', padding: '16px', borderRadius: '14px', border: 'none', background: colors.white, color: colors.matcha, fontFamily: "'Geologica', sans-serif", fontSize: '0.92rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.15)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8H13M13 8L9 4M13 8L9 12" stroke={colors.matcha} strokeWidth="1.6" strokeLinecap="round" /></svg>
                {t('home.ctaAction')}
              </button>
              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', marginTop: '10px', textAlign: 'center', fontWeight: 300 }}>
                {t('home.noCreditCard')}
              </div>
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer style={{ background: colors.ink, padding: '64px 72px 0', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '48px' }}>
          <div>
            <a href="#!" role="button" onClick={(e) => e.preventDefault()}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', fontFamily: "'Cormorant Garamond', serif", fontSize: '1.4rem', fontWeight: 600, color: 'white', textDecoration: 'none', marginBottom: '14px' }}>
              <div style={{ background: colors.matcha, width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🏠</div>
              Roomate<span style={{ color: colors.matchaMid }}>.kz</span>
            </a>
            <p style={{ fontSize: '0.83rem', fontWeight: 300, color: 'rgba(255,255,255,0.38)', lineHeight: 1.8, marginBottom: '28px' }}>
              {t('footer.description')}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
              {['Алматы', 'Астана', 'Шымкент', 'Актау', '+13'].map((city, i) => (
                <span key={i} style={{ fontSize: '0.68rem', padding: '4px 11px', borderRadius: '100px', border: 'rgba(255,255,255,0.1) 1px solid', color: 'rgba(255,255,255,0.35)', fontWeight: 300 }}>{city}</span>
              ))}
            </div>
          </div>
          {[
            { hKey: 'footer.housing', linksKey: 'footer.housingLinks' },
            { hKey: 'footer.locations', linksKey: 'footer.locationLinks' },
            { hKey: 'footer.resources', linksKey: 'footer.resourceLinks' },
          ].map((col, i) => {
            const links = t(col.linksKey);
            return (
              <div key={i}>
                <h5 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '0.95rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: '20px', letterSpacing: '0.3px' }}>
                  {t(col.hKey)}
                </h5>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', padding: 0, margin: 0 }}>
                  {Array.isArray(links) && links.map((link, j) => (
                    <li key={j}>
                      <button onClick={() => { }} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'rgba(255,255,255,0.3)', fontSize: '0.83rem', fontWeight: 300, transition: 'color 0.2s', fontFamily: 'inherit' }}
                        onMouseEnter={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.65)'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}>
                        {link}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </footer>

        <div style={{ background: colors.ink, padding: '20px 72px 32px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.74rem', fontWeight: 300, color: 'rgba(255,255,255,0.18)' }}>
          <span>{t('footer.copyright')}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span>{t('footer.privacy')}</span>
            {/* Language switcher in footer too */}
            <LanguageSwitcher variant="minimal" dark={true} />
          </div>
        </div>

      </div>
    </>
  );
}

export default HomePage;
