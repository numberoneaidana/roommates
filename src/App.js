import { useState, useEffect, useRef } from "react";
//import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import ApiClient from './api-client';
const api = new ApiClient();


// ── KAZAKHSTAN REGIONS ────────────────────────────────────────────────────────
const KZ_REGIONS = [
  { id: "almaty_city", name: "Алматы (город)", lat: 43.238, lng: 76.945 },
  { id: "astana", name: "Астана", lat: 51.18, lng: 71.446 },
  { id: "shymkent", name: "Шымкент", lat: 42.3, lng: 69.6 },
  { id: "almaty_region", name: "Алматинская область", lat: 45.0, lng: 78.0 },
  { id: "akmola", name: "Акмолинская область", lat: 51.5, lng: 70.0 },
  { id: "aktobe", name: "Актюбинская область", lat: 50.28, lng: 57.21 },
  { id: "atyrau", name: "Атырауская область", lat: 47.1, lng: 51.9 },
  { id: "east_kaz", name: "Восточно-Казахстанская область", lat: 49.97, lng: 82.6 },
  { id: "zhambyl", name: "Жамбылская область", lat: 42.9, lng: 71.4 },
  { id: "west_kaz", name: "Западно-Казахстанская область", lat: 51.2, lng: 51.4 },
  { id: "karaganda", name: "Карагандинская область", lat: 49.8, lng: 73.1 },
  { id: "kostanay", name: "Костанайская область", lat: 53.2, lng: 63.6 },
  { id: "kyzylorda", name: "Кызылординская область", lat: 44.85, lng: 65.5 },
  { id: "mangystau", name: "Мангистауская область", lat: 43.6, lng: 51.2 },
  { id: "north_kaz", name: "Северо-Казахстанская область", lat: 54.0, lng: 69.0 },
  { id: "pavlodar", name: "Павлодарская область", lat: 52.3, lng: 76.95 },
  { id: "turkestan", name: "Туркестанская область", lat: 41.3, lng: 68.3 },
  { id: "abai", name: "Область Абай", lat: 50.41, lng: 80.25 },
  { id: "zhetisu", name: "Область Жетісу", lat: 45.02, lng: 78.37 },
  { id: "ulytau", name: "Область Ұлытау", lat: 48.3, lng: 67.5 }
];

// ── MOCK DATA ─────────────────────────────────────────────────────────────────
const MOCK_PROFILES = [
  {
    id:1, name:"Айдана О.", age:23, avatar:"АС", gender:"female",
    region:"almaty_city",
    renterType:"looking", // "looking" or "has_place"
    budget:80000, move_in:"Март 2026", occupation:"Студентка",
    schedule:"Сова", cleanliness:4, social:3, pets:false, smoking:false,
    remote:false, religion:"Мусульманка", alcohol:false, guests:"Редко",
    studyWork:"Учёба", noise:"Тихая", languages:["Казахский","Русский"],
    tags:["📚 Студентка","🌸 Уютная","☕ Кофеман"],
    bio:"Студентка 3-го курса КазНУ. Тихая, аккуратная. Ищу соседку рядом с университетом.",
    verified:true, online:true, photos:["#e8a598","#d4b5a0","#c9a89a"],
  },
  {
    id:2, name:"Дана М.", age:26, avatar:"ДМ", gender:"female",
    region:"almaty_city",
    renterType:"has_place",
    address:"ул. Абая 150, кв. 45",
    budget:120000, move_in:"Апрель 2026", occupation:"Дизайнер",
    schedule:"Жаворонок", cleanliness:5, social:3, pets:false, smoking:false,
    remote:true, religion:"Нет", alcohol:false, guests:"Редко",
    studyWork:"Работа", noise:"Тихая", languages:["Русский","Английский"],
    tags:["🎨 Дизайнер","🏋️ Спорт","🌿 Эко"],
    bio:"UX-дизайнер, работаю удалённо. Очень чистоплотная, веду здоровый образ жизни.",
    verified:true, online:false, photos:["#b8a4d4","#a894c4","#9884b4"],
  },
  {
    id:3, name:"Мадина К.", age:29, avatar:"МК", gender:"female",
    region:"astana",
    budget:100000, move_in:"Февраль 2026", occupation:"Маркетолог",
    schedule:"Переменный", cleanliness:3, social:5, pets:true, smoking:false,
    remote:false, religion:"Мусульманка", alcohol:false, guests:"Часто",
    studyWork:"Работа", noise:"Умеренная", languages:["Казахский","Русский"],
    tags:["📣 Общительная","🐈 Кошатница","🎉 Активная"],
    bio:"Маркетолог в IT-компании. Люблю готовить и звать подруг. Есть кошка Мурзик.",
    verified:true, online:true, photos:["#a8c4a2","#96b490","#84a47e"],
  },
  {
    id:4, name:"Алина Т.", age:24, avatar:"АТ", gender:"female",
    region:"shymkent",
    budget:60000, move_in:"Март 2026", occupation:"Учительница",
    schedule:"Жаворонок", cleanliness:4, social:2, pets:false, smoking:false,
    remote:false, religion:"Мусульманка", alcohol:false, guests:"Никогда",
    studyWork:"Работа", noise:"Тихая", languages:["Казахский"],
    tags:["📖 Читает","🍳 Готовит","🧘 Йога"],
    bio:"Учительница начальных классов. Тихая жизнь, ранние подъёмы. Ищу тихую соседку.",
    verified:false, online:true, photos:["#c4d4a8","#b4c498","#a4b488"],
  },
  {
    id:5, name:"Жанар Б.", age:27, avatar:"ЖБ", gender:"female",
    region:"karaganda",
    budget:75000, move_in:"Май 2026", occupation:"Программист",
    schedule:"Сова", cleanliness:4, social:3, pets:false, smoking:false,
    remote:true, religion:"Нет", alcohol:false, guests:"Иногда",
    studyWork:"Работа", noise:"Тихая", languages:["Русский","Английский"],
    tags:["💻 IT","🎮 Геймер","🍕 Фудди"],
    bio:"Backend-разработчик, работаю удалённо. Тихая, чистоплотная. Люблю кино вечером.",
    verified:true, online:false, photos:["#8baed4","#7da1c4","#6e94b5"],
  },
  {
    id:6, name:"Камила Н.", age:22, avatar:"КН", gender:"female",
    region:"almaty_city",
    budget:90000, move_in:"Март 2026", occupation:"Студентка",
    schedule:"Переменный", cleanliness:3, social:4, pets:true, smoking:false,
    remote:false, religion:"Нет", alcohol:false, guests:"Иногда",
    studyWork:"Учёба", noise:"Умеренная", languages:["Казахский","Русский","Английский"],
    tags:["🎓 КазГЮУ","🐕 Собачница","🎵 Музыка"],
    bio:"Студентка юрфака. Очень общительная, есть маленькая собачка. Ищу соседку в Алматы.",
    verified:false, online:true, photos:["#d4c0a0","#c4b090","#b4a080"],
  },
  {
    id:7, name:"Расул А.", age:28, avatar:"РА", gender:"male",
    region:"astana",
    budget:110000, move_in:"Апрель 2026", occupation:"Инженер",
    schedule:"Жаворонок", cleanliness:5, social:2, pets:false, smoking:false,
    remote:false, religion:"Мусульманин", alcohol:false, guests:"Редко",
    studyWork:"Работа", noise:"Тихая", languages:["Казахский","Русский"],
    tags:["🏗️ Инженер","🏃 Бегун","📚 Читает"],
    bio:"Инженер-строитель. Чистоплотный, спокойный. Работаю с 8 до 17.",
    verified:true, online:false, photos:["#c4a882","#b89870","#ac8c64"],
  },
  {
    id:8, name:"Нурлан С.", age:31, avatar:"НС", gender:"male",
    region:"almaty_city",
    budget:130000, move_in:"Март 2026", occupation:"Врач",
    schedule:"Переменный", cleanliness:5, social:2, pets:false, smoking:false,
    remote:false, religion:"Нет", alcohol:false, guests:"Редко",
    studyWork:"Работа", noise:"Тихая", languages:["Казахский","Русский","Английский"],
    tags:["🏥 Врач","🚴 Велосипед","🌍 Путешествия"],
    bio:"Врач в городской больнице. Сменный график, иногда дежурю. Очень чистоплотный.",
    verified:true, online:true, photos:["#a0b8c4","#90a8b4","#8098a4"],
  },
];

// ── ICONS ─────────────────────────────────────────────────────────────────────
const Ic = ({ n, size=18, c="currentColor" }) => {
  const d = {
    home:<svg width={size} height={size} fill="none" stroke={c} strokeWidth="2" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    search:<svg width={size} height={size} fill="none" stroke={c} strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    map:<svg width={size} height={size} fill="none" stroke={c} strokeWidth="2" viewBox="0 0 24 24"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>,
    heart:<svg width={size} height={size} fill="none" stroke={c} strokeWidth="2" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>,
    heartFill:<svg width={size} height={size} fill={c} stroke={c} strokeWidth="2" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>,
    msg:<svg width={size} height={size} fill="none" stroke={c} strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
    user:<svg width={size} height={size} fill="none" stroke={c} strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    pin:<svg width={size} height={size} fill="none" stroke={c} strokeWidth="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>,
    check:<svg width={size} height={size} fill="none" stroke={c} strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>,
    x:<svg width={size} height={size} fill="none" stroke={c} strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    sliders:<svg width={size} height={size} fill="none" stroke={c} strokeWidth="2" viewBox="0 0 24 24"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>,
    grid:<svg width={size} height={size} fill="none" stroke={c} strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
    list:<svg width={size} height={size} fill="none" stroke={c} strokeWidth="2" viewBox="0 0 24 24"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
    send:<svg width={size} height={size} fill="none" stroke={c} strokeWidth="2" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
    logout:<svg width={size} height={size} fill="none" stroke={c} strokeWidth="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
    star:<svg width={size} height={size} fill={c} viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>,
    chevron:<svg width={size} height={size} fill="none" stroke={c} strokeWidth="2" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>,
    female:<svg width={size} height={size} fill="none" stroke={c} strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="8" r="5"/><line x1="12" y1="13" x2="12" y2="21"/><line x1="9" y1="18" x2="15" y2="18"/></svg>,
    male:<svg width={size} height={size} fill="none" stroke={c} strokeWidth="2" viewBox="0 0 24 24"><circle cx="10" cy="14" r="5"/><line x1="19" y1="5" x2="14.14" y2="9.86"/><polyline points="15 5 19 5 19 9"/></svg>,
    settings:<svg width={size} height={size} fill="none" stroke={c} strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
  };
  return d[n]||null;
};

