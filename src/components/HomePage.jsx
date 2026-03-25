import React, { useState, useEffect } from 'react';

function HomePage({onGetStarted}) {
  const [scrolled, setScrolled] = useState(false);
  const [visibleElements, setVisibleElements] = useState(new Set());

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
        
        {/* NAV */}
        <nav style={{position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 52px', height: '68px', background: 'rgba(250,253,249,0.88)', backdropFilter: 'blur(20px)', borderBottom: `1px solid ${colors.matchaLight}`}}>
          <a href="#" style={{display: 'flex', alignItems: 'center', gap: '10px', fontFamily: "'Cormorant Garamond', serif", fontSize: '1.5rem', fontWeight: 600, color: colors.ink, textDecoration: 'none', letterSpacing: '0.2px'}}>
            <div style={{width: '32px', height: '32px', borderRadius: '10px', background: colors.matcha, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
              <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
                <path d="M8.5 2L14 6.8V15H10.5V11H6.5V15H3V6.8L8.5 2Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M5.5 5C7 3.2 10 2.8 11.5 4.5C9.5 4.5 7.5 6 7.5 8" stroke="rgba(255,255,255,0.7)" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            </div>
            Roomate<span style={{color: colors.matcha}}>.kz</span>
          </a>

          <ul style={{display: 'flex', gap: '36px', listStyle: 'none'}}>
            <li><a href="#" style={{textDecoration: 'none', color: colors.ink60, fontSize: '0.84rem', fontWeight: 400, transition: 'color 0.2s', letterSpacing: '0.2px'}}>Карта</a></li>
            <li><a href="#" style={{textDecoration: 'none', color: colors.ink60, fontSize: '0.84rem', fontWeight: 400, transition: 'color 0.2s', letterSpacing: '0.2px'}}>Понравилось</a></li>
            <li><a href="#" style={{textDecoration: 'none', color: colors.ink60, fontSize: '0.84rem', fontWeight: 400, transition: 'color 0.2s', letterSpacing: '0.2px'}}>Профиль</a></li>
            <li><a href="#" style={{textDecoration: 'none', color: colors.ink60, fontSize: '0.84rem', fontWeight: 400, transition: 'color 0.2s', letterSpacing: '0.2px'}}>Главная</a></li>
          </ul>

          <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
            <button onClick={onGetStarted} style={{padding: '9px 22px', borderRadius: '100px', border: `1.5px solid ${colors.matchaLight}`, background: 'transparent', color: colors.ink, fontFamily: "'Geologica', sans-serif", fontSize: '0.83rem', fontWeight: 400, cursor: 'pointer', textDecoration: 'none', transition: 'border-color 0.2s, background 0.2s'}}>Войти</button>
            <button onClick={onGetStarted} style={{padding: '9px 24px', borderRadius: '100px', background: colors.matcha, color: 'white', border: 'none', fontFamily: "'Geologica', sans-serif", fontSize: '0.83rem', fontWeight: 500, cursor: 'pointer', textDecoration: 'none', transition: 'background 0.2s, transform 0.2s'}}>Зарегистрироваться</button>
          </div>
        </nav>

        {/* HERO */}
        <section style={{minHeight: '100vh', paddingTop: '68px', background: colors.cream, position: 'relative', display: 'grid', gridTemplateColumns: '1fr 1fr', overflow: 'hidden'}}>
          {/* Blobs */}
          <div style={{position: 'absolute', width: '600px', height: '600px', borderRadius: '50%', background: 'rgba(168,197,160,0.22)', top: '-100px', right: '-100px', filter: 'blur(90px)', pointerEvents: 'none'}}/>
          <div style={{position: 'absolute', width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(200,222,196,0.18)', bottom: 0, left: '20%', filter: 'blur(90px)', pointerEvents: 'none'}}/>
          <div style={{position: 'absolute', width: '280px', height: '280px', borderRadius: '50%', background: 'rgba(122,158,126,0.12)', top: '30%', left: '8%', filter: 'blur(90px)', pointerEvents: 'none'}}/>

          <div style={{position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '80px 56px 80px 72px'}}>
            <div style={{display: 'inline-flex', alignItems: 'center', gap: '8px', background: colors.matchaPale, border: `1px solid ${colors.matchaLight}`, padding: '6px 14px', borderRadius: '100px', width: 'fit-content', marginBottom: '36px', fontSize: '0.76rem', fontWeight: 500, color: colors.matcha, letterSpacing: '0.3px', animation: 'softUp 0.8s ease both'}}>
              <span style={{width: '5px', height: '5px', background: colors.matcha, borderRadius: '50%'}}/>
              🇰🇿 Сделано для Казахстана
            </div>

            <h1 style={{fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(3rem, 5vw, 5rem)', fontWeight: 600, lineHeight: 1.0, letterSpacing: '-1.5px', color: colors.ink, marginBottom: '28px', animation: 'softUp 0.8s 0.1s ease both'}}>
              Найдите своего<br/><em style={{fontStyle: 'italic', color: colors.matcha}}>идеального</em><br/>соседа по комнате
            </h1>

            <p style={{fontSize: '1rem', fontWeight: 300, color: colors.ink60, lineHeight: 1.8, maxWidth: '420px', marginBottom: '44px', animation: 'softUp 0.8s 0.2s ease both'}}>
              От Алматы до Астаны — общайтесь с проверенными соседями по квартире, подходящими по образу жизни.
            </p>

            <div style={{display: 'flex', gap: '14px', flexWrap: 'wrap', animation: 'softUp 0.8s 0.3s ease both'}}>
              <button onClick={onGetStarted} style={{display: 'inline-flex', alignItems: 'center', gap: '10px', background: colors.ink, color: 'white', padding: '16px 32px', borderRadius: '100px', fontFamily: "'Geologica', sans-serif", fontSize: '0.92rem', fontWeight: 500, textDecoration: 'none', border: 'none', cursor: 'pointer', transition: 'background 0.25s, transform 0.25s'}}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="5" stroke="white" strokeWidth="1.4"/><path d="M11 11L14 14" stroke="white" strokeWidth="1.4" strokeLinecap="round"/></svg>
                Посмотрите анкеты
              </button>
            </div>

            <div style={{display: 'flex', gap: 0, marginTop: '60px', paddingTop: '44px', borderTop: `1px solid ${colors.matchaLight}`, animation: 'softUp 0.8s 0.4s ease both'}}>
              {[
                {n: '4,200', s: '+', l: 'Активных пользователей'},
                {n: '17', s: '', l: 'Городов по Казахстану'},
                {n: '92', s: '%', l: 'Удовлетворенность совпадений'}
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
                Шаг за шагом
              </div>
              <h2 style={{fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(2rem, 3.5vw, 3rem)', fontWeight: 600, letterSpacing: '-0.5px', lineHeight: 1.08, color: colors.ink}}>Три шага к вашему <br/> новому соседу</h2>
            </div>
          </div>

          <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2px'}}>
            {[
              {n: 1, h: 'Создайте профиль', d: 'Ответьте на 20 вопросов о вашем образе жизни — сон, чистоплотность, социальные привычки, бюджет. Занимает четыре минуты.'},
              {n: 2, h: 'Получите совпадения', d: 'Наш алгоритм оценивает более 40 данных и показывает наиболее совместимых людей рядом с вами.'},
              {n: 3, h: 'Свяжитесь и переезжайте', d: 'Общайтесь на казахском, русском или английском. Все профили проверены по ИИН. Организуйте просмотры. Переезжайте.'}
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
            {h: 'Верифицированные профили', d: 'Каждый пользователь проверен'},
            {h: 'Совместимость образа жизни', d: 'Оцени своего соседа по 20+ факторам для лучших совпадений'},
            {h: 'Поддержка 3 языков', d: 'Общайтесь на казахском, русском или английском'},
            {h: '17 городов в КЗ', d: 'От Алматы до Актау — покрытие по всей стране'}
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
                REVIEWS
              </div>
              <h2 style={{fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(2rem, 3.5vw, 3rem)', fontWeight: 600, letterSpacing: '-0.5px', lineHeight: 1.08, color: colors.ink}}>Реальные соседи,<br/>реальные истории</h2>
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
                  Безопасность
                </div>
                <h2 style={{fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(2rem, 3.5vw, 3rem)', fontWeight: 600, letterSpacing: '-0.5px', lineHeight: 1.08, color: colors.ink}}>Проверенные<br/>профили для вашей<br/>безопасности</h2>
              </div>
            </div>

            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', alignItems: 'center', marginBottom: '60px'}}>
              <div style={{display: 'flex', flexDirection: 'column', gap: '24px'}}>
                {[
                  {icon: '🛡️', title: 'Проверка ИИН', desc: 'Все профили проверяются по базе ИИН для полной безопасности'},
                  {icon: '⏱️', title: 'Проверка 24 часа', desc: 'Каждый новый профиль проходит верификацию в течение суток'},
                  {icon: '🚫', title: 'Блокировка мошенников', desc: 'Система автоматически выявляет и блокирует подозрительные аккаунты'},
                  {icon: '📱', title: 'Подтверждение номера', desc: 'Обязательная верификация по номеру телефона'}
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
                {stat: '100%', label: 'Профилей верифицировано', emoji: '✓'},
                {stat: '<24ч', label: 'Время проверки', emoji: '⏱️'},
                {stat: '0%', label: 'Мошеннических профилей', emoji: '🔒'}
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
               Готов найти<br/>своего <em style={{fontStyle: 'italic', color: 'rgba(255,255,255,0.7)'}}>человека?</em>
              </h2>
              <p style={{fontSize: '0.95rem', fontWeight: 300, color: 'rgba(255,255,255,0.72)', lineHeight: 1.75}}>
                Присоединяйтесь к более чем 4,200 людям, которые уже используют Roomate.kz для поиска совместимых соседей по комнате по всему Казахстану. Регистрация бесплатна, навсегда.
              </p>
            </div>
            <div style={{position: 'relative'}}>
              <button onClick={onGetStarted} style={{width: '100%', padding: '16px', borderRadius: '14px', border: 'none', background: colors.white, color: colors.matcha, fontFamily: "'Geologica', sans-serif", fontSize: '0.92rem', fontWeight: 600, cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'}}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8H13M13 8L9 4M13 8L9 12" stroke={colors.matcha} strokeWidth="1.6" strokeLinecap="round"/></svg>
                Создайте аккаунт бесплатно
              </button>
              <div style={{fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', marginTop: '10px', textAlign: 'center', fontWeight: 300}}>
                Оплата не требуется · Проверка в течение 24 часов
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer style={{background: colors.ink, padding: '64px 72px 0', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '48px'}}>
          <div>
            <a href="#" style={{display: 'flex', alignItems: 'center', gap: '10px', fontFamily: "'Cormorant Garamond', serif", fontSize: '1.4rem', fontWeight: 600, color: 'white', textDecoration: 'none', marginBottom: '14px'}}>
              <div style={{background: colors.matcha, width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                🏠
              </div>
              Roomate<span style={{color: colors.matchaMid}}>.kz</span>
            </a>
            <p style={{fontSize: '0.83rem', fontWeight: 300, color: 'rgba(255,255,255,0.38)', lineHeight: 1.8, marginBottom: '28px'}}>
              Первый в Казахстане умный сервис по подбору соседей по комнате. Подбор по образу жизни во всех 17 городах, с проверкой ИИН для безопасности.
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
{h: 'Жилье', links: ['Поиск комнат', 'Сдать жилье', 'Проверка совместимости', 'Безопасная сделка']},
{h: 'Локации', links: ['Алматы', 'Астана', 'Шымкент', 'Все города']},
{h: 'Ресурс', links: ['О проекте', 'Центр доверия', 'Полезные статьи', 'Поддержка']}
          ].map((col, i) => (
            <div key={i}>
              <h5 style={{fontFamily: "'Cormorant Garamond', serif", fontSize: '0.95rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: '20px', letterSpacing: '0.3px'}}>
                {col.h}
              </h5>
              <ul style={{listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px'}}>
                {col.links.map((link, j) => (
                  <li key={j}><a href="#" style={{textDecoration: 'none', color: 'rgba(255,255,255,0.3)', fontSize: '0.83rem', fontWeight: 300, transition: 'color 0.2s'}}>{link}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </footer>
        <div style={{background: colors.ink, padding: '0 72px 32px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', fontWeight: 300, color: 'rgba(255,255,255,0.18)', paddingTop: '20px'}}>
          <span>© 2026 Roomate.kz · Астана, Казахстан</span>
          <span>Политика конфиденциальности · Условия использования</span>
        </div>
      </div>
    </>
  );
}

export default HomePage;
