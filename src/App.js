import { useState, useEffect, useRef, useCallback } from "react";
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
  --match:#f59e0b;
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
/* PHOTO UPLOAD */
.photo-upload-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:8px;}
.photo-slot{aspect-ratio:3/4;border-radius:14px;border:2px dashed var(--bg2);background:var(--bg);display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;transition:all .22s cubic-bezier(.34,1.56,.64,1);position:relative;overflow:hidden;}
.photo-slot:hover{border-color:var(--accent);background:var(--accent-light);transform:translateY(-2px);box-shadow:0 6px 18px rgba(61,122,92,.14);}
.photo-slot.filled{border:2px solid transparent;background:transparent;}
.photo-slot.filled:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,.14);}
.photo-slot img{width:100%;height:100%;object-fit:cover;border-radius:12px;}
.photo-slot-overlay{position:absolute;inset:0;background:rgba(30,42,34,.0);transition:background .2s;border-radius:12px;display:flex;align-items:center;justify-content:center;}
.photo-slot.filled:hover .photo-slot-overlay{background:rgba(30,42,34,.45);}
.photo-slot-del{opacity:0;background:rgba(201,74,58,.92);border:none;border-radius:50%;width:30px;height:30px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:opacity .2s,transform .2s;color:#fff;font-size:14px;}
.photo-slot.filled:hover .photo-slot-del{opacity:1;transform:scale(1.1);}
.photo-slot-label{position:absolute;bottom:6px;left:0;right:0;text-align:center;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--accent2);background:rgba(255,255,255,.88);padding:3px 0;border-radius:0 0 10px 10px;}
.photo-slot-empty-ic{color:var(--muted);margin-bottom:6px;opacity:.6;}
.photo-slot-empty-txt{font-size:11px;font-weight:700;color:var(--muted);}
.photo-upload-tip{font-size:11px;color:var(--muted);text-align:center;margin-top:4px;}
.chat-send{width:44px;height:44px;border-radius:13px;background:linear-gradient(135deg,var(--accent),var(--accent2));border:none;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .22s cubic-bezier(.34,1.56,.64,1);flex-shrink:0;box-shadow:0 4px 14px rgba(61,122,92,.25);}
.chat-send:hover:not(:disabled){transform:translateY(-2px) scale(1.08);box-shadow:0 8px 22px rgba(61,122,92,.38);}
.chat-send:active:not(:disabled){transform:scale(0.92);}
.chat-send:disabled{background:linear-gradient(135deg,#e5e7eb,#d1d5db);cursor:default;box-shadow:none;}
.sent-preview{background:linear-gradient(135deg,#f5f5f4,#e7e5e4);border-radius:12px;padding:10px 14px;font-size:13px;color:var(--mid);margin-top:8px;border-left:4px solid var(--accent);font-style:italic;word-break:break-word;line-height:1.5;}

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
@keyframes swipeRight{to{transform:translateX(120%) rotate(20deg);opacity:0}}
@keyframes swipeLeft{to{transform:translateX(-120%) rotate(-20deg);opacity:0}}
@keyframes cardEnter{from{opacity:0;transform:translateY(24px) scale(.97)}to{opacity:1;transform:none}}
@keyframes pageUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}
@keyframes popIn{from{opacity:0;transform:scale(.92)}to{opacity:1;transform:scale(1)}}
.modern-swipe-card{animation:cardEnter .35s cubic-bezier(.34,1.2,.64,1);}
.swipe-right{animation:swipeRight .32s ease forwards!important;}
.swipe-left{animation:swipeLeft .32s ease forwards!important;}
.page{animation:pageUp .35s cubic-bezier(.34,1.2,.64,1);}
.auth-card{animation:popIn .4s cubic-bezier(.34,1.56,.64,1);}
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
const fmt = (d = new Date()) =>
  `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

export function useRealtimeChat(authUserId, apiClient, { onMatch } = {}) {  
  const [conversations, setConversations] = useState({});
  const [connected, setConnected] = useState(false);
  const [typingFor, setTypingFor] = useState(null);

  const wsRef = useRef(null);
  const pollRef = useRef(null);
  const retriesRef = useRef(0);
  const lastIdRef = useRef({});
  const typingTimers = useRef({});

  const appendMsg = useCallback((profileId, msg) => {
    setConversations((prev) => {
      const existing = prev[profileId] || [];
      // Exact id dedup
      if (msg.id && existing.some((m) => m.id === msg.id)) return prev;
      // Replace optimistic placeholder: same text + mine, id starts with opt_
      const optIdx = existing.findIndex(
        (m) => String(m.id).startsWith("opt_") && m.text === msg.text && m.mine === msg.mine
      );
      if (optIdx !== -1 && !String(msg.id).startsWith("opt_")) {
        const next = [...existing];
        next[optIdx] = { ...next[optIdx], ...msg };
        if (msg.created_at) lastIdRef.current[profileId] = msg.created_at;
        return { ...prev, [profileId]: next };
      }
      if (optIdx !== -1) return prev; // duplicate optimistic, skip
      if (msg.created_at) lastIdRef.current[profileId] = msg.created_at;
      return { ...prev, [profileId]: [...existing, msg] };
    });
  }, []);

  const updateMsgStatus = useCallback((profileId, optimisticId, update) => {
    setConversations((prev) => ({
      ...prev,
      [profileId]: (prev[profileId] || []).map((m) =>
        m.id === optimisticId ? { ...m, ...update } : m
      ),
    }));
  }, []);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  // ── Bootstrap: load message history for all existing matches ─────────────
  // ← PATCH: new function — runs once on connect
  const bootstrapConversations = useCallback(async () => {
    if (!apiClient) return;
    try {
      const matches = await apiClient.getMatches();
      for (const match of matches) {
        const otherId = match.user?.id;
        if (!otherId) continue;
        try {
          const msgs = await apiClient.getMessages(otherId);
          if (!msgs?.length) continue;
          const normalised = msgs.map((m) => ({
            id: m.id,
            text: m.content ?? m.text,
            mine: String(m.sender_id) === String(authUserId),
            time: fmt(new Date(m.created_at)),
            status: "received",
          }));
          setConversations((prev) => {
            // Don't overwrite optimistic messages already in state
            if (prev[otherId]?.length) return prev;
            return { ...prev, [otherId]: normalised };
          });
          if (msgs.length > 0) {
            lastIdRef.current[otherId] = msgs[msgs.length - 1].id;
          }
        } catch (_) {}
      }
    } catch (_) {}
  }, [apiClient, authUserId]);

  const startPolling = useCallback(() => {
    if (pollRef.current) return;
    pollRef.current = setInterval(async () => {
      const profileIds = [
        ...Object.keys(lastIdRef.current),
        ...Object.keys(conversations),
      ];
      const unique = [...new Set(profileIds)];
      for (const pid of unique) {
        try {
          const sinceAt = lastIdRef.current[pid] || null;
          const msgs = await apiClient.getMessages(String(pid), sinceAt);
          msgs.forEach((m) => {
            appendMsg(String(pid), {
              id: m.id,
              text: m.content ?? m.text,
              mine: String(m.sender_id) === String(authUserId),
              time: fmt(new Date(m.created_at)),
              status: "received",
            });
          });
        } catch (_) {}
      }
    }, 3000);
  }, [apiClient, authUserId, appendMsg, conversations]);

  const connectWS = useCallback(() => {
    if (!authUserId || !apiClient) return;
    try {
      const url = apiClient.wsUrl();
      const ws = new WebSocket(url);
      wsRef.current = ws;
      let pingInterval;

      ws.onopen = () => {
        setConnected(true);
        retriesRef.current = 0;
        stopPolling();
        bootstrapConversations();  // ← PATCH: bootstrap on fresh WS connect
        pingInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN)
            ws.send(JSON.stringify({ type: "ping" }));
        }, 20000);
      };

      ws.onmessage = (evt) => {
        try {
          const data = JSON.parse(evt.data);
          if (data.type === "pong") return;

          if (data.type === "typing") {
            const sid = Number(data.sender_id);
            setTypingFor(sid);
            clearTimeout(typingTimers.current[sid]);
            typingTimers.current[sid] = setTimeout(
              () => setTypingFor((p) => (p === sid ? null : p)),
              3000
            );
            return;
          }
// handle match notifications
          if (data.type === "match") {
            onMatch?.(data.with_user_id, data.match_id);
            // Bootstrap messages for the NEW match immediately —
            // without this, the other user sees 0 messages until page refresh
            if (apiClient && data.with_user_id) {
              apiClient.getMessages(data.with_user_id).then((msgs) => {
                if (!msgs?.length) return;
                const normalised = msgs.map((m) => ({
                  id:     m.id,
                  text:   m.content ?? m.text,
                  mine:   String(m.sender_id) === String(authUserId),
                  time:   fmt(new Date(m.created_at)),
                  status: "received",
                }));
                setConversations((prev) => ({
                  ...prev,
                  [data.with_user_id]: prev[data.with_user_id]?.length
                    ? prev[data.with_user_id]   // don't overwrite if already has msgs
                    : normalised,
                }));
                if (msgs.length > 0) {
                  lastIdRef.current[data.with_user_id] = msgs[msgs.length - 1].id;
                }
              }).catch(() => {});
            }
            return;
          }

          if (data.type === "message") {
            const isMine = String(data.sender_id) === String(authUserId);
            const threadId = isMine ? String(data.receiver_id) : String(data.sender_id);
            appendMsg(threadId, {
              id: data.id ?? `ws_${Date.now()}`,
              text: data.text ?? data.content,
              mine: isMine,
              time: fmt(),
              status: isMine ? "sent" : "received",
              created_at: data.created_at ?? new Date().toISOString(),
            });
          }
        } catch (_) {}
      };

      ws.onclose = () => {
        setConnected(false);
        clearInterval(pingInterval);
        wsRef.current = null;
        const delay = Math.min(1000 * 2 ** retriesRef.current, 30000);
        retriesRef.current += 1;
        setTimeout(connectWS, delay);
        startPolling();
      };

      ws.onerror = () => ws.close();
    } catch (_) {
      setConnected(false);
      startPolling();
      bootstrapConversations();  // ← PATCH: also bootstrap when WS unavailable
    }
  }, [authUserId, apiClient, appendMsg, startPolling, stopPolling, bootstrapConversations, onMatch]);

  useEffect(() => {
    if (!authUserId) return;
    connectWS();
    const timers = typingTimers.current;
    return () => {
      wsRef.current?.close();
      stopPolling();
      Object.values(timers).forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUserId]);

  const sendMessage = useCallback(
    async (profileId, text) => {
      if (!text.trim()) return;
      const optimisticId = `opt_${Date.now()}`;
      appendMsg(profileId, { id: optimisticId, text, mine: true, time: fmt(), status: "sending" });
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "message", receiver_id: profileId, text }));
        // Don't change the id here — let the server echo (appendMsg) replace the optimistic
        updateMsgStatus(profileId, optimisticId, { status: "sending" });
        return;
      }
      try {
        const saved = await apiClient.sendMessage(profileId, text);
        updateMsgStatus(profileId, optimisticId, { id: saved.id, status: "sent" });
      } catch (err) {
        updateMsgStatus(profileId, optimisticId, { status: "failed" });
        console.error("sendMessage error:", err);
      }
    },
    [apiClient, appendMsg, updateMsgStatus]
  );

  const sendTyping = useCallback((profileId) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "typing", receiver_id: profileId }));
    }
  }, []);

  return {
    conversations,
    setConversations,   // ← PATCH: exposed so App can pass it to legacy hooks
    sendMessage,
    sendTyping,
    connected,
    typingFor,
  };
}

// ── MODAL ICON COMPONENT (PascalCase to satisfy react/jsx-pascal-case) ────────
const ModalIc = ({ n, size = 18, c = "currentColor" }) => {
  const icons = {
    check: <svg width={size} height={size} fill="none" stroke={c} strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>,
    send:  <svg width={size} height={size} fill="none" stroke={c} strokeWidth="2"   viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
    msg:   <svg width={size} height={size} fill="none" stroke={c} strokeWidth="2"   viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
    x:     <svg width={size} height={size} fill="none" stroke={c} strokeWidth="2"   viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    heart: <svg width={size} height={size} fill="none" stroke={c} strokeWidth="2"   viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>,
    heartFill: <svg width={size} height={size} fill={c} stroke={c} strokeWidth="2" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>,
    pin:   <svg width={size} height={size} fill="none" stroke={c} strokeWidth="2"   viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>,
    user:  <svg width={size} height={size} fill="none" stroke={c} strokeWidth="2"   viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  };
  return icons[n] || null;
};

function injectSendStyles() {
  if (document.getElementById("send-btn-styles")) return;
  const s = document.createElement("style");
  s.id = "send-btn-styles";
  s.textContent = `
@keyframes btnShake {
  0%,100% { transform: translateX(0) scale(1); }
  10%     { transform: translateX(-4px) scale(0.98); }
  20%     { transform: translateX( 4px) scale(1.02); }
  30%     { transform: translateX(-3px) scale(0.99); }
  40%     { transform: translateX( 3px) scale(1.01); }
  50%     { transform: translateX(-2px) scale(1); }
  60%     { transform: translateX( 2px) scale(1); }
  70%     { transform: translateX(0)    scale(1); }
}
@keyframes checkGrow {
  0%   { transform: translate(-50%,-50%) scale(0)   rotate(-30deg); opacity:0; }
  50%  { transform: translate(-50%,-50%) scale(1.4) rotate(10deg);  opacity:1; }
  100% { transform: translate(-50%,-50%) scale(1)   rotate(0deg);   opacity:1; }
}
.btn-primary {
  position: relative;
  overflow: hidden;
}
.btn-primary.sending {
  animation: btnShake 0.7s ease;
  background: var(--accent2, #2e6048) !important;
  pointer-events: none;
}
.btn-primary.sending .send-label { opacity: 0; }
.btn-primary.sending::after {
  content: '✓';
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%,-50%) scale(0);
  font-size: 26px;
  color: #fff;
  font-weight: 700;
  animation: checkGrow 0.4s ease 0.35s forwards;
}
.send-label {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  transition: opacity 0.2s;
}
.msg-status { font-size: 10px; margin-left: 4px; }
.msg-status.sending { color: #aaa; }
.msg-status.sent    { color: var(--accent, #3d7a5c); }
.msg-status.failed  { color: #ef4444; }
  `;
  document.head.appendChild(s);
}


// Normalise a DB profile so the UI always gets consistent fields
const normaliseProfile = (p) => ({
  ...p,
  avatar:   getInitials(p.name),
  initials: getInitials(p.name),
  renterType: p.renter_type ?? p.renterType ?? "looking",
  studyWork: p.study_work ?? p.studyWork ?? "Работа",
  move_in: p.move_in || "—",
  photos: Array.isArray(p.photos) && p.photos.length
    ? p.photos
    : ["#e8a598", "#d4b5a0", "#c9a89a"],
  tags: Array.isArray(p.tags) ? p.tags : [],
  languages: Array.isArray(p.languages) ? p.languages : [],
  online: Boolean(p.online),
  verified: Boolean(p.verified),
  matched: Boolean(p.matched),
  liked: Boolean(p.liked),
});

const getInitials = (name = "") =>
  name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "??";


// ── PHOTO UPLOAD ──────────────────────────────────────────────────────────────
async function uploadPhoto(file) {
  const BASE  = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
  const token = localStorage.getItem("roommate_kz_token");
  const form  = new FormData();
  form.append("photo", file);
  const res = await fetch(`${BASE}/api/upload/photo`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${token}` },
    body: form,
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error || `HTTP ${res.status}`);
  }
  return (await res.json()).url;
}

function PhotoUpload({ photos, onChange, onSaved, label = "Фото профиля" }) {
  const inputRef              = useRef(null);
  const [slot, setSlot]       = useState(null);
  const [busy, setBusy]       = useState(false);
  const [err,  setErr]        = useState(null);
  const SLOTS = 3;

  const openPicker = (i) => { setSlot(i); setErr(null); inputRef.current.click(); };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    // Instant local preview via FileReader
    const reader = new FileReader();
    reader.onload = ev => {
      const p = [...photos]; p[slot] = ev.target.result; onChange(p);
    };
    reader.readAsDataURL(file);

    // Upload in background
    setBusy(true); setErr(null);
    try {
      const url = await uploadPhoto(file);
      // Swap base64 preview for real URL
      onChange(cur => { const p = Array.isArray(cur)?[...cur]:[null,null,null]; p[slot]=url; return p; });
      if (onSaved) { const fresh=[...photos]; fresh[slot]=url; onSaved(fresh.filter(Boolean)); }
    } catch(e) {
      setErr(e.message);
      onChange(cur => { const p=Array.isArray(cur)?[...cur]:[null,null,null]; p[slot]=null; return p; });
    } finally { setBusy(false); }
  };

  const remove = (e, i) => {
    e.stopPropagation();
    const p=[...photos]; p[i]=null; onChange(p);
    if (onSaved) onSaved(p.filter(Boolean));
  };

  return (
    <div className="fg-form">
      {label && <label className="fl">{label}</label>}
      {err && <div style={{color:"#e53e3e",fontSize:12,marginBottom:6}}>⚠ {err}</div>}
      <input ref={inputRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleFile}/>
      <div className="photo-upload-grid">
        {Array.from({length:SLOTS}).map((_,i) => {
          const url    = photos[i];
          const active = busy && slot === i;
          return (
            <div key={i}
              className={`photo-slot ${url?"filled":""}`}
              onClick={() => !url && !busy && openPicker(i)}
              style={url?{backgroundImage:`url(${url})`,backgroundSize:"cover",backgroundPosition:"center",border:"2px solid transparent"}:{}}>
              {url ? (
                <>
                  <div className="photo-slot-overlay">
                    <button className="photo-slot-del" onClick={e=>remove(e,i)}>✕</button>
                  </div>
                  {active && <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.55)",display:"flex",alignItems:"center",justifyContent:"center",borderRadius:12,color:"#fff",fontSize:12,fontWeight:700,gap:6}}><span style={{fontSize:18}}>⏳</span>Загрузка…</div>}
                  {i===0&&!active&&<div className="photo-slot-label">Главное</div>}
                </>
              ) : (
                <>
                  <div className="photo-slot-empty-ic">
                    {active
                      ? <div style={{fontSize:22,animation:"spin 1s linear infinite"}}>⏳</div>
                      : <svg width={26} height={26} fill="none" stroke="var(--muted)" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
                    }
                  </div>
                  <div className="photo-slot-empty-txt">{i===0?"+ Главное фото":`+ Фото ${i+1}`}</div>
                </>
              )}
            </div>
          );
        })}
      </div>
      <div className="photo-upload-tip">JPG, PNG · до 5 МБ · автосохранение</div>
    </div>
  );
}
// ── SWIPE TAB (TINDER STYLE) ─────────────────────────────────────────────────
function SwipeTab({ profiles, onLike, onPass, onViewProfile }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging]     = useState(false);
  const [dragX, setDragX]               = useState(0);
  const [dragY, setDragY]               = useState(0);
  const [isAnimatingOut, setIsAnimatingOut] = useState(null); // 'left' | 'right' | null
  const cardRef   = useRef(null);
  const startPos  = useRef({ x: 0, y: 0 });
  const animFrame = useRef(null);

  // ── helpers ────────────────────────────────────────────────────────────────
  const THRESHOLD = 100; // px needed to trigger like/pass

  const dismissCard = useCallback((direction) => {
    setIsAnimatingOut(direction);
    setTimeout(() => {
      if (direction === 'right') onLike(profiles[currentIndex]);
      else                       onPass(profiles[currentIndex]);
      setCurrentIndex(i => i + 1);
      setDragX(0);
      setDragY(0);
      setIsAnimatingOut(null);
    }, 380);
  }, [currentIndex, profiles, onLike, onPass]);

  // ── pointer events (works for both mouse and touch) ────────────────────────
  const onPointerDown = useCallback((e) => {
    if (isAnimatingOut) return;
    // Only react to primary button / single touch
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    startPos.current = { x: e.clientX, y: e.clientY };
    setIsDragging(true);
    setDragX(0);
    setDragY(0);
  }, [isAnimatingOut]);

  const onPointerMove = useCallback((e) => {
    if (!isDragging) return;
    cancelAnimationFrame(animFrame.current);
    animFrame.current = requestAnimationFrame(() => {
      setDragX(e.clientX - startPos.current.x);
      setDragY(e.clientY - startPos.current.y);
    });
  }, [isDragging]);

  const onPointerUp = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    if (Math.abs(dragX) > THRESHOLD) {
      dismissCard(dragX > 0 ? 'right' : 'left');
    } else {
      // Snap back
      setDragX(0);
      setDragY(0);
    }
  }, [isDragging, dragX, dismissCard]);

  // cleanup animation frame on unmount
  useEffect(() => () => cancelAnimationFrame(animFrame.current), []);

  // ── derived values ─────────────────────────────────────────────────────────
  const rotation   = dragX / 18;
  const likeOpacity  = Math.min(Math.max(dragX / THRESHOLD, 0), 1);
  const passOpacity  = Math.min(Math.max(-dragX / THRESHOLD, 0), 1);

  // ── empty states (all hooks already called above) ─────────────────────────
  if (!profiles || profiles.length === 0 || currentIndex >= profiles.length) {
    return (
      <div className="page" style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"calc(100vh - 64px)" }}>
        <div className="empty" style={{ paddingTop:"80px", textAlign:"center" }}>
          <div className="empty-ic" style={{ fontSize:"64px" }}>🎉</div>
          <div className="empty-t">Вы просмотрели всех!</div>
          <p>Попробуйте изменить фильтры или вернитесь позже</p>
          {currentIndex > 0 && (
            <button className="btn-primary" style={{ marginTop:"20px", maxWidth:"220px" }} onClick={() => setCurrentIndex(0)}>
              Начать сначала
            </button>
          )}
        </div>
      </div>
    );
  }

  const currentProfile = profiles[currentIndex];
  const nextProfile    = profiles[currentIndex + 1];
  const reg = KZ_REGIONS.find(r => r.id === currentProfile.region);

  // ── card transform ─────────────────────────────────────────────────────────
  let cardTransform = `translateX(${dragX}px) translateY(${dragY * 0.3}px) rotate(${rotation}deg)`;
  let cardTransition = isDragging ? 'none' : 'transform .35s cubic-bezier(.25,.46,.45,.94)';
  if (isAnimatingOut === 'right') {
    cardTransform = 'translateX(150%) rotate(30deg)';
    cardTransition = 'transform .38s cubic-bezier(.55,0,1,.45)';
  } else if (isAnimatingOut === 'left') {
    cardTransform = 'translateX(-150%) rotate(-30deg)';
    cardTransition = 'transform .38s cubic-bezier(.55,0,1,.45)';
  }

  const handleLikeBtn = () => { if (!isAnimatingOut) dismissCard('right'); };
  const handlePassBtn = () => { if (!isAnimatingOut) dismissCard('left');  };

  return (
    <div style={{
      display:"flex", flexDirection:"column", alignItems:"center",
      minHeight:"calc(100vh - 64px)",
      background:"linear-gradient(135deg, #fafaf9 0%, #f0ebe3 100%)",
      padding:"28px 16px 40px",
      userSelect:"none",
    }}>
      {/* Progress */}
      <div style={{
        width:"100%", maxWidth:"460px", marginBottom:"20px",
        background:"rgba(255,255,255,.7)", borderRadius:"16px",
        padding:"14px 20px", backdropFilter:"blur(10px)",
        boxShadow:"0 4px 20px rgba(0,0,0,.06)"
      }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"8px" }}>
          <span style={{ fontSize:"13px", fontWeight:"700", color:"var(--dark)" }}>
            Анкета {currentIndex + 1} из {profiles.length}
          </span>
          <span style={{ fontSize:"12px", color:"var(--muted)" }}>
            {Math.round(((currentIndex + 1) / profiles.length) * 100)}%
          </span>
        </div>
        <div style={{ width:"100%", height:"5px", background:"var(--bg2)", borderRadius:"10px", overflow:"hidden" }}>
          <div style={{
            width:`${((currentIndex + 1) / profiles.length) * 100}%`,
            height:"100%",
            background:"linear-gradient(90deg, var(--accent), var(--accent2))",
            borderRadius:"10px", transition:"width .3s ease"
          }}/>
        </div>
      </div>

      {/* Card stack */}
      <div style={{ width:"100%", maxWidth:"460px", position:"relative", height:"660px" }}>

        {/* Background (next) card */}
        {nextProfile && (
          <div style={{
            position:"absolute", inset:0, zIndex:1,
            background:"#fff", borderRadius:"24px",
            boxShadow:"0 8px 32px rgba(0,0,0,.10)",
            transform:`scale(${0.95 + Math.min(Math.abs(dragX) / THRESHOLD, 1) * 0.05})`,
            transition: isDragging ? 'none' : 'transform .35s ease',
            overflow:"hidden",
            backgroundImage: nextProfile.photos[0]?.startsWith('http')
              ? `url(${nextProfile.photos[0]})`
              : `linear-gradient(160deg,${nextProfile.photos[0]||'#d4b5a0'},${nextProfile.photos[2]||'#e8a598'})`,
            backgroundSize:"cover", backgroundPosition:"center",
          }}>
            <div style={{
              position:"absolute", inset:0,
              background:"linear-gradient(to top, rgba(0,0,0,.65) 0%, transparent 55%)",
            }}/>
            <div style={{ position:"absolute", bottom:"24px", left:"24px", color:"#fff" }}>
              <div style={{ fontFamily:"Cormorant Garamond,serif", fontSize:"32px", fontWeight:"700", textShadow:"0 2px 10px rgba(0,0,0,.5)" }}>
                {nextProfile.name}
              </div>
              <div style={{ fontSize:"18px", fontWeight:"600", opacity:".9", textShadow:"0 1px 6px rgba(0,0,0,.5)" }}>
                {nextProfile.age} лет
              </div>
            </div>
          </div>
        )}

        {/* Front (current) card */}
        <div
          ref={cardRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          style={{
            position:"absolute", inset:0, zIndex:10,
            borderRadius:"24px", overflow:"hidden",
            boxShadow:"0 20px 60px rgba(0,0,0,.18)",
            transform: cardTransform,
            transition: cardTransition,
            cursor: isDragging ? "grabbing" : "grab",
            touchAction:"none",
          }}
        >
          {/* Photo */}
          <div style={{
            height:"100%", position:"relative",
            backgroundImage: currentProfile.photos[0]?.startsWith('http')
              ? `url(${currentProfile.photos[0]})`
              : `linear-gradient(160deg,${currentProfile.photos[0]||'#c9a89a'},${currentProfile.photos[2]||'#e8a598'})`,
            backgroundSize:"cover", backgroundPosition:"center",
          }}>
            {/* Gradient overlay */}
            <div style={{
              position:"absolute", inset:0,
              background:"linear-gradient(to top, rgba(0,0,0,.75) 0%, transparent 55%)",
              pointerEvents:"none",
            }}/>

            {/* LIKE stamp */}
            <div style={{
              position:"absolute", top:"40px", left:"30px",
              border:"5px solid #22c55e", borderRadius:"12px",
              padding:"8px 20px", color:"#22c55e",
              fontFamily:"Nunito,sans-serif", fontSize:"32px", fontWeight:"900",
              letterSpacing:"2px", transform:"rotate(-20deg)",
              opacity: likeOpacity, pointerEvents:"none",
              textShadow:"0 0 20px rgba(34,197,94,.4)",
              boxShadow:"0 0 20px rgba(34,197,94,.15)",
            }}>ЛАЙК</div>

            {/* NOPE stamp */}
            <div style={{
              position:"absolute", top:"40px", right:"30px",
              border:"5px solid #ef4444", borderRadius:"12px",
              padding:"8px 20px", color:"#ef4444",
              fontFamily:"Nunito,sans-serif", fontSize:"32px", fontWeight:"900",
              letterSpacing:"2px", transform:"rotate(20deg)",
              opacity: passOpacity, pointerEvents:"none",
              textShadow:"0 0 20px rgba(239,68,68,.4)",
              boxShadow:"0 0 20px rgba(239,68,68,.15)",
            }}>НЕТ</div>

            {/* Top badges */}
            <div style={{ position:"absolute", top:"20px", left:"20px", display:"flex", gap:"8px", flexWrap:"wrap" }}>
              {currentProfile.online && (
                <div style={{ background:"rgba(76,175,80,.95)", backdropFilter:"blur(10px)", color:"#fff", padding:"5px 11px", borderRadius:"20px", fontSize:"12px", fontWeight:"700", display:"flex", alignItems:"center", gap:"5px" }}>
                  <span style={{ width:"6px", height:"6px", borderRadius:"50%", background:"#fff" }}/>Онлайн
                </div>
              )}
              {currentProfile.verified && (
                <div style={{ background:"rgba(61,122,92,.95)", backdropFilter:"blur(10px)", color:"#fff", padding:"5px 11px", borderRadius:"20px", fontSize:"12px", fontWeight:"700", display:"flex", alignItems:"center", gap:"5px" }}>
                  <Ic n="check" size={12} c="#fff"/>Верифицирован
                </div>
              )}
              {currentProfile.renterType && (
                <div style={{ background: currentProfile.renterType==="has_place" ? "rgba(251,191,36,.95)" : "rgba(14,165,233,.95)", backdropFilter:"blur(10px)", color:"#fff", padding:"5px 11px", borderRadius:"20px", fontSize:"12px", fontWeight:"700" }}>
                  {currentProfile.renterType==="has_place" ? "🏠 Есть жильё" : "🔍 Ищет"}
                </div>
              )}
            </div>

            {/* Bottom info overlay */}
            <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"24px", color:"#fff", pointerEvents:"none" }}>
              <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", marginBottom:"10px" }}>
                <div>
                  <div style={{ fontFamily:"Cormorant Garamond,serif", fontSize:"38px", fontWeight:"700", margin:0, textShadow:"0 2px 12px rgba(0,0,0,.6)", lineHeight:"1.05" }}>
                    {currentProfile.name}
                  </div>
                  <div style={{ fontSize:"22px", fontWeight:"600", marginTop:"3px", opacity:".95", textShadow:"0 1px 8px rgba(0,0,0,.5)" }}>
                    {currentProfile.age} лет
                  </div>
                </div>
                <div style={{ background:"rgba(255,255,255,.22)", backdropFilter:"blur(10px)", padding:"10px 16px", borderRadius:"16px", fontWeight:"700", fontSize:"17px", textShadow:"0 1px 4px rgba(0,0,0,.3)" }}>
                  {(currentProfile.budget || 0).toLocaleString()} ₸
                </div>
              </div>
              <div style={{ fontSize:"14px", opacity:".9", textShadow:"0 1px 6px rgba(0,0,0,.5)", display:"flex", alignItems:"center", gap:"5px", marginBottom:"8px" }}>
                <Ic n="pin" size={14} c="#fff"/>{reg?.name || currentProfile.region}
              </div>
              {currentProfile.bio && (
                <div style={{ fontSize:"14px", opacity:".82", textShadow:"0 1px 4px rgba(0,0,0,.5)", lineHeight:"1.5", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>
                  {currentProfile.bio}
                </div>
              )}
              {currentProfile.tags?.length > 0 && (
                <div style={{ display:"flex", flexWrap:"wrap", gap:"6px", marginTop:"10px", pointerEvents:"none" }}>
                  {currentProfile.tags.slice(0,4).map(t => (
                    <span key={t} style={{ background:"rgba(255,255,255,.18)", backdropFilter:"blur(6px)", color:"#fff", padding:"4px 10px", borderRadius:"10px", fontSize:"12px", fontWeight:"600", border:"1px solid rgba(255,255,255,.25)" }}>{t}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display:"flex", justifyContent:"center", gap:"24px", alignItems:"center", marginTop:"28px" }}>
        {/* Pass */}
        <button
          onClick={handlePassBtn}
          style={{ width:"72px", height:"72px", fontSize:"28px", background:"#fff", border:"3px solid #ef4444", color:"#ef4444", borderRadius:"50%", cursor:"pointer", transition:"all .2s cubic-bezier(.34,1.56,.64,1)", boxShadow:"0 6px 24px rgba(239,68,68,.2)", display:"flex", alignItems:"center", justifyContent:"center" }}
          onMouseEnter={e => { e.currentTarget.style.background="#ef4444"; e.currentTarget.style.color="#fff"; e.currentTarget.style.transform="scale(1.1)"; }}
          onMouseLeave={e => { e.currentTarget.style.background="#fff"; e.currentTarget.style.color="#ef4444"; e.currentTarget.style.transform="scale(1)"; }}
        >✕</button>

        {/* View profile */}
        <button
          onClick={() => onViewProfile(currentProfile)}
          style={{ width:"56px", height:"56px", background:"linear-gradient(135deg, var(--accent), var(--accent2))", border:"none", borderRadius:"50%", cursor:"pointer", transition:"all .2s cubic-bezier(.34,1.56,.64,1)", boxShadow:"0 6px 20px rgba(61,122,92,.28)", display:"flex", alignItems:"center", justifyContent:"center" }}
          onMouseEnter={e => e.currentTarget.style.transform="scale(1.1)"}
          onMouseLeave={e => e.currentTarget.style.transform="scale(1)"}
        ><Ic n="user" size={22} c="#fff"/></button>

        {/* Like */}
        <button
          onClick={handleLikeBtn}
          style={{ width:"72px", height:"72px", background:"linear-gradient(135deg, #f472b6, #ec4899)", border:"none", borderRadius:"50%", cursor:"pointer", transition:"all .2s cubic-bezier(.34,1.56,.64,1)", boxShadow:"0 6px 24px rgba(236,72,153,.3)", display:"flex", alignItems:"center", justifyContent:"center" }}
          onMouseEnter={e => e.currentTarget.style.transform="scale(1.1)"}
          onMouseLeave={e => e.currentTarget.style.transform="scale(1)"}
        ><Ic n="heart" size={30} c="#fff"/></button>
      </div>

      {/* Hint */}
      <div style={{ marginTop:"16px", fontSize:"12px", color:"var(--muted)", display:"flex", gap:"18px", justifyContent:"center" }}>
        <span>← Пропустить</span>
        <span>↑ Профиль</span>
        <span>→ Лайк</span>
      </div>
    </div>
  );
}

// ── ADDRESS MAP SELECTOR ──────────────────────────────────────────────────────
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
      const regionData = KZ_REGIONS.find(r => r.id === region);
      const center = lat && lng ? [lat, lng] : regionData ? [regionData.lat, regionData.lng] : [43.238, 76.945];
      const zoom = lat && lng ? 15 : 12;

      const map = L.map(mapRef.current, { center, zoom, zoomControl: true });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: '© OpenStreetMap', maxZoom: 18 }).addTo(map);
      mapInstanceRef.current = map;

      map.on('click', async (e) => {
        const { lat: clickLat, lng: clickLng } = e.latlng;
        if (markerRef.current) markerRef.current.remove();
        markerRef.current = L.marker([clickLat, clickLng], {
          icon: L.divIcon({ className: '', html: `<div style="background:#f59e0b;color:white;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 4px 16px rgba(0,0,0,.3);border:3px solid #fef3c7;">🏠</div>`, iconSize: [36, 36], iconAnchor: [18, 36] })
        }).addTo(map);
        onLocationChange(clickLat, clickLng);
        setIsGeocoding(true);
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${clickLat}&lon=${clickLng}&accept-language=ru`);
          const data = await response.json();
          if (data.address) {
            const addr = data.address;
            let addressString = '';
            if (addr.road) addressString += addr.road;
            if (addr.house_number) addressString += ' ' + addr.house_number;
            if (!addressString && addr.neighbourhood) addressString += addr.neighbourhood;
            if (!addressString && addr.suburb) addressString += addr.suburb;
            if (addressString) onAddressChange(addressString);
          }
        } catch (error) {
          console.log('Geocoding error:', error);
        } finally {
          setIsGeocoding(false);
        }
      });

      if (lat && lng) {
        markerRef.current = L.marker([lat, lng], {
          icon: L.divIcon({ className: '', html: `<div style="background:#f59e0b;color:white;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 4px 16px rgba(0,0,0,.3);border:3px solid #fef3c7;">🏠</div>`, iconSize: [36, 36], iconAnchor: [18, 36] })
        }).addTo(map);
      }
    };

    if (window.L) loadLeaflet();
    else {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
      script.onload = loadLeaflet;
      document.body.appendChild(script);
    }

    return () => {
      if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [region]);

  useEffect(() => {
    onLocationChange?.(lat, lng);
    if (!mapInstanceRef.current || !window.L) return;
    const L = window.L;
    const map = mapInstanceRef.current;
    if (lat && lng) {
      if (markerRef.current) markerRef.current.remove();
      markerRef.current = L.marker([lat, lng], {
        icon: L.divIcon({ className: '', html: `<div style="background:#f59e0b;color:white;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 4px 16px rgba(0,0,0,.3);border:3px solid #fef3c7;">🏠</div>`, iconSize: [36, 36], iconAnchor: [18, 36] })
      }).addTo(map);
      map.setView([lat, lng], 15);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng]);

  return (
    <div style={{ marginTop: '16px' }}>
      <div style={{ borderRadius: 'var(--r)', overflow: 'hidden', boxShadow: 'var(--sh)', border: '2px solid var(--accent)', marginBottom: '12px' }}>
        <div ref={mapRef} style={{ width: '100%', height: '300px' }} />
        <div style={{ background: 'linear-gradient(135deg,#fef3c7,#fde68a)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: '#92400e', fontWeight: '600' }}>
          <span style={{ fontSize: '18px' }}>💡</span>
          <span>{isGeocoding ? 'Определяю адрес...' : 'Кликните на карту, чтобы указать точное местоположение вашего жилья'}</span>
        </div>
      </div>
    </div>
  );
}

// ── LEAFLET MAP ───────────────────────────────────────────────────────────────
function LeafletMap({ profiles, onView, onRadiusFilterChange, authUser, focusRegion }) {
  const mapRef      = useRef(null);
  const instanceRef = useRef(null);
  const markersRef  = useRef([]);

  const onRadiusFilterChangeRef = useRef(onRadiusFilterChange);
  useEffect(() => { onRadiusFilterChangeRef.current = onRadiusFilterChange; }, [onRadiusFilterChange]);

  // ── 1. Init map once ──────────────────────────────────────────
  useEffect(() => {
    if (instanceRef.current) return;

    if (!document.getElementById("leaflet-css")) {
      const lnk = document.createElement("link");
      lnk.id   = "leaflet-css";
      lnk.rel  = "stylesheet";
      lnk.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
      document.head.appendChild(lnk);
    }

    const boot = () => {
      if (!mapRef.current || instanceRef.current) return;
      const L   = window.L;
      const map = L.map(mapRef.current, { center: [48.0, 68.0], zoom: 5 });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap", maxZoom: 18,
      }).addTo(map);

      instanceRef.current = map;

      let circle = null, center = null, drawing = false;

      map.on("mousedown", (e) => {
        if (e.originalEvent.button !== 2) return;
        e.originalEvent.preventDefault();
        drawing = true;
        center  = e.latlng;
        if (circle) { map.removeLayer(circle); circle = null; }
        circle = L.circle(center, { radius: 1000, color: "#3d7a5c", fillColor: "#d4ead9", fillOpacity: 0.25, weight: 3, dashArray: "10,10" }).addTo(map);
      });

      map.on("mousemove", (e) => {
        if (drawing && circle && center) circle.setRadius(map.distance(center, e.latlng));
      });

      map.on("mouseup", () => {
        if (!drawing) return;
        drawing = false;
        if (!circle || !center) return;
        const km = +(circle.getRadius() / 1000).toFixed(1);
        onRadiusFilterChangeRef.current?.({ lat: center.lat, lng: center.lng, radius: km });
        circle.bindPopup(
          `<div style="padding:10px;text-align:center;font-family:Nunito,sans-serif;">
             <b>🎯 Зона поиска</b><br/>
             <span style="font-size:12px;">Радиус: ${km} км</span><br/>
             <button id="clr-rc" style="margin-top:8px;padding:4px 12px;background:#c94a3a;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:11px;">Очистить ✕</button>
           </div>`
        ).openPopup();
        setTimeout(() => {
          const btn = document.getElementById("clr-rc");
          if (btn) btn.onclick = () => {
            onRadiusFilterChangeRef.current?.(null);
            if (circle) { map.removeLayer(circle); circle = null; }
            map.closePopup();
          };
        }, 80);
      });

      mapRef.current?.addEventListener("contextmenu", (e) => e.preventDefault());
    };

    if (window.L) boot();
    else {
      const sc = document.createElement("script");
      sc.src    = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
      sc.onload = boot;
      document.body.appendChild(sc);
    }

    return () => { instanceRef.current?.remove(); instanceRef.current = null; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 2. Fly to region ──────────────────────────────────────────
  useEffect(() => {
    if (!instanceRef.current || !window.L) return;
    const map = instanceRef.current;
    try {
      if (!focusRegion || focusRegion === "all") {
        map.flyTo([48.0, 68.0], 5, { duration: 1.2 });
        return;
      }
      const region = KZ_REGIONS.find(r => r.id === focusRegion);
      if (!region) return;
      map.flyTo([region.lat, region.lng], 11, { duration: 1.4 });
    } catch (_) {}
  }, [focusRegion]);

  // ── 3. Re-draw markers ────────────────────────────────────────
  useEffect(() => {
    if (!instanceRef.current || !window.L) return;
    const L   = window.L;
    const map = instanceRef.current;

    markersRef.current.forEach(m => { try { m.remove(); } catch (_) {} });
    markersRef.current = [];

    const pin = (bg, sym, sz = 36) =>
      `<div style="background:${bg};color:#fff;border-radius:50% 50% 50% 0;width:${sz}px;height:${sz}px;display:flex;align-items:center;justify-content:center;font-size:${Math.round(sz * 0.36)}px;font-weight:700;box-shadow:0 3px 10px rgba(0,0,0,.28);transform:rotate(-45deg);border:2.5px solid rgba(255,255,255,.85);"><span style="transform:rotate(45deg)">${sym}</span></div>`;

    const mkIcon = (html, sz) => L.divIcon({ className: "", html, iconSize: [sz, sz], iconAnchor: [sz / 2, sz], popupAnchor: [0, -(sz + 4)] });

    const ICONS = {
      f_looking: mkIcon(pin("#d4587a", "♀"),      36),
      m_looking: mkIcon(pin("#4a7abf", "♂"),      36),
      f_has:     mkIcon(pin("#f59e0b", "🏠", 40), 40),
      m_has:     mkIcon(pin("#f59e0b", "🏠", 40), 40),
    };

    [...new Set(profiles.map(p => p.region))].forEach(rid => {
      const r = KZ_REGIONS.find(x => x.id === rid);
      if (!r) return;
      try {
        markersRef.current.push(L.circle([r.lat, r.lng], { color: "#3d7a5c", fillColor: "#d4ead9", fillOpacity: 0.10, weight: 1.5, opacity: 0.35, radius: 40000, dashArray: "8,14", interactive: false }).addTo(map));
      } catch (_) {}
    });

    if (authUser?.lat && authUser?.lng && authUser?.renterType === "has_place") {
      const myIcon = L.divIcon({ className: "", html: `<div style="background:#10b981;color:#fff;border-radius:50%;width:46px;height:46px;display:flex;align-items:center;justify-content:center;font-size:22px;box-shadow:0 6px 24px rgba(16,185,129,.45);border:4px solid #d1fae5;position:relative;"><span style="position:absolute;top:-8px;right:-8px;background:#ef4444;width:15px;height:15px;border-radius:50%;border:2px solid #fff;"></span>🏠</div>`, iconSize: [46, 46], iconAnchor: [23, 46], popupAnchor: [0, -50] });
      try {
        const m = L.marker([authUser.lat, authUser.lng], { icon: myIcon }).addTo(map);
        m.bindPopup(`<div class="map-popup" style="border-top:4px solid #10b981;"><div class="map-popup-name">${authUser.name} <span style="color:#10b981;">(Вы)</span></div><div class="map-popup-info">${authUser.budget ? authUser.budget.toLocaleString() + " ₸/мес" : ""}</div>${authUser.address ? `<div style="margin-top:6px;padding:6px;background:#f0fdf4;border-radius:6px;font-size:11px;color:#166534;">📍 ${authUser.address}</div>` : ""}<div style="margin-top:8px;padding:6px;background:#fef3c7;border-radius:6px;font-size:10px;color:#92400e;text-align:center;">💡 Только вы видите точный адрес</div></div>`);
        markersRef.current.push(m);
      } catch (_) {}
    }

    profiles.forEach(p => {
      const region = KZ_REGIONS.find(r => r.id === p.region);
      let markerLat, markerLng;
      if (p.renterType === "has_place" && p.lat && p.lng) {
        markerLat = p.lat; markerLng = p.lng;
      } else if (region) {
        const seed = ((p.id ?? 0) * 2654435761) >>> 0;
        markerLat = region.lat + ((seed % 1000) / 1000 - 0.5) * 0.5;
        markerLng = region.lng + (((seed >> 8) % 1000) / 1000 - 0.5) * 0.7;
      } else return;

      const key  = `${p.gender === "female" ? "f" : "m"}_${p.renterType === "has_place" ? "has" : "looking"}`;
      const icon = ICONS[key] ?? ICONS.m_looking;

      try {
        const marker = L.marker([markerLat, markerLng], { icon }).addTo(map);
        marker.bindPopup(L.popup({ maxWidth: 260, closeButton: false }).setContent(`
          <div class="map-popup">
            <div class="map-popup-name">${p.name}, ${p.age}</div>
            <div class="map-popup-info">${region?.name ?? ""} · ${(p.budget || 0).toLocaleString()} ₸/мес</div>
            <div style="margin:8px 0;padding:6px 10px;border-radius:8px;font-size:11px;font-weight:700;background:${p.renterType==="has_place"?"#fef3c7":"#e0f2fe"};color:${p.renterType==="has_place"?"#92400e":"#075985"};">
              ${p.renterType==="has_place"?"🏠 Есть жильё":"🔍 Ищет жильё"}
            </div>
            ${p.address && p.renterType==="has_place" ? `<div style="margin-bottom:8px;font-size:11px;color:#555;">📍 ${p.address}</div>` : ""}
            <button class="map-popup-btn" id="mp-${p.id}">Открыть профиль</button>
          </div>`));
        marker.on("popupopen", () => {
          setTimeout(() => {
            const btn = document.getElementById(`mp-${p.id}`);
            if (btn) btn.onclick = () => { map.closePopup(); onView(p); };
          }, 50);
        });
        markersRef.current.push(marker);
      } catch (_) {}
    });

    if (!focusRegion || focusRegion === "all") {
      const pts = markersRef.current.filter(m => typeof m.getLatLng === "function");
      if (pts.length > 0) {
        try {
          map.fitBounds(L.latLngBounds(pts.map(m => m.getLatLng())), { padding: [50, 50], maxZoom: 12 });
        } catch (_) {}
      }
    }
  }, [profiles, authUser, focusRegion, onView]);

  return (
    <div className="map-wrap">
      <div ref={mapRef} id="kz-map" style={{ height: "520px", width: "100%" }} />
    </div>
  );
}

function MapTabContent({ allProfiles, onViewProfile, authUser, filters, setFilters }) {
  const [cityFilter,   setCityFilter]   = useState("all");
  const [radiusFilter, setRadiusFilter] = useState(null);

  useEffect(() => {
    if (allProfiles.length === 0) return;
    const ids = [...new Set(allProfiles.map(p => p.region))];
    console.log("[MapTab] Unique region IDs in profiles:", ids);
  }, [allProfiles]);

  const ALIASES = {
    "nur_sultan": "astana", "nur-sultan": "astana", "nursultan": "astana",
    "akmola": "astana", "Astana": "astana", "almaty": "almaty_city",
    "alma-ata": "almaty_city", "Almaty": "almaty_city", "south_kaz": "shymkent",
    "Shymkent": "shymkent", "karagandy": "karaganda", "qaraghandy": "karaganda",
    "Karaganda": "karaganda", "east_kazakhstan": "east_kaz",
    "north_kazakhstan": "north_kaz", "west_kazakhstan": "west_kaz",
  };

  const norm = (id) => (id ? (ALIASES[id] ?? id) : id);

  const distKm = (la1, lo1, la2, lo2) => {
    if (!la1 || !lo1 || !la2 || !lo2) return Infinity;
    const R = 6371, dL = (la2-la1)*Math.PI/180, dN = (lo2-lo1)*Math.PI/180;
    const a = Math.sin(dL/2)**2 + Math.cos(la1*Math.PI/180)*Math.cos(la2*Math.PI/180)*Math.sin(dN/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  };

  const CITY_DEFS = [
    { id: "all",           short: "Весь КЗ",      emoji: "🇰🇿", major: true  },
    { id: "astana",        short: "Астана",        emoji: "🏛️",  major: true  },
    { id: "almaty_city",   short: "Алматы",        emoji: "🏔️",  major: true  },
    { id: "shymkent",      short: "Шымкент",       emoji: "🌆",  major: true  },
    { id: "karaganda",     short: "Караганда",     emoji: "🏭",  major: true  },
    { id: "aktobe",        short: "Актобе",        emoji: "🌿",  major: false },
    { id: "atyrau",        short: "Атырау",        emoji: "🛢️",  major: false },
    { id: "pavlodar",      short: "Павлодар",      emoji: "⚙️",  major: false },
    { id: "kostanay",      short: "Костанай",      emoji: "🌾",  major: false },
    { id: "east_kaz",      short: "УКК",           emoji: "⛰️",  major: false },
    { id: "turkestan",     short: "Туркестан",     emoji: "🕌",  major: false },
    { id: "mangystau",     short: "Актау",         emoji: "🌊",  major: false },
    { id: "west_kaz",      short: "Уральск",       emoji: "🏞️",  major: false },
    { id: "north_kaz",     short: "Петропавл.",    emoji: "❄️",  major: false },
    { id: "almaty_region", short: "Алм. обл.",     emoji: "🌄",  major: false },
    { id: "zhambyl",       short: "Тараз",         emoji: "🏛️",  major: false },
    { id: "kyzylorda",     short: "Кызылорда",     emoji: "🌵",  major: false },
  ];

  const countFor = (id) => {
    if (id === "all") return allProfiles.length;
    return allProfiles.filter(p => norm(p.region) === id).length;
  };

  const visibleCities = CITY_DEFS.filter(c => c.major || countFor(c.id) > 0);

  const displayedProfiles = allProfiles.filter((p) => {
    const pRegion = norm(p.region);
    if (cityFilter !== "all" && pRegion !== cityFilter)      return false;
    if (filters.gender && p.gender !== filters.gender)       return false;
    if ((filters.renterType ?? "") && p.renterType !== filters.renterType) return false;
    if (radiusFilter) {
      const r  = KZ_REGIONS.find(r => r.id === pRegion || r.id === p.region);
      const pL = (p.renterType === "has_place" && p.lat) ? p.lat : r?.lat;
      const pN = (p.renterType === "has_place" && p.lng) ? p.lng : r?.lng;
      if (distKm(radiusFilter.lat, radiusFilter.lng, pL, pN) > radiusFilter.radius) return false;
    }
    return true;
  });

  const genderCount = (g) =>
    (cityFilter === "all" ? allProfiles : allProfiles.filter(p => norm(p.region) === cityFilter))
      .filter(p => !g || p.gender === g).length;

  const pillBase = {
    display: "flex", alignItems: "center", gap: "5px",
    padding: "8px 14px", borderRadius: "var(--rs)",
    border: "2px solid", fontFamily: "Nunito,sans-serif",
    fontSize: "13px", fontWeight: "700", cursor: "pointer",
    transition: "all .18s", whiteSpace: "nowrap", flexShrink: 0, background: "none",
  };
  const pillActive   = { background: "var(--accent)", color: "#fff",       borderColor: "var(--accent)" };
  const pillInactive = { background: "var(--bg)",     color: "var(--mid)", borderColor: "var(--bg2)"   };
  const pillEmpty    = { ...pillInactive, opacity: 0.4, cursor: "default" };

  return (
    <div className="page">
      <div className="ph">
        <h1 className="pt">Карта соседей 📍</h1>
        <p className="ps">
          {cityFilter === "all"
            ? `${displayedProfiles.length} из ${allProfiles.length} пользователей по всему Казахстану`
            : `${displayedProfiles.length} чел. · ${visibleCities.find(c => c.id === cityFilter)?.short ?? cityFilter}`}
        </p>
      </div>

      <div style={{ background: "var(--card)", borderRadius: "var(--r)", padding: "18px 20px", marginBottom: "16px", boxShadow: "var(--sh)" }}>
        <div style={{ fontSize: "11px", fontWeight: "700", color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".7px", marginBottom: "12px" }}>🏙️ Город</div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {visibleCities.map((city) => {
            const active  = cityFilter === city.id;
            const cnt     = countFor(city.id);
            const isEmpty = cnt === 0 && city.id !== "all";
            return (
              <button key={city.id} onClick={() => { if (!isEmpty) setCityFilter(city.id); }}
                style={{ ...pillBase, ...(active ? pillActive : isEmpty ? pillEmpty : pillInactive) }}
                onMouseEnter={(e) => { if (!active && !isEmpty) { e.currentTarget.style.borderColor="var(--accent)"; e.currentTarget.style.color="var(--accent2)"; }}}
                onMouseLeave={(e) => { if (!active && !isEmpty) { e.currentTarget.style.borderColor="var(--bg2)";    e.currentTarget.style.color="var(--mid)"; }}}
                title={isEmpty ? "Нет анкет в этом городе" : city.short}
              >
                <span>{city.emoji}</span><span>{city.short}</span>
                <span style={{ background: active ? "rgba(255,255,255,.25)" : "var(--bg2)", color: active ? "#fff" : isEmpty ? "#bbb" : "var(--mid)", borderRadius: "10px", padding: "1px 7px", fontSize: "11px" }}>{cnt}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="fbar" style={{ marginBottom: "16px" }}>
        <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize:"11px", fontWeight:"700", color:"var(--muted)", textTransform:"uppercase", letterSpacing:".7px", marginBottom:"8px" }}>👤 Пол</div>
            <div style={{ display: "flex", gap: "6px" }}>
              {[
                { val: "",       label: `Все (${genderCount("")})`,              female: false },
                { val: "female", label: `♀ Девушки (${genderCount("female")})`, female: true  },
                { val: "male",   label: `♂ Парни (${genderCount("male")})`,      female: false },
              ].map(({ val, label, female }) => {
                const on = filters.gender === val;
                const activeStyle = female ? { background:"var(--female)", color:"#fff", borderColor:"var(--female)" } : pillActive;
                return (
                  <button key={val} onClick={() => setFilters(f => ({ ...f, gender: val }))}
                    style={{ ...pillBase, ...(on ? activeStyle : pillInactive) }}
                    onMouseEnter={(e) => { if (!on) { e.currentTarget.style.borderColor="var(--accent)"; e.currentTarget.style.color="var(--accent)"; }}}
                    onMouseLeave={(e) => { if (!on) { e.currentTarget.style.borderColor="var(--bg2)";    e.currentTarget.style.color="var(--mid)"; }}}
                  >{label}</button>
                );
              })}
            </div>
          </div>
          <div>
            <div style={{ fontSize:"11px", fontWeight:"700", color:"var(--muted)", textTransform:"uppercase", letterSpacing:".7px", marginBottom:"8px" }}>🏠 Тип</div>
            <div style={{ display: "flex", gap: "6px" }}>
              {[{ val: "", label: "Все" },{ val: "has_place", label: "🏠 Есть жильё" },{ val: "looking", label: "🔍 Ищут" }].map(({ val, label }) => {
                const on = (filters.renterType ?? "") === val;
                return (
                  <button key={val} onClick={() => setFilters(f => ({ ...f, renterType: val }))}
                    style={{ ...pillBase, ...(on ? pillActive : pillInactive) }}
                    onMouseEnter={(e) => { if (!on) { e.currentTarget.style.borderColor="var(--accent)"; e.currentTarget.style.color="var(--accent)"; }}}
                    onMouseLeave={(e) => { if (!on) { e.currentTarget.style.borderColor="var(--bg2)";    e.currentTarget.style.color="var(--mid)"; }}}
                  >{label}</button>
                );
              })}
            </div>
          </div>
          <div style={{ flex:1, minWidth:"220px", alignSelf:"flex-end", background:"linear-gradient(135deg,var(--accent-light),#e8f5ea)", borderRadius:"var(--rs)", padding:"10px 14px", border:"2px solid var(--accent)", display:"flex", alignItems:"center", gap:"8px" }}>
            <span style={{ fontSize:"20px" }}>🖍️</span>
            <div>
              <div style={{ fontSize:"12px", fontWeight:"700", color:"var(--accent2)" }}>Нарисуйте зону поиска</div>
              <div style={{ fontSize:"11px", color:"var(--mid)" }}>Зажмите <b>правую кнопку</b> на карте и тяните</div>
            </div>
          </div>
        </div>
      </div>

      {radiusFilter && (
        <div style={{ background:"linear-gradient(135deg,#dcfce7,#bbf7d0)", borderRadius:"var(--r)", padding:"12px 18px", marginBottom:"16px", border:"2px solid #22c55e", display:"flex", alignItems:"center", justifyContent:"space-between", gap:"12px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
            <span style={{ fontSize:"22px" }}>🎯</span>
            <div>
              <div style={{ fontSize:"13px", fontWeight:"700", color:"#166534" }}>Фильтр по радиусу активен</div>
              <div style={{ fontSize:"11px", color:"#15803d" }}>Радиус: <b>{radiusFilter.radius} км</b> · Найдено: <b>{displayedProfiles.length}</b></div>
            </div>
          </div>
          <button onClick={() => setRadiusFilter(null)} style={{ background:"#dc2626", color:"#fff", border:"none", borderRadius:"8px", padding:"7px 14px", fontSize:"12px", fontWeight:"700", cursor:"pointer" }}>Очистить ✕</button>
        </div>
      )}

      <div style={{ display:"flex", gap:"16px", flexWrap:"wrap", padding:"12px 16px", marginBottom:"16px", background:"var(--card)", borderRadius:"var(--rs)", boxShadow:"var(--sh)" }}>
        {[{ color:"#d4587a", label:"♀ Ищет жильё" },{ color:"#4a7abf", label:"♂ Ищет жильё" },{ color:"#f59e0b", label:"🏠 Есть жильё" },{ color:"#10b981", label:"📍 Вы" }].map(({ color, label }) => (
          <div key={label} style={{ display:"flex", alignItems:"center", gap:"6px", fontSize:"12px", color:"var(--mid)" }}>
            <span style={{ width:"11px", height:"11px", borderRadius:"50%", background:color, flexShrink:0, display:"inline-block" }} />{label}
          </div>
        ))}
      </div>

      <LeafletMap profiles={displayedProfiles} onView={onViewProfile} onRadiusFilterChange={setRadiusFilter} authUser={authUser} focusRegion={cityFilter} />

      <div style={{ marginTop:"28px" }}>
        <h2 style={{ fontFamily:"Cormorant Garamond", fontSize:"22px", fontWeight:"700", marginBottom:"16px" }}>
          {cityFilter === "all" ? "Все пользователи" : visibleCities.find(c => c.id === cityFilter)?.short}
          <span style={{ fontSize:"16px", fontWeight:"400", color:"var(--muted)", marginLeft:"8px" }}>({displayedProfiles.length})</span>
        </h2>
        {displayedProfiles.length === 0 ? (
          <div className="empty">
            <div className="empty-ic">🗺️</div>
            <div className="empty-t">Никого не найдено</div>
            <p>Попробуйте другой город или сбросьте фильтры</p>
            <div style={{ display:"flex", gap:"10px", justifyContent:"center", marginTop:"16px", flexWrap:"wrap" }}>
              {cityFilter !== "all" && <button className="btn-primary" style={{ width:"auto", padding:"10px 22px" }} onClick={() => setCityFilter("all")}>Все города</button>}
              {radiusFilter && <button className="btn-ghost" onClick={() => setRadiusFilter(null)}>Сбросить радиус</button>}
            </div>
          </div>
        ) : (
          KZ_REGIONS
            .filter(r => {
              if (cityFilter !== "all" && r.id !== cityFilter) return false;
              return displayedProfiles.some(p => norm(p.region) === r.id || p.region === r.id);
            })
            .map(r => {
              const ps = displayedProfiles.filter(p => norm(p.region) === r.id || p.region === r.id);
              if (ps.length === 0) return null;
              return (
                <div key={r.id} style={{ marginBottom:"22px" }}>
                  <div style={{ fontSize:"12px", fontWeight:"700", color:"var(--muted)", textTransform:"uppercase", letterSpacing:".5px", marginBottom:"8px", display:"flex", alignItems:"center", gap:"6px" }}>
                    <span style={{ color:"var(--accent)" }}>📍</span>{r.name}
                    <span style={{ background:"var(--accent-light)", color:"var(--accent2)", borderRadius:"10px", padding:"1px 8px", fontSize:"11px" }}>{ps.length}</span>
                  </div>
                  {ps.map(p => (
                    <div key={p.id} style={{ background:"var(--card)", borderRadius:"var(--rs)", padding:"12px 16px", display:"flex", alignItems:"center", gap:"12px", boxShadow:"var(--sh)", cursor:"pointer", marginBottom:"8px", border:"1.5px solid transparent", transition:"all .2s" }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor="var(--accent)"; e.currentTarget.style.transform="translateX(3px)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor="transparent";   e.currentTarget.style.transform="none"; }}
                      onClick={() => onViewProfile(p)}
                    >
                      <div style={{ width:"44px", height:"44px", borderRadius:"50%", background:"var(--bg2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"20px", flexShrink:0 }}>{p.avatar}</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:"7px", marginBottom:"2px", flexWrap:"wrap" }}>
                          <span style={{ fontWeight:"700", fontSize:"14px" }}>{p.name}, {p.age}</span>
                          {p.verified && <span style={{ color:"var(--accent)", fontSize:"11px" }}>✓</span>}
                          <span style={{ fontSize:"10px", borderRadius:"10px", padding:"1px 7px", fontWeight:"600", background: p.gender==="female" ? "var(--female-light)" : "var(--male-light)", color: p.gender==="female" ? "var(--female)" : "var(--male)" }}>{p.gender==="female"?"♀":"♂"}</span>
                          <span style={{ fontSize:"10px", borderRadius:"10px", padding:"1px 7px", fontWeight:"600", background: p.renterType==="has_place"?"#fef3c7":"#e0f2fe", color: p.renterType==="has_place"?"#92400e":"#075985" }}>{p.renterType==="has_place"?"🏠":"🔍"}</span>
                        </div>
                        <div style={{ fontSize:"12px", color:"var(--muted)" }}>{(p.budget || 0).toLocaleString()} ₸/мес · {p.occupation}</div>
                      </div>
                      {p.online && <div style={{ width:"9px", height:"9px", borderRadius:"50%", background:"#4caf50", flexShrink:0, boxShadow:"0 0 0 2px rgba(76,175,80,.25)" }} />}
                    </div>
                  ))}
                </div>
              );
            })
        )}
      </div>
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App() {
  useEffect(() => { injectStyles(); }, []);

  const [auth, setAuth] = useState(() => {
    const token = localStorage.getItem("roommate_kz_token");
    return token ? "loading" : null;
  });
  const [allProfiles, setAllProfiles] = useState([]);
  // matchedProfiles holds users fetched directly from /api/matches — independent
  // of allProfiles so the passive side (who was liked) always sees their matches
  // even if the other person was never in their discovery feed.
  const [matchedProfiles, setMatchedProfiles] = useState([]);

  const [tab, setTab] = useState("swipe");
  const [liked, setLiked] = useState(new Set());
  const [sent, setSent] = useState(new Set());
  const [sentMessages, setSentMessages] = useState({});

  const [activeChat, setActiveChat] = useState(null);
  const [selected, setSelected] = useState(null);
  const [view, setView] = useState("grid");
  const [showF, setShowF] = useState(false);
  const [msgText, setMsgText] = useState("");
  const [passed, setPassed] = useState(new Set());
  const [filters, setFilters] = useState({
    search: "", region: "", budget: 200000, gender: "",
    schedule: "", pets: "", remote: "", smoking: "", religion: "", alcohol: "",
  });

  useEffect(() => {
    if (auth !== "loading") return;
    const token = localStorage.getItem("roommate_kz_token");
    if (token) api.setToken(token);
    api.getCurrentUser()
      .then(u => setAuth(normaliseProfile(u)))
      .catch(() => { api.setToken(null); setAuth(null); });
  }, [auth]);

  // Fetch confirmed matches from /api/matches directly — this is the source of truth
  // for both sides. The person who was liked (passive side) may not have the other
  // user in their allProfiles discovery feed at all.
  const fetchMatches = useCallback(async () => {
    if (!auth || auth === "loading") return;
    try {
      const matches = await api.getMatches();
      const profiles = matches.map(m => {
        const u = normaliseProfile(m.user);
        u.matched = true;
        u.liked = true;
        return u;
      });
      setMatchedProfiles(profiles);
      setLiked(prev => {
        const next = new Set(prev);
        profiles.forEach(p => next.add(p.id));
        return next;
      });
    } catch (err) {
      console.error("Не удалось загрузить совпадения:", err.message);
    }
  }, [auth]);

  const fetchProfiles = useCallback(async () => {
    if (!auth || auth === "loading") return;
    try {
      const baseFilters = { limit: 100, mode: "browse" };
      if (filters.region) baseFilters.region = filters.region;
      if (filters.gender) baseFilters.gender = filters.gender;
      if (filters.budget && filters.budget < 300000) baseFilters.max_budget = filters.budget;
      const raw = await api.getProfiles(baseFilters);
      const normalised = raw.map(normaliseProfile);
      setAllProfiles(normalised);
      setLiked(prev => {
        const next = new Set(prev);
        normalised.forEach(p => { if (p.liked || p.matched) next.add(p.id); });
        return next;
      });
    } catch (err) {
      console.error("Не удалось загрузить анкеты:", err.message);
    }
    await fetchMatches().catch(() => {});
  }, [auth, filters.region, filters.gender, filters.budget, fetchMatches]);

  useEffect(() => { fetchProfiles(); }, [fetchProfiles]);
  // Also fetch matches on mount independently so the passive side sees them immediately
  useEffect(() => { if (auth && auth !== "loading") fetchMatches(); }, [auth, fetchMatches]);

  // ── Real-time chat + match handling (must come AFTER fetchProfiles) ────────
  const [matchToast, setMatchToast] = useState(null);

const handleMatch = useCallback(async (withUserId) => {
    setLiked(prev => { const n = new Set(prev); n.add(withUserId); return n; });
    setAllProfiles(prev => prev.map(p => p.id === withUserId ? {...p,matched:true,liked:true} : p));
    setMatchedProfiles(prev => {
      if (prev.some(p => p.id === withUserId)) return prev.map(p => p.id === withUserId ? {...p,matched:true,liked:true} : p);
      const found = allProfiles.find(p => p.id === withUserId);
      return found ? [...prev, {...found,matched:true,liked:true}] : prev;
    });
    setMatchToast(withUserId); setActiveChat(withUserId); setTab("matches");
    setTimeout(() => setMatchToast(null), 6000);
    fetchMatches().catch(()=>{}); fetchProfiles().catch(()=>{});
  }, [fetchMatches, fetchProfiles, allProfiles]);

  const {
    conversations,
    sendMessage:    wsSendMessage,
    sendTyping,
    connected,
    typingFor,
  } = useRealtimeChat(auth?.id, api, { onMatch: handleMatch });

const sendFirst = async (profileId) => {
  if (!msgText.trim() || msgText.trim().length < 10) return;
  const text = msgText.trim();

  setSent(s         => { const n = new Set(s); n.add(profileId); return n; });
  setSentMessages(m => ({ ...m, [profileId]: text }));

  try {
    // Like FIRST — this creates the like row and possibly the match
    const result = await api.likeProfile(profileId);
    if (result?.matched) {
      // Match happened — refresh profiles then send the message
      await Promise.all([fetchProfiles(), fetchMatches()]);
      await wsSendMessage(profileId, text);
      setMatchToast(profileId);
      setActiveChat(profileId);
      setTab("matches");
      setTimeout(() => setMatchToast(null), 5000);
    } else {
      // No match yet (waiting for the other side), just record the like
      fetchProfiles();
    }
  } catch (e) {
    console.warn("likeProfile API error:", e.message);
  }

  setMsgText("");
  setTimeout(() => setSelected(null), 900);
};

const sendChat = async (profileId, text) => {
  if (!text.trim()) return;
  await wsSendMessage(profileId, text);
};

  const filtered = allProfiles.filter(p => {
    if (filters.region && p.region !== filters.region) return false;
    if (filters.search && !p.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (p.budget && filters.budget < 300000 && p.budget > filters.budget) return false;
    if (filters.gender && p.gender !== filters.gender) return false;
    if (filters.schedule && p.schedule !== filters.schedule) return false;
    if (filters.pets === "yes" && p.pets !== "yes") return false;
    if (filters.pets === "no" && p.pets === "yes") return false;
    if (filters.remote === "yes" && p.remote !== "yes") return false;
    if (filters.remote === "no" && p.remote === "yes") return false;
    if (filters.smoking === "no" && p.smoking === "yes") return false;
    if (filters.alcohol === "no" && p.alcohol === "yes") return false;
    if (filters.religion && p.religion !== filters.religion) return false;
    return true;
  });

  // Merge: start with direct API matches (always correct for both sides),
  // then add any liked/matched profiles from the discovery feed that aren't already included.
  const likedProfilesMap = new Map();
  matchedProfiles.forEach(p => likedProfilesMap.set(p.id, p));
  allProfiles.forEach(p => {
    if ((liked.has(p.id) || p.matched || p.liked) && !likedProfilesMap.has(p.id)) {
      likedProfilesMap.set(p.id, p);
    }
  });
  const likedProfiles = Array.from(likedProfilesMap.values());
  const genderColor = (g) => g === "female" ? "var(--female)" : "var(--male)";

  if (!auth) return <AuthScreen onAuth={setAuth} />;

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
           <div title={connected ? "Подключено" : "Переподключение…"}
            style={{
              width: 8, height: 8, borderRadius: "50%",
              background: connected ? "#4caf50" : "#f59e0b",
              boxShadow: connected ? "0 0 6px rgba(76,175,80,.7)" : "none",
              transition: "all .4s",
            }}
          />
          <button className="nl" onClick={()=>setAuth(null)} title="Выйти"><Ic n="logout" size={15}/></button>
          <div className="nav-av">{auth.initials}</div>
        </div>
      </nav>

      {tab==="swipe"&&(
        <SwipeTab
          profiles={filtered.filter(p => !liked.has(p.id) && !passed.has(p.id))}
          onLike={async (p)=>{
            setLiked(s=>{const n=new Set(s);n.add(p.id);return n;});
            try {
              const result = await api.likeProfile(p.id);
              if (result?.matched) {
                handleMatch(p.id);
              }
            } catch(e) { console.warn("likeProfile error:", e.message); }
          }}
          onPass={async (p)=>{
            setPassed(s=>{const n=new Set(s);n.add(p.id);return n;});
            try { await api.passProfile(p.id); } catch(_) {}
          }}
          onViewProfile={(p)=>{setSelected(p);setMsgText("");}}
        />
      )}

      {tab==="browse"&&(
        <div className="page">
          <div className="ph" style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:"14px"}}>
            <div>
              <h1 className="pt">Найди соседа 🏠</h1>
              <p className="ps">{filtered.length} человек по вашим критериям в Казахстане</p>
            </div>
            <div style={{display:"flex",gap:"8px",alignItems:"center"}}>
              <button onClick={()=>setShowF(!showF)} className="btn-ghost" style={{display:"flex",alignItems:"center",gap:"6px"}}><Ic n="sliders" size={14}/>Фильтры {showF?"▲":"▼"}</button>
              <div className="vt">
                <button className={`vb ${view==="grid"?"active":""}`} onClick={()=>setView("grid")}><Ic n="grid" size={14}/></button>
                <button className={`vb ${view==="list"?"active":""}`} onClick={()=>setView("list")}><Ic n="list" size={14}/></button>
              </div>
            </div>
          </div>
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
                  <button onClick={()=>setFilters({search:"",region:"",budget:200000,gender:"",schedule:"",pets:"",remote:"",smoking:"",religion:"",alcohol:""})} className="btn-ghost" style={{width:"auto"}}>Сбросить все фильтры</button>
                </div>
              </div>
            )}
          </div>
          {view==="grid"?(
            <div className="grid">
              {filtered.map(p=>(
                <ProfileCard key={p.id} p={p} liked={liked.has(p.id)} sent={sent.has(p.id)}
                  onLike={async()=>{setLiked(s=>{const n=new Set(s);n.add(p.id);return n;});
                    try{const r=await api.likeProfile(p.id);if(r?.matched)await handleMatch(p.id);}catch(e){console.warn(e);}
                  }}
                  onView={()=>{setSelected(p);setMsgText("");}}/>
              ))}
            </div>
          ):(
            <div>
              {filtered.map(p=>{
                const reg=KZ_REGIONS.find(r=>r.id===p.region);
                return(
                  <div key={p.id} className="list-item" onClick={()=>{setSelected(p);setMsgText("");}}>
                    <div className="mat-av" style={{backgroundImage:p.photos[0]?.startsWith("http")?`url(${p.photos[0]})`:"none",background:p.photos[0]?.startsWith("http")?"transparent":(p.photos[0]||"var(--bg2)"),backgroundSize:"cover",backgroundPosition:"center"}}>{p.photos[0]?.startsWith("http")?"":p.avatar}</div>
                    <div style={{flex:1}}>
                      <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"2px"}}>
                        <span style={{fontWeight:"700",fontSize:"15px"}}>{p.name}</span>
                        {p.verified&&<span style={{color:"var(--accent)",fontSize:"12px",fontWeight:"700"}}>✓</span>}
                        <span style={{fontSize:"11px",background:p.gender==="female"?"var(--female-light)":"var(--male-light)",color:genderColor(p.gender),borderRadius:"10px",padding:"1px 7px",fontWeight:"600"}}>{p.gender==="female"?"♀ Девушка":"♂ Парень"}</span>
                      </div>
                      <div style={{fontSize:"12px",color:"var(--muted)"}}>{reg?.name||""} · {(p.budget || 0).toLocaleString()} ₸/мес · {p.occupation}</div>
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
              <button className="btn-primary" style={{marginTop:"18px",width:"auto",padding:"11px 28px"}} onClick={()=>setFilters({search:"",region:"",budget:200000,gender:"",schedule:"",pets:"",remote:"",smoking:"",religion:"",alcohol:""})}>Сбросить фильтры</button>
            </div>
          )}
        </div>
      )}

      {tab === "map" && (
        <MapTabContent allProfiles={allProfiles} onViewProfile={(p) => { setSelected(p); setMsgText(""); }} authUser={auth} filters={filters} setFilters={setFilters} />
      )}

      {tab === "matches" && (
        <MatchesTab
          likedProfiles={likedProfiles}
          matchedProfiles={matchedProfiles}
          liked={liked}
          sent={sent}
          sentMessages={sentMessages}
          conversations={conversations}
          typingFor={typingFor}
          activeChat={activeChat}
          setActiveChat={setActiveChat}
          setSelected={setSelected}
          setMsgText={setMsgText}
          auth={auth}
          sendChat={sendChat}
          sendTyping={sendTyping}
          setTab={setTab}
          onRefresh={async () => { await Promise.all([fetchProfiles(), fetchMatches()]); }}
        />
      )}

      {tab==="profile"&&(
        <ProfileEditTab auth={auth} setAuth={setAuth} api={api} KZ_REGIONS={KZ_REGIONS} />
      )}

{selected && (
        <ProfileModal
          p={selected}
          liked={liked.has(selected.id)}
          sent={sent.has(selected.id)}
          msgText={msgText}
          setMsgText={setMsgText}
          KZ_REGIONS={KZ_REGIONS}
          onLike={async()=>{setLiked(s=>{const n=new Set(s);n.add(selected.id);return n;});
            try{const r=await api.likeProfile(selected.id);if(r?.matched)await handleMatch(selected.id);}catch(e){console.warn(e);}
          }}
          onSend={() => sendFirst(selected.id)}
          onClose={() => setSelected(null)}
        />
      )}

      {/* ── Match Toast ── */}
      {matchToast && (() => {
        const matchedUser = allProfiles.find(p => p.id === matchToast) || likedProfiles.find(p => p.id === matchToast);
        return (
          <div
            onClick={() => { setTab("matches"); setActiveChat(matchToast); setMatchToast(null); }}
            style={{
              position: "fixed", bottom: 28, right: 28, zIndex: 9999,
              background: "linear-gradient(135deg,#1e2a22,#2e4a36)",
              color: "#fff", borderRadius: 20, padding: "18px 22px",
              boxShadow: "0 12px 40px rgba(0,0,0,.35)", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 14, maxWidth: 320,
              animation: "toastIn .4s cubic-bezier(.34,1.4,.64,1)",
            }}
          >
            <style>{`@keyframes toastIn{from{opacity:0;transform:translateY(20px) scale(.92)}to{opacity:1;transform:translateY(0) scale(1)}}`}</style>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: matchedUser?.photos?.[0] ?? "var(--accent)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "Cormorant Garamond,serif", fontSize: 18, fontWeight: 700,
              color: "#1e2a22", flexShrink: 0,
              boxShadow: "0 0 0 3px rgba(245,158,11,.6)",
            }}>
              {matchedUser?.avatar ?? "🤝"}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 3 }}>
                🎉 Совпадение!
              </div>
              <div style={{ fontSize: 12, opacity: .8, lineHeight: 1.4 }}>
                {matchedUser ? `${matchedUser.name} тоже лайкнул(а) вас` : "У вас новое совпадение"}
                <br/>
                <span style={{ color: "#fbbf24", fontWeight: 600 }}>Нажмите, чтобы написать →</span>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ── CHAT PANEL ────────────────────────────────────────────────────────────────
const SendSVG = () => (
  <svg width="17" height="17" fill="none" viewBox="0 0 24 24">
    <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CloseSVG = () => (
  <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
    <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
    <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
  </svg>
);

export function ChatPanel({ profile, messages, typing, userInitials, onSend, onTyping, onClose }) {
  const [input, setInput] = useState("");
  const [fired, setFired] = useState(false);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => { injectChatStyles(); }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const send = () => {
    const text = input.trim();
    if (!text) return;
    setFired(true);
    onSend(text);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setTimeout(() => setFired(false), 450);
    textareaRef.current?.focus();
  };

  const onKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const groups = messages.reduce((acc, msg, i) => {
    const prev = messages[i - 1];
    if (prev && prev.mine === msg.mine) acc[acc.length - 1].push(msg);
    else acc.push([msg]);
    return acc;
  }, []);

  const avatarBg = profile.photos?.[0] ?? "#d4ead9";

  return (
    <div className="cv3">
      <div className="cv3-head">
        <div className="cv3-av-wrap">
          <div className="cv3-av" style={{ background: avatarBg }}>{profile.avatar}</div>
          {profile.online && <div className="cv3-online" />}
        </div>
        <div className="cv3-head-info">
          <div className="cv3-head-name">{profile.name}</div>
          <div className="cv3-head-sub">
            {profile.online
              ? <><span className="cv3-head-dot" /><span>Онлайн</span></>
              : <span>Был(а) недавно</span>
            }
          </div>
        </div>
        <button className="cv3-close" onClick={onClose}><CloseSVG /></button>
      </div>

      <div className="cv3-match">
        <div className="cv3-match-icon">🤝</div>
        <div className="cv3-match-text">
          <strong>Взаимное совпадение!</strong>
          <span>Можете общаться свободно</span>
        </div>
      </div>

      <div className="cv3-msgs">
        {messages.length === 0 && !typing && (
          <div className="cv3-empty">
            <div className="cv3-empty-icon">💬</div>
            <div className="cv3-empty-title">Начните общение</div>
            <div className="cv3-empty-sub">Напишите первое сообщение {profile.name.split(" ")[0]}!</div>
          </div>
        )}
        {messages.length > 0 && <div className="cv3-date"><span>Сегодня</span></div>}
        {groups.map((group, gi) => {
          const isMine = group[0].mine;
          return (
            <div key={gi} className={`cv3-group ${isMine ? "mine" : "them"}`} style={{ animationDelay: `${gi * 0.04}s` }}>
              {group.map((msg, mi) => {
                const isLast = mi === group.length - 1;
                const isMid = !isLast;
                return (
                  <div key={msg.id} className={`cv3-row ${isMine ? "mine" : ""}`}>
                    {!isMine && (isLast ? <div className="cv3-mini-av" style={{ background: avatarBg }}>{profile.avatar}</div> : <div style={{ width: 26 }} />)}
                    <div className={`cv3-bubble ${isMine ? "mine" : "them"}${isMid ? " mid" : ""}`}>{msg.text}</div>
                    {isMine && (isLast ? <div className="cv3-mini-av" style={{ background: "#d4ead9", color: "#2e6048" }}>{userInitials}</div> : <div style={{ width: 26 }} />)}
                  </div>
                );
              })}
              <div className={`cv3-meta ${isMine ? "mine" : ""}`}>
                {group[group.length - 1].time}
                {isMine && <span className="cv3-tick">✓✓</span>}
              </div>
            </div>
          );
        })}
        {typing && (
          <div className="cv3-typing">
            <div className="cv3-mini-av" style={{ background: avatarBg }}>{profile.avatar}</div>
            <div className="cv3-typing-bub">
              <div className="cv3-dot" /><div className="cv3-dot" /><div className="cv3-dot" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="cv3-inp-row">
        <div className="cv3-inp-wrap">
          <textarea
            ref={textareaRef}
            className="cv3-inp"
            rows={1}
            placeholder="Написать сообщение…"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              onTyping?.(); // ✅ FIX: was props.onTyping?.()
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 96) + "px";
            }}
            onKeyDown={onKey}
          />
        </div>
        <button className={`cv3-send${fired ? " fired" : ""}`} onClick={send} disabled={!input.trim()}><SendSVG /></button>
      </div>
    </div>
  );
}
function injectChatStyles() {
  if (document.getElementById("chat-v3-styles")) return;
  const s = document.createElement("style");
  s.id = "chat-v3-styles";
  s.textContent = `
.cv3{width:400px;flex-shrink:0;display:flex;flex-direction:column;height:680px;border-radius:24px;overflow:hidden;background:#faf7f3;border:1.5px solid #e8e0d5;box-shadow:0 8px 40px rgba(30,42,34,.12),0 2px 8px rgba(30,42,34,.06);font-family:'Nunito',sans-serif;animation:cv3In .3s cubic-bezier(.34,1.2,.64,1) both;}
@keyframes cv3In{from{opacity:0;transform:translateY(14px) scale(.97);}to{opacity:1;transform:translateY(0) scale(1);}}
.cv3-head{display:flex;align-items:center;gap:12px;padding:18px 20px 16px;background:#fff;border-bottom:1px solid #ede7df;flex-shrink:0;}
.cv3-av-wrap{position:relative;flex-shrink:0;}
.cv3-av{width:44px;height:44px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-family:'Cormorant Garamond',serif;font-size:16px;font-weight:700;color:#1e2a22;box-shadow:0 2px 8px rgba(30,42,34,.12);}
.cv3-online{position:absolute;bottom:-2px;right:-2px;width:11px;height:11px;border-radius:50%;background:#4caf50;border:2.5px solid #fff;box-shadow:0 0 6px rgba(76,175,80,.45);animation:cv3Pulse 2.4s ease-in-out infinite;}
@keyframes cv3Pulse{0%,100%{box-shadow:0 0 6px rgba(76,175,80,.45);}50%{box-shadow:0 0 12px rgba(76,175,80,.7);}}
.cv3-head-info{flex:1;}
.cv3-head-name{font-size:15px;font-weight:700;color:#1e2a22;}
.cv3-head-sub{font-size:11px;color:#7d9080;margin-top:2px;display:flex;align-items:center;gap:4px;}
.cv3-head-dot{width:5px;height:5px;border-radius:50%;background:#4caf50;display:inline-block;}
.cv3-close{width:34px;height:34px;border-radius:10px;border:1.5px solid #e8e0d5;background:#f0ebe3;color:#7d9080;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .18s;}
.cv3-close:hover{background:#fce8ef;border-color:#d4587a;color:#d4587a;transform:rotate(90deg);}
.cv3-match{display:flex;align-items:center;gap:10px;margin:12px 14px 0;padding:10px 14px;background:linear-gradient(135deg,#fffbeb,#fef3c7);border:1.5px solid #fde68a;border-radius:14px;flex-shrink:0;animation:cv3BannerIn .38s cubic-bezier(.34,1.4,.64,1) both;}
@keyframes cv3BannerIn{from{opacity:0;transform:translateY(-8px) scale(.95);}to{opacity:1;transform:translateY(0) scale(1);}}
.cv3-match-icon{width:30px;height:30px;background:linear-gradient(135deg,#fbbf24,#f59e0b);border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;box-shadow:0 3px 10px rgba(245,158,11,.3);}
.cv3-match-text strong{display:block;font-size:12px;font-weight:700;color:#78350f;}
.cv3-match-text span{font-size:11px;color:#92400e;opacity:.7;}
.cv3-msgs{flex:1;overflow-y:auto;padding:18px 16px 8px;display:flex;flex-direction:column;gap:4px;background:#f5f1ea;}
.cv3-msgs::-webkit-scrollbar{width:4px;}
.cv3-msgs::-webkit-scrollbar-track{background:transparent;}
.cv3-msgs::-webkit-scrollbar-thumb{background:#d6ccc0;border-radius:10px;}
.cv3-date{display:flex;align-items:center;gap:8px;margin:2px 0 10px;opacity:.5;}
.cv3-date::before,.cv3-date::after{content:'';flex:1;height:1px;background:#d6ccc0;}
.cv3-date span{font-size:10px;color:#7d9080;letter-spacing:.4px;text-transform:uppercase;white-space:nowrap;}
.cv3-group{display:flex;flex-direction:column;gap:2px;animation:cv3MsgIn .26s cubic-bezier(.34,1.2,.64,1) both;}
.cv3-group.mine{align-items:flex-end;}
.cv3-group.them{align-items:flex-start;}
@keyframes cv3MsgIn{from{opacity:0;transform:translateY(9px);}to{opacity:1;transform:translateY(0);}}
.cv3-row{display:flex;align-items:flex-end;gap:7px;}
.cv3-row.mine{flex-direction:row-reverse;}
.cv3-mini-av{width:26px;height:26px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-family:'Cormorant Garamond',serif;font-size:10px;font-weight:700;color:#1e2a22;flex-shrink:0;margin-bottom:1px;}
.cv3-bubble{max-width:70%;padding:10px 14px;font-size:14px;line-height:1.55;word-break:break-word;}
.cv3-bubble.them{background:#fff;color:#1e2a22;border-radius:16px 16px 16px 4px;box-shadow:0 1px 6px rgba(30,42,34,.07);border:1px solid rgba(30,42,34,.05);}
.cv3-bubble.mine{background:linear-gradient(135deg,#3d7a5c,#2e6048);color:#fff;border-radius:16px 16px 4px 16px;box-shadow:0 3px 12px rgba(61,122,92,.22);}
.cv3-bubble.them.mid{border-radius:16px;}
.cv3-bubble.mine.mid{border-radius:16px;}
.cv3-meta{font-size:10px;color:#a09480;display:flex;align-items:center;gap:3px;padding:0 3px;margin-top:1px;}
.cv3-meta.mine{justify-content:flex-end;}
.cv3-tick{color:#3d7a5c;font-size:9px;}
.cv3-typing{display:flex;align-items:flex-end;gap:7px;animation:cv3MsgIn .24s ease both;}
.cv3-typing-bub{background:#fff;border:1px solid rgba(30,42,34,.05);border-radius:16px 16px 16px 4px;padding:11px 14px;display:flex;gap:4px;align-items:center;box-shadow:0 1px 6px rgba(30,42,34,.07);}
.cv3-dot{width:6px;height:6px;border-radius:50%;background:#a0b8a8;animation:cv3Bounce 1.4s ease-in-out infinite;}
.cv3-dot:nth-child(2){animation-delay:.16s;}
.cv3-dot:nth-child(3){animation-delay:.32s;}
@keyframes cv3Bounce{0%,60%,100%{transform:translateY(0) scale(1);opacity:.5;}30%{transform:translateY(-6px) scale(1.15);opacity:1;}}
.cv3-empty{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:40px 28px;text-align:center;}
.cv3-empty-icon{width:58px;height:58px;background:#e8f5ec;border:1.5px solid #c8e6d0;border-radius:18px;display:flex;align-items:center;justify-content:center;font-size:26px;animation:cv3Float 4s ease-in-out infinite;}
@keyframes cv3Float{0%,100%{transform:translateY(0);}50%{transform:translateY(-5px);}}
.cv3-empty-title{font-family:'Cormorant Garamond',serif;font-size:19px;font-weight:600;color:#1e2a22;}
.cv3-empty-sub{font-size:12px;color:#7d9080;line-height:1.6;max-width:200px;}
.cv3-inp-row{padding:12px 14px;background:#fff;border-top:1px solid #ede7df;display:flex;align-items:flex-end;gap:9px;flex-shrink:0;}
.cv3-inp-wrap{flex:1;background:#f5f1ea;border-radius:16px;border:1.5px solid #e0d8cf;transition:all .18s;overflow:hidden;}
.cv3-inp-wrap:focus-within{border-color:#3d7a5c;background:#fff;box-shadow:0 0 0 3px rgba(61,122,92,.08);}
.cv3-inp{width:100%;background:transparent;border:none;outline:none;padding:11px 15px;font-family:'Nunito',sans-serif;font-size:14px;color:#1e2a22;resize:none;max-height:96px;overflow-y:auto;line-height:1.5;display:block;}
.cv3-inp::placeholder{color:#a09480;}
.cv3-inp::-webkit-scrollbar{display:none;}
.cv3-send{width:44px;height:44px;border-radius:14px;border:none;background:linear-gradient(135deg,#3d7a5c,#2e6048);color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .2s cubic-bezier(.34,1.56,.64,1);box-shadow:0 4px 14px rgba(61,122,92,.28);}
.cv3-send:hover:not(:disabled){transform:translateY(-3px) scale(1.07);box-shadow:0 8px 22px rgba(61,122,92,.4);}
.cv3-send:active:not(:disabled){transform:scale(.92);}
.cv3-send.fired{animation:cv3SendFired .42s cubic-bezier(.34,1.56,.64,1);}
@keyframes cv3SendFired{0%{transform:scale(1) rotate(0);}35%{transform:scale(.85) rotate(-10deg);}70%{transform:scale(1.1) rotate(5deg);}100%{transform:scale(1) rotate(0);}}
.cv3-send:disabled{background:#e8e0d5;box-shadow:none;cursor:default;color:#b8a898;}
  `;
  document.head.appendChild(s);
}

// ── PROFILE CARD ──────────────────────────────────────────────────────────────
function ProfileCard({p, liked, sent, onLike, onView}){
  const reg=KZ_REGIONS.find(r=>r.id===p.region);
  return(
    <div className="card">
      <div className="card-hero" style={{background:p.photos[0]?.startsWith("http")?`url(${p.photos[0]}) center/cover`:`linear-gradient(160deg,${p.photos[0]||"#e8a598"},${p.photos[2]||"#c9a89a"})`}} onClick={onView}>
        {p.online&&<div className="online-dot"/>}
        {p.verified&&<div className="verified-badge"><Ic n="check" size={10} c="var(--accent)"/>Верифицирован</div>}
        <div className="card-av">{p.avatar}</div>
        <div className={`gender-badge ${p.gender==="female"?"gender-f":"gender-m"}`}>
          {p.gender==="female"?"♀ Девушка":"♂ Парень"}
        </div>
        {p.renterType && (
          <div style={{position:"absolute",top:"12px",right:"12px",background:p.renterType==="has_place"?"#fef3c7":"#e0f2fe",borderRadius:"20px",padding:"4px 10px",fontSize:"11px",fontWeight:"700",color:p.renterType==="has_place"?"#92400e":"#075985",display:"flex",alignItems:"center",gap:"4px",boxShadow:"0 2px 8px rgba(0,0,0,.1)"}}>
            {p.renterType==="has_place"?"🏠 Есть жильё":"🔍 Ищет"}
          </div>
        )}
      </div>
      <div className="cb">
        <div className="cn"><span className="cname">{p.name}, {p.age}</span><span className="cprice">{(p.budget || 0).toLocaleString()} ₸</span></div>
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
export function ProfileModal({ p, liked, sent, msgText, setMsgText, KZ_REGIONS: regionsFromProp, onLike, onSend, onClose }) {
  useEffect(() => { injectSendStyles(); }, []);

  const [isSending, setIsSending] = useState(false);
  const [localPhoto, setLocalPhoto] = useState(0);

  const regions = regionsFromProp || KZ_REGIONS;
  const reg = regions.find(r => r.id === p.region);
  const max = 300;

  const handleSend = () => {
    if (msgText.trim().length < 10 || isSending) return;
    setIsSending(true);
    onSend();
    setTimeout(() => { setIsSending(false); }, 1200);
  };

  return (
    <div className="overlay" style={{ zIndex: 1000 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="mhero" style={{background:p.photos[0]?.startsWith("http")?`url(${p.photos[0]}) center/cover`:`linear-gradient(160deg,${p.photos[0]||"#e8a598"},${p.photos[2]||"#c9a89a"})`}}>
          <div className="mav">{p.avatar}</div>
          <button className="mclose" onClick={onClose}><ModalIc n="x" size={15} /></button>
          {p.online && (
            <div style={{ position:"absolute", bottom:"14px", left:"14px", background:"rgba(255,255,255,.9)", borderRadius:"20px", padding:"3px 10px", fontSize:"12px", color:"#4caf50", fontWeight:"700", display:"flex", alignItems:"center", gap:"5px" }}>
              <span style={{ width:"7px", height:"7px", borderRadius:"50%", background:"#4caf50", display:"inline-block" }} />Онлайн
            </div>
          )}
          <div style={{ position:"absolute", top:"14px", right:"14px", display:"flex", gap:"5px", alignItems:"center" }}>
            {p.photos.map((_, i) => (
              <div key={i} onClick={() => setLocalPhoto(i)} style={{ width:"8px", height:"8px", borderRadius:"50%", background: localPhoto===i ? "#fff" : "rgba(255,255,255,.4)", cursor:"pointer", transition:"all .2s" }} />
            ))}
          </div>
          <div style={{ position:"absolute", bottom:"14px", right:"14px", background: p.gender==="female" ? "var(--female-light)" : "var(--male-light)", borderRadius:"20px", padding:"4px 12px", fontSize:"12px", fontWeight:"700", color: p.gender==="female" ? "var(--female)" : "var(--male)" }}>
            {p.gender==="female" ? "♀ Девушка" : "♂ Парень"}
          </div>
        </div>

        <div className="mbody">
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:"10px", flexWrap:"wrap", gap:"10px" }}>
            <div>
              <div className="mname">{p.name}, {p.age}</div>
              {p.verified && <span className="badge badge-g" style={{ fontSize:"11px" }}><ModalIc n="check" size={10} c="var(--accent)" /> Верифицирован</span>}
            </div>
            <button onClick={onLike} style={{ background: liked ? "var(--female-light)" : "var(--bg)", border: `1.5px solid ${liked ? "var(--female)" : "var(--bg2)"}`, borderRadius:"var(--rs)", padding:"9px 14px", cursor:"pointer", display:"flex", alignItems:"center", gap:"6px", fontSize:"13px", fontWeight:"700", color: liked ? "var(--female)" : "var(--muted)", fontFamily:"Nunito,sans-serif" }}>
              <ModalIc n={liked ? "heartFill" : "heart"} size={15} c={liked ? "var(--female)" : "var(--muted)"} />
              {liked ? "В избранном" : "В избранное"}
            </button>
          </div>

          <div className="mmeta">
            <div className="mmi"><ModalIc n="pin" size={13} /> {reg?.name || p.region}</div>
            <div className="mmi">💰 {(p.budget || 0).toLocaleString()} ₸/мес</div>
            <div className="mmi"><ModalIc n="user" size={13} /> {p.occupation}</div>
            <div className="mmi">📅 {p.move_in}</div>
          </div>

          {p.renterType && (
            <div style={{ background: p.renterType==="has_place" ? "linear-gradient(135deg,#fef3c7,#fde68a)" : "linear-gradient(135deg,#e0f2fe,#bae6fd)", borderRadius:"var(--rs)", padding:"14px 16px", marginBottom:"16px", border: `2px solid ${p.renterType==="has_place" ? "#fbbf24" : "#0ea5e9"}` }}>
              <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                <div style={{ fontSize:"24px" }}>{p.renterType==="has_place" ? "🏠" : "🔍"}</div>
                <div>
                  <div style={{ fontSize:"13px", fontWeight:"700", color: p.renterType==="has_place" ? "#92400e" : "#075985" }}>{p.renterType==="has_place" ? "Есть своё жильё" : "Ищет жильё"}</div>
                  <div style={{ fontSize:"11px", opacity:".8", color: p.renterType==="has_place" ? "#92400e" : "#075985" }}>{p.renterType==="has_place" ? "Ищет соседа к себе" : "Ищет квартиру + соседа"}</div>
                </div>
              </div>
            </div>
          )}

          <div className="msec">
            <div className="mst">О себе</div>
            <p style={{ fontSize:"14px", lineHeight:"1.6", color:"var(--mid)" }}>{p.bio}</p>
          </div>

          <div className="msec">
            <div className="mst">Образ жизни</div>
            {[["Чистоплотность", p.cleanliness], ["Общительность", p.social]].map(([l, v]) => (
              <div key={l} className="trait">
                <span className="tlabel">{l}</span>
                <div className="ttrack"><div className="tfill" style={{ width: `${v * 20}%` }} /></div>
                <span style={{ fontSize:"12px", fontWeight:"700", color:"var(--accent)", width:"24px" }}>{v}/5</span>
              </div>
            ))}
            <div style={{ display:"flex", flexWrap:"wrap", gap:"7px", marginTop:"12px" }}>
              {p.pets && <span className="badge badge-b">🐾 Питомец есть</span>}
              {p.remote && <span className="badge badge-b">💻 Удалёнка</span>}
              {!p.smoking && <span className="badge badge-g">🚭 Не курит</span>}
              {!p.alcohol && <span className="badge badge-g">🥤 Не пьёт</span>}
            </div>
          </div>

          <div className="msec">
            <div className="mst">Интересы</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:"7px" }}>
              {p.tags.map(t => <span key={t} className="tag" style={{ fontSize:"13px", padding:"5px 12px" }}>{t}</span>)}
            </div>
          </div>

          <div className="msgbox">
            {p.matched && sent ? (
              <>
                <div style={{ background:"rgba(245,158,11,.1)", border:"1px solid rgba(245,158,11,.35)", borderRadius:"var(--rs)", padding:"10px 14px", display:"flex", alignItems:"center", gap:"8px", marginBottom:"12px" }}>
                  <span style={{ fontSize:"18px" }}>🤝</span>
                  <span style={{ fontSize:"13px", fontWeight:"700", color:"#92400e" }}>Совпадение! {p.name.split(" ")[0]} тоже хочет познакомиться</span>
                </div>
                <button className="btn-primary" style={{ background:"var(--match)", display:"flex", alignItems:"center", justifyContent:"center", gap:"8px" }} onClick={onClose}>
                  <ModalIc n="msg" size={15} c="#fff" /> Перейти в чат
                </button>
                <p style={{ fontSize:"11px", color:"var(--muted)", textAlign:"center", marginTop:"8px" }}>Откройте вкладку «Избранное» для переписки</p>
              </>
            ) : sent ? (
              <>
                <div className="msghead"><ModalIc n="check" size={14} c="var(--accent)" /> Сообщение отправлено!</div>
                <p className="msgnote">Если ответят — откроется чат 💬</p>
                <div style={{ background:"var(--bg2)", borderRadius:"var(--rs)", padding:"10px 13px", fontSize:"13px", color:"var(--mid)", borderLeft:"3px solid var(--accent)", marginTop:"10px" }}>{msgText}</div>
              </>
            ) : (
              <>
                <div className="msghead"><ModalIc n="msg" size={14} c="var(--accent)" /> Написать сообщение</div>
                <p className="msgnote">Одно сообщение — сделайте его запоминающимся ✨</p>
                <textarea className="msgtxt" placeholder={`Привет, ${p.name.split(" ")[0]}! Увидел(а) твою анкету и…`} value={msgText} onChange={e => setMsgText(e.target.value.slice(0, max))} />
                <div className="msgchar">{msgText.length}/{max}</div>
                <button className={`btn-primary${isSending ? " sending" : ""}`} style={{ marginTop:"10px" }} onClick={handleSend} disabled={msgText.trim().length < 10 || isSending}>
                  <span className="send-label">
                    {isSending
                      ? <><ModalIc n="check" size={14} c="#fff" /> Отправляется…</>
                      : <><ModalIc n="send"  size={14} c="#fff" /> Отправить</>
                    }
                  </span>
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

function ProfileEditTab({ auth, setAuth, api, KZ_REGIONS }) {
  const [form, setForm] = useState({
    name:auth.name||"",age:auth.age||"",bio:auth.bio||"",occupation:auth.occupation||"",
    region:auth.region||"",budget:auth.budget||"",renter_type:auth.renter_type||"looking",
    schedule:auth.schedule||"",cleanliness:auth.cleanliness||3,
    pets:auth.pets||"",smoking:auth.smoking||"",alcohol:auth.alcohol||"",remote:auth.remote||"",religion:auth.religion||"",
  });
  const [photos,setPhotos]=useState(()=>{ const p=Array.isArray(auth.photos)?auth.photos:[]; return [p[0]||null,p[1]||null,p[2]||null]; });
  const [saving,setSaving]=useState(false);
  const [saved,setSaved]=useState(false);
  const upd=(k,v)=>setForm(f=>({...f,[k]:v}));

  const handlePhotosSaved=async(urls)=>{
    try{ await api.updateProfile({photos:urls}); setAuth(prev=>({...prev,photos:urls})); }
    catch(e){ console.error("Photo save:",e.message); }
  };

  const handleSave=async()=>{
    setSaving(true);
    try{
      const payload={...form,age:parseInt(form.age)||null,budget:parseInt(form.budget)||null,photos:photos.filter(Boolean)};
      const updated=await api.updateProfile(payload);
      const ini=(updated.name||form.name).split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2)||"??";
      setAuth(prev=>({...prev,...updated,avatar:ini,initials:ini,photos:photos.filter(Boolean)}));
      setSaved(true); setTimeout(()=>setSaved(false),3000);
    }catch(err){alert("Ошибка: "+err.message);}
    finally{setSaving(false);}
  };

  const YesNo=({label,field})=>(
    <div className="fg-form"><label className="fl">{label}</label>
      <div style={{display:"flex",gap:8}}>
        {["yes","no",""].map(v=>(
          <button key={v} onClick={()=>upd(field,v)} style={{flex:1,padding:"8px 4px",borderRadius:"var(--rs)",cursor:"pointer",fontWeight:600,fontSize:13,border:`1.5px solid ${form[field]===v?"var(--accent)":"var(--bg2)"}`,background:form[field]===v?"var(--accent-light)":"var(--bg)",color:form[field]===v?"var(--accent)":"var(--muted)"}}>
            {v==="yes"?"Да":v==="no"?"Нет":"—"}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="page"><div style={{maxWidth:"640px",margin:"0 auto"}}>
      <h1 className="pt" style={{marginBottom:22}}>Мой профиль</h1>
      <div className="prof-card">
        <div className="prof-av" style={{margin:"0 auto 16px",width:64,height:64,fontSize:22}}>{auth.initials||auth.avatar||"?"}</div>
        <PhotoUpload photos={photos} onChange={setPhotos} onSaved={handlePhotosSaved} label="Фотографии профиля"/>
        <div className="fg-form"><label className="fl">Имя</label><input className="fi" value={form.name} onChange={e=>upd("name",e.target.value)} placeholder="Ваше имя"/></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <div className="fg-form"><label className="fl">Возраст</label><input className="fi" type="number" value={form.age} onChange={e=>upd("age",e.target.value)} placeholder="23"/></div>
          <div className="fg-form"><label className="fl">Бюджет (₸/мес)</label><input className="fi" type="number" value={form.budget} onChange={e=>upd("budget",e.target.value)} placeholder="80000"/></div>
        </div>
        <div className="fg-form"><label className="fl">Профессия / учёба</label><input className="fi" value={form.occupation} onChange={e=>upd("occupation",e.target.value)} placeholder="Студент, разработчик..."/></div>
        <div className="fg-form"><label className="fl">Регион</label>
          <select className="fi" value={form.region} onChange={e=>upd("region",e.target.value)}>
            <option value="">— Выберите —</option>
            {KZ_REGIONS.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}
          </select></div>
        <div className="fg-form"><label className="fl">Статус</label>
          <div style={{display:"flex",gap:8}}>
            {[["looking","🔍 Ищу жильё"],["has_place","🏠 Сдаю / есть место"]].map(([v,l])=>(
              <button key={v} onClick={()=>upd("renter_type",v)} style={{flex:1,padding:"9px 8px",borderRadius:"var(--rs)",cursor:"pointer",fontWeight:600,fontSize:12,border:`1.5px solid ${form.renter_type===v?"var(--accent)":"var(--bg2)"}`,background:form.renter_type===v?"var(--accent-light)":"var(--bg)",color:form.renter_type===v?"var(--accent)":"var(--muted)"}}>{l}</button>
            ))}
          </div></div>
        <div className="fg-form"><label className="fl">О себе</label>
          <textarea className="fi" style={{height:90,resize:"vertical"}} value={form.bio} onChange={e=>upd("bio",e.target.value)} placeholder="Чем занимаетесь, что ищете в соседе..."/></div>
      </div>
      <div className="prof-card" style={{marginTop:16}}>
        <h2 className="sec-title">🌿 Образ жизни</h2>
        <div className="fg-form"><label className="fl">График</label>
          <select className="fi" value={form.schedule} onChange={e=>upd("schedule",e.target.value)}>
            <option value="">— Не важно —</option>
            <option value="Жаворонок">🌅 Жаворонок</option>
            <option value="Сова">🌙 Сова</option>
            <option value="Переменный">🔄 Переменный</option>
          </select></div>
        <div className="fg-form">
          <label className="fl">Чистоплотность <span style={{float:"right",fontWeight:700,color:"var(--accent)"}}>{form.cleanliness}/5</span></label>
          <input type="range" min="1" max="5" value={form.cleanliness} onChange={e=>upd("cleanliness",Number(e.target.value))} style={{width:"100%",accentColor:"var(--accent)",marginTop:6}}/></div>
        <YesNo label="🐾 Домашние животные" field="pets"/>
        <YesNo label="🚬 Курение" field="smoking"/>
        <YesNo label="🍷 Алкоголь" field="alcohol"/>
        <YesNo label="💻 Удалённая работа" field="remote"/>
        <div className="fg-form"><label className="fl">Религия</label>
          <select className="fi" value={form.religion} onChange={e=>upd("religion",e.target.value)}>
            <option value="">— Не указано —</option>
            <option value="Нет">Нерелигиозный</option>
            <option value="Мусульманин">Мусульманин</option>
            <option value="Мусульманка">Мусульманка</option>
            <option value="Христианин">Христианин</option>
            <option value="Другое">Другое</option>
          </select></div>
      </div>
      <button className="btn-primary" style={{marginTop:20,width:"100%",padding:"15px",fontSize:15}} onClick={handleSave} disabled={saving}>
        {saving?"⏳ Сохранение...":saved?"✅ Сохранено!":"Сохранить профиль"}
      </button>
      <div style={{height:40}}/>
    </div></div>
  );
}

function AuthScreen({onAuth}){
  const [mode, setMode]=useState("login");
  const [step, setStep]=useState(0);
  const [photos, setPhotos] = useState([null, null, null]);
  const [form, setForm]=useState({
    name:"", email:"", password:"", age:"", gender:"", region:"",
    renterType:"looking", address:"", lat:null, lng:null,
    budget:"", occupation:"", move_in:"", cleanliness:3, social:3,
    pets:false, smoking:false, remote:false, alcohol:false, schedule: "Гибкий",
    religion:"Нет", guests:"Иногда", noise:"Умеренная",
    studyWork:"Работа", languages:[], bio:"",
  });
  const [loading, setLoading] = useState(false);

  const handleLoginSubmit = async () => {
    if (!form.email?.trim())    return alert("Введите email");
    if (!form.password?.trim()) return alert("Введите пароль");
    setLoading(true);
    try {
      const response = await api.login(form.email.trim(), form.password);
      if (!response?.token) throw new Error("No token provided");
      api.setToken(response.token);
      onAuth(normaliseProfile(response.user));
    } catch (err) {
      alert("Ошибка входа: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async () => {
    if (!form.name?.trim())    return alert("Введите имя");
    if (!form.email?.trim())   return alert("Введите email");
    if (!form.password || form.password.length < 8) return alert("Пароль должен быть не менее 8 символов");
    if (!form.gender)          return alert("Выберите пол");
    setLoading(true);
    let validSchedule = form.schedule;
    if (!validSchedule || validSchedule === "Гибкий") validSchedule = "Переменный";
    try {
      const registerData = {
        ...form,
        age:         parseInt(form.age) || null,
        budget:      parseInt(form.budget) || 0,
        renter_type: form.renterType  || "looking",
        study_work:  form.studyWork   || "Работа",
        schedule:    validSchedule,
        gender:      form.gender      || "male",
        religion:    form.religion    || "Нет",
        guests:      form.guests      || "Иногда",
        noise:       form.noise       || "Умеренная",
        tags:        [],
      };
      const response = await api.register(registerData);
      if (!response?.token) throw new Error("No token provided");
      api.setToken(response.token);
      onAuth(normaliseProfile(response.user));
    } catch (err) {
      alert("Ошибка регистрации: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const upd=(k,v)=>setForm(f=>({...f,[k]:v}));
  const toggleLang=(l)=>setForm(f=>({...f,languages:f.languages.includes(l)?f.languages.filter(x=>x!==l):[...f.languages,l]}));
  const STEPS=["Основное","Жильё","Образ жизни","О себе"];

  const stepContent=()=>{
    if(step===0) return(
      <>
        <div className="step-title">Основная информация</div>
        <div className="step-sub">Расскажите немного о себе</div>
        <div className="grid2">
          <div className="fg-form"><label className="fl">Имя *</label><input className="fi" placeholder="Айгерим" value={form.name} onChange={e=>upd("name",e.target.value)}/></div>
          <div className="fg-form"><label className="fl">Возраст <span style={{fontSize:11,color:'var(--muted)',fontWeight:400}}>(необязательно)</span></label><input className="fi" type="number" placeholder="23" value={form.age} onChange={e=>upd("age",e.target.value)}/></div>
        </div>
        <div className="fg-form"><label className="fl">Email *</label><input className="fi" type="email" placeholder="mail@example.com" value={form.email} onChange={e=>upd("email",e.target.value)}/></div>
        <div className="fg-form"><label className="fl">Пароль *</label><input className="fi" type="password" placeholder="••••••••" value={form.password} onChange={e=>upd("password",e.target.value)}/></div>
        <div className="fg-form">
          <label className="fl">Пол *</label>
          <div className="chip-row">
            {[["♀ Девушка","female"],["♂ Парень","male"]].map(([l,v])=>(
              <button key={v} className={`chip-sel ${form.gender===v?"on":""}`} onClick={()=>upd("gender",v)}>{l}</button>
            ))}
          </div>
        </div>
        <div className="fg-form">
          <label className="fl">Регион <span style={{fontSize:11,color:'var(--muted)',fontWeight:400}}>(необязательно)</span></label>
          <select className="fi" value={form.region} onChange={e=>upd("region",e.target.value)}>
            <option value="">Выберите регион</option>
            {KZ_REGIONS.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
        <div className="fg-form">
          <label className="fl">Ваша ситуация *</label>
          <div className="chip-row" style={{gap:"10px"}}>
            <button className={`chip-sel ${form.renterType==="looking"?"on":""}`} onClick={()=>upd("renterType","looking")} style={{flex:1,textAlign:"center",padding:"14px 16px"}}>
              <div style={{fontSize:"20px",marginBottom:"4px"}}>🔍</div><div style={{fontSize:"13px",fontWeight:"700"}}>Ищу жильё</div><div style={{fontSize:"10px",opacity:".7",marginTop:"2px"}}>Ищу квартиру + соседа</div>
            </button>
            <button className={`chip-sel ${form.renterType==="has_place"?"on":""}`} onClick={()=>upd("renterType","has_place")} style={{flex:1,textAlign:"center",padding:"14px 16px"}}>
              <div style={{fontSize:"20px",marginBottom:"4px"}}>🏠</div><div style={{fontSize:"13px",fontWeight:"700"}}>Есть жильё</div><div style={{fontSize:"10px",opacity:".7",marginTop:"2px"}}>Ищу соседа к себе</div>
            </button>
          </div>
        </div>
        {form.renterType === "has_place" && (
          <div className="fg-form" style={{background:"linear-gradient(135deg,#f0fdf4,var(--accent-light))",padding:"16px",borderRadius:"var(--rs)",border:"2px solid var(--accent)"}}>
            <label className="fl" style={{color:"var(--accent2)"}}>📍 Адрес вашего жилья *</label>
            <input className="fi" placeholder="ул. Абая 150, кв. 45" value={form.address} onChange={e=>upd("address",e.target.value)}/>
            <AddressMapSelector address={form.address} lat={form.lat} lng={form.lng} region={form.region} onAddressChange={(addr) => upd("address", addr)} onLocationChange={(lat, lng) => { setForm(f => ({ ...f, lat, lng })); }}/>
            <div style={{fontSize:"11px",color:"var(--mid)",marginTop:"6px",lineHeight:"1.5"}}>💡 Вы можете ввести адрес вручную или кликнуть на карту.</div>
            {form.lat && form.lng && (
              <div style={{marginTop:'10px',padding:'8px 12px',background:'rgba(255,255,255,.7)',borderRadius:'8px',fontSize:'11px',color:'#666',display:'flex',alignItems:'center',gap:'6px'}}>
                <span style={{fontSize:'14px'}}>✓</span><span>Координаты: {form.lat.toFixed(5)}, {form.lng.toFixed(5)}</span>
              </div>
            )}
          </div>
        )}
      </>
    );
    if(step===1) return(
      <>
        <div className="step-title">Жильё и работа</div>
        <div className="step-sub">Ваши условия и требования · <span style={{color:'var(--muted)',fontSize:12}}>все поля необязательны</span></div>
        <div className="grid2">
          <div className="fg-form"><label className="fl">Бюджет (₸/мес)</label><input className="fi" type="number" placeholder="80000" value={form.budget} onChange={e=>upd("budget",e.target.value)}/></div>
          <div className="fg-form"><label className="fl">Дата заезда</label><input className="fi" type="date" value={form.move_in} onChange={e=>upd("move_in",e.target.value)}/></div>
        </div>
        <div className="fg-form"><label className="fl">Профессия / учёба</label><input className="fi" placeholder="Студентка, дизайнер, врач…" value={form.occupation} onChange={e=>upd("occupation",e.target.value)}/></div>
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
        <div className="step-sub">Поможет найти совместимого соседа · <span style={{color:'var(--muted)',fontSize:12}}>необязательно</span></div>
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
        <PhotoUpload photos={photos} onChange={setPhotos}/>
        <div className="fg-form">
          <label className="fl">Коротко о себе</label>
          <textarea className="fi" style={{height:"100px",resize:"vertical"}} placeholder="Я студентка 3-го курса, тихая и аккуратная…" value={form.bio} onChange={e=>upd("bio",e.target.value)}/>
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
          <div className="fg-form"><label className="fl">Email</label><input className="fi" type="email" placeholder="mail@example.com" value={form.email} onChange={e=>upd("email",e.target.value)}/></div>
          <div className="fg-form" style={{marginBottom:"24px"}}><label className="fl">Пароль</label><input className="fi" type="password" placeholder="••••••••" value={form.password} onChange={e=>upd("password",e.target.value)}/></div>
          <button className="btn-primary" onClick={handleLoginSubmit} disabled={loading}>{loading ? "Загрузка..." : "Войти →"}</button>
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
          <div className="reg-steps">{STEPS.map((_,i)=><div key={i} className={`reg-step ${i<step?"done":i===step?"active":""}`}/>)}</div>
          <div style={{maxHeight:"calc(80vh - 220px)",overflowY:"auto",paddingRight:"4px"}}>{stepContent()}</div>
          <div className="step-nav">
            {step>0&&<button className="btn-back" onClick={()=>setStep(s=>s-1)}>← Назад</button>}
            {step<STEPS.length-1?(
              <button className="btn-next" onClick={()=>setStep(s=>s+1)}>Далее →</button>
            ):(
              <button className="btn-next" onClick={handleRegisterSubmit} disabled={loading}>{loading ? "Создаем..." : "Создать профиль 🎉"}</button>
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

function injectMatchesStyles() {
  if (document.getElementById("matches-v2-styles")) return;
  const s = document.createElement("style");
  s.id = "matches-v2-styles";
  s.textContent = `
.mt-page{flex:1;padding:36px 28px 60px;max-width:1200px;margin:0 auto;width:100%;}
.mt-hero{margin-bottom:40px;position:relative;}
.mt-hero-label{font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:8px;display:flex;align-items:center;gap:8px;}
.mt-hero-label::before{content:'';display:inline-block;width:24px;height:1.5px;background:var(--muted);opacity:.5;}
.mt-hero-title{font-family:'Cormorant Garamond',serif;font-size:clamp(36px,5vw,54px);font-weight:600;color:var(--dark);line-height:1.1;letter-spacing:-1px;margin-bottom:10px;}
.mt-hero-title em{font-style:italic;color:var(--accent);}
.mt-hero-sub{font-size:14px;color:var(--muted);font-weight:400;line-height:1.6;max-width:420px;}
.mt-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:40px;}
@media(max-width:700px){.mt-stats{grid-template-columns:repeat(3,1fr);}}
.mt-stat{background:var(--card);border-radius:18px;padding:20px 20px 18px;box-shadow:0 2px 16px rgba(30,42,34,.07);border:1.5px solid transparent;transition:all .22s cubic-bezier(.34,1.2,.64,1);position:relative;overflow:hidden;cursor:default;opacity:0;transform:translateY(18px);animation:mtStatIn .4s cubic-bezier(.34,1.2,.64,1) forwards;}
.mt-stat:nth-child(1){animation-delay:.05s;}.mt-stat:nth-child(2){animation-delay:.12s;}.mt-stat:nth-child(3){animation-delay:.19s;}.mt-stat:nth-child(4){animation-delay:.26s;}
@keyframes mtStatIn{to{opacity:1;transform:translateY(0);}}
.mt-stat::after{content:'';position:absolute;bottom:0;left:0;right:0;height:3px;background:linear-gradient(90deg,var(--accent),transparent);transform:scaleX(0);transform-origin:left;transition:transform .3s ease;}
.mt-stat:hover{border-color:var(--accent);transform:translateY(-3px);box-shadow:0 8px 28px rgba(30,42,34,.12);}
.mt-stat:hover::after{transform:scaleX(1);}
.mt-stat-icon{font-size:22px;margin-bottom:10px;display:block;}
.mt-stat-n{font-family:'Cormorant Garamond',serif;font-size:38px;font-weight:700;color:var(--dark);line-height:1;margin-bottom:4px;letter-spacing:-1px;}
.mt-stat-l{font-size:12px;color:var(--muted);font-weight:500;letter-spacing:.2px;}
.mt-layout{display:flex;gap:28px;align-items:flex-start;}
.mt-list-col{flex:1;min-width:0;}
.mt-list-head{display:flex;align-items:baseline;gap:10px;margin-bottom:20px;}
.mt-list-title{font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:600;color:var(--dark);}
.mt-list-count{font-size:12px;color:var(--muted);font-weight:500;}
.mt-card{background:var(--card);border-radius:18px;padding:16px 18px;display:flex;align-items:flex-start;gap:14px;border:1.5px solid transparent;cursor:pointer;transition:all .24s cubic-bezier(.34,1.1,.64,1);margin-bottom:10px;position:relative;overflow:hidden;opacity:0;transform:translateX(-12px);animation:mtCardIn .36s cubic-bezier(.34,1.2,.64,1) forwards;}
.mt-card::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:linear-gradient(180deg,var(--accent),transparent);opacity:0;transition:opacity .2s;}
.mt-card:hover{border-color:rgba(61,122,92,.25);transform:translateX(5px);box-shadow:0 6px 24px rgba(30,42,34,.1);}
.mt-card:hover::before{opacity:1;}
.mt-card.active-chat{border-color:var(--accent);background:linear-gradient(135deg,#f6faf7,var(--accent-light));box-shadow:0 6px 24px rgba(61,122,92,.14);}
.mt-card.active-chat::before{opacity:1;}
@keyframes mtCardIn{to{opacity:1;transform:translateX(0);}}
.mt-av{width:52px;height:52px;border-radius:16px;display:flex;align-items:center;justify-content:center;font-family:'Cormorant Garamond',serif;font-size:19px;font-weight:700;color:var(--dark);flex-shrink:0;position:relative;box-shadow:0 3px 12px rgba(30,42,34,.12);transition:transform .2s;}
.mt-card:hover .mt-av{transform:scale(1.05) rotate(-2deg);}
.mt-av-online{position:absolute;bottom:-2px;right:-2px;width:12px;height:12px;border-radius:50%;background:#4caf50;border:2.5px solid var(--card);box-shadow:0 0 6px rgba(76,175,80,.5);animation:mtPulse 2.5s ease-in-out infinite;}
@keyframes mtPulse{0%,100%{box-shadow:0 0 6px rgba(76,175,80,.4);}50%{box-shadow:0 0 12px rgba(76,175,80,.75);}}
.mt-card-body{flex:1;min-width:0;}
.mt-card-top{display:flex;align-items:center;gap:7px;margin-bottom:3px;flex-wrap:wrap;}
.mt-card-name{font-weight:700;font-size:15px;color:var(--dark);letter-spacing:-.2px;}
.mt-verified{color:var(--accent);font-size:12px;}
.mt-match-pill{background:linear-gradient(135deg,#fef3c7,#fde68a);color:#92400e;font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;border:1px solid #fcd34d;letter-spacing:.3px;animation:mtMatchGlow 2s ease-in-out infinite alternate;}
@keyframes mtMatchGlow{from{box-shadow:0 0 0 0 rgba(251,191,36,0);}to{box-shadow:0 0 8px 1px rgba(251,191,36,.35);}}
.mt-card-meta{font-size:12px;color:var(--muted);margin-bottom:8px;}
.mt-preview{font-size:13px;color:var(--mid);padding:9px 12px;border-radius:10px;line-height:1.5;position:relative;}
.mt-preview.sent{background:#f0f7f2;border-left:3px solid var(--accent);}
.mt-preview.received{background:linear-gradient(135deg,#fffbeb,#fef9e7);border-left:3px solid #fbbf24;font-weight:600;color:var(--dark);}
.mt-preview.waiting{color:var(--muted);font-style:italic;font-size:12px;padding:0;background:none;border-left:none;}
.mt-preview-who{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;margin-bottom:3px;opacity:.6;display:block;}
.mt-card-arrow{font-size:16px;color:var(--muted);opacity:0;transition:all .2s;flex-shrink:0;align-self:center;}
.mt-card:hover .mt-card-arrow{opacity:1;transform:translateX(3px);}
.mt-empty{padding:80px 30px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:14px;}
.mt-empty-art{width:80px;height:80px;border-radius:24px;background:linear-gradient(135deg,var(--accent-light),#e8f5ea);border:2px solid rgba(61,122,92,.15);display:flex;align-items:center;justify-content:center;font-size:38px;animation:mtEmptyFloat 4s ease-in-out infinite;box-shadow:0 8px 32px rgba(61,122,92,.12);}
@keyframes mtEmptyFloat{0%,100%{transform:translateY(0) rotate(-3deg);}50%{transform:translateY(-8px) rotate(3deg);}}
.mt-empty-title{font-family:'Cormorant Garamond',serif;font-size:28px;font-weight:600;color:var(--dark);letter-spacing:-.5px;}
.mt-empty-sub{font-size:14px;color:var(--muted);line-height:1.7;max-width:280px;}
.mt-empty-btn{margin-top:6px;padding:13px 28px;background:var(--accent);color:#fff;border:none;border-radius:var(--rs);font-family:'Nunito',sans-serif;font-size:14px;font-weight:700;cursor:pointer;transition:all .2s cubic-bezier(.34,1.56,.64,1);box-shadow:0 4px 16px rgba(61,122,92,.25);}
.mt-empty-btn:hover{transform:translateY(-2px) scale(1.03);box-shadow:0 8px 24px rgba(61,122,92,.38);}
.mt-section-label{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:var(--muted);margin:24px 0 12px;display:flex;align-items:center;gap:8px;}
.mt-section-label::after{content:'';flex:1;height:1px;background:var(--bg2);}
  `;
  document.head.appendChild(s);
}

function MatchesTab({
  likedProfiles, matchedProfiles = [], liked, sent, sentMessages, conversations,
  typingFor, activeChat, setActiveChat, setSelected, setMsgText,
  auth, sendChat, sendTyping, setTab, onRefresh
}) {
  useEffect(() => { injectMatchesStyles(); }, []);
  // Refresh on every mount so the user who was liked (passive side) sees their matches
  useEffect(() => { onRefresh?.(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const matched  = likedProfiles.filter(p => p.matched);
  const pending  = likedProfiles.filter(p => !p.matched);

  const handleCardClick = (p) => {
    if (p.matched) { setActiveChat(p.id); }
    else { setSelected(p); setMsgText(""); }
  };

  const renderPreview = (p) => {
    const conv    = conversations[p.id];
    const lastMsg = conv && conv.length > 0 ? conv[conv.length - 1] : null;
    const sentMsg = sentMessages[p.id];
    if (lastMsg) {
      return (
        <div className={`mt-preview ${lastMsg.mine ? "sent" : "received"}`}>
          <span className="mt-preview-who">{lastMsg.mine ? "Вы" : p.name.split(" ")[0]}</span>
          {lastMsg.text.length > 72 ? lastMsg.text.slice(0, 72) + "…" : lastMsg.text}
        </div>
      );
    }
    if (sentMsg) {
      return (
        <div className="mt-preview sent">
          <span className="mt-preview-who">Вы</span>
          {sentMsg.length > 72 ? sentMsg.slice(0, 72) + "…" : sentMsg}
        </div>
      );
    }
    if (sent.has(p.id) && !p.matched) return <div className="mt-preview waiting">⏳ Ожидание ответа…</div>;
    return <div className="mt-preview waiting">Нажмите, чтобы написать</div>;
  };

  const PersonCard = ({ p, delay = 0 }) => {
    const reg = KZ_REGIONS.find(r => r.id === p.region);
    return (
      <div className={`mt-card ${activeChat === p.id ? "active-chat" : ""}`} style={{ animationDelay: `${delay}s` }} onClick={() => handleCardClick(p)}>
        <div className="mt-av" style={{backgroundImage:p.photos?.[0]?.startsWith("http")?`url(${p.photos[0]})`:"none",background:p.photos?.[0]?.startsWith("http")?"transparent":(p.photos?.[0]??"var(--bg2)"),backgroundSize:"cover",backgroundPosition:"center"}}>
          {p.photos?.[0]?.startsWith("http")?"":p.avatar}{p.online&&<div className="mt-av-online"/>}
        </div>
        <div className="mt-card-body">
          <div className="mt-card-top">
            <span className="mt-card-name">{p.name}, {p.age}</span>
            {p.verified && <span className="mt-verified">✓</span>}
            {p.matched && <span className="mt-match-pill">🤝 Совпадение</span>}
          </div>
          <div className="mt-card-meta">{reg?.name || ""}{p.occupation ? ` · ${p.occupation}` : ""}{p.budget ? ` · ${(p.budget || 0).toLocaleString()} ₸` : ""}</div>
          {renderPreview(p)}
        </div>
        <span className="mt-card-arrow">›</span>
      </div>
    );
  };

  return (
    <div className="mt-page">
      <div className="mt-hero">
        <div className="mt-hero-label">Ваши связи</div>
        <h1 className="mt-hero-title">Избранные <em>люди</em></h1>
        <p className="mt-hero-sub">Те, кто заинтересовал вас. Напишите первыми — хорошие соседи не ждут долго.</p>
      </div>
      <div className="mt-stats">
        {[
          { n: liked.size,     l: "Лайков",     color: "#f43f5e", bg: "#fff1f2" },
          { n: matched.length, l: "Совпадений", color: "#10b981", bg: "#ecfdf5" },
          { n: sent.size,      l: "Переписок",  color: "#6366f1", bg: "#eef2ff" },
        ].map(({ icon, n, l, color, bg }) => (
          <div className="mt-stat" key={l} style={{borderColor:color+"33",background:`linear-gradient(135deg,${bg},#fff)`}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
              <span style={{fontSize:26}}>{icon}</span>
              <div style={{width:32,height:32,borderRadius:"50%",background:color+"18",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <div style={{width:16,height:16,borderRadius:"50%",background:color,opacity:.8}}/>
              </div>
            </div>
            <div className="mt-stat-n" style={{color}}>{n}</div>
            <div className="mt-stat-l">{l}</div>
            <div style={{marginTop:10,height:3,background:color+"22",borderRadius:3,overflow:"hidden"}}>
              <div style={{width:`${Math.min(n*15,100)}%`,height:"100%",background:color,borderRadius:3,transition:"width .6s ease"}}/>
            </div>
          </div>
        ))}
      </div>
      {likedProfiles.length === 0 ? (
        <div className="mt-empty">
          <div className="mt-empty-art">💛</div>
          <div className="mt-empty-title">Пока пусто</div>
          <p className="mt-empty-sub">Листайте анкеты и нажимайте ❤️ — здесь появятся люди, которые вам понравились.</p>
          <button className="mt-empty-btn" onClick={() => setTab("swipe")}>Смотреть анкеты →</button>
        </div>
      ) : (
        <div className="mt-layout">
          <div className="mt-list-col">
            {matched.length > 0 && (
              <>
                <div className="mt-section-label">🤝 Совпадения — пишите прямо сейчас</div>
                {matched.map((p, i) => <PersonCard key={p.id} p={p} delay={i * 0.06} />)}
              </>
            )}
            {pending.length > 0 && (
              <>
                <div className="mt-section-label" style={{ marginTop: matched.length ? 28 : 0 }}>⏳ Ожидают ответа</div>
                {pending.map((p, i) => <PersonCard key={p.id} p={p} delay={(matched.length + i) * 0.06} />)}
              </>
            )}
          </div>
          {activeChat && (() => {
            const profile = likedProfiles.find(p => p.id === activeChat) || matchedProfiles?.find(p => p.id === activeChat);
            if (!profile) return null;
            return (
              <ChatPanel
                profile={profile}
                messages={conversations[profile.id] || []}
                typing={typingFor === profile.id}
                userInitials={auth.initials}
                onSend={(text) => sendChat(profile.id, text)}
                onTyping={() => sendTyping(profile.id)}   // ← add this

                onClose={() => setActiveChat(null)}
              />
            );
          })()}
        </div>
      )}
    </div>
  );
}

export function usePollingChat(authUserId, matchedProfiles, setConversations) {
  const [typingFor, setTypingFor] = useState(null);
  const pollTimers = useRef({});

  const startPolling = useCallback((profileId) => {
    if (pollTimers.current[profileId]) return;
    const poll = async () => {
      try {
        const token = localStorage.getItem("roommate_kz_token");
        const res = await fetch(`/api/messages/${profileId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) return;
        const msgs = await res.json();
        setConversations((prev) => {
          const existing = prev[profileId] || [];
          const existingIds = new Set(existing.map((m) => m.id));
          const incoming = msgs.filter((m) => !existingIds.has(m.id)).map((m) => ({
            id:   m.id,
            text: m.text,
            mine: String(m.sender_id) === String(authUserId),
            time: new Date(m.created_at).toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" }),
          }));
          if (incoming.length === 0) return prev;
          if (incoming.some((m) => !m.mine)) {
            setTypingFor(profileId);
            setTimeout(() => setTypingFor(null), 1200);
          }
          return { ...prev, [profileId]: [...existing, ...incoming] };
        });
      } catch (_) {}
    };
    poll();
    pollTimers.current[profileId] = setInterval(poll, 3000);
  }, [authUserId, setConversations]);

  const stopPolling = useCallback((profileId) => {
    clearInterval(pollTimers.current[profileId]);
    delete pollTimers.current[profileId];
  }, []);

  useEffect(() => {
    matchedProfiles.filter((p) => p.matched).forEach((p) => startPolling(p.id));
    return () => {
      Object.values(pollTimers.current).forEach(clearInterval);
      pollTimers.current = {};
    };
  }, [matchedProfiles, startPolling]);

  return { typingFor, startPolling, stopPolling };
}