// ── INJECT STYLES ─────────────────────────────────────────────────────────────
function injectStyles(){
  if(document.getElementById("kz-styles"))return;
  const s=document.createElement("style");
  s.id="kz-styles";
  s.textContent=`
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Nunito:wght@300;400;500;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
:root{
  --bg:#f0ebe3;
  --bg2:#e8e0d5;
  --card:#faf7f3;
  --accent:#3d7a5c;
  --accent2:#2e6048;
  --accent-light:#d4ead9;
  --warm:#c97d4a;
  --warm-light:#f0d5b8;
  --dark:#1e2a22;
  --mid:#4a5e52;
  --muted:#7d9080;
  --female:#d4587a;
  --female-light:#fce8ef;
  --male:#4a7abf;
  --male-light:#e8f0fc;
  --red:#c94a3a;
  --sh:0 4px 20px rgba(30,42,34,0.08);
  --sh2:0 12px 40px rgba(30,42,34,0.14);
  --r:18px;--rs:10px;
}
body{font-family:'Nunito',sans-serif;background:var(--bg);color:var(--dark);}
.app{min-height:100vh;display:flex;flex-direction:column;}

/* NAV */
.nav{background:var(--dark);padding:0 28px;display:flex;align-items:center;justify-content:space-between;height:64px;position:sticky;top:0;z-index:100;}
.nav-logo{font-family:'Cormorant Garamond',serif;font-size:26px;font-weight:700;color:#fff;letter-spacing:1px;}
.nav-logo span{color:var(--warm);}
.nav-links{display:flex;gap:2px;}
.nl{display:flex;align-items:center;gap:7px;padding:9px 15px;border-radius:var(--rs);border:none;background:transparent;font-family:'Nunito',sans-serif;font-size:13px;font-weight:600;cursor:pointer;transition:all .2s;color:rgba(255,255,255,.6);}
.nl:hover{background:rgba(255,255,255,.08);color:#fff;}
.nl.active{background:var(--accent);color:#fff;}
.nav-av{width:34px;height:34px;border-radius:50%;background:var(--warm);color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;cursor:pointer;border:none;}
.nav-right{display:flex;align-items:center;gap:10px;}

/* PAGE */
.page{flex:1;padding:28px 24px;max-width:1280px;margin:0 auto;width:100%;}
.ph{margin-bottom:28px;}
.pt{font-family:'Cormorant Garamond',serif;font-size:34px;font-weight:700;color:var(--dark);}
.ps{color:var(--muted);font-size:14px;margin-top:4px;}

/* CARDS */
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:20px;}
.card{background:var(--card);border-radius:var(--r);overflow:hidden;box-shadow:var(--sh);transition:all .3s;cursor:pointer;border:1.5px solid transparent;}
.card:hover{transform:translateY(-5px);box-shadow:var(--sh2);border-color:var(--accent);}
.card-hero{height:170px;display:flex;align-items:center;justify-content:center;position:relative;}
.card-av{width:76px;height:76px;border-radius:50%;background:rgba(255,255,255,.9);display:flex;align-items:center;justify-content:center;font-family:'Cormorant Garamond',serif;font-size:26px;font-weight:700;color:var(--dark);box-shadow:0 4px 16px rgba(0,0,0,.15);}
.online-dot{position:absolute;top:14px;right:14px;width:9px;height:9px;border-radius:50%;background:#4caf50;border:2px solid #fff;}
.verified-badge{position:absolute;top:12px;left:12px;background:rgba(255,255,255,.92);border-radius:20px;padding:3px 9px;font-size:11px;font-weight:700;color:var(--accent);display:flex;align-items:center;gap:3px;}
.gender-badge{position:absolute;bottom:12px;left:12px;border-radius:20px;padding:3px 9px;font-size:11px;font-weight:700;display:flex;align-items:center;gap:3px;}
.gender-f{background:var(--female-light);color:var(--female);}
.gender-m{background:var(--male-light);color:var(--male);}
.dist-badge{position:absolute;bottom:12px;right:12px;background:rgba(255,255,255,.9);border-radius:20px;padding:3px 9px;font-size:11px;font-weight:600;color:var(--dark);}
.cb{padding:18px;}
.cn{display:flex;align-items:center;justify-content:space-between;margin-bottom:3px;}
.cname{font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:600;}
.cprice{font-size:14px;font-weight:700;color:var(--accent);}
.cloc{color:var(--muted);font-size:12px;display:flex;align-items:center;gap:3px;margin-bottom:10px;}
.cbio{font-size:13px;color:var(--mid);line-height:1.5;margin-bottom:12px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
.tags{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:14px;}
.tag{font-size:11px;background:var(--bg2);border-radius:20px;padding:3px 9px;color:var(--mid);}
.cact{display:flex;gap:7px;}
.btn-like{flex:0 0 42px;height:42px;border-radius:var(--rs);border:1.5px solid var(--bg2);background:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .2s;}
.btn-like:hover,.btn-like.liked{border-color:var(--female);background:var(--female-light);}
.btn-msg{flex:1;height:42px;background:var(--accent);color:#fff;border:none;border-radius:var(--rs);font-family:'Nunito',sans-serif;font-size:13px;font-weight:700;cursor:pointer;transition:all .2s;display:flex;align-items:center;justify-content:center;gap:6px;}
.btn-msg:hover{background:var(--accent2);}
.btn-msg:disabled{background:var(--bg2);color:var(--muted);cursor:default;}

/* BUTTONS */
.btn-primary{width:100%;padding:14px;background:var(--accent);color:#fff;border:none;border-radius:var(--rs);font-family:'Nunito',sans-serif;font-size:15px;font-weight:700;cursor:pointer;transition:all .2s;position:relative;overflow:hidden;}
.btn-primary:hover{background:var(--accent2);transform:translateY(-1px);box-shadow:0 6px 18px rgba(61,122,92,.3);}
.btn-primary:active{transform:scale(0.98);}
.btn-primary.sending{animation:btnShake .7s ease;background:var(--accent2);}
@keyframes btnShake{
  0%,100%{transform:translateX(0) scale(1);}
  10%{transform:translateX(-4px) scale(0.98);}
  20%{transform:translateX(4px) scale(1.02);}
  30%{transform:translateX(-3px) scale(0.99);}
  40%{transform:translateX(3px) scale(1.01);}
  50%{transform:translateX(-2px) scale(1);}
  60%{transform:translateX(2px) scale(1);}
  70%{transform:translateX(0) scale(1);}
}
.btn-primary.sending::after{
  content:'✓';
  position:absolute;
  top:50%;
  left:50%;
  transform:translate(-50%,-50%) scale(0);
  font-size:32px;
  color:#fff;
  font-weight:700;
  animation:checkGrow .4s ease .35s forwards;
}
@keyframes checkGrow{
  0%{transform:translate(-50%,-50%) scale(0) rotate(-30deg);opacity:0;}
  50%{transform:translate(-50%,-50%) scale(1.4) rotate(10deg);opacity:1;}
  100%{transform:translate(-50%,-50%) scale(1) rotate(0);opacity:1;}
}
.btn-ghost{background:transparent;border:1.5px solid var(--bg2);color:var(--dark);padding:9px 18px;border-radius:var(--rs);font-family:'Nunito',sans-serif;font-size:13px;font-weight:600;cursor:pointer;transition:all .2s;}
.btn-ghost:hover{border-color:var(--accent);color:var(--accent);}

/* FILTERS */
.fbar{background:var(--card);border-radius:var(--r);padding:18px 22px;margin-bottom:24px;box-shadow:var(--sh);}
.ftop{display:flex;align-items:center;gap:12px;flex-wrap:wrap;}
.fsearch{flex:1;min-width:200px;position:relative;}
.fsearch input{width:100%;padding:11px 14px 11px 40px;border:1.5px solid var(--bg2);border-radius:var(--rs);font-family:'Nunito',sans-serif;font-size:13px;background:var(--bg);outline:none;transition:all .2s;color:var(--dark);}
.fsearch input:focus{background:#fff;border-color:var(--accent);}
.fsearch-ic{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--muted);}
.fsel{padding:11px 14px;border:1.5px solid var(--bg2);border-radius:var(--rs);font-family:'Nunito',sans-serif;font-size:13px;background:var(--bg);color:var(--dark);outline:none;cursor:pointer;transition:border-color .2s;}
.fsel:focus{border-color:var(--accent);background:#fff;}
.fexp{margin-top:16px;padding-top:16px;border-top:1px solid var(--bg2);display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:16px;}
.fg{display:flex;flex-direction:column;gap:6px;}
.fg label{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--muted);}
.frange{-webkit-appearance:none;width:100%;height:4px;border-radius:2px;background:var(--bg2);outline:none;cursor:pointer;}
.frange::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;border-radius:50%;background:var(--accent);cursor:pointer;box-shadow:0 2px 6px rgba(61,122,92,.4);}
.rv{font-size:13px;font-weight:700;color:var(--accent);}
.chip-row{display:flex;gap:6px;flex-wrap:wrap;}
.chip{padding:6px 12px;border-radius:20px;border:1.5px solid;font-size:12px;font-weight:600;cursor:pointer;transition:all .2s;}
.chip-off{border-color:var(--bg2);background:transparent;color:var(--mid);}
.chip-on{border-color:var(--accent);background:var(--accent);color:#fff;}
.chip-f-on{border-color:var(--female);background:var(--female);color:#fff;}
.vt{display:flex;border:1.5px solid var(--bg2);border-radius:var(--rs);overflow:hidden;}
.vb{padding:9px 12px;border:none;background:transparent;cursor:pointer;color:var(--muted);transition:all .2s;display:flex;align-items:center;}
.vb.active{background:var(--accent);color:#fff;}

/* TRAIT BAR */
.trait{display:flex;align-items:center;gap:8px;margin-bottom:7px;}
.tlabel{font-size:12px;color:var(--muted);width:110px;flex-shrink:0;}
.ttrack{flex:1;height:5px;background:var(--bg2);border-radius:3px;overflow:hidden;}
.tfill{height:100%;background:linear-gradient(90deg,var(--accent),var(--accent2));border-radius:3px;transition:width .4s;}

/* MODAL */
.overlay{position:fixed;inset:0;background:rgba(30,42,34,.65);backdrop-filter:blur(4px);z-index:300;display:flex;align-items:center;justify-content:center;padding:20px;animation:fi .2s;}
@keyframes fi{from{opacity:0}to{opacity:1}}
.modal{background:var(--card);border-radius:var(--r);width:100%;max-width:600px;max-height:92vh;overflow-y:auto;box-shadow:var(--sh2);animation:sc .2s;}
@keyframes sc{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
.mhero{height:210px;display:flex;align-items:center;justify-content:center;position:relative;}
.mav{width:96px;height:96px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;font-family:'Cormorant Garamond',serif;font-size:34px;font-weight:700;color:var(--dark);box-shadow:0 8px 24px rgba(0,0,0,.15);}
.mbody{padding:26px 30px 30px;}
.mname{font-family:'Cormorant Garamond',serif;font-size:28px;font-weight:700;margin-bottom:4px;}
.mmeta{display:flex;flex-wrap:wrap;gap:14px;color:var(--muted);font-size:13px;margin-bottom:18px;}
.mmi{display:flex;align-items:center;gap:5px;}
.msec{margin-bottom:22px;}
.mst{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--muted);margin-bottom:10px;}
.mclose{position:absolute;top:14px;right:14px;background:rgba(255,255,255,.88);border:none;border-radius:50%;width:34px;height:34px;cursor:pointer;display:flex;align-items:center;justify-content:center;}

/* MSG BOX */
.msgbox{background:var(--bg);border-radius:var(--rs);padding:16px;margin-bottom:14px;}
.msghead{font-size:13px;font-weight:700;color:var(--dark);margin-bottom:6px;display:flex;align-items:center;gap:6px;}
.msgnote{font-size:11px;color:var(--muted);margin-bottom:8px;}
.msgtxt{width:100%;border:1.5px solid var(--bg2);border-radius:var(--rs);padding:11px;font-family:'Nunito',sans-serif;font-size:13px;resize:none;outline:none;min-height:80px;transition:border-color .2s;background:#fff;}
.msgtxt:focus{border-color:var(--accent);}
.msgchar{font-size:11px;color:var(--muted);text-align:right;margin-top:3px;}
.msgsent{background:#e8f5e9;border:1.5px solid #a5d6a7;border-radius:var(--rs);padding:12px 16px;display:flex;align-items:center;gap:8px;color:var(--accent);font-size:13px;font-weight:600;}

/* MAP */
.map-wrap{border-radius:var(--r);overflow:hidden;box-shadow:var(--sh);border:1px solid var(--bg2);}
#kz-map{width:100%;height:500px;}
.leaflet-popup-content-wrapper{border-radius:12px!important;box-shadow:0 8px 24px rgba(0,0,0,.15)!important;}
.leaflet-popup-content{margin:0!important;padding:0!important;}
.map-popup{padding:14px 16px;min-width:200px;}
.map-popup-name{font-family:'Cormorant Garamond',serif;font-size:18px;font-weight:700;margin-bottom:2px;}
.map-popup-info{font-size:12px;color:var(--muted);margin-bottom:8px;}
.map-popup-btn{background:var(--accent);color:#fff;border:none;border-radius:8px;padding:8px 14px;font-family:'Nunito',sans-serif;font-size:12px;font-weight:700;cursor:pointer;width:100%;}

/* AUTH */
.auth-wrap{min-height:100vh;display:flex;align-items:stretch;background:var(--dark);}
.auth-left{flex:1;display:none;background:linear-gradient(160deg,var(--accent2),#1e3a2a);align-items:center;justify-content:center;padding:60px;flex-direction:column;gap:32px;}
@media(min-width:900px){.auth-left{display:flex;}.auth-right{max-width:480px;}}
.auth-right{flex:1;background:var(--bg);display:flex;align-items:center;justify-content:center;padding:40px 32px;overflow-y:auto;}
.auth-card{width:100%;max-width:440px;}
.auth-logo{font-family:'Cormorant Garamond',serif;font-size:36px;font-weight:700;color:var(--dark);margin-bottom:4px;}
.auth-logo span{color:var(--warm);}
.auth-sub{color:var(--muted);font-size:13px;margin-bottom:28px;}
.atabs{display:flex;gap:3px;background:var(--bg2);border-radius:var(--rs);padding:3px;margin-bottom:28px;}
.atab{flex:1;padding:9px;text-align:center;border:none;background:transparent;border-radius:8px;font-family:'Nunito',sans-serif;font-size:13px;font-weight:600;cursor:pointer;transition:all .2s;color:var(--muted);}
.atab.active{background:#fff;color:var(--dark);box-shadow:0 2px 8px rgba(0,0,0,.08);}
.fg-form{margin-bottom:16px;}
.fl{display:block;font-size:12px;font-weight:700;color:var(--mid);margin-bottom:6px;text-transform:uppercase;letter-spacing:.3px;}
.fi{width:100%;padding:12px 14px;border:1.5px solid var(--bg2);border-radius:var(--rs);font-family:'Nunito',sans-serif;font-size:14px;background:#fff;color:var(--dark);transition:border-color .2s;outline:none;}
.fi:focus{border-color:var(--accent);}
.reg-steps{display:flex;gap:6px;margin-bottom:24px;}
.reg-step{flex:1;height:3px;border-radius:2px;background:var(--bg2);transition:background .3s;}
.reg-step.done{background:var(--accent);}
.reg-step.active{background:var(--warm);}
.step-title{font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:600;margin-bottom:4px;}
.step-sub{font-size:13px;color:var(--muted);margin-bottom:20px;}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
.step-nav{display:flex;gap:10px;margin-top:20px;}
.btn-back{flex:0 0 auto;padding:13px 20px;background:var(--bg2);color:var(--mid);border:none;border-radius:var(--rs);font-family:'Nunito',sans-serif;font-size:14px;font-weight:700;cursor:pointer;}
.btn-next{flex:1;padding:13px;background:var(--accent);color:#fff;border:none;border-radius:var(--rs);font-family:'Nunito',sans-serif;font-size:14px;font-weight:700;cursor:pointer;transition:all .2s;}
.btn-next:hover{background:var(--accent2);}
.chip-sel{padding:7px 14px;border-radius:20px;border:1.5px solid var(--bg2);background:var(--bg);color:var(--mid);font-size:13px;font-weight:600;cursor:pointer;transition:all .2s;font-family:'Nunito',sans-serif;}
.chip-sel.on{border-color:var(--accent);background:var(--accent-light);color:var(--accent2);}

/* LIKED */
.match-item{background:var(--card);border-radius:var(--rs);padding:14px 18px;display:flex;align-items:center;gap:14px;box-shadow:var(--sh);cursor:pointer;transition:all .2s;border:1.5px solid transparent;margin-bottom:10px;}
.match-item:hover{border-color:var(--accent);transform:translateX(4px);}
.mat-av{width:50px;height:50px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'Cormorant Garamond',serif;font-size:18px;font-weight:700;color:var(--dark);flex-shrink:0;}

/* PROFILE */
.prof-card{background:var(--card);border-radius:var(--r);padding:28px 32px;box-shadow:var(--sh);margin-bottom:20px;}
.prof-av{width:88px;height:88px;border-radius:50%;background:var(--accent);display:flex;align-items:center;justify-content:center;font-family:'Cormorant Garamond',serif;font-size:30px;font-weight:700;color:#fff;margin:0 auto 20px;}
.sec-title{font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:600;margin-bottom:18px;}
.badge{display:inline-flex;align-items:center;gap:5px;padding:5px 12px;border-radius:20px;font-size:12px;font-weight:600;}
.badge-g{background:var(--accent-light);color:var(--accent2);}
.badge-r{background:#fce8e6;color:var(--red);}
.badge-b{background:var(--male-light);color:var(--male);}
.stat-row{display:flex;gap:14px;flex-wrap:wrap;margin-bottom:24px;}
.stat-c{flex:1;min-width:88px;background:var(--card);border-radius:var(--rs);padding:14px;text-align:center;box-shadow:var(--sh);}
.stat-n{font-family:'Cormorant Garamond',serif;font-size:28px;font-weight:700;color:var(--accent);}
.stat-l{font-size:11px;color:var(--muted);margin-top:3px;}
.empty{text-align:center;padding:56px 20px;color:var(--muted);}
.empty-ic{font-size:46px;margin-bottom:14px;}
.empty-t{font-family:'Cormorant Garamond',serif;font-size:24px;color:var(--dark);margin-bottom:6px;}

/* LIST VIEW */
.list-item{background:var(--card);border-radius:var(--rs);padding:14px 18px;display:flex;align-items:center;gap:14px;box-shadow:var(--sh);cursor:pointer;transition:all .2s;border:1.5px solid transparent;margin-bottom:10px;}
.list-item:hover{border-color:var(--accent);}

/* responsive */
/* SWIPE CARD */
.swipe-card{
  background:var(--card);
  border-radius:var(--r);
  overflow:hidden;
  box-shadow:0 20px 60px rgba(30,42,34,.15);
  border:1.5px solid rgba(61,122,92,.1);
  transition:all .3s;
}
.swipe-card:hover{
  box-shadow:0 24px 70px rgba(30,42,34,.2);
  transform:translateY(-2px);
}
.swipe-hero{
  height:460px;
  display:flex;
  align-items:center;
  justify-content:center;
  position:relative;
  background-size:cover;
  background-position:center;
}
.swipe-actions{
  display:flex;
  gap:18px;
  justify-content:center;
  align-items:center;
  margin-top:28px;
}
.swipe-btn{
  display:flex;
  align-items:center;
  justify-content:center;
  border-radius:50%;
  cursor:pointer;
  transition:all .2s;
  box-shadow:0 6px 20px rgba(0,0,0,.1);
  border:none;
  position:relative;
}
.swipe-btn:hover{
  transform:scale(1.08);
  box-shadow:0 8px 28px rgba(0,0,0,.15);
}
.swipe-btn:active{
  transform:scale(0.98);
}
.swipe-btn-pass{
  width:72px;
  height:72px;
  background:linear-gradient(135deg,#fff,#fafafa);
  border:3px solid var(--red);
  color:var(--red);
  font-size:36px;
  font-weight:700;
}
.swipe-btn-pass:hover{
  background:var(--red);
  color:#fff;
}
.swipe-btn-info{
  width:60px;
  height:60px;
  background:linear-gradient(135deg,var(--accent-light),#c8e4d4);
  border:2px solid var(--accent);
}
.swipe-btn-info:hover{
  background:var(--accent);
}
.swipe-btn-like{
  width:72px;
  height:72px;
  background:linear-gradient(135deg,var(--female-light),#fbe0e8);
  border:3px solid var(--female);
}
.swipe-btn-like:hover{
  background:var(--female);
}
.swipe-detail-grid{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:12px;
  margin-bottom:28px;
}
.swipe-detail-item{
  background:linear-gradient(135deg,var(--bg),#f5f1ea);
  border-radius:var(--rs);
  padding:14px 16px;
  border:1px solid rgba(61,122,92,.08);
  transition:all .2s;
}
.swipe-detail-item:hover{
  border-color:var(--accent);
  transform:translateY(-1px);
}
.swipe-detail-label{
  font-size:10px;
  color:var(--muted);
  font-weight:700;
  text-transform:uppercase;
  letter-spacing:.8px;
  margin-bottom:5px;
}
.swipe-detail-value{
  font-size:14px;
  font-weight:700;
  color:var(--dark);
}

/* MODERN CHAT INTERFACE */
.chat-panel{
  width:420px;
  flex-shrink:0;
  background:#fff;
  border-radius:20px;
  box-shadow:0 8px 40px rgba(30,42,34,.12);
  display:flex;
  flex-direction:column;
  height:680px;
  overflow:hidden;
  border:1px solid rgba(61,122,92,.08);
}
.chat-head{
  padding:20px 24px;
  background:linear-gradient(135deg,var(--accent),var(--accent2));
  display:flex;
  align-items:center;
  gap:16px;
  position:relative;
}
.chat-head::after{
  content:'';
  position:absolute;
  bottom:-10px;
  left:0;
  right:0;
  height:10px;
  background:linear-gradient(180deg,rgba(61,122,92,.05),transparent);
}
.chat-head-av{
  width:48px;
  height:48px;
  border-radius:14px;
  display:flex;
  align-items:center;
  justify-content:center;
  font-family:'Cormorant Garamond',serif;
  font-size:18px;
  font-weight:700;
  flex-shrink:0;
  box-shadow:0 4px 12px rgba(0,0,0,.15);
  border:3px solid rgba(255,255,255,.3);
  position:relative;
}
.chat-head-av::after{
  content:'';
  position:absolute;
  bottom:-2px;
  right:-2px;
  width:14px;
  height:14px;
  background:#4caf50;
  border-radius:50%;
  border:2px solid var(--accent);
}
.chat-head-info{flex:1;}
.chat-head-name{
  font-weight:700;
  font-size:17px;
  color:#fff;
  margin-bottom:2px;
  text-shadow:0 1px 2px rgba(0,0,0,.1);
}
.chat-head-status{
  font-size:12px;
  color:rgba(255,255,255,.85);
  display:flex;
  align-items:center;
  gap:4px;
}
.chat-head-close{
  background:rgba(255,255,255,.15);
  border:none;
  border-radius:10px;
  width:36px;
  height:36px;
  display:flex;
  align-items:center;
  justify-content:center;
  cursor:pointer;
  transition:all .2s;
  backdrop-filter:blur(10px);
}
.chat-head-close:hover{
  background:rgba(255,255,255,.25);
  transform:scale(1.05);
}
.match-banner{
  background:linear-gradient(135deg,#fef3c7,#fde68a);
  border:none;
  padding:14px 20px;
  display:flex;
  align-items:center;
  gap:10px;
  font-size:13px;
  font-weight:700;
  color:#92400e;
  margin:16px 16px 0;
  border-radius:14px;
  box-shadow:0 2px 8px rgba(245,158,11,.15);
}
.match-banner-icon{
  width:32px;
  height:32px;
  background:linear-gradient(135deg,#fbbf24,#f59e0b);
  border-radius:10px;
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:16px;
  flex-shrink:0;
}
.chat-msgs{
  flex:1;
  overflow-y:auto;
  padding:20px;
  display:flex;
  flex-direction:column;
  gap:12px;
  background:linear-gradient(180deg,#fafaf9,#f5f5f4);
}
.chat-msgs::-webkit-scrollbar{width:6px;}
.chat-msgs::-webkit-scrollbar-track{background:transparent;}
.chat-msgs::-webkit-scrollbar-thumb{
  background:linear-gradient(180deg,#d1d5db,#9ca3af);
  border-radius:10px;
}
.chat-msgs::-webkit-scrollbar-thumb:hover{background:#6b7280;}
.bw{
  display:flex;
  gap:10px;
  align-items:flex-end;
  animation:slideIn .3s ease;
}
@keyframes slideIn{
  from{opacity:0;transform:translateY(10px);}
  to{opacity:1;transform:translateY(0);}
}
.bw.me{flex-direction:row-reverse;}
.bav{
  width:32px;
  height:32px;
  border-radius:12px;
  display:flex;
  align-items:center;
  justify-content:center;
  font-family:'Cormorant Garamond',serif;
  font-size:13px;
  font-weight:700;
  flex-shrink:0;
  box-shadow:0 2px 8px rgba(0,0,0,.08);
}
.bubble{
  max-width:75%;
  padding:12px 16px;
  border-radius:18px;
  font-size:14px;
  line-height:1.6;
  word-break:break-word;
  position:relative;
}
.bubble.them{
  background:#fff;
  color:var(--dark);
  border-bottom-left-radius:6px;
  box-shadow:0 2px 12px rgba(0,0,0,.06);
  border:1px solid rgba(0,0,0,.04);
}
.bubble.me{
  background:linear-gradient(135deg,var(--accent),#2d6a4f);
  color:#fff;
  border-bottom-right-radius:6px;
  box-shadow:0 4px 16px rgba(61,122,92,.25);
}
.btime{
  font-size:10px;
  margin-top:4px;
  color:var(--muted);
  display:flex;
  align-items:center;
  gap:3px;
}
.bw.me .btime{
  justify-content:flex-end;
  color:rgba(255,255,255,.7);
}
.typing{
  display:flex;
  gap:5px;
  align-items:center;
  padding:12px 16px;
  background:#fff;
  border-radius:18px;
  border-bottom-left-radius:6px;
  box-shadow:0 2px 12px rgba(0,0,0,.06);
  width:fit-content;
  border:1px solid rgba(0,0,0,.04);
}
.td{
  width:8px;
  height:8px;
  border-radius:50%;
  background:linear-gradient(135deg,var(--accent),var(--accent2));
  animation:bop 1.4s infinite ease-in-out;
}
.td:nth-child(2){animation-delay:.2s;}
.td:nth-child(3){animation-delay:.4s;}
@keyframes bop{
  0%,60%,100%{transform:translateY(0) scale(1);}
  30%{transform:translateY(-8px) scale(1.1);}
}
.typing-text{
  font-size:11px;
  color:var(--muted);
  margin-left:4px;
  font-style:italic;
}
.no-chat{
  flex:1;
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;
  color:var(--muted);
  gap:14px;
  padding:40px 30px;
  text-align:center;
}
.no-chat-icon{
  width:72px;
  height:72px;
  background:linear-gradient(135deg,var(--accent-light),#d1e7dd);
  border-radius:20px;
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:36px;
  margin-bottom:8px;
  box-shadow:0 4px 16px rgba(61,122,92,.15);
}
.no-chat-title{
  font-family:'Cormorant Garamond',serif;
  font-size:20px;
  font-weight:700;
  color:var(--dark);
}
.no-chat-subtitle{
  font-size:13px;
  color:var(--muted);
  line-height:1.6;
}
.chat-inp-row{
  padding:16px 20px;
  border-top:1px solid rgba(0,0,0,.06);
  display:flex;
  gap:10px;
  align-items:flex-end;
  background:#fff;
}
.chat-inp{
  flex:1;
  border:2px solid var(--bg2);
  border-radius:16px;
  padding:12px 18px;
  font-family:'Nunito',sans-serif;
  font-size:14px;
  resize:none;
  outline:none;
  max-height:120px;
  overflow-y:auto;
  transition:all .2s;
  background:#fafafa;
  line-height:1.5;
}
.chat-inp:focus{
  border-color:var(--accent);
  background:#fff;
  box-shadow:0 0 0 4px rgba(61,122,92,.08);
}
.chat-inp::placeholder{color:#9ca3af;}
.chat-send{
  width:46px;
  height:46px;
  border-radius:14px;
  background:linear-gradient(135deg,var(--accent),var(--accent2));
  border:none;
  display:flex;
  align-items:center;
  justify-content:center;
  cursor:pointer;
  transition:all .2s;
  flex-shrink:0;
  position:relative;
  box-shadow:0 4px 16px rgba(61,122,92,.25);
}
.chat-send:hover:not(:disabled){
  transform:translateY(-2px) scale(1.05);
  box-shadow:0 6px 24px rgba(61,122,92,.35);
}
.chat-send:disabled{
  background:linear-gradient(135deg,#e5e7eb,#d1d5db);
  cursor:default;
  transform:scale(1);
  box-shadow:none;
}
.chat-send:active:not(:disabled){animation:sendPulse .4s ease;}
@keyframes sendPulse{
  0%{transform:scale(1);}
  50%{transform:scale(0.88) rotate(-5deg);}
  100%{transform:scale(1) rotate(0deg);}
}
.chat-send.sending{animation:sending .6s ease;}
@keyframes sending{
  0%,100%{transform:scale(1) rotate(0deg);}
  25%{transform:scale(0.92) rotate(-12deg);}
  50%{transform:scale(1.08) rotate(12deg);}
  75%{transform:scale(0.96) rotate(-6deg);}
}

/* MATCH ITEMS IN FAVORITES */
.mi{
  background:#fff;
  border-radius:16px;
  padding:16px 18px;
  display:flex;
  align-items:flex-start;
  gap:14px;
  box-shadow:0 2px 12px rgba(0,0,0,.06);
  cursor:pointer;
  transition:all .25s cubic-bezier(0.4,0,0.2,1);
  border:2px solid transparent;
  margin-bottom:12px;
  position:relative;
  overflow:hidden;
}
.mi::before{
  content:'';
  position:absolute;
  top:0;
  left:0;
  right:0;
  height:3px;
  background:linear-gradient(90deg,var(--accent),var(--accent2));
  transform:scaleX(0);
  transition:transform .3s;
}
.mi:hover{
  border-color:var(--accent);
  transform:translateX(4px) translateY(-2px);
  box-shadow:0 8px 24px rgba(0,0,0,.12);
}
.mi:hover::before{transform:scaleX(1);}
.mi.sel{
  border-color:var(--accent);
  background:linear-gradient(135deg,#f0fdf4,var(--accent-light));
  box-shadow:0 8px 24px rgba(61,122,92,.15);
}
.mi.sel::before{transform:scaleX(1);}
.mat-av{
  width:56px;
  height:56px;
  border-radius:14px;
  display:flex;
  align-items:center;
  justify-content:center;
  font-family:'Cormorant Garamond',serif;
  font-size:20px;
  font-weight:700;
  color:var(--dark);
  flex-shrink:0;
  position:relative;
  box-shadow:0 4px 12px rgba(0,0,0,.08);
}
.sent-preview{
  background:linear-gradient(135deg,#f5f5f4,#e7e5e4);
  border-radius:12px;
  padding:10px 14px;
  font-size:13px;
  color:var(--mid);
  margin-top:8px;
  border-left:4px solid var(--accent);
  font-style:italic;
  word-break:break-word;
  line-height:1.5;
}
.liked-layout{
  display:flex;
  gap:24px;
  align-items:flex-start;
}
.liked-list{
  flex:1;
  min-width:0;
}

@media(max-width:768px){
  .page{padding:16px 14px;}
  .ftop{flex-direction:column;}
  .fsearch{width:100%;}
  .grid{grid-template-columns:1fr;}
  .nav{padding:0 14px;}
  .nl span{display:none;}
  .auth-right{padding:28px 20px;}
  .grid2{grid-template-columns:1fr;}
  .mbody{padding:18px 20px 22px;}
}
  `;
  document.head.appendChild(s);
}
// Формула Гаверсинуса для расчета расстояния в км между двумя точками
const getDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371; // Радиус Земли в километрах
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};
const profilesWithCoords = MOCK_PROFILES.map(p => {
  const regionData = KZ_REGIONS.find(r => r.id === p.region);
  return {
    ...p,
    lat: p.lat || regionData?.lat,
    lng: p.lng || regionData?.lng
  };
});
// ── SWIPE TAB (TINDER STYLE) ─────────────────────────────────────────────────
function SwipeTab({ profiles, onLike, onPass, onViewProfile }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState(null);

  if (!profiles || profiles.length === 0) {
    return (
      <div className="page">
        <div className="empty" style={{paddingTop:"80px"}}>
          <div className="empty-ic" style={{fontSize:"64px"}}>🎉</div>
          <div className="empty-t">Вы просмотрели всех!</div>
          <p>Попробуйте изменить фильтры или вернитесь позже</p>
        </div>
      </div>
    );
  }

  const currentProfile = profiles[currentIndex];
  if (!currentProfile) {
    return (
      <div className="page">
        <div className="empty" style={{paddingTop:"80px"}}>
          <div className="empty-ic" style={{fontSize:"64px"}}>🎉</div>
          <div className="empty-t">Вы просмотрели всех!</div>
          <button className="btn-primary" style={{marginTop:"20px"}} onClick={() => setCurrentIndex(0)}>
            Начать сначала
          </button>
        </div>
      </div>
    );
  }
  
  const reg = KZ_REGIONS.find(r => r.id === currentProfile.region);

  const handleLike = () => {
    setSwipeDirection('right');
    setTimeout(() => {
      onLike(currentProfile);
      setCurrentIndex(prev => prev + 1);
      setSwipeDirection(null);
    }, 300);
  };

  const handlePass = () => {
    setSwipeDirection('left');
    setTimeout(() => {
      onPass(currentProfile);
      setCurrentIndex(prev => prev + 1);
      setSwipeDirection(null);
    }, 300);
  };

  return (
    <div className="page" style={{
      display:"flex",
      alignItems:"center",
      justifyContent:"center",
      minHeight:"calc(100vh - 64px)",
      background:"linear-gradient(135deg, #fafaf9 0%, #f5f1ea 100%)",
      padding:"40px 20px"
    }}>
      <div style={{maxWidth:"460px",width:"100%",position:"relative"}}>
        
        {/* Progress Bar */}
        <div style={{
          marginBottom:"24px",
          background:"rgba(255,255,255,.6)",
          borderRadius:"16px",
          padding:"16px 20px",
          backdropFilter:"blur(10px)",
          boxShadow:"0 4px 20px rgba(0,0,0,.06)"
        }}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"10px"}}>
            <span style={{fontSize:"13px",fontWeight:"700",color:"var(--dark)"}}>
              Анкета {currentIndex + 1} из {profiles.length}
            </span>
            <span style={{fontSize:"12px",color:"var(--muted)"}}>
              {Math.round(((currentIndex + 1) / profiles.length) * 100)}%
            </span>
          </div>
          <div style={{
            width:"100%",
            height:"6px",
            background:"var(--bg2)",
            borderRadius:"10px",
            overflow:"hidden"
          }}>
            <div style={{
              width:`${((currentIndex + 1) / profiles.length) * 100}%`,
              height:"100%",
              background:"linear-gradient(90deg, var(--accent), var(--accent2))",
              borderRadius:"10px",
              transition:"width .3s ease"
            }}/>
          </div>
        </div>

        {/* Swipe Card */}
        <div className={`modern-swipe-card ${swipeDirection ? `swipe-${swipeDirection}` : ''}`} style={{
          background:"#fff",
          borderRadius:"24px",
          overflow:"hidden",
          boxShadow:"0 12px 48px rgba(0,0,0,.15)",
          transition:"all .3s ease"
        }}>
          {/* Hero Section with Gradient Overlay */}
          <div style={{
            height:"480px",
            position:"relative",
            borderRadius:"24px 24px 0 0",
            overflow:"hidden",
            background:`linear-gradient(160deg,${currentProfile.photos[0]},${currentProfile.photos[2]})`,
          }}>
            {/* Gradient Overlay for readability */}
            <div style={{
              position:"absolute",
              bottom:0,
              left:0,
              right:0,
              height:"50%",
              background:"linear-gradient(to top, rgba(0,0,0,.7), transparent)",
              pointerEvents:"none"
            }}/>
            
            {/* Status Badges */}
            <div style={{position:"absolute",top:"20px",left:"20px",display:"flex",gap:"8px",flexWrap:"wrap"}}>
              {currentProfile.online && (
                <div style={{
                  background:"rgba(76,175,80,.95)",
                  backdropFilter:"blur(10px)",
                  color:"#fff",
                  padding:"6px 12px",
                  borderRadius:"20px",
                  fontSize:"12px",
                  fontWeight:"700",
                  display:"flex",
                  alignItems:"center",
                  gap:"5px",
                  boxShadow:"0 4px 12px rgba(0,0,0,.2)"
                }}>
                  <span style={{width:"6px",height:"6px",borderRadius:"50%",background:"#fff"}}/>
                  Онлайн
                </div>
              )}
              {currentProfile.verified && (
                <div style={{
                  background:"rgba(61,122,92,.95)",
                  backdropFilter:"blur(10px)",
                  color:"#fff",
                  padding:"6px 12px",
                  borderRadius:"20px",
                  fontSize:"12px",
                  fontWeight:"700",
                  display:"flex",
                  alignItems:"center",
                  gap:"5px",
                  boxShadow:"0 4px 12px rgba(0,0,0,.2)"
                }}>
                  <Ic n="check" size={12} c="#fff"/>
                  Верифицирован
                </div>
              )}
              {currentProfile.renterType && (
                <div style={{
                  background:currentProfile.renterType==="has_place"?"rgba(251,191,36,.95)":"rgba(14,165,233,.95)",
                  backdropFilter:"blur(10px)",
                  color:"#fff",
                  padding:"6px 12px",
                  borderRadius:"20px",
                  fontSize:"12px",
                  fontWeight:"700",
                  boxShadow:"0 4px 12px rgba(0,0,0,.2)"
                }}>
                  {currentProfile.renterType==="has_place"?"🏠 Есть жильё":"🔍 Ищет"}
                </div>
              )}
            </div>

            {/* Main Info Overlay */}
            <div style={{
              position:"absolute",
              bottom:"20px",
              left:"20px",
              right:"20px",
              color:"#fff"
            }}>
              <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",marginBottom:"12px"}}>
                <div>
                  <h1 style={{
                    fontFamily:"Cormorant Garamond",
                    fontSize:"38px",
                    fontWeight:"700",
                    margin:0,
                    textShadow:"0 2px 12px rgba(0,0,0,.5)",
                    lineHeight:"1.1"
                  }}>
                    {currentProfile.name}
                  </h1>
                  <div style={{
                    fontSize:"22px",
                    fontWeight:"600",
                    marginTop:"4px",
                    opacity:".95",
                    textShadow:"0 1px 8px rgba(0,0,0,.5)"
                  }}>
                    {currentProfile.age} лет
                  </div>
                </div>
                <div style={{
                  background:"rgba(255,255,255,.25)",
                  backdropFilter:"blur(10px)",
                  padding:"10px 16px",
                  borderRadius:"16px",
                  fontWeight:"700",
                  fontSize:"18px",
                  textShadow:"0 1px 4px rgba(0,0,0,.3)"
                }}>
                  {currentProfile.budget.toLocaleString()} ₸
                </div>
              </div>
              
              <div style={{
                display:"flex",
                alignItems:"center",
                gap:"6px",
                fontSize:"14px",
                opacity:".9",
                textShadow:"0 1px 6px rgba(0,0,0,.5)"
              }}>
                <Ic n="pin" size={14} c="#fff"/>
                {reg?.name || currentProfile.region}
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div style={{padding:"28px",background:"#fff"}}>
            {/* Bio */}
            <p style={{
              fontSize:"16px",
              lineHeight:"1.7",
              color:"var(--dark)",
              marginBottom:"20px",
              fontWeight:"400"
            }}>
              {currentProfile.bio}
            </p>

            {/* Tags */}
            <div style={{display:"flex",flexWrap:"wrap",gap:"8px",marginBottom:"24px"}}>
              {currentProfile.tags.map(t => (
                <span key={t} style={{
                  background:"linear-gradient(135deg, #f0fdf4, var(--accent-light))",
                  color:"var(--accent2)",
                  padding:"8px 14px",
                  borderRadius:"12px",
                  fontSize:"13px",
                  fontWeight:"600",
                  border:"1px solid var(--accent)"
                }}>
                  {t}
                </span>
              ))}
            </div>

            {/* Quick Stats Grid */}
            <div style={{
              display:"grid",
              gridTemplateColumns:"1fr 1fr",
              gap:"12px",
              marginBottom:"28px"
            }}>
              <div style={{
                background:"linear-gradient(135deg, #fafaf9, #f5f1ea)",
                padding:"14px 16px",
                borderRadius:"14px",
                border:"1px solid rgba(0,0,0,.06)"
              }}>
                <div style={{fontSize:"11px",fontWeight:"700",color:"var(--muted)",marginBottom:"4px",textTransform:"uppercase",letterSpacing:".5px"}}>
                  Профессия
                </div>
                <div style={{fontSize:"14px",fontWeight:"700",color:"var(--dark)"}}>
                  {currentProfile.occupation}
                </div>
              </div>
              <div style={{
                background:"linear-gradient(135deg, #fafaf9, #f5f1ea)",
                padding:"14px 16px",
                borderRadius:"14px",
                border:"1px solid rgba(0,0,0,.06)"
              }}>
                <div style={{fontSize:"11px",fontWeight:"700",color:"var(--muted)",marginBottom:"4px",textTransform:"uppercase",letterSpacing:".5px"}}>
                  Заезд
                </div>
                <div style={{fontSize:"14px",fontWeight:"700",color:"var(--dark)"}}>
                  {currentProfile.move_in}
                </div>
              </div>
              <div style={{
                background:"linear-gradient(135deg, #fafaf9, #f5f1ea)",
                padding:"14px 16px",
                borderRadius:"14px",
                border:"1px solid rgba(0,0,0,.06)"
              }}>
                <div style={{fontSize:"11px",fontWeight:"700",color:"var(--muted)",marginBottom:"4px",textTransform:"uppercase",letterSpacing:".5px"}}>
                  График
                </div>
                <div style={{fontSize:"14px",fontWeight:"700",color:"var(--dark)"}}>
                  {currentProfile.schedule}
                </div>
              </div>
              <div style={{
                background:"linear-gradient(135deg, #fafaf9, #f5f1ea)",
                padding:"14px 16px",
                borderRadius:"14px",
                border:"1px solid rgba(0,0,0,.06)"
              }}>
                <div style={{fontSize:"11px",fontWeight:"700",color:"var(--muted)",marginBottom:"4px",textTransform:"uppercase",letterSpacing:".5px"}}>
                  Чистота
                </div>
                <div style={{fontSize:"14px",fontWeight:"700",color:"var(--dark)",display:"flex",alignItems:"center",gap:"4px"}}>
                  {currentProfile.cleanliness}/5 
                  <span style={{color:"#f59e0b"}}>⭐</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{display:"flex",justifyContent:"center",gap:"20px",alignItems:"center"}}>
              <button 
                onClick={handlePass}
                style={{
                  width:"70px",
                  height:"70px",
                  fontSize:"32px",
                  background:"#fff",
                  border:"3px solid #ef4444",
                  color:"#ef4444",
                  borderRadius:"50%",
                  cursor:"pointer",
                  transition:"all .2s",
                  boxShadow:"0 6px 20px rgba(239,68,68,.2)",
                  display:"flex",
                  alignItems:"center",
                  justifyContent:"center"
                }}
                onMouseEnter={e => {e.currentTarget.style.background="#ef4444";e.currentTarget.style.color="#fff";e.currentTarget.style.transform="scale(1.08)";}}
                onMouseLeave={e => {e.currentTarget.style.background="#fff";e.currentTarget.style.color="#ef4444";e.currentTarget.style.transform="scale(1)";}}
              >
                ✕
              </button>

              <button
                onClick={() => onViewProfile(currentProfile)}
                style={{
                  width:"60px",
                  height:"60px",
                  background:"linear-gradient(135deg, var(--accent), var(--accent2))",
                  border:"none",
                  borderRadius:"50%",
                  cursor:"pointer",
                  transition:"all .2s",
                  boxShadow:"0 6px 20px rgba(61,122,92,.25)",
                  display:"flex",
                  alignItems:"center",
                  justifyContent:"center"
                }}
                onMouseEnter={e => e.currentTarget.style.transform="scale(1.08)"}
                onMouseLeave={e => e.currentTarget.style.transform="scale(1)"}
              >
                <Ic n="user" size={24} c="#fff"/>
              </button>

              <button 
                onClick={handleLike}
                style={{
                  width:"70px",
                  height:"70px",
                  fontSize:"32px",
                  background:"linear-gradient(135deg, #f472b6, #ec4899)",
                  border:"none",
                  borderRadius:"50%",
                  cursor:"pointer",
                  transition:"all .2s",
                  boxShadow:"0 6px 20px rgba(236,72,153,.3)",
                  display:"flex",
                  alignItems:"center",
                  justifyContent:"center"
                }}
                onMouseEnter={e => e.currentTarget.style.transform="scale(1.08)"}
                onMouseLeave={e => e.currentTarget.style.transform="scale(1)"}
              >
                <Ic n="heart" size={32} c="#fff"/>
              </button>
            </div>

            {/* Keyboard Hint */}
            <div style={{
              textAlign:"center",
              marginTop:"20px",
              fontSize:"12px",
              color:"var(--muted)",
              display:"flex",
              justifyContent:"center",
              gap:"16px"
            }}>
              <span>← Пропустить</span>
              <span>↑ Профиль</span>
              <span>→ Лайк</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



