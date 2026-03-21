import { useState, useEffect, useRef, useCallback } from "react";
//import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import './design/components.css';
import { KZ_REGIONS, BASE_URL } from './logic/constants';
import { Ic } from './components/Icons';
// usePollingChat is exported from ./logic/hooks for external/backend use;
// internally useRealtimeChat handles all polling via its own fallback.
import 'leaflet/dist/leaflet.css';
import ApiClient from './api-client';
const api = new ApiClient();


const fmt = (d = new Date()) =>
  `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

const UNIVERSITY_OPTIONS = [
  "NU",
  "KBTU",
  "SDU",
  "Satbayev",
  "KazNU",
  "AITU",
  "Narxoz",
];

const metaFromTags = (tags, key, fallback = "") => {
  const arr = Array.isArray(tags) ? tags : [];
  const row = arr.find((t) => typeof t === "string" && t.startsWith(`${key}:`));
  return row ? row.slice(key.length + 1) : fallback;
};

const withMetaTag = (tags, key, value) => {
  const arr = (Array.isArray(tags) ? tags : []).filter((t) => !(typeof t === "string" && t.startsWith(`${key}:`)));
  if (value !== undefined && value !== null && String(value).trim() !== "") {
    arr.push(`${key}:${String(value).trim()}`);
  }
  return arr;
};

const distKm = (la1, lo1, la2, lo2) => {
  if (!la1 || !lo1 || !la2 || !lo2) return Infinity;
  const R = 6371;
  const dL = ((la2 - la1) * Math.PI) / 180;
  const dN = ((lo2 - lo1) * Math.PI) / 180;
  const a = Math.sin(dL / 2) ** 2 + Math.cos((la1 * Math.PI) / 180) * Math.cos((la2 * Math.PI) / 180) * Math.sin(dN / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

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
  university: p.university ?? metaFromTags(p.tags, "uni", ""),
  commuteMax: Number(p.commuteMax ?? metaFromTags(p.tags, "commute", "0")) || 0,
  nearMetro: String(p.nearMetro ?? metaFromTags(p.tags, "metro", "")) === "yes",
  nearBus: String(p.nearBus ?? metaFromTags(p.tags, "bus", "")) === "yes",
  idealRoommate: p.idealRoommate ?? metaFromTags(p.tags, "ideal", ""),
  quietHours: p.quietHours ?? metaFromTags(p.tags, "quiet", ""),
  boostedUntil: p.boostedUntil ?? metaFromTags(p.tags, "boost", ""),
});

const getInitials = (name = "") =>
  name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "??";


// ── PHOTO UPLOAD ──────────────────────────────────────────────────────────────
async function uploadPhoto(file) {
  const token = localStorage.getItem("roommate_kz_token");
  const form  = new FormData();
  form.append("photo", file);
  const res = await fetch(`${BASE_URL}/api/upload/photo`, {
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
function SwipeTab({ profiles, onLike, onPass, onViewProfile, onSuperLike }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging]     = useState(false);
  const [dragX, setDragX]               = useState(0);
  const [dragY, setDragY]               = useState(0);
  const [isAnimatingOut, setIsAnimatingOut] = useState(null); // 'left' | 'right' | null
  const [mode, setMode] = useState("people");
  const cardRef   = useRef(null);
  const startPos  = useRef({ x: 0, y: 0 });
  const animFrame = useRef(null);

  // ── helpers ────────────────────────────────────────────────────────────────
  const THRESHOLD = 100; // px needed to trigger like/pass
  const swipeProfiles = (profiles || []).filter((p) => (mode === "places" ? p.renterType === "has_place" : true));

  const dismissCard = useCallback((direction) => {
    setIsAnimatingOut(direction);
    setTimeout(() => {
      if (direction === 'right') onLike(swipeProfiles[currentIndex]);
      else                       onPass(swipeProfiles[currentIndex]);
      setCurrentIndex(i => i + 1);
      setDragX(0);
      setDragY(0);
      setIsAnimatingOut(null);
    }, 380);
  }, [currentIndex, swipeProfiles, onLike, onPass]);

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
  if (!swipeProfiles || swipeProfiles.length === 0 || currentIndex >= swipeProfiles.length) {
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

  const currentProfile = swipeProfiles[currentIndex];
  const nextProfile    = swipeProfiles[currentIndex + 1];
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
            Анкета {currentIndex + 1} из {swipeProfiles.length}
          </span>
          <span style={{ fontSize:"12px", color:"var(--muted)" }}>
            {Math.round(((currentIndex + 1) / swipeProfiles.length) * 100)}%
          </span>
        </div>
        <div style={{ width:"100%", height:"5px", background:"var(--bg2)", borderRadius:"10px", overflow:"hidden" }}>
          <div style={{
            width:`${((currentIndex + 1) / swipeProfiles.length) * 100}%`,
            height:"100%",
            background:"linear-gradient(90deg, var(--accent), var(--accent2))",
            borderRadius:"10px", transition:"width .3s ease"
          }}/>
        </div>
      </div>

      <div style={{ display:"flex", gap:"8px", marginBottom:"14px" }}>
        <button className={`chip ${mode==="people"?"chip-on":"chip-off"}`} onClick={() => { setMode("people"); setCurrentIndex(0); }}>
          People
        </button>
        <button className={`chip ${mode==="places"?"chip-on":"chip-off"}`} onClick={() => { setMode("places"); setCurrentIndex(0); }}>
          Places
        </button>
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
              {(currentProfile.idealRoommate || currentProfile.quietHours) && (
                <div style={{ marginTop:"8px", background:"rgba(0,0,0,.28)", borderRadius:"10px", padding:"8px 10px", fontSize:"12px", lineHeight:"1.5" }}>
                  {currentProfile.idealRoommate && <div><b>Ideal roommate:</b> {currentProfile.idealRoommate}</div>}
                  {currentProfile.quietHours && <div><b>Quiet hours:</b> {currentProfile.quietHours}</div>}
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
      <div style={{ display:"flex", justifyContent:"center", gap:"16px", alignItems:"center", marginTop:"28px", flexWrap:"wrap" }}>
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
        <button
          onClick={() => onSuperLike?.(currentProfile)}
          style={{ width:"58px", height:"58px", background:"linear-gradient(135deg,#fde047,#f59e0b)", border:"none", borderRadius:"50%", cursor:"pointer", boxShadow:"0 6px 24px rgba(245,158,11,.28)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:"24px", fontWeight:"800" }}
          title="Super like / priority boost"
        >★</button>
      </div>

      {/* Hint */}
      <div style={{ marginTop:"16px", fontSize:"12px", color:"var(--muted)", display:"flex", gap:"18px", justifyContent:"center" }}>
        <span>← Пропустить</span>
        <span>↑ Профиль</span>
        <span>→ Лайк</span><span>★ Super Like</span>
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
    if (filters.university && p.university !== filters.university) return false;
    if (filters.commuteMax && (Number(p.commuteMax) || 999) > Number(filters.commuteMax)) return false;
    if (filters.transit === "metro" && !p.nearMetro) return false;
    if (filters.transit === "bus" && !p.nearBus) return false;
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
          <div>
            <div style={{ fontSize:"11px", fontWeight:"700", color:"var(--muted)", textTransform:"uppercase", letterSpacing:".7px", marginBottom:"8px" }}>🎓 Университет</div>
            <select className="fsel" value={filters.university || ""} onChange={e=>setFilters(f=>({...f,university:e.target.value}))}>
              <option value="">Любой</option>
              {UNIVERSITY_OPTIONS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize:"11px", fontWeight:"700", color:"var(--muted)", textTransform:"uppercase", letterSpacing:".7px", marginBottom:"8px" }}>🕒 Коммьют</div>
            <select className="fsel" value={filters.commuteMax || ""} onChange={e=>setFilters(f=>({...f,commuteMax:e.target.value}))}>
              <option value="">Не важно</option>
              <option value="30">≤ 30 мин</option>
              <option value="45">≤ 45 мин</option>
              <option value="60">≤ 60 мин</option>
            </select>
          </div>
          <div>
            <div style={{ fontSize:"11px", fontWeight:"700", color:"var(--muted)", textTransform:"uppercase", letterSpacing:".7px", marginBottom:"8px" }}>🚇🚌 Транспорт</div>
            <div style={{ display: "flex", gap: "6px" }}>
              {[["Любой",""],["Метро","metro"],["Автобус","bus"]].map(([label,val]) => {
                const on = (filters.transit || "") === val;
                return (
                  <button key={val} onClick={() => setFilters(f => ({ ...f, transit: val }))}
                    style={{ ...pillBase, ...(on ? pillActive : pillInactive) }}>
                    {label}
                  </button>
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

      {/* Map + people sidebar */}
      <div style={{display:"grid",gridTemplateColumns:"280px 1fr",gap:"16px",alignItems:"start"}}>

        {/* LEFT SIDEBAR — scrollable person list */}
        <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:"var(--r)",overflow:"hidden",boxShadow:"var(--sh)"}}>
          <div style={{padding:"13px 16px",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <span style={{fontFamily:"var(--font-display)",fontSize:"15px",color:"var(--txt)"}}>
              {cityFilter==="all"?"Все":visibleCities.find(c=>c.id===cityFilter)?.short??cityFilter}
            </span>
            <span style={{fontSize:"11px",fontWeight:"600",background:"var(--accent-light)",color:"var(--accent)",borderRadius:"20px",padding:"2px 9px"}}>{displayedProfiles.length}</span>
          </div>
          <div style={{maxHeight:"500px",overflowY:"auto",padding:"6px"}}>
            {displayedProfiles.length===0 ? (
              <div style={{textAlign:"center",padding:"32px 12px",color:"var(--txt3)"}}>
                <div style={{fontSize:"28px",marginBottom:"8px"}}>🗺️</div>
                <div style={{fontSize:"12.5px"}}>Никого не найдено</div>
              </div>
            ) : displayedProfiles.map(p=>(
              <div key={p.id} onClick={()=>onViewProfile(p)}
                style={{display:"flex",alignItems:"center",gap:"10px",padding:"9px 10px",borderRadius:"var(--rs)",cursor:"pointer",transition:"all .18s",marginBottom:"1px"}}
                onMouseEnter={e=>{e.currentTarget.style.background="var(--bg2)";}}
                onMouseLeave={e=>{e.currentTarget.style.background="transparent";}}
              >
                {/* avatar */}
                <div style={{
                  width:"42px",height:"42px",borderRadius:"50%",flexShrink:0,
                  border:"1.5px solid var(--border2)",overflow:"hidden",
                  backgroundImage:p.photos?.[0]?.startsWith("http")?`url(${p.photos[0]})`:"url(/hero-astana.jpg)",
                  backgroundSize:"cover",backgroundPosition:"center",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontFamily:"var(--font-display)",fontSize:"14px",color:"var(--txt2)",
                  background:p.photos?.[0]?.startsWith("http")?"transparent":"var(--bg2)",
                }}>
                  {p.photos?.[0]?.startsWith("http")?"":p.avatar}
                </div>
                {/* info */}
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:"4px",marginBottom:"1px"}}>
                    <span style={{fontFamily:"var(--font-display)",fontSize:"13.5px",color:"var(--txt)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}{p.age?`, ${p.age}`:""}</span>
                    {p.online&&<span style={{width:"6px",height:"6px",borderRadius:"50%",background:"var(--green)",flexShrink:0,display:"inline-block"}}/>}
                  </div>
                  <div style={{fontSize:"10.5px",color:"var(--txt3)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                    {(p.budget||0).toLocaleString()} ₸{p.occupation?` · ${p.occupation}`:""}
                  </div>
                </div>
                {/* gender */}
                <span style={{fontSize:"9.5px",padding:"2px 6px",borderRadius:"20px",flexShrink:0,fontWeight:"600",
                  background:p.gender==="female"?"var(--female-light)":"var(--male-light)",
                  color:p.gender==="female"?"var(--female)":"var(--male)"}}>
                  {p.gender==="female"?"♀":"♂"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — map */}
        <LeafletMap profiles={displayedProfiles} onView={onViewProfile} onRadiusFilterChange={setRadiusFilter} authUser={authUser} focusRegion={cityFilter} />
      </div>
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App() {


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
  const [superLiked, setSuperLiked] = useState(new Set());
  const [filters, setFilters] = useState({
    search: "", region: "", budget: 200000, gender: "",
    schedule: "", pets: "", remote: "", smoking: "", religion: "", alcohol: "",
    university: "", commuteMax: "", transit: "",
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
    if (filters.university && p.university !== filters.university) return false;
    if (filters.commuteMax && (Number(p.commuteMax) || 999) > Number(filters.commuteMax)) return false;
    if (filters.transit === "metro" && !p.nearMetro) return false;
    if (filters.transit === "bus" && !p.nearBus) return false;
    return true;
  });
  const recommendationScore = (p) => {
    let score = 0;
    const budgetA = Number(auth?.budget || 0);
    const budgetB = Number(p.budget || 0);
    if (budgetA && budgetB) score += Math.max(0, 25 - Math.min(Math.abs(budgetA - budgetB) / 12000, 25));
    if (auth?.schedule && p.schedule && auth.schedule === p.schedule) score += 15;
    if (auth?.cleanliness && p.cleanliness) score += Math.max(0, 14 - Math.abs(auth.cleanliness - p.cleanliness) * 4);
    if (auth?.social && p.social) score += Math.max(0, 10 - Math.abs(auth.social - p.social) * 3);
    const myRegion = KZ_REGIONS.find((r) => r.id === auth?.region);
    const pRegion = KZ_REGIONS.find((r) => r.id === p.region);
    if (myRegion && pRegion) {
      const km = distKm(myRegion.lat, myRegion.lng, pRegion.lat, pRegion.lng);
      score += Math.max(0, 18 - Math.min(km / 60, 18));
    }
    if (superLiked.has(p.id)) score += 40;
    if (p.renterType === "has_place" && auth?.renterType === "looking") score += 10;
    if (p.university && auth?.university && p.university === auth.university) score += 12;
    return Math.round(score);
  };
  const rankedFiltered = filtered
    .map((p) => ({ ...p, recScore: recommendationScore(p) }))
    .sort((a, b) => b.recScore - a.recScore);

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
          profiles={rankedFiltered.filter(p => !liked.has(p.id) && !passed.has(p.id))}
          onLike={async (p)=>{
            setLiked(s=>{const n=new Set(s);n.add(p.id);return n;});
            try {
              const result = await api.likeProfile(p.id);
              if (result?.matched) {
                handleMatch(p.id);
              }
            } catch(e) { console.warn("likeProfile error:", e.message); }
          }}
          onSuperLike={async (p) => {
            setSuperLiked((s) => { const n = new Set(s); n.add(p.id); return n; });
            setLiked((s)=>{const n=new Set(s);n.add(p.id);return n;});
            try {
              const result = await api.likeProfile(p.id);
              if (result?.matched) handleMatch(p.id);
            } catch (e) { console.warn("superLike error:", e.message); }
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
              <p className="ps">{rankedFiltered.length} человек по вашим критериям в Казахстане</p>
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
                <div className="fg">
                  <label>Университет рядом</label>
                  <select className="fsel" style={{width:"100%"}} value={filters.university} onChange={e=>setFilters(f=>({...f,university:e.target.value}))}>
                    <option value="">Любой</option>
                    {UNIVERSITY_OPTIONS.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div className="fg">
                  <label>Коммьют до кампуса</label>
                  <select className="fsel" style={{width:"100%"}} value={filters.commuteMax} onChange={e=>setFilters(f=>({...f,commuteMax:e.target.value}))}>
                    <option value="">Не важно</option>
                    <option value="30">≤ 30 мин</option>
                    <option value="45">≤ 45 мин</option>
                    <option value="60">≤ 60 мин</option>
                  </select>
                </div>
                <div className="fg">
                  <label>Транспорт рядом</label>
                  <div className="chip-row">
                    {[["Любой",""],["Метро","metro"],["Автобус","bus"]].map(([l,v])=>(
                      <button key={l} className={`chip ${filters.transit===v?"chip-on":"chip-off"}`} onClick={()=>setFilters(f=>({...f,transit:v}))}>{l}</button>
                    ))}
                  </div>
                </div>
                <div className="fg" style={{gridColumn:"1/-1",alignItems:"flex-start"}}>
                  <button onClick={()=>setFilters({search:"",region:"",budget:200000,gender:"",schedule:"",pets:"",remote:"",smoking:"",religion:"",alcohol:"",university:"",commuteMax:"",transit:""})} className="btn-ghost" style={{width:"auto"}}>Сбросить все фильтры</button>
                </div>
              </div>
            )}
          </div>
          {view==="grid"?(
            <div className="grid">
              {rankedFiltered.map(p=>(
                <ProfileCard key={p.id} p={p} liked={liked.has(p.id)} sent={sent.has(p.id)}
                  onLike={async()=>{setLiked(s=>{const n=new Set(s);n.add(p.id);return n;});
                    try{const r=await api.likeProfile(p.id);if(r?.matched)await handleMatch(p.id);}catch(e){console.warn(e);}
                  }}
                  onView={()=>{setSelected(p);setMsgText("");}}/>
              ))}
            </div>
          ):(
            <div>
              {rankedFiltered.map(p=>{
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
          {rankedFiltered.length===0&&(
            <div className="empty">
              <div className="empty-ic">🔍</div>
              <div className="empty-t">Ничего не найдено</div>
              <p>Попробуйте изменить фильтры</p>
              <button className="btn-primary" style={{marginTop:"18px",width:"auto",padding:"11px 28px"}} onClick={()=>setFilters({search:"",region:"",budget:200000,gender:"",schedule:"",pets:"",remote:"",smoking:"",religion:"",alcohol:"",university:"",commuteMax:"",transit:""})}>Сбросить фильтры</button>
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
        {(p.idealRoommate || p.quietHours) && (
          <div style={{fontSize:"11px",color:"var(--mid)",marginBottom:"10px",lineHeight:"1.5",background:"var(--bg2)",padding:"7px 9px",borderRadius:"8px"}}>
            {p.idealRoommate && <div><b>Ideal:</b> {p.idealRoommate}</div>}
            {p.quietHours && <div><b>Quiet:</b> {p.quietHours}</div>}
          </div>
        )}
        <div className="tags">
          {p.tags.map(t=><span key={t} className="tag">{t}</span>)}
          {p.pets&&<span className="tag">🐾 Питомец</span>}
          {p.remote&&<span className="tag">💻 Удалёнка</span>}
          {!p.smoking&&<span className="tag">🚭</span>}
          {p.university&&<span className="tag">🎓 {p.university}</span>}
        </div>
        {typeof p.recScore === "number" && <div style={{fontSize:"11px",fontWeight:"700",color:"var(--accent)",marginBottom:"8px"}}>Smart match: {p.recScore}%</div>}
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
            {p.university && <div className="mmi">🎓 {p.university}</div>}
            {!!p.commuteMax && <div className="mmi">🕒 Коммьют до кампуса: ≤ {p.commuteMax} мин</div>}
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
            {(p.idealRoommate || p.quietHours) && (
              <div style={{ marginTop:"10px", background:"var(--bg2)", borderRadius:"10px", padding:"10px 12px", fontSize:"12px", color:"var(--mid)", lineHeight:"1.6" }}>
                {p.idealRoommate && <div><b>My ideal roommate is:</b> {p.idealRoommate}</div>}
                {p.quietHours && <div><b>Quiet hours:</b> {p.quietHours}</div>}
              </div>
            )}
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
    university:auth.university||"",commuteMax:String(auth.commuteMax||""),nearMetro:Boolean(auth.nearMetro),nearBus:Boolean(auth.nearBus),
    idealRoommate:auth.idealRoommate||"",quietHours:auth.quietHours||"",
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
      let tags = Array.isArray(auth.tags) ? auth.tags : [];
      tags = withMetaTag(tags, "uni", form.university);
      tags = withMetaTag(tags, "commute", form.commuteMax);
      tags = withMetaTag(tags, "metro", form.nearMetro ? "yes" : "no");
      tags = withMetaTag(tags, "bus", form.nearBus ? "yes" : "no");
      tags = withMetaTag(tags, "ideal", form.idealRoommate);
      tags = withMetaTag(tags, "quiet", form.quietHours);
      const payload={...form,age:parseInt(form.age)||null,budget:parseInt(form.budget)||null,photos:photos.filter(Boolean),tags};
      const updated=await api.updateProfile(payload);
      const ini=(updated.name||form.name).split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2)||"??";
      setAuth(prev=>({...prev,...normaliseProfile(updated),avatar:ini,initials:ini,photos:photos.filter(Boolean)}));
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
        <div className="grid2">
          <div className="fg-form"><label className="fl">Университет</label>
            <select className="fi" value={form.university} onChange={e=>upd("university",e.target.value)}>
              <option value="">— Не указано —</option>
              {UNIVERSITY_OPTIONS.map((u)=><option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div className="fg-form"><label className="fl">Коммьют до кампуса</label>
            <select className="fi" value={form.commuteMax} onChange={e=>upd("commuteMax",e.target.value)}>
              <option value="">Не важно</option><option value="30">≤ 30 мин</option><option value="45">≤ 45 мин</option><option value="60">≤ 60 мин</option>
            </select>
          </div>
        </div>
        <div className="fg-form"><label className="fl">Транспорт рядом</label>
          <div className="chip-row">
            <button className={`chip-sel ${form.nearMetro?"on":""}`} onClick={()=>upd("nearMetro",!form.nearMetro)}>🚇 Метро</button>
            <button className={`chip-sel ${form.nearBus?"on":""}`} onClick={()=>upd("nearBus",!form.nearBus)}>🚌 Автобус</button>
          </div>
        </div>
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
        <div className="fg-form"><label className="fl">Prompt: My ideal roommate is…</label>
          <input className="fi" value={form.idealRoommate} onChange={e=>upd("idealRoommate",e.target.value)} placeholder="Ответственный и чистоплотный"/></div>
        <div className="fg-form"><label className="fl">Prompt: Quiet hours…</label>
          <input className="fi" value={form.quietHours} onChange={e=>upd("quietHours",e.target.value)} placeholder="23:00 - 08:00"/></div>
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
  const [resetCode, setResetCode] = useState("");
  const [devResetCode, setDevResetCode] = useState("");
  const [form, setForm]=useState({
    name:"", email:"", password:"", age:"", gender:"", region:"",
    renterType:"looking", address:"", lat:null, lng:null,
    budget:"", occupation:"", move_in:"", cleanliness:3, social:3,
    pets:false, smoking:false, remote:false, alcohol:false, schedule: "Гибкий",
    religion:"Нет", guests:"Иногда", noise:"Умеренная",
    studyWork:"Работа", languages:[], bio:"",
    university:"", commuteMax:"", nearMetro:false, nearBus:true,
    idealRoommate:"", quietHours:"",
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
        tags: withMetaTag(
          withMetaTag(
            withMetaTag(
              withMetaTag(
                withMetaTag([], "uni", form.university),
                "commute", form.commuteMax
              ),
              "metro", form.nearMetro ? "yes" : "no"
            ),
            "bus", form.nearBus ? "yes" : "no"
          ),
          "ideal", form.idealRoommate
        ),
        quietHours: form.quietHours,
      };
      registerData.tags = withMetaTag(registerData.tags, "quiet", form.quietHours);
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

  const handleForgotRequest = async () => {
    if (!form.email?.trim()) return alert("Введите email");
    setLoading(true);
    try {
      const res = await api.forgotPassword(form.email.trim());
      setDevResetCode(res?.dev_code || "");
      alert("Код сброса отправлен. Проверьте почту (или используйте dev-код ниже).");
    } catch (err) {
      alert("Ошибка запроса: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async () => {
    if (!form.email?.trim()) return alert("Введите email");
    if (!resetCode.trim()) return alert("Введите код сброса");
    if (!form.password || form.password.length < 8) {
      return alert("Новый пароль должен быть не менее 8 символов");
    }
    setLoading(true);
    try {
      await api.resetPassword(form.email.trim(), resetCode.trim(), form.password);
      alert("Пароль обновлен. Теперь войдите в аккаунт.");
      setMode("login");
      setResetCode("");
      setDevResetCode("");
      setForm(f => ({ ...f, password: "" }));
    } catch (err) {
      alert("Ошибка сброса: " + err.message);
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
        <div className="fg-form">
          <label className="fl">Университет рядом</label>
          <select className="fi" value={form.university} onChange={e=>upd("university",e.target.value)}>
            <option value="">Не выбрано</option>
            {UNIVERSITY_OPTIONS.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <div className="fg-form">
          <label className="fl">Коммьют до кампуса</label>
          <select className="fi" value={form.commuteMax} onChange={e=>upd("commuteMax",e.target.value)}>
            <option value="">Не важно</option>
            <option value="30">≤ 30 мин</option>
            <option value="45">≤ 45 мин</option>
            <option value="60">≤ 60 мин</option>
          </select>
        </div>
        <div className="fg-form">
          <label className="fl">Транспорт рядом</label>
          <div className="chip-row">
            <button className={`chip-sel ${form.nearMetro?"on":""}`} onClick={()=>upd("nearMetro",!form.nearMetro)}>🚇 Метро</button>
            <button className={`chip-sel ${form.nearBus?"on":""}`} onClick={()=>upd("nearBus",!form.nearBus)}>🚌 Автобус</button>
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
        <div className="fg-form">
          <label className="fl">Prompt: My ideal roommate is…</label>
          <input className="fi" placeholder="Ответственный, уважает личное пространство…" value={form.idealRoommate} onChange={e=>upd("idealRoommate",e.target.value)} />
        </div>
        <div className="fg-form">
          <label className="fl">Prompt: Quiet hours…</label>
          <input className="fi" placeholder="23:00 - 08:00" value={form.quietHours} onChange={e=>upd("quietHours",e.target.value)} />
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

  if(mode==="forgot") return(
    <div className="auth-wrap">
      <div className="auth-left">
        <div style={{textAlign:"center"}}>
          <div style={{fontFamily:"Cormorant Garamond",fontSize:"52px",fontWeight:"700",color:"#fff",lineHeight:1}}>Сосед<span style={{color:"var(--warm)"}}>КЗ</span></div>
          <div style={{color:"rgba(255,255,255,.7)",fontSize:"16px",marginTop:"12px"}}>Восстановление пароля</div>
        </div>
      </div>
      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-logo">Сосед<span>КЗ</span></div>
          <p className="auth-sub">Восстановите доступ к своему аккаунту</p>
          <div className="atabs">
            <button className="atab" onClick={()=>setMode("login")}>Вход</button>
            <button className="atab" onClick={()=>{setMode("register");setStep(0);}}>Регистрация</button>
            <button className="atab active">Сброс</button>
          </div>
          <div className="fg-form">
            <label className="fl">Email</label>
            <input className="fi" type="email" placeholder="mail@example.com" value={form.email} onChange={e=>upd("email",e.target.value)}/>
          </div>
          <div className="fg-form">
            <label className="fl">Код сброса</label>
            <input className="fi" placeholder="6-значный код" value={resetCode} onChange={e=>setResetCode(e.target.value.replace(/\D/g, "").slice(0, 6))}/>
          </div>
          <div className="fg-form" style={{marginBottom:"20px"}}>
            <label className="fl">Новый пароль</label>
            <input className="fi" type="password" placeholder="Не менее 8 символов" value={form.password} onChange={e=>upd("password",e.target.value)}/>
          </div>
          {!!devResetCode && (
            <div style={{background:"var(--accent-light)",border:"1px solid var(--accent)",padding:"10px 12px",borderRadius:"10px",fontSize:"12px",marginBottom:"14px",color:"var(--accent2)"}}>
              Dev код: <b>{devResetCode}</b>
            </div>
          )}
          <div style={{display:"grid",gap:"8px"}}>
            <button className="btn-ghost" onClick={handleForgotRequest} disabled={loading}>Получить код</button>
            <button className="btn-primary" onClick={handleResetSubmit} disabled={loading}>{loading ? "Загрузка..." : "Сбросить пароль"}</button>
          </div>
          <p style={{textAlign:"center",fontSize:"12px",color:"var(--muted)",marginTop:"16px"}}>
            Вспомнили пароль?&nbsp;<span style={{color:"var(--accent)",cursor:"pointer",fontWeight:"700"}} onClick={()=>setMode("login")}>Войти</span>
          </p>
        </div>
      </div>
    </div>
  );

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
            <button className={`atab ${mode==="forgot"?"active":""}`} onClick={()=>setMode("forgot")}>Сброс</button>
          </div>
          <div className="fg-form"><label className="fl">Email</label><input className="fi" type="email" placeholder="mail@example.com" value={form.email} onChange={e=>upd("email",e.target.value)}/></div>
          <div className="fg-form" style={{marginBottom:"24px"}}><label className="fl">Пароль</label><input className="fi" type="password" placeholder="••••••••" value={form.password} onChange={e=>upd("password",e.target.value)}/></div>
          <div style={{textAlign:"right",marginTop:"-12px",marginBottom:"14px"}}>
            <span style={{fontSize:"12px",color:"var(--accent)",cursor:"pointer",fontWeight:"700"}} onClick={()=>setMode("forgot")}>Забыли пароль?</span>
          </div>
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
            <button className="atab" onClick={()=>setMode("forgot")}>Сброс</button>
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

function MatchesTab({
  likedProfiles, matchedProfiles = [], liked, sent, sentMessages, conversations,
  typingFor, activeChat, setActiveChat, setSelected, setMsgText,
  auth, sendChat, sendTyping, setTab, onRefresh
}) {

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
          { n: liked.size,     l: "Лайков",     color: "var(--female)" },
          { n: matched.length, l: "Совпадений", color: "var(--accent)" },
          { n: sent.size,      l: "Переписок",  color: "var(--male)"   },
        ].map(({ n, l, color }) => (
          <div className="mt-stat" key={l}>
            <div className="mt-stat-n" style={{color}}>{n}</div>
            <div className="mt-stat-l">{l}</div>
            <div style={{marginTop:10,height:3,background:"var(--border)",borderRadius:3,overflow:"hidden"}}>
              <div style={{width:`${Math.min(n*20,100)}%`,height:"100%",background:color,borderRadius:3,transition:"width .6s ease"}}/>
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