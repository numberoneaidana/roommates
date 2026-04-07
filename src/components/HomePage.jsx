import React, { useState, useEffect } from 'react';
import {TRANSLATIONS} from './translations.js';


function HomePage({onGetStarted, uiLang = "ru", connected, auth, setAuth}) {
  const [scrolled, setScrolled] = useState(false);
  const [visibleElements, setVisibleElements] = useState(new Set());
  const translations = TRANSLATIONS[uiLang] || {};
  
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
      document.querySelectorAll('.reveal').forEach(el => {
        if (el.getBoundingClientRect().top < window.innerHeight * 0.9) {
          setVisibleElements(prev => new Set([...prev, el]));
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
  `;

  return (
    <>
      <style>{globalStyles}</style>
      <div style={{background: colors.cream, minHeight: '100vh', fontFamily: "'Geologica', sans-serif"}}>
        
        {/* HERO */}
        <section style={{minHeight: '100vh', paddingTop: '68px', background: colors.cream, position: 'relative', display: 'grid', gridTemplateColumns: '1fr 1fr', overflow: 'hidden'}}>
          {/* Blobs */}
          <div style={{position: 'absolute', width: '600px', height: '600px', borderRadius: '50%', background: 'rgba(168,197,160,0.22)', top: '-100px', right: '-100px', filter: 'blur(90px)', pointerEvents: 'none'}}/>
          <div style={{position: 'absolute', width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(200,222,196,0.18)', bottom: 0, left: '20%', filter: 'blur(90px)', pointerEvents: 'none'}}/>
          <div style={{position: 'absolute', width: '280px', height: '280px', borderRadius: '50%', background: 'rgba(122,158,126,0.12)', top: '30%', left: '8%', filter: 'blur(90px)', pointerEvents: 'none'}}/>

          <div style={{position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '80px 56px 80px 72px'}}>
            <div style={{display: 'inline-flex', alignItems: 'center', gap: '8px', background: colors.matchaPale, border: `1px solid ${colors.matchaLight}`, padding: '6px 14px', borderRadius: '100px', width: 'fit-content', marginBottom: '36px', fontSize: '0.76rem', fontWeight: 500, color: colors.matcha, letterSpacing: '0.3px', animation: 'softUp 0.8s ease both'}}>
              <span style={{width: '5px', height: '5px', background: colors.matcha, borderRadius: '50%'}}/>
              {translations.home?.madeForKZ || "🇰🇿 Made for Kazakhstan"}
            </div>

            <h1 style={{fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(3rem, 5vw, 5rem)', fontWeight: 600, lineHeight: 1.0, letterSpacing: '-1.5px', color: colors.ink, marginBottom: '28px', animation: 'softUp 0.8s 0.1s ease both'}}>
              {translations.home?.findPerfect || "Find your perfect"}<br/><em style={{fontStyle: 'italic', color: colors.matcha}}>{translations.home?.perfectRoommate || "perfect roommate"}</em><br/>{translations.home?.roommate || "roommate"}
            </h1>

            <p style={{fontSize: '1rem', fontWeight: 300, color: colors.ink60, lineHeight: 1.8, maxWidth: '420px', marginBottom: '44px', animation: 'softUp 0.8s 0.2s ease both'}}>
              {translations.home?.subtitle || "From Almaty to Astana — connect with verified roommates matched by lifestyle."}
            </p>

            <div style={{display: 'flex', gap: '14px', flexWrap: 'wrap', animation: 'softUp 0.8s 0.3s ease both'}}>
              <button onClick={onGetStarted} style={{display: 'inline-flex', alignItems: 'center', gap: '10px', background: colors.ink, color: 'white', padding: '16px 32px', borderRadius: '100px', fontFamily: "'Geologica', sans-serif", fontSize: '0.92rem', fontWeight: 500, textDecoration: 'none', border: 'none', cursor: 'pointer', transition: 'background 0.25s, transform 0.25s'}}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="5" stroke="white" strokeWidth="1.4"/><path d="M11 11L14 14" stroke="white" strokeWidth="1.4" strokeLinecap="round"/></svg>
                {translations.home?.browseProfiles || "Browse Profiles"}
              </button>
            </div>

            <div style={{display: 'flex', gap: 0, marginTop: '60px', paddingTop: '44px', borderTop: `1px solid ${colors.matchaLight}`, animation: 'softUp 0.8s 0.4s ease both'}}>
              {[
                {n: '4,200', s: '+', l: translations.home?.activeUsers || 'Active Users'},
                {n: '17', s: '', l: translations.home?.citiesInKZ || 'Cities in Kazakhstan'},
                {n: '92', s: '%', l: translations.home?.matchSatisfaction || 'Match Satisfaction'}
              ].map((stat, i) => (
                <div key={i} style={{flex: 1, paddingRight: i < 2 ? '24px' : 0, paddingLeft: i > 0 ? '24px' : 0, borderRight: i < 2 ? `1px solid ${colors.matchaLight}` : 'none'}}>
                  <div style={{fontFamily: "'Cormorant Garamond', serif", fontSize: '2.4rem', fontWeight: 600, color: colors.ink, letterSpacing: '-1px', lineHeight: 1, marginBottom: '4px'}}>
                    {stat.n}<span style={{color: colors.matcha}}>{stat.s}</span>
                  </div>
                  <div style={{fontSize: '0.78rem', fontWeight: 300, color: colors.ink60, letterSpacing: '0.3px'}}>{stat.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* CARDS */}
          <div style={{position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 40px'}}>
            <div style={{position: 'relative', width: '360px', height: '520px'}}>
              {/* Main Card */}
              <div className="float-a" style={{position: 'absolute', top: '40px', left: 0, width: '280px', background: colors.white, border: `1px solid ${colors.matchaLight}`, borderRadius: '28px', padding: '24px', boxShadow: `0 8px 40px rgba(122,158,126,0.12), 0 2px 8px rgba(28,43,30,0.05)`}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px'}}>
                  <div style={{width: '44px', height: '44px', borderRadius: '50%', background: colors.matchaPale, border: `2px solid ${colors.matchaLight}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Cormorant Garamond', serif", fontSize: '1rem', fontWeight: 600, color: colors.matcha, flexShrink: 0}}>AK</div>
                  <div>
                    <div style={{fontFamily: "'Cormorant Garamond', serif", fontSize: '1rem', fontWeight: 600, color: colors.ink, lineHeight: 1.2}}>Айзат Кенже</div>
                    <div style={{fontSize: '0.7rem', fontWeight: 300, color: colors.ink60, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '3px'}}>
                      📍 Алматы, Бостандыкский район
                    </div>
                  </div>
                </div>
                <div style={{display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '14px'}}>
                  {['Не курю', 'Студент', 'Ранний подъем', '₸85,000/мес'].map((tag, i) => (
                    <span key={i} style={{fontSize: '0.65rem', fontWeight: 400, padding: '4px 10px', borderRadius: '100px', background: i < 2 ? colors.matchaPale : colors.white, color: i < 2 ? colors.matcha : colors.ink60, border: `1px solid ${i < 2 ? colors.matchaLight : colors.ink10}`, letterSpacing: '0.2px'}}>
                      {tag}
                    </span>
                  ))}
                </div>
                <div style={{display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', background: colors.matchaMist, borderRadius: '12px'}}>
                  <span style={{fontSize: '0.7rem', color: colors.ink60, fontWeight: 300, flex: 1}}>Совместимость</span>
                  <div style={{flex: 2, height: '4px', background: colors.matchaLight, borderRadius: '2px'}}>
                    <div style={{height: '100%', borderRadius: '2px', background: colors.matcha, width: '96%'}}/>
                  </div>
                  <span style={{fontFamily: "'Cormorant Garamond', serif", fontSize: '1.1rem', fontWeight: 600, color: colors.matcha}}>96%</span>
                </div>
              </div>

              {/* Mini Card */}
              <div className="float-c" style={{position: 'absolute', top: '200px', right: '10px', width: '180px', background: colors.matcha, borderRadius: '20px', padding: '16px 18px', boxShadow: `0 8px 32px rgba(122,158,126,0.3)`, color: 'white'}}>
                <div style={{fontSize: '0.65rem', fontWeight: 300, opacity: 0.7, marginBottom: '4px'}}>Новые совпадения</div>
                <div style={{fontFamily: "'Cormorant Garamond', serif", fontSize: '1.6rem', fontWeight: 600, color: 'white', lineHeight: 1, marginBottom: '2px'}}>12</div>
                <div style={{fontSize: '0.65rem', fontWeight: 300, opacity: 0.6}}>сегодня</div>
              </div>

              {/* Secondary Card */}
              <div className="float-b" style={{position: 'absolute', bottom: '40px', right: 0, width: '256px', background: colors.white, border: `1px solid ${colors.matchaLight}`, borderRadius: '24px', padding: '20px 22px', boxShadow: `0 8px 40px rgba(122,158,126,0.1), 0 2px 8px rgba(28,43,30,0.04)`}}>
                <div style={{fontSize: '0.65rem', fontWeight: 600, color: colors.matcha, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '14px'}}>Ваша Совместимость</div>
                <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                  {[{l: 'Режим сна', v: 94}, {l: 'Чистоплотность', v: 88}, {l: 'Бюджет', v: 100}, {l: 'Социальные привычки', v: 74}].map((item, i) => (
                    <div key={i} style={{display: 'flex', flexDirection: 'column', gap: '3px'}}>
                      <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: colors.ink60, fontWeight: 300}}>
                        <span>{item.l}</span>
                        <span style={{fontWeight: 500, color: colors.ink}}>{item.v}%</span>
                      </div>
                      <div style={{height: '3px', background: colors.matchaPale, borderRadius: '2px'}}>
                        <div style={{height: '100%', borderRadius: '2px', background: colors.matchaMid, width: `${item.v}%`}}/>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section style={{padding: '100px 72px', background: colors.cream}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '64px'}}>
            <div>
              <div style={{fontSize: '0.72rem', fontWeight: 500, letterSpacing: '3px', textTransform: 'uppercase', color: colors.matcha, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px'}}>
                <span style={{width: '20px', height: '1px', background: colors.matcha}}/>
                {translations.home?.stepByStep || "Step by step"}
              </div>
              <h2 style={{fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(2rem, 3.5vw, 3rem)', fontWeight: 600, letterSpacing: '-0.5px', lineHeight: 1.08, color: colors.ink}}>{translations.home?.threeSteps || "Three steps to your new roommate"}<br/> новому соседу</h2>
            </div>
          </div>

          <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2px'}}>
            {[
              {n: 1, h: translations.home?.step1Title || 'Create Profile', d: translations.home?.step1Desc || 'Answer 20 questions about your lifestyle — sleep schedule, cleanliness, social habits, budget. Takes four minutes.'},
              {n: 2, h: translations.home?.step2Title || 'Get Matches', d: translations.home?.step2Desc || 'Our algorithm evaluates 40+ data points and shows the most compatible people near you.'},
              {n: 3, h: translations.home?.step3Title || 'Connect & Move', d: translations.home?.step3Desc || 'Chat in Kazakh, Russian, or English. All profiles verified by ID. Schedule viewings. Move in.'}
            ].map((step, i) => (
              <div key={i} className="reveal" style={{background: colors.white, border: `1px solid ${colors.matchaLight}`, padding: '40px 36px', position: 'relative', transition: 'background 0.3s', borderRadius: i === 0 ? '24px 0 0 24px' : i === 2 ? '0 24px 24px 0' : '0'}}>
                <div style={{width: '36px', height: '36px', borderRadius: '50%', background: colors.matchaPale, border: `1px solid ${colors.matchaLight}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Cormorant Garamond', serif", fontSize: '1rem', fontWeight: 600, color: colors.matcha, marginBottom: '24px'}}>
                  {step.n}
                </div>
                <h3 style={{fontFamily: "'Cormorant Garamond', serif", fontSize: '1.3rem', fontWeight: 600, color: colors.ink, marginBottom: '10px', lineHeight: 1.25}}>
                  {step.h}
                </h3>
                <p style={{fontSize: '0.85rem', fontWeight: 300, color: colors.ink60, lineHeight: 1.75}}>
                  {step.d}
                </p>
                {i < 2 && <div style={{position: 'absolute', top: '50%', right: '-16px', transform: 'translateY(-50%)', width: '32px', height: '32px', background: colors.white, border: `1px solid ${colors.matchaLight}`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1}}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6H10M10 6L7 3M10 6L7 9" stroke={colors.matcha} strokeWidth="1.3" strokeLinecap="round"/></svg>
                </div>}
              </div>
            ))}
          </div>
        </section>

        {/* TRUST STRIP */}
        <div style={{background: colors.white, borderTop: `1px solid ${colors.matchaLight}`, borderBottom: `1px solid ${colors.matchaLight}`, padding: '48px 72px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '32px', alignItems: 'center'}}>
          {[
            {h: translations.home?.verifiedProfiles || 'Verified Profiles', d: translations.home?.eachUserVerified || 'Each user is verified'},
            {h: translations.home?.lifestyleMatch || 'Lifestyle Match', d: translations.home?.evaluateOver20 || 'Evaluate your roommate on 20+ factors for best matches'},
            {h: translations.home?.triLanguageSupport || '3 Language Support', d: translations.home?.chatInThreeLangs || 'Chat in Kazakh, Russian, or English'},
            {h: translations.home?.coverageCountry || '17 Cities in KZ', d: translations.home?.coverageAll || 'Coverage across the entire country'}
          ].map((item, i) => (
            <div key={i} className="reveal" style={{display: 'flex', alignItems: 'center', gap: '14px'}}>
              <div style={{width: '48px', height: '48px', borderRadius: '14px', background: colors.matchaPale, border: `1px solid ${colors.matchaLight}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.25s'}}>
                <span style={{fontSize: '24px'}}>{['🛡️', '⚡', '💬', '🌍'][i]}</span>
              </div>
              <div>
                <h4 style={{fontFamily: "'Cormorant Garamond', serif", fontSize: '0.95rem', fontWeight: 600, color: colors.ink, marginBottom: '2px'}}>
                  {item.h}
                </h4>
                <p style={{fontSize: '0.75rem', fontWeight: 300, color: colors.ink60, lineHeight: 1.5}}>
                  {item.d}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* TESTIMONIALS */}
        <section style={{padding: '100px 72px', background: colors.cream}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '48px'}}>
            <div>
              <div style={{fontSize: '0.72rem', fontWeight: 500, letterSpacing: '3px', textTransform: 'uppercase', color: colors.matcha, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px'}}>
                <span style={{width: '20px', height: '1px', background: colors.matcha}}/>
                {translations.home?.reviews || "REVIEWS"}
              </div>
              <h2 style={{fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(2rem, 3.5vw, 3rem)', fontWeight: 600, letterSpacing: '-0.5px', lineHeight: 1.08, color: colors.ink}}>{translations.home?.realStories || "Real roommates, real stories"}</h2>
            </div>
          </div>

          <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px'}}>
            {[
              {stars: 5, text: 'Нашел идеального соседа по комнате в Алматы менее чем за неделю. Оценка совместимости была точной — у нас одинаковый режим сна и мы оба любим чистоту.', av: 'AM', n: 'Али Мирзаев', m: 'Алматы · Студент КазНУ'},
              {stars: 5, text: 'Переезд из Караганды в Астану по работе — это было спасением. Переехал с проверенным, действительно отличным соседом по комнате в течение 10 дней после регистрации.', av: 'RK', n: 'Руслан Кенжибеков', m: 'Астана · Программист'},
              {stars: 4, text: 'Проверка ИИН дала мне настоящее спокойствие. Я знал, что каждый профиль — реальный человек. Нашел отличного соседа по комнате рядом с Шымкентским медицинским университетом за две недели.', av: 'ZB', n: 'Диар Беков', m: 'Шымкент · Медицинский студент'}
            ].map((test, i) => (
              <div key={i} className="reveal" style={{background: colors.white, border: `1px solid ${colors.matchaLight}`, borderRadius: '24px', padding: '32px', transition: 'transform 0.25s', position: 'relative', overflow: 'hidden'}}>
                <div style={{position: 'absolute', top: '16px', right: '22px', fontFamily: "'Cormorant Garamond', serif", fontSize: '6rem', lineHeight: 1, color: colors.matchaPale, fontWeight: 600, pointerEvents: 'none'}}>"</div>
                <div style={{display: 'flex', gap: '3px', marginBottom: '16px'}}>
                  {[...Array(5)].map((_, j) => (
                    <svg key={j} width="14" height="14" viewBox="0 0 14 14" fill={j < test.stars ? colors.matcha : colors.matchaLight}><path d="M7 1L8.5 5H13L9.5 7.5L11 12L7 9.5L3 12L4.5 7.5L1 5H5.5L7 1Z"/></svg>
                  ))}
                </div>
                <p style={{fontSize: '0.9rem', fontWeight: 300, color: colors.ink60, lineHeight: 1.8, marginBottom: '24px', position: 'relative'}}>
                  {test.text}
                </p>
                <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                  <div style={{width: '40px', height: '40px', borderRadius: '50%', background: colors.matchaPale, border: `1.5px solid ${colors.matchaLight}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Cormorant Garamond', serif", fontSize: '0.9rem', fontWeight: 600, color: colors.matcha}}>
                    {test.av}
                  </div>
                  <div>
                    <div style={{fontFamily: "'Cormorant Garamond', serif", fontSize: '0.95rem', fontWeight: 600, color: colors.ink}}>
                      {test.n}
                    </div>
                    <div style={{fontSize: '0.72rem', fontWeight: 300, color: colors.ink60}}>
                      {test.m}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* VERIFICATION SECTION */}
        <section style={{padding: '100px 72px', background: colors.white}}>
          <div style={{maxWidth: '1200px', margin: '0 auto'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '64px'}}>
              <div>
                <div style={{fontSize: '0.72rem', fontWeight: 500, letterSpacing: '3px', textTransform: 'uppercase', color: colors.matcha, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px'}}>
                  <span style={{width: '20px', height: '1px', background: colors.matcha}}/>
                  {translations.home?.security || "Security"}
                </div>
                <h2 style={{fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(2rem, 3.5vw, 3rem)', fontWeight: 600, letterSpacing: '-0.5px', lineHeight: 1.08, color: colors.ink}}>{translations.home?.verifiedForSafety || "Verified profiles for your safety"}</h2>
              </div>
            </div>

            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', alignItems: 'center', marginBottom: '60px'}}>
              <div style={{display: 'flex', flexDirection: 'column', gap: '24px'}}>
                {[
                  {icon: '🛡️', title: translations.home?.idVerification || 'ID Verification', desc: translations.home?.allProfilesVerified || 'All profiles verified by ID database for full security'},
                  {icon: '⏱️', title: translations.home?.verification24h || '24 Hour Verification', desc: translations.home?.eachNewProfile || 'Each new profile is verified within 24 hours'},
                  {icon: '🚫', title: translations.home?.fraudBlocking || 'Fraud Blocking', desc: translations.home?.systemAutomatically || 'System automatically detects and blocks suspicious accounts'},
                  {icon: '📱', title: translations.home?.phoneConfirmation || 'Phone Confirmation', desc: translations.home?.requiredPhoneVerification || 'Required phone number verification'}
                ].map((item, i) => (
                  <div key={i} className="reveal" style={{display: 'flex', alignItems: 'flex-start', gap: '16px', padding: '16px 20px', background: colors.matchaMist, borderRadius: '16px', border: `1px solid ${colors.matchaLight}`, transition: 'all 0.3s'}}>
                    <div style={{fontSize: '1.8rem', flexShrink: 0}}>{item.icon}</div>
                    <div>
                      <h4 style={{fontFamily: "'Cormorant Garamond', serif", fontSize: '1rem', fontWeight: 600, color: colors.ink, marginBottom: '4px'}}>{item.title}</h4>
                      <p style={{fontSize: '0.85rem', fontWeight: 300, color: colors.ink60, margin: 0, lineHeight: 1.5}}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <div style={{position: 'absolute', width: '320px', height: '320px', borderRadius: '50%', background: 'rgba(122,158,126,0.15)', filter: 'blur(80px)', pointerEvents: 'none'}}/>
                <div className="float-a" style={{position: 'relative', zIndex: 2, width: '280px', background: colors.white, border: `2px solid ${colors.matchaLight}`, borderRadius: '28px', padding: '32px 24px', boxShadow: `0 12px 48px rgba(122,158,126,0.18)`, textAlign: 'center'}}>
                  <div style={{fontSize: '3.2rem', marginBottom: '14px'}}>✓</div>
                  <div style={{fontFamily: "'Cormorant Garamond', serif", fontSize: '1.4rem', fontWeight: 600, color: colors.ink, marginBottom: '8px'}}>Верифицирован</div>
                  <div style={{fontSize: '0.85rem', color: colors.ink60, marginBottom: '20px', lineHeight: 1.6}}>Все профили на Roomate.kz прошли проверку и верифицированы</div>
                  <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: colors.ink60}}>
                      <span style={{color: colors.matcha, fontWeight: 600}}>✓</span> ID проверка
                    </div>
                    <div style={{display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: colors.ink60}}>
                      <span style={{color: colors.matcha, fontWeight: 600}}>✓</span> Номер подтвержден
                    </div>
                    <div style={{display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: colors.ink60}}>
                      <span style={{color: colors.matcha, fontWeight: 600}}>✓</span> Анкета подтверждена
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Verification Stats */}
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px'}}>
              {[
                {stat: translations.home?.percent100Verified || '100%', label: translations.home?.profilesVerified || 'Profiles Verified', emoji: '✓'},
                {stat: translations.home?.verificationTime || '<24h', label: translations.home?.timeToVerify || 'Verification Time', emoji: '⏱️'},
                {stat: translations.home?.zeroFraud || '0%', label: translations.home?.fraudProfiles || 'Fraudulent Profiles', emoji: '🔐'}
              ].map((item, i) => (
                <div key={i} className="reveal" style={{background: colors.matchaMist, border: `1px solid ${colors.matchaLight}`, borderRadius: '24px', padding: '32px 24px', textAlign: 'center', transition: 'all 0.3s', cursor: 'pointer'}} onMouseEnter={(e) => e.currentTarget.style.background = colors.matchaLight} onMouseLeave={(e) => e.currentTarget.style.background = colors.matchaMist}>
                  <div style={{fontSize: '2.4rem', marginBottom: '12px'}}>{item.emoji}</div>
                  <div style={{fontFamily: "'Cormorant Garamond', serif", fontSize: '2rem', fontWeight: 600, color: colors.matcha, marginBottom: '8px'}}>{item.stat}</div>
                  <div style={{fontSize: '0.85rem', color: colors.ink60, fontWeight: 300}}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{padding: '80px 72px', background: colors.matchaMist}}>
          <div className="reveal" style={{background: colors.matcha, borderRadius: '32px', padding: '80px 72px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', alignItems: 'center', position: 'relative', overflow: 'hidden'}}>
            <div style={{position: 'absolute', top: '-80px', right: '-80px', width: '320px', height: '320px', background: 'rgba(255,255,255,0.08)', borderRadius: '50%'}}/>
            <div style={{position: 'absolute', bottom: '-60px', left: '30%', width: '200px', height: '200px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%'}}/>
            <div>
              <h2 style={{fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(2.2rem, 3.5vw, 3.2rem)', fontWeight: 600, lineHeight: 1.08, letterSpacing: '-0.5px', color: 'white', marginBottom: '16px'}}>
               {translations.home?.readyFind || "Ready to find your person?"}<br/><em style={{fontStyle: 'italic', color: 'rgba(255,255,255,0.7)'}}></em>
              </h2>
              <p style={{fontSize: '0.95rem', fontWeight: 300, color: 'rgba(255,255,255,0.72)', lineHeight: 1.75}}>
                {translations.home?.joinThousands || "Join over 4,200 people already using Roomate.kz to find compatible roommates across Kazakhstan. Sign up free, forever."}
              </p>
            </div>
            <div style={{position: 'relative'}}>
              <button onClick={onGetStarted} style={{width: '100%', padding: '16px', borderRadius: '14px', border: 'none', background: colors.white, color: colors.matcha, fontFamily: "'Geologica', sans-serif", fontSize: '0.92rem', fontWeight: 600, cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'}}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8H13M13 8L9 4M13 8L9 12" stroke={colors.matcha} strokeWidth="1.6" strokeLinecap="round"/></svg>
                {translations.home?.createAccountFree || "Create Account Free"}
              </button>
              <div style={{fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', marginTop: '10px', textAlign: 'center', fontWeight: 300}}>
                {translations.home?.noPayment || "No payment required · Verification within 24 hours"}
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer style={{background: colors.ink, padding: '64px 72px 0', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '48px'}}>
          <div>
            <a href="#!" role="button" onClick={(e) => e.preventDefault()} style={{display: 'flex', alignItems: 'center', gap: '10px', fontFamily: "'Cormorant Garamond', serif", fontSize: '1.4rem', fontWeight: 600, color: 'white', textDecoration: 'none', marginBottom: '14px'}}>
              <div style={{background: colors.matcha, width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                🏠
              </div>
              Roomate<span style={{color: colors.matchaMid}}>.kz</span>
            </a>
            <p style={{fontSize: '0.83rem', fontWeight: 300, color: 'rgba(255,255,255,0.38)', lineHeight: 1.8, marginBottom: '28px'}}>
              {translations.home?.smartService || "Kazakhstan's first smart roommate matching service. Lifestyle-based matching across all 17 cities, with ID verification for security."}
            </p>
            <div style={{display: 'flex', flexWrap: 'wrap', gap: '7px'}}>
              {['Алматы', 'Астана', 'Шымкент', 'Актау', '+13 городов'].map((city, i) => (
                <span key={i} style={{fontSize: '0.68rem', padding: '4px 11px', borderRadius: '100px', border: 'rgba(255,255,255,0.1) 1px solid', color: 'rgba(255,255,255,0.35)', fontWeight: 300}}>
                  {city}
                </span>
              ))}
            </div>
          </div>
          {[
{h: translations.home?.navigation || 'Search Rooms', links: [translations.home?.advertiseProperty || 'Advertise Property', translations.home?.checkCompatibility || 'Check Compatibility', translations.home?.safeDeal || 'Safe Deal']},
{h: translations.home?.locations || 'Locations', links: [translations.home?.allCities || 'All Cities']},
{h: translations.home?.resources || 'Resources', links: [translations.home?.aboutProject || 'About Project', translations.home?.trustCenter || 'Trust Center', translations.home?.helpfulArticles || 'Helpful Articles', translations.home?.support || 'Support']}
          ].map((col, i) => (
            <div key={i}>
              <h5 style={{fontFamily: "'Cormorant Garamond', serif", fontSize: '0.95rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: '20px', letterSpacing: '0.3px'}}>
                {col.h}
              </h5>
              <ul style={{listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px'}}>
                {col.links.map((link, j) => (
                  <li key={j}><button onClick={() => {}} style={{background: 'none', border: 'none', padding: 0, cursor: 'pointer', textDecoration: 'none', color: 'rgba(255,255,255,0.3)', fontSize: '0.83rem', fontWeight: 300, transition: 'color 0.2s', font: 'inherit'}}>{link}</button></li>
                ))}
              </ul>
            </div>
          ))}
        </footer>
        <div style={{background: colors.ink, padding: '0 72px 32px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', fontWeight: 300, color: 'rgba(255,255,255,0.18)', paddingTop: '20px'}}>
          <span>{translations.home?.copyright || "© 2026 Roomate.kz · Astana, Kazakhstan"}</span>
          <span>{translations.home?.policyAnd || "Privacy Policy · Terms of Use"}</span>
        </div>
      </div>
    </>
  );
}

export default HomePage;