// ── LEAFLET MAP ───────────────────────────────────────────────────────────────
// ── ADDRESS MAP SELECTOR (for registration) ──────────────────────────────────
function AddressMapSelector({ address, lat, lng, region, onAddressChange, onLocationChange }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const [isGeocoding, setIsGeocoding] = useState(false);

  useEffect(() => {
    if (mapInstanceRef.current) return;

    const loadLeaflet = () => {
      if (!mapRef.current || mapInstanceRef.current) return;
      const L = window.L;

      // Get region center
      const regionData = KZ_REGIONS.find(r => r.id === region);
      const center = lat && lng ? [lat, lng] : regionData ? [regionData.lat, regionData.lng] : [43.238, 76.945];
      const zoom = lat && lng ? 15 : 12;

      const map = L.map(mapRef.current, {
        center: center,
        zoom: zoom,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© OpenStreetMap',
        maxZoom: 18,
      }).addTo(map);

      mapInstanceRef.current = map;

      // Click to select location
      map.on('click', async (e) => {
        const { lat, lng } = e.latlng;
        
        // Update marker
        if (markerRef.current) {
          markerRef.current.remove();
        }
        
        markerRef.current = L.marker([lat, lng], {
          icon: L.divIcon({
            className: '',
            html: `<div style="background:#f59e0b;color:white;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 4px 16px rgba(0,0,0,.3);border:3px solid #fef3c7;">🏠</div>`,
            iconSize: [36, 36],
            iconAnchor: [18, 36],
          })
        }).addTo(map);

        onLocationChange(lat, lng);

        // Reverse geocode to get address
        setIsGeocoding(true);
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ru`
          );
          const data = await response.json();
          
          if (data.address) {
            const addr = data.address;
            let addressString = '';
            
            if (addr.road) addressString += addr.road;
            if (addr.house_number) addressString += ' ' + addr.house_number;
            if (!addressString && addr.neighbourhood) addressString += addr.neighbourhood;
            if (!addressString && addr.suburb) addressString += addr.suburb;
            
            if (addressString) {
              onAddressChange(addressString);
            }
          }
        } catch (error) {
          console.log('Geocoding error:', error);
        } finally {
          setIsGeocoding(false);
        }
      });

      // If coordinates exist, show marker
      if (lat && lng) {
        markerRef.current = L.marker([lat, lng], {
          icon: L.divIcon({
            className: '',
            html: `<div style="background:#f59e0b;color:white;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 4px 16px rgba(0,0,0,.3);border:3px solid #fef3c7;">🏠</div>`,
            iconSize: [36, 36],
            iconAnchor: [18, 36],
          })
        }).addTo(map);
      }
    };

    if (window.L) {
      loadLeaflet();
    } else {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
      script.onload = loadLeaflet;
      document.body.appendChild(script);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [region, lat, lng, onAddressChange, onLocationChange]);

  // Update marker when coordinates change externally
  useEffect(() => {
    onLocationChange?.(lat, lng);
    if (!mapInstanceRef.current || !window.L) return;
    
    if (lat && lng) {
      const L = window.L;
      const map = mapInstanceRef.current;
      
      if (markerRef.current) {
        markerRef.current.remove();
      }
      
      markerRef.current = L.marker([lat, lng], {
        icon: L.divIcon({
          className: '',
          html: `<div style="background:#f59e0b;color:white;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 4px 16px rgba(0,0,0,.3);border:3px solid #fef3c7;">🏠</div>`,
          iconSize: [36, 36],
          iconAnchor: [18, 36],
        })
      }).addTo(map);
      
      map.setView([lat, lng], 15);
    }
  }, [lat, lng, onAddressChange, onLocationChange]);

  return (
    <div style={{ marginTop: '16px' }}>
      <div style={{
        borderRadius: 'var(--r)',
        overflow: 'hidden',
        boxShadow: 'var(--sh)',
        border: '2px solid var(--accent)',
        marginBottom: '12px'
      }}>
        <div 
          ref={mapRef} 
          style={{ width: '100%', height: '300px' }}
        />
        <div style={{
          background: 'linear-gradient(135deg,#fef3c7,#fde68a)',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '12px',
          color: '#92400e',
          fontWeight: '600'
        }}>
          <span style={{ fontSize: '18px' }}>💡</span>
          <span>
            {isGeocoding ? 'Определяю адрес...' : 'Кликните на карту, чтобы указать точное местоположение вашего жилья'}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── LEAFLET MAP ───────────────────────────────────────────────────────────────
function LeafletMap({ profiles, onView, onRadiusFilterChange, authUser }) {
  const mapRef = useRef(null);
  const instanceRef = useRef(null);
  const markersRef = useRef([]);

  // PRIVACY: Добавляем случайное смещение (±1-2 км)
  const getFuzzedCoords = (lat, lng) => {
    const jitter = () => (Math.random() - 0.5) * 0.02; 
    return [lat + jitter(), lng + jitter()];
  };

  // 1. Инициализация карты
  useEffect(() => {
    if (instanceRef.current) return;

    const head = document.head;
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
      head.appendChild(link);
    }

    const initMap = () => {
      if (!mapRef.current || instanceRef.current) return;
      const L = window.L;

      const map = L.map(mapRef.current, {
        center: [48.0, 68.0],
        zoom: 5,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map);

      instanceRef.current = map;

      // Add simple drawing functionality
      let drawingCircle = null;
      let centerPoint = null;
      let isDrawing = false;

      map.on('mousedown', function(e) {
        if (e.originalEvent.button === 2) { // Right click
          e.originalEvent.preventDefault();
          isDrawing = true;
          centerPoint = e.latlng;
          drawingCircle = L.circle(centerPoint, {
            radius: 1000,
            color: '#3d7a5c',
            fillColor: '#d4ead9',
            fillOpacity: 0.25,
            weight: 3,
            dashArray: '10, 10'
          }).addTo(map);
        }
      });

      map.on('mousemove', function(e) {
        if (isDrawing && drawingCircle && centerPoint) {
          const radius = map.distance(centerPoint, e.latlng);
          drawingCircle.setRadius(radius);
        }
      });

      map.on('mouseup', function(e) {
        if (isDrawing) {
          isDrawing = false;
          if (drawingCircle && centerPoint) {
            const radiusMeters = drawingCircle.getRadius();
            const radiusKm = (radiusMeters / 1000).toFixed(1);
            
            // Save the radius filter
            if (onRadiusFilterChange) {
              onRadiusFilterChange({
                lat: centerPoint.lat,
                lng: centerPoint.lng,
                radius: radiusMeters / 1000 // in km
              });
            }
            
            drawingCircle.bindPopup(`
              <div style="padding:10px;text-align:center;">
                <b>🎯 Ваша зона поиска</b><br/>
                <span style="font-size:12px;">Радиус: ${radiusKm} км</span><br/>
                <button id="clear-radius-filter" style="margin-top:8px;padding:4px 12px;background:#c94a3a;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:11px;">Очистить фильтр</button>
              </div>
            `).openPopup();
            
            // Add event listener to clear button
            setTimeout(() => {
              const clearBtn = document.getElementById('clear-radius-filter');
              if (clearBtn) {
                clearBtn.onclick = () => {
                  if (onRadiusFilterChange) {
                    onRadiusFilterChange(null);
                  }
                  if (drawingCircle) {
                    map.removeLayer(drawingCircle);
                    drawingCircle = null;
                  }
                  map.closePopup();
                };
              }
            }, 100);
          }
        }
      });

      // Prevent context menu
      mapRef.current.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        return false;
      });
    };

    if (window.L) {
      initMap();
    } else {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
      script.onload = initMap;
      document.body.appendChild(script);
    }

    return () => {
      if (instanceRef.current) {
        instanceRef.current.remove();
        instanceRef.current = null;
      }
    };
  }, []);

  // 2. Обновление маркеров
  useEffect(() => {
    if (!instanceRef.current || !window.L) return;
    
    const L = window.L;
    const map = instanceRef.current;

    // Очистка старых маркеров
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // ВИЗУАЛИЗАЦИЯ РЕГИОНОВ ПОИСКА (как на Krisha.kz)
    // Если у пользователя выбраны регионы для поиска, показываем их на карте
    if (profiles.length > 0) {
      // Определяем уникальные регионы из профилей
      const uniqueRegions = [...new Set(profiles.map(p => p.region))];
      
      uniqueRegions.forEach(regionId => {
        const region = KZ_REGIONS.find(r => r.id === regionId);
        if (!region) return;
        
        // Рисуем полупрозрачный круг, показывающий зону поиска
        const searchCircle = L.circle([region.lat, region.lng], {
          color: '#3d7a5c',
          fillColor: '#d4ead9',
          fillOpacity: 0.12,
          weight: 2,
          opacity: 0.4,
          radius: 40000, // 40 km радиус
          dashArray: '8, 12',
          interactive: false // Не блокирует клики на маркеры
        }).addTo(map);
        
        markersRef.current.push(searchCircle);
      });
    }

    const icons = {
      female: L.divIcon({
        className: "",
        html: `<div style="background:#d4587a;color:white;border-radius:50% 50% 50% 0;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-family:'Nunito',sans-serif;font-size:13px;font-weight:700;box-shadow:0 3px 10px rgba(0,0,0,.25);transform:rotate(-45deg);border:2px solid #fff;"><span style="transform:rotate(45deg)">♀</span></div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -38],
      }),
      male: L.divIcon({
        className: "",
        html: `<div style="background:#4a7abf;color:white;border-radius:50% 50% 50% 0;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-family:'Nunito',sans-serif;font-size:13px;font-weight:700;box-shadow:0 3px 10px rgba(0,0,0,.25);transform:rotate(-45deg);border:2px solid #fff;"><span style="transform:rotate(45deg)">♂</span></div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -38],
      }),
      house_female: L.divIcon({
        className: "",
        html: `<div style="background:#f59e0b;color:white;border-radius:50% 50% 50% 0;width:40px;height:40px;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 4px 12px rgba(0,0,0,.3);transform:rotate(-45deg);border:3px solid #fef3c7;"><span style="transform:rotate(45deg)">🏠</span></div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -42],
      }),
      house_male: L.divIcon({
        className: "",
        html: `<div style="background:#f59e0b;color:white;border-radius:50% 50% 50% 0;width:40px;height:40px;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 4px 12px rgba(0,0,0,.3);transform:rotate(-45deg);border:3px solid #fef3c7;"><span style="transform:rotate(45deg)">🏠</span></div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -42],
      }),
    };

    // Add auth user's location marker first (if they have address)
    if (authUser && authUser.lat && authUser.lng && authUser.renterType === 'has_place') {
      const myIcon = L.divIcon({
        className: '',
        html: `<div style="background:#10b981;color:white;border-radius:50%;width:44px;height:44px;display:flex;align-items:center;justify-content:center;font-size:22px;box-shadow:0 6px 24px rgba(16,185,129,.4);border:4px solid #d1fae5;position:relative;">
          <span style="position:absolute;top:-8px;right:-8px;background:#ef4444;width:16px;height:16px;border-radius:50%;border:2px solid #fff;"></span>
          🏠
        </div>`,
        iconSize: [44, 44],
        iconAnchor: [22, 44],
        popupAnchor: [0, -46],
      });

      const myMarker = L.marker([authUser.lat, authUser.lng], { icon: myIcon }).addTo(map);
      
      const myPopup = L.popup({ maxWidth: 280, closeButton: false });
      myPopup.setContent(`
        <div class="map-popup" style="border-top:4px solid #10b981;">
          <div style="background:linear-gradient(135deg,#d1fae5,#a7f3d0);padding:10px 12px;margin:-10px -12px 12px;border-radius:8px 8px 0 0;">
            <div style="font-size:13px;font-weight:700;color:#047857;display:flex;align-items:center;gap:6px;">
              <span style="font-size:16px;">📍</span>
              Ваше жильё
            </div>
          </div>
          <div class="map-popup-name">${authUser.name}</div>
          <div class="map-popup-info">${authUser.budget ? authUser.budget.toLocaleString() + ' ₸/мес' : ''}</div>
          ${authUser.address ? `
            <div style="margin:8px 0;padding:8px 10px;background:#f0fdf4;border-radius:8px;font-size:11px;color:#166534;border-left:3px solid #10b981;">
              📍 ${authUser.address}
            </div>
          ` : ''}
          <div style="margin-top:10px;padding:8px;background:#fef3c7;border-radius:6px;font-size:10px;color:#92400e;text-align:center;">
            💡 Ваше местоположение видно только вам
          </div>
        </div>
      `);
      
      myMarker.bindPopup(myPopup);
      markersRef.current.push(myMarker);
    }

    profiles.forEach(p => {
      // Choose icon based on renterType
      let icon;
      if (p.renterType === 'has_place') {
        icon = p.gender === 'female' ? icons.house_female : icons.house_male;
      } else {
        icon = icons[p.gender] || icons.male;
      }
      
      const region = KZ_REGIONS.find(r => r.id === p.region);
      
      // Use exact coordinates if profile has address and coordinates
      // Otherwise use fuzzy coordinates for privacy
      let displayCoords;
      if (p.lat && p.lng && p.renterType === 'has_place') {
        // Exact location for people with addresses
        displayCoords = [p.lat, p.lng];
      } else {
        // Fuzzy location for people looking or without coordinates
        const baseCoords = region ? [region.lat, region.lng] : [43.238, 76.945];
        displayCoords = getFuzzedCoords(baseCoords[0], baseCoords[1]);
      }
      
      const marker = L.marker(displayCoords, { icon }).addTo(map);

      const popup = L.popup({ maxWidth: 260, closeButton: false });
      popup.setContent(`
        <div class="map-popup">
          <div class="map-popup-name">${p.name}, ${p.age}</div>
          <div class="map-popup-info">${region?.name || ""} · ${p.budget.toLocaleString()} ₸/мес</div>
          ${p.renterType ? `
            <div style="margin:8px 0;padding:6px 10px;background:${p.renterType==='has_place'?'#fef3c7':'#e0f2fe'};border-radius:8px;font-size:11px;font-weight:700;color:${p.renterType==='has_place'?'#92400e':'#075985'};display:flex;align-items:center;gap:6px;">
              ${p.renterType==='has_place'?'🏠 Есть жильё':'🔍 Ищет жильё'}
            </div>
          ` : ''}
          ${p.address && p.renterType==='has_place' ? `
            <div style="margin:6px 0 8px;padding:6px 8px;background:rgba(255,255,255,.7);border-radius:6px;font-size:10px;color:#666;">
              📍 ${p.address}
            </div>
          ` : ''}
          <button class="map-popup-btn" id="mp-${p.id}">Профиль</button>
        </div>
      `);

      marker.bindPopup(popup);
      marker.on("popupopen", () => {
        setTimeout(() => {
          const btn = document.getElementById(`mp-${p.id}`);
          if (btn) btn.onclick = () => { map.closePopup(); onView(p); };
        }, 50);
      });

      markersRef.current.push(marker);
    });

    // Авто-зум
    if (profiles.length > 0) {
      const bounds = L.latLngBounds(markersRef.current.map(m => m.getLatLng()));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
    }
  }, [profiles, onView]);

  return (
    <div className="map-wrap">
      <div id="kz-map" ref={mapRef} style={{ height: "500px", width: "100%" }} />
    </div>
  );
}

const AUTO_REPLIES = [
  "Привет! Спасибо за сообщение 😊 Расскажи подробнее о себе?",
  "Здравствуй! Звучит интересно, когда планируешь заехать?",
  "Привет! Я тоже искала спокойную соседку. Можем поговорить подробнее!",
  "Ого, совпадаем по многим пунктам! Давай обсудим детали 🏠",
  "Привет! Посмотрела твой профиль — думаю, нам будет комфортно 😊",
];

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App() {
  useEffect(() => { injectStyles(); }, []);

  const [auth, setAuth] = useState(null);
  const [tab, setTab] = useState("swipe");
  const [liked, setLiked] = useState(new Set());
  const [sent, setSent] = useState(new Set());
  const [sentMessages, setSentMessages] = useState({});
  const [conversations, setConversations] = useState({});
  const [typingFor, setTypingFor] = useState(null);
  const [activeChat, setActiveChat] = useState(null);
  const [selected, setSelected] = useState(null);
  const [view, setView] = useState("grid");
  const [showF, setShowF] = useState(false);
  const [msgText, setMsgText] = useState("");
  const [mapCityFilter, setMapCityFilter] = useState("all");
  const [radiusFilter, setRadiusFilter] = useState(null); // {lat, lng, radius}
  const [swipeQueue, setSwipeQueue] = useState([]);
  const [currentSwipeIndex, setCurrentSwipeIndex] = useState(0);
  const [passed, setPassed] = useState(new Set());
  const [filters, setFilters] = useState({
    search: "", region: "", budget: 200000, gender: "",
    schedule: "", pets: "", remote: "", smoking: "", religion: "", alcohol: "",
  });

  // Messaging functions
  const ts = () => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
  };

  const sendFirst = (profileId) => {
    if (!msgText.trim() || msgText.trim().length < 10) return;
    setSent(s => { const n = new Set(s); n.add(profileId); return n; });
    setSentMessages(m => ({ ...m, [profileId]: msgText }));
    
    const profile = MOCK_PROFILES.find(p => p.id === profileId);
    setConversations(c => ({
      ...c,
      [profileId]: [{ id: Date.now(), text: msgText, mine: true, time: ts() }]
    }));

    // Auto-reply if matched
    if (profile?.matched) {
      setTimeout(() => {
        setTypingFor(profileId);
        setTimeout(() => {
          const reply = AUTO_REPLIES[Math.floor(Math.random() * AUTO_REPLIES.length)];
          setConversations(c => ({
            ...c,
            [profileId]: [...(c[profileId] || []), { id: Date.now(), text: reply, mine: false, time: ts() }]
          }));
          setTypingFor(null);
        }, 1800);
      }, 500);
    }

    setMsgText("");
    setSelected(null);
  };

  const sendChat = (profileId, text) => {
    if (!text.trim()) return;
    setConversations(c => ({
      ...c,
      [profileId]: [...(c[profileId] || []), { id: Date.now(), text, mine: true, time: ts() }]
    }));

    // Auto-reply
    setTimeout(() => {
      setTypingFor(profileId);
      setTimeout(() => {
        const reply = AUTO_REPLIES[Math.floor(Math.random() * AUTO_REPLIES.length)];
        setConversations(c => ({
          ...c,
          [profileId]: [...(c[profileId] || []), { id: Date.now(), text: reply, mine: false, time: ts() }]
        }));
        setTypingFor(null);
      }, Math.random() * 800 + 1200);
    }, 500);
  };
const [searchRadius, setSearchRadius] = useState(50); // Радиус в км
const [centerCoords, setCenterCoords] = useState({ lat: 43.238, lng: 76.945 }); // Например, Алматы

const filtered = MOCK_PROFILES.filter(p => {
    // 1. ПОИСК ПО РАДИУСУ (Заменяет старый фильтр по региону)
    const centerCity = KZ_REGIONS.find(r => r.id === (filters.region || "almaty_city"));
    const profileCity = KZ_REGIONS.find(r => r.id === p.region);

    if (centerCity && profileCity) {
      const distance = getDistance(
        centerCity.lat, 
        centerCity.lng, 
        profileCity.lat, 
        profileCity.lng
      );
      
      // Сохраняем дистанцию в объект, чтобы потом показать её в карточке
      p.dist = distance;

      // Если дистанция больше выбранного радиуса — скрываем (filters.radius из ползунка)
      if (distance > (filters.radius || 100)) return false;
    }

    // 2. ОСТАЛЬНЫЕ ФИЛЬТРЫ (Ваш текущий код)
    if (filters.search && !p.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (p.budget > filters.budget) return false;
    if (filters.gender && p.gender !== filters.gender) return false;
    if (filters.schedule && p.schedule !== filters.schedule) return false;
    if (filters.pets === "yes" && !p.pets) return false;
    if (filters.pets === "no" && p.pets) return false;
    if (filters.remote === "yes" && !p.remote) return false;
    if (filters.remote === "no" && p.remote) return false;
    if (filters.smoking === "no" && p.smoking) return false;
    if (filters.alcohol === "no" && p.alcohol) return false;
    if (filters.religion && p.religion !== filters.religion) return false;
    
    return true;
  });

  const likedProfiles = MOCK_PROFILES.filter(p => liked.has(p.id));
  const genderColor = (g) => g === "female" ? "var(--female)" : "var(--male)";
  
  // Calculate distance between two points in km
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  if (!auth) return <AuthScreen onAuth={setAuth} />;

  const handleSwipe = (direction) => {
  const currentPerson = swipeQueue[currentSwipeIndex];
  
  if (direction === "right") {
    setLiked(prev => new Set([...prev, currentPerson.id]));
  } else {
    setPassed(prev => new Set([...prev, currentPerson.id]));
  }

  // Переходим к следующей карточке
  setCurrentSwipeIndex(prev => prev + 1);
};
  return (
    <div className="app">
      <nav className="nav">
        <div className="nav-logo">No Bachidao<span>КЗ</span></div>
        <div className="nav-links">
          {[["swipe","heart","Свайп"],["browse","home","Обзор"],["map","map","Карта"],["matches","heart","Избранное"],["profile","user","Профиль"]].map(([id,ic,lb]) => (
            <button key={id} className={`nl ${tab===id?"active":""}`} onClick={()=>setTab(id)}>
              <Ic n={ic} size={15}/><span>{lb}</span>
              {id==="matches"&&liked.size>0&&<span style={{background:"var(--female)",color:"#fff",borderRadius:"10px",padding:"1px 6px",fontSize:"10px",marginLeft:"2px"}}>{liked.size}</span>}
            </button>
          ))}
        </div>
        <div className="nav-right">
          <button className="nl" onClick={()=>setAuth(null)} title="Выйти"><Ic n="logout" size={15}/></button>
          <div className="nav-av">{auth.initials}</div>
        </div>
      </nav>

      {/* ── SWIPE (TINDER MODE) ── */}
      {tab==="swipe"&&(
        <SwipeTab 
          profiles={filtered.filter(p => !liked.has(p.id) && !passed.has(p.id))}
          onLike={(p)=>{
            setLiked(s=>{const n=new Set(s);n.add(p.id);return n;});
          }}
          onPass={(p)=>{
            setPassed(s=>{const n=new Set(s);n.add(p.id);return n;});
          }}
          onViewProfile={(p)=>{setSelected(p);setMsgText("");}}
        />
      )}

      {/* ── BROWSE ── */}
      {tab==="browse"&&(
        <div className="page">
          <div className="ph" style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:"14px"}}>
            <div>
              <h1 className="pt">Найди соседа 🏠</h1>
              <p className="ps">{filtered.length} человек по вашим критериям в Казахстане</p>
            </div>
            <div style={{display:"flex",gap:"8px",alignItems:"center"}}>
              <button onClick={()=>setShowF(!showF)} className="btn-ghost" style={{display:"flex",alignItems:"center",gap:"6px"}}>
                <Ic n="sliders" size={14}/>Фильтры {showF?"▲":"▼"}
              </button>
              <div className="vt">
                <button className={`vb ${view==="grid"?"active":""}`} onClick={()=>setView("grid")}><Ic n="grid" size={14}/></button>
                <button className={`vb ${view==="list"?"active":""}`} onClick={()=>setView("list")}><Ic n="list" size={14}/></button>
              </div>
            </div>
          </div>

          {/* FILTERS */}
          <div className="fbar">
            <div className="ftop">
              <div className="fsearch">
                <span className="fsearch-ic"><Ic n="search" size={15}/></span>
                <input placeholder="Поиск по имени…" value={filters.search} onChange={e=>setFilters(f=>({...f,search:e.target.value}))}/>
              </div>
              <select className="fsel" value={filters.region} onChange={e=>setFilters(f=>({...f,region:e.target.value}))}>
                <option value="">Весь Казахстан</option>
                {KZ_REGIONS.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
              <select className="fsel" value={filters.gender} onChange={e=>setFilters(f=>({...f,gender:e.target.value}))}>
                <option value="">Любой пол</option>
                <option value="female">♀ Только девушки</option>
                <option value="male">♂ Только парни</option>
              </select>
              <select className="fsel" value={filters.schedule} onChange={e=>setFilters(f=>({...f,schedule:e.target.value}))}>
                <option value="">Любой режим</option>
                <option value="Жаворонок">Жаворонок 🌅</option>
                <option value="Сова">Сова 🌙</option>
                <option value="Переменный">Гибкий 🔄</option>
              </select>
            </div>
            {showF&&(
              <div className="fexp">
                <div className="fg">
                  <label>Макс. бюджет <span className="rv">{filters.budget.toLocaleString()} ₸</span></label>
                  <input type="range" className="frange" min={30000} max={300000} step={5000} value={filters.budget} onChange={e=>setFilters(f=>({...f,budget:+e.target.value}))}/>
                </div>
                <div className="fg">
                  <label>Питомцы</label>
                  <div className="chip-row">
                    {[["Любые",""],["Есть 🐾","yes"],["Нет","no"]].map(([l,v])=>(
                      <button key={l} className={`chip ${filters.pets===v?"chip-on":"chip-off"}`} onClick={()=>setFilters(f=>({...f,pets:v}))}>{l}</button>
                    ))}
                  </div>
                </div>
                <div className="fg">
                  <label>Удалённая работа</label>
                  <div className="chip-row">
                    {[["Любая",""],["Да 💻","yes"],["Нет","no"]].map(([l,v])=>(
                      <button key={l} className={`chip ${filters.remote===v?"chip-on":"chip-off"}`} onClick={()=>setFilters(f=>({...f,remote:v}))}>{l}</button>
                    ))}
                  </div>
                </div>
                <div className="fg">
                  <label>Курение</label>
                  <div className="chip-row">
                    {[["Любое",""],["Некурящий","no"]].map(([l,v])=>(
                      <button key={l} className={`chip ${filters.smoking===v?"chip-on":"chip-off"}`} onClick={()=>setFilters(f=>({...f,smoking:v}))}>{l}</button>
                    ))}
                  </div>
                </div>
                <div className="fg">
                  <label>Алкоголь</label>
                  <div className="chip-row">
                    {[["Любой",""],["Не пьёт","no"]].map(([l,v])=>(
                      <button key={l} className={`chip ${filters.alcohol===v?"chip-on":"chip-off"}`} onClick={()=>setFilters(f=>({...f,alcohol:v}))}>{l}</button>
                    ))}
                  </div>
                </div>
                <div className="fg">
                  <label>Вероисповедание</label>
                  <select className="fsel" style={{width:"100%"}} value={filters.religion} onChange={e=>setFilters(f=>({...f,religion:e.target.value}))}>
                    <option value="">Любое</option>
                    <option value="Мусульманка">Мусульманка</option>
                    <option value="Мусульманин">Мусульманин</option>
                    <option value="Нет">Нерелигиозный</option>
                  </select>
                </div>
                <div className="fg" style={{gridColumn:"1/-1",alignItems:"flex-start"}}>
                  <button onClick={()=>setFilters({search:"",region:"",budget:200000,gender:"",schedule:"",pets:"",remote:"",smoking:"",religion:"",alcohol:""})} className="btn-ghost" style={{width:"auto"}}>
                    Сбросить все фильтры
                  </button>
                </div>
              </div>
            )}
          </div>

          {view==="grid"?(
            <div className="grid">
              {filtered.map(p=>(
                <ProfileCard key={p.id} p={p} liked={liked.has(p.id)} sent={sent.has(p.id)}
                  onLike={()=>setLiked(s=>{const n=new Set(s);n.has(p.id)?n.delete(p.id):n.add(p.id);return n;})}
                  onView={()=>{setSelected(p);setMsgText("");}}/>
              ))}
            </div>
          ):(
            <div>
              {filtered.map(p=>{
                const reg=KZ_REGIONS.find(r=>r.id===p.region);
                return(
                  <div key={p.id} className="list-item" onClick={()=>{setSelected(p);setMsgText("");}}>
                    <div className="mat-av" style={{background:p.photos[0]}}>{p.avatar}</div>
                    <div style={{flex:1}}>
                      <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"2px"}}>
                        <span style={{fontWeight:"700",fontSize:"15px"}}>{p.name}</span>
                        {p.verified&&<span style={{color:"var(--accent)",fontSize:"12px",fontWeight:"700"}}>✓</span>}
                        <span style={{fontSize:"11px",background:p.gender==="female"?"var(--female-light)":"var(--male-light)",color:genderColor(p.gender),borderRadius:"10px",padding:"1px 7px",fontWeight:"600"}}>{p.gender==="female"?"♀ Девушка":"♂ Парень"}</span>
                      </div>
                      <div style={{fontSize:"12px",color:"var(--muted)"}}>{reg?.name||""} · {p.budget.toLocaleString()} ₸/мес · {p.occupation}</div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                      {p.tags.slice(0,1).map(t=><span key={t} className="tag">{t}</span>)}
                      <Ic n="chevron" size={15} c="var(--muted)"/>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {filtered.length===0&&(
            <div className="empty">
              <div className="empty-ic">🔍</div>
              <div className="empty-t">Ничего не найдено</div>
              <p>Попробуйте изменить фильтры</p>
              <button className="btn-primary" style={{marginTop:"18px",width:"auto",padding:"11px 28px"}} onClick={()=>setFilters({search:"",region:"",budget:200000,gender:"",schedule:"",pets:"",remote:"",smoking:"",religion:"",alcohol:""})}>
                Сбросить фильтры
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── MAP ── */}
      {tab==="map"&&(
        
        
        <div className="page">
          <div className="ph">
            <h1 className="pt">Карта соседей 📍</h1>
            <p className="ps">
              {mapCityFilter === "all" 
                ? "Все пользователи на карте Казахстана" 
                : `Показано в: ${KZ_REGIONS.find(r=>r.id===mapCityFilter)?.name || ""}`}
            </p>
          </div>
          
          {/* TOOLBAR: Radius & Gender */}
    <div className="fbar" style={{ marginBottom: '15px', padding: '15px', background: 'var(--card)', borderRadius: 'var(--r)' }}>
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        
        <div className="fg" style={{ flex: 1, minWidth: '200px' }}>
<label>Радиус поиска: <span className="rv">{searchRadius} км</span></label>
  <input 
    type="range" 
    className="frange" 
    min="0" 
    max="1200" 
    value={searchRadius} 
    onChange={(e) => setSearchRadius(Number(e.target.value))} 
  />
        </div>

        <div className="fg">
          <label className="fl">Пол</label>
          <div className="chip-row">
            <button className={`chip ${filters.gender===""?"chip-on":"chip-off"}`} onClick={()=>setFilters(f=>({...f,gender:""}))}>Все</button>
            <button className={`chip ${filters.gender==="female"?"chip-f-on":"chip-off"}`} onClick={()=>setFilters(f=>({...f,gender:"female"}))}>♀</button>
            <button className={`chip ${filters.gender==="male"?"chip-on":"chip-off"}`} onClick={()=>setFilters(f=>({...f,gender:"male"}))}>♂</button>
          </div>
        </div>
      </div>
    </div>

          {/* City Filter Buttons */}
          <div style={{
            background:"var(--card)",
            borderRadius:"var(--r)",
            padding:"18px 20px",
            marginBottom:"14px",
            boxShadow:"var(--sh)"
          }}>
            <div style={{
              fontSize:"12px",
              fontWeight:"700",
              color:"var(--muted)",
              textTransform:"uppercase",
              letterSpacing:".5px",
              marginBottom:"12px"
            }}>
              Фильтр по городам
            </div>
            <div style={{
              display:"flex",
              gap:"8px",
              flexWrap:"wrap"
            }}>
              <button
                onClick={() => setMapCityFilter("all")}
                style={{
                  padding:"10px 16px",
                  borderRadius:"var(--rs)",
                  border:`2px solid ${mapCityFilter==="all"?"var(--accent)":"var(--bg2)"}`,
                  background:mapCityFilter==="all"?"var(--accent-light)":"var(--bg)",
                  color:mapCityFilter==="all"?"var(--accent2)":"var(--mid)",
                  fontFamily:"Nunito,sans-serif",
                  fontSize:"14px",
                  fontWeight:"700",
                  cursor:"pointer",
                  transition:"all .2s",
                  display:"flex",
                  alignItems:"center",
                  gap:"6px"
                }}
              >
                🇰🇿 Весь Казахстан
                <span style={{
                  background:mapCityFilter==="all"?"var(--accent)":"var(--bg2)",
                  color:"#fff",
                  borderRadius:"10px",
                  padding:"2px 7px",
                  fontSize:"11px"
                }}>
                  {MOCK_PROFILES.length}
                </span>
              </button>

              {[
                {id:"almaty_city", name:"Алматы", emoji:"🏔️"},
                {id:"astana", name:"Астана", emoji:"🏛️"},
                {id:"shymkent", name:"Шымкент", emoji:"🌆"},
                {id:"karaganda", name:"Караганда", emoji:"🏭"}
              ].map(city => {
                const count = MOCK_PROFILES.filter(p=>p.region===city.id).length;
                if(count === 0) return null;
                return (
                  <button
                    key={city.id}
                    onClick={() => setMapCityFilter(city.id)}
                    style={{
                      padding:"10px 16px",
                      borderRadius:"var(--rs)",
                      border:`2px solid ${mapCityFilter===city.id?"var(--accent)":"var(--bg2)"}`,
                      background:mapCityFilter===city.id?"var(--accent-light)":"var(--bg)",
                      color:mapCityFilter===city.id?"var(--accent2)":"var(--mid)",
                      fontFamily:"Nunito,sans-serif",
                      fontSize:"14px",
                      fontWeight:"700",
                      cursor:"pointer",
                      transition:"all .2s",
                      display:"flex",
                      alignItems:"center",
                      gap:"6px"
                    }}
                  >
                    {city.emoji} {city.name}
                    <span style={{
                      background:mapCityFilter===city.id?"var(--accent)":"var(--bg2)",
                      color:"#fff",
                      borderRadius:"10px",
                      padding:"2px 7px",
                      fontSize:"11px"
                    }}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Map Legend */}
          <div style={{
            background:"linear-gradient(135deg,var(--accent-light),#e8f5ea)",
            borderRadius:"var(--r)",
            padding:"14px 18px",
            marginBottom:"20px",
            border:"2px solid var(--accent)",
            display:"flex",
            alignItems:"center",
            gap:"12px"
          }}>
            <div style={{
              width:"44px",
              height:"44px",
              borderRadius:"50%",
              background:"rgba(61,122,92,.15)",
              border:"2px dashed var(--accent)",
              flexShrink:0,
              display:"flex",
              alignItems:"center",
              justifyContent:"center",
              fontSize:"20px"
            }}>
              🖍️
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:"13px",fontWeight:"700",color:"var(--accent2)",marginBottom:"2px"}}>
                Нарисуйте зону поиска на карте
              </div>
              <div style={{fontSize:"11px",color:"var(--mid)",lineHeight:"1.5"}}>
                <b>Инструкция:</b> Кликните правой кнопкой на карте и держите, чтобы нарисовать круг вашей зоны поиска. Пунктирные круги — регионы поиска. Маркеры — анкеты (точное местоположение скрыто).
              </div>
            </div>
          </div>

          {/* Active Radius Filter Indicator */}
          {radiusFilter && (
            <div style={{
              background:"linear-gradient(135deg,#dcfce7,#bbf7d0)",
              borderRadius:"var(--r)",
              padding:"12px 16px",
              marginBottom:"16px",
              border:"2px solid #22c55e",
              display:"flex",
              alignItems:"center",
              justifyContent:"space-between"
            }}>
              <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
                <span style={{fontSize:"20px"}}>🎯</span>
                <div>
                  <div style={{fontSize:"13px",fontWeight:"700",color:"#166534"}}>
                    Фильтр по радиусу активен
                  </div>
                  <div style={{fontSize:"11px",color:"#15803d"}}>
                    Радиус: {radiusFilter.radius.toFixed(1)} км · Показано профилей: {
                      (() => {
                        let filtered = mapCityFilter === "all" 
                          ? MOCK_PROFILES 
                          : MOCK_PROFILES.filter(p => p.region === mapCityFilter);
                        
                        filtered = filtered.filter(p => {
                          let profileLat, profileLng;
                          if (p.lat && p.lng && p.renterType === 'has_place') {
                            profileLat = p.lat;
                            profileLng = p.lng;
                          } else {
                            const region = KZ_REGIONS.find(r => r.id === p.region);
                            if (!region) return false;
                            profileLat = region.lat;
                            profileLng = region.lng;
                          }
                          const distance = calculateDistance(radiusFilter.lat, radiusFilter.lng, profileLat, profileLng);
                          return distance <= radiusFilter.radius;
                        });
                        
                        return filtered.length;
                      })()
                    }
                  </div>
                </div>
              </div>
              <button
                onClick={() => setRadiusFilter(null)}
                style={{
                  background:"#dc2626",
                  color:"#fff",
                  border:"none",
                  borderRadius:"8px",
                  padding:"6px 12px",
                  fontSize:"11px",
                  fontWeight:"700",
                  cursor:"pointer",
                  transition:"all .2s"
                }}
                onMouseEnter={e => e.currentTarget.style.background = "#b91c1c"}
                onMouseLeave={e => e.currentTarget.style.background = "#dc2626"}
              >
                Очистить
              </button>
            </div>
          )}

          <LeafletMap 
            profiles={(() => {
              // First filter by city
              let filtered = mapCityFilter === "all" 
                ? MOCK_PROFILES 
                : MOCK_PROFILES.filter(p => p.region === mapCityFilter);
              
              // Then filter by radius if set
              if (radiusFilter) {
                filtered = filtered.filter(p => {
                  // Get profile coordinates
                  let profileLat, profileLng;
                  
                  if (p.lat && p.lng && p.renterType === 'has_place') {
                    // Use exact coordinates for people with addresses
                    profileLat = p.lat;
                    profileLng = p.lng;
                  } else {
                    // Use region center for others
                    const region = KZ_REGIONS.find(r => r.id === p.region);
                    if (!region) return false;
                    profileLat = region.lat;
                    profileLng = region.lng;
                  }
                  
                  // Calculate distance
                  const distance = calculateDistance(
                    radiusFilter.lat,
                    radiusFilter.lng,
                    profileLat,
                    profileLng
                  );
                  
                  return distance <= radiusFilter.radius;
                });
              }
              
              return filtered;
            })()}
            onView={p=>{setSelected(p);setMsgText("");}}
            onRadiusFilterChange={setRadiusFilter}
            authUser={auth}
            allowDrawing={true}
          />
          <div style={{marginTop:"24px"}}>
            <h2 style={{fontFamily:"Cormorant Garamond",fontSize:"22px",marginBottom:"14px",fontWeight:"700"}}>Список по регионам</h2>
            {KZ_REGIONS.filter(r=>{
              const hasProfiles = MOCK_PROFILES.some(p=>p.region===r.id);
              if(!hasProfiles) return false;
              if(mapCityFilter === "all") return true;
              return r.id === mapCityFilter;
            }).map(r=>{
              const ps=MOCK_PROFILES.filter(p=>p.region===r.id);
              return(
                <div key={r.id} style={{marginBottom:"12px"}}>
                  <div style={{fontSize:"12px",fontWeight:"700",color:"var(--muted)",textTransform:"uppercase",letterSpacing:".5px",marginBottom:"8px",display:"flex",alignItems:"center",gap:"6px"}}>
                    <Ic n="pin" size={12} c="var(--accent)"/>{r.name} ({ps.length})
                  </div>
                  {ps.map(p=>(
                    <div key={p.id} style={{background:"var(--card)",borderRadius:"var(--rs)",padding:"12px 16px",display:"flex",alignItems:"center",gap:"12px",boxShadow:"var(--sh)",cursor:"pointer",marginBottom:"8px",border:"1.5px solid transparent",transition:"all .2s"}}
                      onMouseEnter={e=>e.currentTarget.style.borderColor="var(--accent)"}
                      onMouseLeave={e=>e.currentTarget.style.borderColor="transparent"}
                      onClick={()=>{setSelected(p);setMsgText("");}}>
                      <div style={{width:"42px",height:"42px",borderRadius:"50%",background:p.photos[0],display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Cormorant Garamond",fontSize:"15px",fontWeight:"700"}}>{p.avatar}</div>
                      <div style={{flex:1}}>
                        <span style={{fontWeight:"700",fontSize:"14px"}}>{p.name}</span>
                        <span style={{fontSize:"11px",background:p.gender==="female"?"var(--female-light)":"var(--male-light)",color:genderColor(p.gender),borderRadius:"10px",padding:"1px 7px",fontWeight:"600",marginLeft:"8px"}}>{p.gender==="female"?"♀":"♂"}</span>
                        <div style={{fontSize:"12px",color:"var(--muted)",marginTop:"1px"}}>{p.budget.toLocaleString()} ₸/мес · {p.occupation}</div>
                      </div>
                      {p.online&&<div style={{width:"8px",height:"8px",borderRadius:"50%",background:"#4caf50",flexShrink:0}}/>}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── MATCHES ── */}
      {tab==="matches"&&(
        <div className="page">
          <div className="ph">
            <h1 className="pt">Избранные ❤️</h1>
            <p className="ps">Люди, которые вам понравились</p>
          </div>
          <div className="stat-row">
            <div className="stat-c">
              <div className="stat-n">{liked.size}</div>
              <div className="stat-l">Понравилось</div>
            </div>
            <div className="stat-c">
              <div className="stat-n">{sent.size}</div>
              <div className="stat-l">Сообщений</div>
            </div>
            <div className="stat-c">
              <div className="stat-n">{Object.keys(conversations).length}</div>
              <div className="stat-l">Диалогов 💬</div>
            </div>
            <div className="stat-c">
              <div className="stat-n">{likedProfiles.filter(p=>p.matched).length}</div>
              <div className="stat-l">🤝 Совпадений</div>
            </div>
          </div>
          
          {likedProfiles.length===0?(
            <div className="empty">
              <div className="empty-ic">❤️</div>
              <div className="empty-t">Пока пусто</div>
              <p>Нажмите ❤️ на понравившихся соседях</p>
              <button className="btn-primary" style={{marginTop:"18px",width:"auto",padding:"11px 28px"}} onClick={()=>setTab("swipe")}>Смотреть анкеты</button>
            </div>
          ):(
            <div className="liked-layout">
              <div className="liked-list">
                {likedProfiles.map(p=>{
                  const reg=KZ_REGIONS.find(r=>r.id===p.region);
                  const conv = conversations[p.id];
                  const lastMsg = conv && conv.length > 0 ? conv[conv.length - 1] : null;
                  const sentMsg = sentMessages[p.id];
                  const isMatched = p.matched && sent.has(p.id);
                  
                  return(
                    <div 
                      key={p.id} 
                      className={`mi ${activeChat===p.id?"sel":""}`}
                      onClick={() => {
                        if(isMatched) {
                          setActiveChat(p.id);
                        } else {
                          setSelected(p);
                          setMsgText("");
                        }
                      }}
                    >
                      <div className="mat-av" style={{background:p.photos[0]}}>
                        {p.avatar}
                        {p.online && <div style={{position:"absolute",bottom:"-2px",right:"-2px",width:"12px",height:"12px",borderRadius:"50%",background:"#4caf50",border:"2px solid var(--card)"}}/>}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:"flex",alignItems:"center",gap:"6px",marginBottom:"2px"}}>
                          <span style={{fontWeight:"700",fontSize:"15px"}}>{p.name}</span>
                          {p.verified&&<span style={{color:"var(--accent)",fontSize:"12px"}}>✓</span>}
                          {isMatched&&<span style={{background:"var(--match)",color:"#fff",fontSize:"10px",padding:"2px 6px",borderRadius:"10px",fontWeight:"700"}}>🤝</span>}
                        </div>
                        <div style={{fontSize:"12px",color:"var(--muted)",marginBottom:"4px"}}>
                          {reg?.name||""} · {p.budget.toLocaleString()} ₸/мес
                        </div>
                        
                        {/* Message preview */}
                        {sentMsg && !lastMsg && (
                          <div className="sent-preview">
                            <span style={{color:"var(--accent)",fontWeight:"700",fontSize:"11px"}}>Вы: </span>
                            {sentMsg.length > 60 ? sentMsg.substring(0,60)+"..." : sentMsg}
                          </div>
                        )}
                        {lastMsg && (
                          <div style={{
                            fontSize:"13px",
                            color:lastMsg.mine?"var(--mid)":"var(--dark)",
                            fontWeight:lastMsg.mine?"500":"700",
                            padding:"8px 12px",
                            background:lastMsg.mine?"#f5f5f4":"var(--accent-light)",
                            borderRadius:"10px",
                            borderLeft:`3px solid ${lastMsg.mine?"var(--accent)":"var(--match)"}`,
                            marginTop:"6px",
                            lineHeight:"1.4"
                          }}>
                            <span style={{fontSize:"10px",fontWeight:"700",color:"var(--muted)",display:"block",marginBottom:"3px"}}>
                              {lastMsg.mine?"Вы":"Они"}:
                            </span>
                            {lastMsg.text.length > 50 ? lastMsg.text.substring(0,50)+"..." : lastMsg.text}
                          </div>
                        )}
                        {!sentMsg && !lastMsg && (
                          <div style={{fontSize:"12px",color:"var(--muted)",fontStyle:"italic",marginTop:"6px"}}>
                            Нажмите, чтобы написать сообщение
                          </div>
                        )}
                        {sent.has(p.id) && !isMatched && !lastMsg && (
                          <div style={{fontSize:"11px",color:"var(--muted)",marginTop:"6px",fontStyle:"italic"}}>
                            ⏳ Ожидание ответа…
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Chat Panel */}
              {activeChat && (() => {
                const profile = likedProfiles.find(p => p.id === activeChat);
                if (!profile || !profile.matched || !sent.has(profile.id)) return null;
                
                return (
                  <ChatPanel
                    profile={profile}
                    messages={conversations[profile.id] || []}
                    typing={typingFor === profile.id}
                    userInitials={auth.initials}
                    onSend={(text) => sendChat(profile.id, text)}
                    onClose={() => setActiveChat(null)}
                  />
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* ── PROFILE ── */}
      {tab==="profile"&&(
        <div className="page">
          <div style={{maxWidth:"680px",margin:"0 auto"}}>
            <h1 className="pt" style={{marginBottom:"22px"}}>Мой профиль</h1>
            <div className="prof-card">
              <div className="prof-av">{auth.initials}</div>
              <h2 style={{textAlign:"center",fontFamily:"Cormorant Garamond",fontSize:"24px",fontWeight:"700",marginBottom:"4px"}}>{auth.name}</h2>
              <p style={{textAlign:"center",color:"var(--muted)",fontSize:"13px",marginBottom:"24px"}}>{auth.email}</p>
              <div style={{display:"flex",flexWrap:"wrap",gap:"8px",justifyContent:"center",marginBottom:"24px"}}>
                {auth.gender==="female"?<span className="badge" style={{background:"var(--female-light)",color:"var(--female)"}}>♀ Девушка</span>:<span className="badge" style={{background:"var(--male-light)",color:"var(--male)"}}>♂ Парень</span>}
                {auth.verified&&<span className="badge badge-g">✓ Верифицирован</span>}
                {auth.remote&&<span className="badge badge-b">💻 Удалёнка</span>}
                {!auth.smoking&&<span className="badge badge-g">🚭 Некурящий</span>}
              </div>
              <div className="grid2">
                {[["Имя",auth.name],["Возраст",auth.age||"—"],["Бюджет",(auth.budget||0).toLocaleString()+" ₸/мес"],["Регион",KZ_REGIONS.find(r=>r.id===auth.region)?.name||"—"],["Профессия",auth.occupation||"—"],["График",auth.schedule||"—"]].map(([l,v])=>(
                  <div className="fg-form" key={l}>
                    <label className="fl">{l}</label>
                    <input className="fi" defaultValue={v}/>
                  </div>
                ))}
              </div>
              <div className="fg-form">
                <label className="fl">О себе</label>
                <textarea className="fi" style={{height:"80px",resize:"vertical"}} defaultValue={auth.bio||""}/>
              </div>
              <button className="btn-primary">Сохранить профиль</button>
            </div>
            <div className="prof-card">
              <h2 className="sec-title">Мои предпочтения</h2>
              {[["Чистоплотность",auth.cleanliness||4],["Общительность",auth.social||3],["Уровень шума",3],["Гости",2]].map(([l,v])=>(
                <div key={l} className="trait">
                  <span className="tlabel">{l}</span>
                  <div className="ttrack"><div className="tfill" style={{width:`${v*20}%`}}/></div>
                  <span style={{fontSize:"12px",fontWeight:"700",color:"var(--accent)",width:"24px"}}>{v}/5</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL ── */}
      {selected&&(
        <ProfileModal p={selected} liked={liked.has(selected.id)} sent={sent.has(selected.id)}
          msgText={msgText} setMsgText={setMsgText}
          onLike={()=>setLiked(s=>{const n=new Set(s);n.has(selected.id)?n.delete(selected.id):n.add(selected.id);return n;})}
          onSend={()=>sendFirst(selected.id)}
          onClose={()=>setSelected(null)}/>
      )}
    </div>
  );
}

// ── CHAT PANEL ────────────────────────────────────────────────────────────────
function ChatPanel({ profile, messages, typing, userInitials, onSend, onClose }) {
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef(null);
  
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const send = () => {
    if (!input.trim()) return;
    setIsSending(true);
    onSend(input);
    setInput("");
    setTimeout(() => setIsSending(false), 600);
  };

  return (
    <div className="chat-panel">
      <div className="chat-head">
        <div className="chat-head-av" style={{ background: profile.photos[0] }}>
          {profile.avatar}
        </div>
        <div className="chat-head-info">
          <div className="chat-head-name">{profile.name}</div>
          <div className="chat-head-status">
            {profile.online ? (
              <>
                <span style={{width:"6px",height:"6px",borderRadius:"50%",background:"#4caf50",display:"inline-block"}}/>
                Сейчас онлайн
              </>
            ) : (
              "Был(а) недавно"
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="chat-head-close"
        >
          <Ic n="x" s={16} c="rgba(255,255,255,.9)" />
        </button>
      </div>

      <div className="match-banner">
        <div className="match-banner-icon">🤝</div>
        <div>
          <div style={{fontSize:"13px",fontWeight:"700",marginBottom:"1px"}}>Совпадение!</div>
          <div style={{fontSize:"11px",opacity:".85"}}>Можете общаться свободно</div>
        </div>
      </div>

      <div className="chat-msgs">
        {messages.length === 0 && (
          <div className="no-chat">
            <div className="no-chat-icon">👋</div>
            <div className="no-chat-title">Начните общение!</div>
            <div className="no-chat-subtitle">
              У вас совпадение — самое время написать первое сообщение
            </div>
          </div>
        )}
        {messages.map(m => (
          <div key={m.id} className={`bw ${m.mine ? "me" : ""}`}>
            {!m.mine && (
              <div className="bav" style={{ background: profile.photos[0] }}>
                {profile.avatar}
              </div>
            )}
            <div style={{maxWidth:"75%"}}>
              <div className={`bubble ${m.mine ? "me" : "them"}`}>{m.text}</div>
              <div className="btime">
                {m.time}
                {m.mine && <span style={{fontSize:"9px"}}>✓✓</span>}
              </div>
            </div>
            {m.mine && (
              <div className="bav" style={{ background: "var(--accent)", color: "#fff" }}>
                {userInitials}
              </div>
            )}
          </div>
        ))}
        {typing && (
          <div className="bw">
            <div className="bav" style={{ background: profile.photos[0] }}>
              {profile.avatar}
            </div>
            <div>
              <div className="typing">
                <div className="td" />
                <div className="td" />
                <div className="td" />
                <span className="typing-text">печатает</span>
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="chat-inp-row">
        <textarea
          className="chat-inp"
          placeholder="Напишите сообщение..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          rows={1}
        />
        <button
          className={`chat-send ${isSending?"sending":""}`}
          onClick={send}
          disabled={!input.trim()}
        >
          <Ic n="send" s={16} c="#fff" />
        </button>
      </div>
    </div>
  );
}

// ── PROFILE CARD ──────────────────────────────────────────────────────────────
function ProfileCard({p, liked, sent, onLike, onView}){
  const reg=KZ_REGIONS.find(r=>r.id===p.region);
  return(
    <div className="card">
      <div className="card-hero" style={{background:`linear-gradient(160deg,${p.photos[0]},${p.photos[2]})`}} onClick={onView}>
        {p.online&&<div className="online-dot"/>}
        {p.verified&&<div className="verified-badge"><Ic n="check" size={10} c="var(--accent)"/>Верифицирован</div>}
        <div className="card-av">{p.avatar}</div>
        <div className={`gender-badge ${p.gender==="female"?"gender-f":"gender-m"}`}>
          {p.gender==="female"?"♀ Девушка":"♂ Парень"}
        </div>
        {p.renterType && (
          <div style={{
            position:"absolute",
            top:"12px",
            right:"12px",
            background:p.renterType==="has_place"?"#fef3c7":"#e0f2fe",
            borderRadius:"20px",
            padding:"4px 10px",
            fontSize:"11px",
            fontWeight:"700",
            color:p.renterType==="has_place"?"#92400e":"#075985",
            display:"flex",
            alignItems:"center",
            gap:"4px",
            boxShadow:"0 2px 8px rgba(0,0,0,.1)"
          }}>
            {p.renterType==="has_place"?"🏠 Есть жильё":"🔍 Ищет"}
          </div>
        )}
      </div>
      <div className="cb">
        <div className="cn"><span className="cname">{p.name}, {p.age}</span><span className="cprice">{p.budget.toLocaleString()} ₸</span></div>
        <div className="cloc"><Ic n="pin" size={11}/>{reg?.name||p.region}</div>
        <p className="cbio">{p.bio}</p>
        <div className="tags">
          {p.tags.map(t=><span key={t} className="tag">{t}</span>)}
          {p.pets&&<span className="tag">🐾 Питомец</span>}
          {p.remote&&<span className="tag">💻 Удалёнка</span>}
          {!p.smoking&&<span className="tag">🚭</span>}
        </div>
        <div className="cact">
          <button className={`btn-like ${liked?"liked":""}`} onClick={onLike}>
            <Ic n={liked?"heartFill":"heart"} size={17} c={liked?"var(--female)":"var(--muted)"}/>
          </button>
          <button className="btn-msg" onClick={onView} disabled={sent}>
            {sent?<><Ic n="check" size={14}/>Отправлено</>:<><Ic n="msg" size={14}/>Написать</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── PROFILE MODAL ─────────────────────────────────────────────────────────────
function ProfileModal({p, liked, sent, msgText, setMsgText, onLike, onSend, onClose}){
  const [isSending, setIsSending] = useState(false);
  const reg=KZ_REGIONS.find(r=>r.id===p.region);
  const max=300;
  
  const handleSend = () => {
    if (msgText.trim().length < 10) return;
    setIsSending(true);
    
    // Call onSend after a short delay to show animation
    setTimeout(() => {
      onSend();
      setTimeout(() => setIsSending(false), 300);
    }, 100);
  };
  
  return(
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="mhero" style={{background:`linear-gradient(160deg,${p.photos[0]},${p.photos[2]})`}}>
          <div className="mav">{p.avatar}</div>
          <button className="mclose" onClick={onClose}><Ic n="x" size={15}/></button>
          {p.online&&<div style={{position:"absolute",bottom:"14px",left:"14px",background:"rgba(255,255,255,.9)",borderRadius:"20px",padding:"3px 10px",fontSize:"12px",color:"#4caf50",fontWeight:"700",display:"flex",alignItems:"center",gap:"5px"}}>
            <span style={{width:"7px",height:"7px",borderRadius:"50%",background:"#4caf50",display:"inline-block"}}/>Онлайн
          </div>}
          <div style={{position:"absolute",top:"14px",right:"14px",background:p.gender==="female"?"var(--female-light)":"var(--male-light)",borderRadius:"20px",padding:"4px 12px",fontSize:"12px",fontWeight:"700",color:p.gender==="female"?"var(--female)":"var(--male)"}}>
            {p.gender==="female"?"♀ Девушка":"♂ Парень"}
          </div>
        </div>
        <div className="mbody">
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:"10px",flexWrap:"wrap",gap:"10px"}}>
            <div>
              <div className="mname">{p.name}, {p.age}</div>
              {p.verified&&<span className="badge badge-g" style={{fontSize:"11px"}}><Ic n="check" size={10} c="var(--accent)"/>Верифицирован</span>}
            </div>
            <button onClick={onLike} style={{background:liked?"var(--female-light)":"var(--bg)",border:`1.5px solid ${liked?"var(--female)":"var(--bg2)"}`,borderRadius:"var(--rs)",padding:"9px 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:"6px",fontSize:"13px",fontWeight:"700",color:liked?"var(--female)":"var(--muted)",fontFamily:"Nunito,sans-serif"}}>
              <Ic n={liked?"heartFill":"heart"} size={15} c={liked?"var(--female)":"var(--muted)"}/>{liked?"В избранном":"В избранное"}
            </button>
          </div>
          <div className="mmeta">
            <div className="mmi"><Ic n="pin" size={13}/>{reg?.name||p.region}</div>
            <div className="mmi">💰 {p.budget.toLocaleString()} ₸/мес</div>
            <div className="mmi"><Ic n="user" size={13}/>{p.occupation}</div>
            <div className="mmi">📅 {p.move_in}</div>
          </div>

          {p.renterType && (
            <div style={{
              background:p.renterType==="has_place"?"linear-gradient(135deg,#fef3c7,#fde68a)":"linear-gradient(135deg,#e0f2fe,#bae6fd)",
              borderRadius:"var(--rs)",
              padding:"14px 16px",
              marginBottom:"16px",
              border:`2px solid ${p.renterType==="has_place"?"#fbbf24":"#0ea5e9"}`
            }}>
              <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:p.address?"8px":"0"}}>
                <div style={{fontSize:"24px"}}>{p.renterType==="has_place"?"🏠":"🔍"}</div>
                <div>
                  <div style={{fontSize:"13px",fontWeight:"700",color:p.renterType==="has_place"?"#92400e":"#075985"}}>
                    {p.renterType==="has_place"?"Есть своё жильё":"Ищет жильё"}
                  </div>
                  <div style={{fontSize:"11px",opacity:".8",color:p.renterType==="has_place"?"#92400e":"#075985"}}>
                    {p.renterType==="has_place"?"Ищет соседа к себе":"Ищет квартиру + соседа"}
                  </div>
                </div>
              </div>
              {p.address && p.renterType==="has_place" && (
                <div style={{
                  background:"rgba(255,255,255,.6)",
                  borderRadius:"8px",
                  padding:"10px 12px",
                  fontSize:"13px",
                  color:"#78350f",
                  display:"flex",
                  alignItems:"center",
                  gap:"8px"
                }}>
                  <span style={{fontSize:"16px"}}>📍</span>
                  <div>
                    <div style={{fontSize:"10px",fontWeight:"700",textTransform:"uppercase",letterSpacing:".5px",marginBottom:"2px",opacity:".7"}}>Адрес</div>
                    <div style={{fontWeight:"600"}}>{p.address}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="msec">
            <div className="mst">О себе</div>
            <p style={{fontSize:"14px",lineHeight:"1.6",color:"var(--mid)"}}>{p.bio}</p>
          </div>

          <div className="msec">
            <div className="mst">Образ жизни</div>
            {[["Чистоплотность",p.cleanliness],["Общительность",p.social]].map(([l,v])=>(
              <div key={l} className="trait">
                <span className="tlabel">{l}</span>
                <div className="ttrack"><div className="tfill" style={{width:`${v*20}%`}}/></div>
                <span style={{fontSize:"12px",fontWeight:"700",color:"var(--accent)",width:"24px"}}>{v}/5</span>
              </div>
            ))}
            <div style={{display:"flex",flexWrap:"wrap",gap:"7px",marginTop:"12px"}}>
              {p.pets&&<span className="badge badge-b">🐾 Питомец есть</span>}
              {p.remote&&<span className="badge badge-b">💻 Удалёнка</span>}
              {!p.smoking&&<span className="badge badge-g">🚭 Не курит</span>}
              {!p.alcohol&&<span className="badge badge-g">🥤 Не пьёт</span>}
              {p.religion!=="Нет"&&<span className="badge" style={{background:"var(--warm-light)",color:"var(--warm)"}}>🕌 {p.religion}</span>}
<span className="badge" style={{background:"var(--bg2)",color:"var(--mid)"}}>
  {p.schedule === "Жаворонок" ? "🌅" : p.schedule === "Сова" ? "🌙" : "🔄 Гибкий"} {p.schedule}
</span>              <span className="badge" style={{background:"var(--bg2)",color:"var(--mid)"}}>👥 Гости: {p.guests}</span>
              <span className="badge" style={{background:"var(--bg2)",color:"var(--mid)"}}>{p.noise==="Тихая"?"🤫":"🔊"} {p.noise}</span>
              {p.languages.map(l=><span key={l} className="badge" style={{background:"var(--bg2)",color:"var(--mid)"}}>{l==="Казахский"?"🇰🇿":l==="Русский"?"🇷🇺":"🌍"} {l}</span>)}
            </div>
          </div>

          <div className="msec">
            <div className="mst">Интересы</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:"7px"}}>
              {p.tags.map(t=><span key={t} className="tag" style={{fontSize:"13px",padding:"5px 12px"}}>{t}</span>)}
            </div>
          </div>

          <div className="msgbox">
            {p.matched && sent ? (
              <>
                <div style={{background:"rgba(245,158,11,.1)",border:"1px solid rgba(245,158,11,.35)",borderRadius:"var(--rs)",padding:"10px 14px",display:"flex",alignItems:"center",gap:"8px",marginBottom:"12px"}}>
                  <span style={{fontSize:"18px"}}>🤝</span>
                  <span style={{fontSize:"13px",fontWeight:"700",color:"#92400e"}}>
                    Совпадение! {p.name.split(" ")[0]} тоже хочет познакомиться
                  </span>
                </div>
                <button className="btn-primary" style={{background:"var(--match)",display:"flex",alignItems:"center",justifyContent:"center",gap:"8px"}} onClick={onClose}>
                  <Ic n="msg" size={15} c="#fff"/>Перейти в чат
                </button>
                <p style={{fontSize:"11px",color:"var(--muted)",textAlign:"center",marginTop:"8px"}}>
                  Откройте вкладку "Избранное" для переписки
                </p>
              </>
            ) : sent ? (
              <>
                <div className="msghead"><Ic n="check" size={14} c="var(--accent)"/>Сообщение отправлено!</div>
                <p className="msgnote">Если ответят — откроется чат 💬</p>
                <div style={{background:"var(--bg2)",borderRadius:"var(--rs)",padding:"10px 13px",fontSize:"13px",color:"var(--mid)",borderLeft:"3px solid var(--accent)",marginTop:"10px"}}>
                  {msgText}
                </div>
              </>
            ) : (
              <>
                <div className="msghead"><Ic n="msg" size={14} c="var(--accent)"/>Написать сообщение</div>
                <p className="msgnote">Одно сообщение — сделайте его запоминающимся ✨</p>
                <textarea className="msgtxt" placeholder={`Привет, ${p.name.split(" ")[0]}! Увидел(а) твою анкету и…`} value={msgText} onChange={e=>setMsgText(e.target.value.slice(0,max))}/>
                <div className="msgchar">{msgText.length}/{max}</div>
                <button className={`btn-primary ${isSending?"sending":""}`} style={{marginTop:"10px"}} onClick={handleSend} disabled={msgText.trim().length<10}>
                  <span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"7px"}}><Ic n="send" size={14} c="#fff"/>Отправить</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── REGISTRATION (MULTI-STEP) ─────────────────────────────────────────────────
function AuthScreen({onAuth}){
  const [mode, setMode]=useState("login");
  const [step, setStep]=useState(0);
  const [form, setForm]=useState({
    name:"", email:"", password:"", age:"", gender:"", region:"",
    renterType:"looking", address:"", lat:null, lng:null,
    budget:"", occupation:"", schedule:"", move_in:"", cleanliness:3, social:3,
    pets:false, smoking:false, remote:false, alcohol:false, schedule: "Гибкий",
    religion:"Нет", guests:"Иногда", noise:"Умеренная",
    studyWork:"Работа", languages:[], bio:"",
  });
const [loading, setLoading] = useState(false);

  // --- NEW LOGIN LOGIC ---
  const handleLoginSubmit = async () => {
    setLoading(true);
    try {
      const response = await api.login(form.email, form.password);
      api.setToken(response.access_token);
      
      // Fetch full profile to get name, age, etc.
      const userProfile = await api.getCurrentUser();
      onAuth(userProfile); // This sends user data to the parent (App.js)
    } catch (err) {
      alert("Ошибка входа: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- NEW REGISTRATION LOGIC ---
  const handleRegisterSubmit = async () => {
    setLoading(true);
    let validSchedule = form.schedule;
    if (validSchedule === "Переменный") validSchedule = "Гибкий";
    try {
      // Prepare data to match your Python UserRegister model
      const registerData = {
        ...form,
        age: parseInt(form.age),
        budget: parseInt(form.budget) || 0,
        renter_type: form.renterType, // Map camelCase to snake_case for Python
        study_work: form.studyWork,   // Map camelCase to snake_case for Python
        tags: [] // You can add tag selection later
      };

      const response = await api.register(registerData);
      api.setToken(response.access_token);
      
      // Fetch profile after registration
      const userProfile = await api.getCurrentUser();
      onAuth(userProfile);
    } catch (err) {
      alert("Ошибка регистрации: " + err.message);
    } finally {
      setLoading(false);
    }
  };
  const upd=(k,v)=>setForm(f=>({...f,[k]:v}));
  const toggleLang=(l)=>setForm(f=>({...f,languages:f.languages.includes(l)?f.languages.filter(x=>x!==l):[...f.languages,l]}));

  const handleLogin=()=>{
    const n=form.name||form.email.split("@")[0];
    const initials=n.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2)||"??";
    onAuth({...form,name:n,initials,verified:false});
  };

  const STEPS=["Основное","Жильё","Образ жизни","О себе"];

  const stepContent=()=>{
    if(step===0) return(
      <>
        <div className="step-title">Основная информация</div>
        <div className="step-sub">Расскажите немного о себе</div>
        <div className="grid2">
          <div className="fg-form">
            <label className="fl">Имя *</label>
            <input className="fi" placeholder="Айгерим" value={form.name} onChange={e=>upd("name",e.target.value)}/>
          </div>
          <div className="fg-form">
            <label className="fl">Возраст *</label>
            <input className="fi" type="number" placeholder="23" value={form.age} onChange={e=>upd("age",e.target.value)}/>
          </div>
        </div>
        <div className="fg-form">
          <label className="fl">Email *</label>
          <input className="fi" type="email" placeholder="mail@example.com" value={form.email} onChange={e=>upd("email",e.target.value)}/>
        </div>
        <div className="fg-form">
          <label className="fl">Пароль *</label>
          <input className="fi" type="password" placeholder="••••••••" value={form.password} onChange={e=>upd("password",e.target.value)}/>
        </div>
        <div className="fg-form">
          <label className="fl">Пол *</label>
          <div className="chip-row">
            {[["♀ Девушка","female"],["♂ Парень","male"]].map(([l,v])=>(
              <button key={v} className={`chip-sel ${form.gender===v?"on":""}`} onClick={()=>upd("gender",v)}>{l}</button>
            ))}
          </div>
        </div>
        <div className="fg-form">
          <label className="fl">Регион *</label>
          <select className="fi" value={form.region} onChange={e=>upd("region",e.target.value)}>
            <option value="">Выберите регион</option>
            {KZ_REGIONS.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
        
        <div className="fg-form">
          <label className="fl">Ваша ситуация *</label>
          <div className="chip-row" style={{gap:"10px"}}>
            <button 
              className={`chip-sel ${form.renterType==="looking"?"on":""}`}
              onClick={()=>upd("renterType","looking")}
              style={{flex:1,textAlign:"center",padding:"14px 16px"}}
            >
              <div style={{fontSize:"20px",marginBottom:"4px"}}>🔍</div>
              <div style={{fontSize:"13px",fontWeight:"700"}}>Ищу жильё</div>
              <div style={{fontSize:"10px",opacity:".7",marginTop:"2px"}}>Ищу квартиру + соседа</div>
            </button>
            <button 
              className={`chip-sel ${form.renterType==="has_place"?"on":""}`}
              onClick={()=>upd("renterType","has_place")}
              style={{flex:1,textAlign:"center",padding:"14px 16px"}}
            >
              <div style={{fontSize:"20px",marginBottom:"4px"}}>🏠</div>
              <div style={{fontSize:"13px",fontWeight:"700"}}>Есть жильё</div>
              <div style={{fontSize:"10px",opacity:".7",marginTop:"2px"}}>Ищу соседа к себе</div>
            </button>
          </div>
        </div>

        {form.renterType === "has_place" && (
          <div className="fg-form" style={{
            background:"linear-gradient(135deg,#f0fdf4,var(--accent-light))",
            padding:"16px",
            borderRadius:"var(--rs)",
            border:"2px solid var(--accent)"
          }}>
            <label className="fl" style={{color:"var(--accent2)"}}>📍 Адрес вашего жилья *</label>
            <input 
              className="fi" 
              placeholder="ул. Абая 150, кв. 45" 
              value={form.address} 
              onChange={e=>upd("address",e.target.value)}
            />
            
            <AddressMapSelector
              address={form.address}
              lat={form.lat}
              lng={form.lng}
              region={form.region}
              onAddressChange={(addr) => upd("address", addr)}
              onLocationChange={(lat, lng) => {
                setForm(f => ({ ...f, lat, lng }));
              }}
            />
            
            <div style={{fontSize:"11px",color:"var(--mid)",marginTop:"6px",lineHeight:"1.5"}}>
              💡 Вы можете ввести адрес вручную или кликнуть на карту. Точное местоположение будет видно только совпадениям.
            </div>
            
            {form.lat && form.lng && (
              <div style={{
                marginTop: '10px',
                padding: '8px 12px',
                background: 'rgba(255,255,255,.7)',
                borderRadius: '8px',
                fontSize: '11px',
                color: '#666',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span style={{fontSize:'14px'}}>✓</span>
                <span>Координаты: {form.lat.toFixed(5)}, {form.lng.toFixed(5)}</span>
              </div>
            )}
          </div>
        )}
      </>
    );
    if(step===1) return(
      <>
        <div className="step-title">Жильё и работа</div>
        <div className="step-sub">Ваши условия и требования</div>
        <div className="grid2">
          <div className="fg-form">
            <label className="fl">Бюджет (₸/мес)</label>
            <input className="fi" type="number" placeholder="80000" value={form.budget} onChange={e=>upd("budget",e.target.value)}/>
          </div>
          <div className="fg-form">
            <label className="fl">Дата заезда</label>
            <input className="fi" type="date" value={form.move_in} onChange={e=>upd("move_in",e.target.value)}/>
          </div>
        </div>
        <div className="fg-form">
          <label className="fl">Профессия / учёба</label>
          <input className="fi" placeholder="Студентка, дизайнер, врач…" value={form.occupation} onChange={e=>upd("occupation",e.target.value)}/>
        </div>
        <div className="fg-form">
          <label className="fl">Статус</label>
          <div className="chip-row">
            {[["💼 Работа","Работа"],["📚 Учёба","Учёба"],["🔄 Оба","Оба"]].map(([l,v])=>(
              <button key={v} className={`chip-sel ${form.studyWork===v?"on":""}`} onClick={()=>upd("studyWork",v)}>{l}</button>
            ))}
          </div>
        </div>
        <div className="fg-form">
          <label className="fl">Удалённая работа</label>
          <div className="chip-row">
            <button className={`chip-sel ${form.remote?"on":""}`} onClick={()=>upd("remote",true)}>💻 Да</button>
            <button className={`chip-sel ${!form.remote?"on":""}`} onClick={()=>upd("remote",false)}>🏢 Нет</button>
          </div>
        </div>
        <div className="fg-form">
          <label className="fl">Режим дня</label>
          <div className="chip-row">
            {[["🌅 Жаворонок","Жаворонок"],["🌙 Сова","Сова"],["🔄 Гибкий","Гибкий"]].map(([l,v])=>(
              <button key={v} className={`chip-sel ${form.schedule===v?"on":""}`} onClick={()=>upd("schedule",v)}>{l}</button>
            ))}
          </div>
        </div>
        <div className="fg-form">
          <label className="fl">Языки</label>
          <div className="chip-row">
            {["Казахский","Русский","Английский"].map(l=>(
              <button key={l} className={`chip-sel ${form.languages.includes(l)?"on":""}`} onClick={()=>toggleLang(l)}>{l==="Казахский"?"🇰🇿":l==="Русский"?"🇷🇺":"🌍"} {l}</button>
            ))}
          </div>
        </div>
      </>
    );
    if(step===2) return(
      <>
        <div className="step-title">Образ жизни</div>
        <div className="step-sub">Это поможет найти совместимого соседа</div>
        {[["Чистоплотность","cleanliness",["😕 Нет","😐 Средне","🙂 Хорошо","😊 Очень","✨ Идеал"]],["Общительность","social",["🤫 Тихоня","😐 Средне","🙂 Общаюсь","😄 Активный","🎉 Тусовщик"]]].map(([l,k,labels])=>(
          <div className="fg-form" key={k}>
            <label className="fl">{l}: <span style={{color:"var(--accent)",fontWeight:"700"}}>{labels[form[k]-1]}</span></label>
            <input type="range" className="frange" min={1} max={5} value={form[k]} onChange={e=>upd(k,+e.target.value)}/>
          </div>
        ))}
        <div className="fg-form">
          <label className="fl">Вредные привычки</label>
          <div className="chip-row">
            <button className={`chip-sel ${form.smoking?"on":""}`} onClick={()=>upd("smoking",!form.smoking)}>🚬 Курю</button>
            <button className={`chip-sel ${form.alcohol?"on":""}`} onClick={()=>upd("alcohol",!form.alcohol)}>🍷 Пью алкоголь</button>
          </div>
        </div>
        <div className="fg-form">
          <label className="fl">Питомцы</label>
          <div className="chip-row">
            <button className={`chip-sel ${form.pets?"on":""}`} onClick={()=>upd("pets",true)}>🐾 Есть питомец</button>
            <button className={`chip-sel ${!form.pets?"on":""}`} onClick={()=>upd("pets",false)}>🚫 Нет питомца</button>
          </div>
        </div>
        <div className="fg-form">
          <label className="fl">Гости</label>
          <div className="chip-row">
            {[["Никогда","Никогда"],["Редко","Редко"],["Иногда","Иногда"],["Часто","Часто"]].map(([l,v])=>(
              <button key={v} className={`chip-sel ${form.guests===v?"on":""}`} onClick={()=>upd("guests",v)}>{l}</button>
            ))}
          </div>
        </div>
        <div className="fg-form">
          <label className="fl">Уровень шума дома</label>
          <div className="chip-row">
            {[["🤫 Тихо","Тихая"],["🔉 Умеренно","Умеренная"],["🔊 Шумно","Шумная"]].map(([l,v])=>(
              <button key={v} className={`chip-sel ${form.noise===v?"on":""}`} onClick={()=>upd("noise",v)}>{l}</button>
            ))}
          </div>
        </div>
        <div className="fg-form">
          <label className="fl">Вероисповедание</label>
          <div className="chip-row">
            {[["Мусульман(ка)","Мусульманка"],["Нерелигиозный","Нет"],["Другое","Другое"]].map(([l,v])=>(
              <button key={v} className={`chip-sel ${form.religion===v||(form.religion==="Мусульманин"&&v==="Мусульманка")?"on":""}`} onClick={()=>upd("religion",v==="Мусульманка"?(form.gender==="male"?"Мусульманин":"Мусульманка"):v)}>{l}</button>
            ))}
          </div>
        </div>
      </>
    );
    if(step===3) return(
      <>
        <div className="step-title">О себе</div>
        <div className="step-sub">Последний шаг — расскажите о себе!</div>
        <div className="fg-form">
          <label className="fl">Коротко о себе</label>
          <textarea className="fi" style={{height:"100px",resize:"vertical"}} placeholder="Я студентка 3-го курса, тихая и аккуратная. Ищу соседку рядом с университетом…" value={form.bio} onChange={e=>upd("bio",e.target.value)}/>
        </div>
        <div style={{background:"var(--bg2)",borderRadius:"var(--rs)",padding:"16px",marginBottom:"16px"}}>
          <div style={{fontSize:"13px",fontWeight:"700",color:"var(--mid)",marginBottom:"10px"}}>📋 Ваша анкета:</div>
          <div style={{fontSize:"13px",color:"var(--mid)",lineHeight:"1.8"}}>
            <div>👤 {form.name}, {form.age} лет · {form.gender==="female"?"♀ Девушка":"♂ Парень"}</div>
            <div>📍 {KZ_REGIONS.find(r=>r.id===form.region)?.name||"Не указан"}</div>
            <div>💰 {(+form.budget||0).toLocaleString()} ₸/мес · 📅 {form.move_in||"Не указано"}</div>
            <div>🕐 {form.schedule||"Не указан"} · {form.remote?"💻 Удалёнка":"🏢 Офис"}</div>
            {form.smoking&&<div>🚬 Курю</div>}
            {form.alcohol&&<div>🍷 Пью алкоголь</div>}
            {form.pets&&<div>🐾 Есть питомец</div>}
          </div>
        </div>
      </>
    );
  };

  if(mode==="login") return(
    <div className="auth-wrap">
      <div className="auth-left">
        <div style={{textAlign:"center"}}>
          <div style={{fontFamily:"Cormorant Garamond",fontSize:"52px",fontWeight:"700",color:"#fff",lineHeight:1}}>Сосед<span style={{color:"var(--warm)"}}>КЗ</span></div>
          <div style={{color:"rgba(255,255,255,.7)",fontSize:"16px",marginTop:"12px"}}>Найдите идеального соседа в Казахстане</div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:"16px",width:"100%",maxWidth:"320px"}}>
          {["🏠 Реальные анкеты по всему Казахстану","📍 Карта с геолокацией","💬 Одно сообщение — один шанс","♀ Фильтр только для девушек"].map(t=>(
            <div key={t} style={{background:"rgba(255,255,255,.08)",borderRadius:"12px",padding:"14px 18px",color:"rgba(255,255,255,.85)",fontSize:"14px"}}>{t}</div>
          ))}
        </div>
      </div>
      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-logo">Сосед<span>КЗ</span></div>
          <p className="auth-sub">Найдите идеального соседа в Казахстане 🇰🇿</p>
          <div className="atabs">
            <button className={`atab ${mode==="login"?"active":""}`} onClick={()=>setMode("login")}>Вход</button>
            <button className={`atab ${mode==="register"?"active":""}`} onClick={()=>{setMode("register");setStep(0);}}>Регистрация</button>
          </div>
          <div className="fg-form">
            <label className="fl">Email</label>
            <input className="fi" type="email" placeholder="mail@example.com" value={form.email} onChange={e=>upd("email",e.target.value)}/>
          </div>
          <div className="fg-form" style={{marginBottom:"24px"}}>
            <label className="fl">Пароль</label>
            <input className="fi" type="password" placeholder="••••••••" value={form.password} onChange={e=>upd("password",e.target.value)}/>
          </div>
          <button className="btn-primary" onClick={handleLoginSubmit} disabled={loading}>
            {loading ? "Загрузка..." : "Войти →"}
         </button>
          <p style={{textAlign:"center",fontSize:"12px",color:"var(--muted)",marginTop:"16px"}}>
            Нет аккаунта?&nbsp;<span style={{color:"var(--accent)",cursor:"pointer",fontWeight:"700"}} onClick={()=>{setMode("register");setStep(0);}}>Зарегистрироваться</span>
          </p>
        </div>
      </div>
    </div>
  );

  return(
    <div className="auth-wrap">
      <div className="auth-left">
        <div style={{textAlign:"center"}}>
          <div style={{fontFamily:"Cormorant Garamond",fontSize:"52px",fontWeight:"700",color:"#fff",lineHeight:1}}>Сосед<span style={{color:"var(--warm)"}}>КЗ</span></div>
          <div style={{color:"rgba(255,255,255,.7)",fontSize:"16px",marginTop:"12px"}}>Шаг {step+1} из {STEPS.length}: {STEPS[step]}</div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:"12px",width:"100%",maxWidth:"300px"}}>
          {STEPS.map((s,i)=>(
            <div key={s} style={{display:"flex",alignItems:"center",gap:"12px",opacity:i<=step?1:.4}}>
              <div style={{width:"28px",height:"28px",borderRadius:"50%",background:i<step?"var(--accent)":i===step?"var(--warm)":"rgba(255,255,255,.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"13px",fontWeight:"700",color:"#fff",flexShrink:0}}>{i<step?"✓":i+1}</div>
              <span style={{color:"rgba(255,255,255,.85)",fontSize:"14px",fontWeight:i===step?"700":"400"}}>{s}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-logo" style={{fontSize:"26px",marginBottom:"4px"}}>Сосед<span>КЗ</span></div>
          <div className="atabs" style={{marginBottom:"20px"}}>
            <button className="atab" onClick={()=>setMode("login")}>Вход</button>
            <button className="atab active">Регистрация</button>
          </div>
          <div className="reg-steps">
            {STEPS.map((_,i)=><div key={i} className={`reg-step ${i<step?"done":i===step?"active":""}`}/>)}
          </div>
          <div style={{maxHeight:"calc(80vh - 220px)",overflowY:"auto",paddingRight:"4px"}}>
            {stepContent()}
          </div>
          <div className="step-nav">
            {step>0&&<button className="btn-back" onClick={()=>setStep(s=>s-1)}>← Назад</button>}
            {step<STEPS.length-1?(
              <button className="btn-next" onClick={()=>setStep(s=>s+1)}>Далее →</button>
            ):(
              <button className="btn-next" onClick={handleRegisterSubmit} disabled={loading}>
               {loading ? "Создаем..." : "Создать профиль 🎉"}
               </button>
            )}
          </div>
          <p style={{textAlign:"center",fontSize:"11px",color:"var(--muted)",marginTop:"12px"}}>
            Уже есть аккаунт?&nbsp;<span style={{color:"var(--accent)",cursor:"pointer",fontWeight:"700"}} onClick={()=>setMode("login")}>Войти</span>
          </p>
        </div>
      </div>
    </div>
  );
}
