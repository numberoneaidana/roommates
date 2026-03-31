import { useState, useEffect, useRef, useCallback } from "react";
//import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import './design/components.css';
import { KZ_REGIONS, BASE_URL } from './logic/constants';
import HomePage from './components/HomePage';
//import DashboardLayout from './components/DashboardLayout';
import MapScreenAdvanced from './components/MapScreenAdvanced';
import LikesScreen from './components/LikesScreen';
import SwipeScreen from './components/SwipeScreen';
import AdminPanel from './components/AdminPanel';
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

export function useRealtimeChat(authUserId, apiClient, { onMatch, onVerificationUpdate } = {}) {  
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

          // Handle verification status updates
          if (data.type === "verification_updated") {
            const verificationData = {
              verification_status: data.verification_status,
              rejection_reason: data.rejection_reason || null,
              timestamp: Date.now()
            };
            if (onVerificationUpdate) {
              onVerificationUpdate(verificationData);
            }
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
  }, [authUserId, apiClient, appendMsg, startPolling, stopPolling, bootstrapConversations, onMatch, onVerificationUpdate]);

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


// Normalise a DB profile so the UI always gets consistent fields
const normaliseProfile = (p) => ({
  ...p,
  latitude: p.lat || p.latitude,
  longitude: p.lng || p.longitude,
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



// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App() {


  const [auth, setAuth] = useState(() => {
    const token = localStorage.getItem("roommate_kz_token");
    return token ? "loading" : null;
  });
  const [showAuthFlow, setShowAuthFlow] = useState(false);
  const [notification, setNotification] = useState(null);
  const [allProfiles, setAllProfiles] = useState([]);
  // matchedProfiles holds users fetched directly from /api/matches — independent
  // of allProfiles so the passive side (who was liked) always sees their matches
  // even if the other person was never in their discovery feed.
  const [matchedProfiles, setMatchedProfiles] = useState([]);
  
  const [tab, setTab] = useState("browse");
  const [liked, setLiked] = useState(new Set());
  const [sent, setSent] = useState(new Set());
  const [setSentMessages] = useState({});

  const [activeChat, setActiveChat] = useState(null);
  const [selected, setSelected] = useState(null);
  const [msgText, setMsgText] = useState("");
  const [passed] = useState(new Set());
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [superLiked] = useState(new Set());
  const [filters] = useState({
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
    if (!auth || auth === "loading") {
      console.log("fetchProfiles skipped: auth =", auth);
      return;
    }
    try {
      console.log("Starting fetchProfiles...");
      const baseFilters = { limit: 100, mode: "browse" };
      if (filters.region) baseFilters.region = filters.region;
      if (filters.gender) baseFilters.gender = filters.gender;
      if (filters.budget && filters.budget < 300000) baseFilters.max_budget = filters.budget;
      console.log("Filters:", baseFilters);
      
      const raw = await api.getProfiles(baseFilters);
      console.log("Raw profiles from API:", raw?.length || 0, raw);
      
      const normalised = raw.map(normaliseProfile);
      console.log("Normalised profiles:", normalised?.length || 0, normalised);
      
      setAllProfiles(normalised);
      setLiked(prev => {
        const next = new Set(prev);
        normalised.forEach(p => { if (p.liked || p.matched) next.add(p.id); });
        return next;
      });
      console.log("Profiles set successfully");
    } catch (err) {
      console.error("Не удалось загрузить анкеты:", err.message, err);
    }
    await fetchMatches().catch((e) => {
      console.error("fetchMatches error:", e);
    });
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

  const handleVerificationUpdate = useCallback((data) => {
    setAuth(prev => ({
      ...prev,
      verification_status: data.verification_status,
    }));
    const message = data.verification_status === 'approved' 
      ? '✓ Ваш профиль верифицирован!'
      : '✗ Ваш профиль отклонен';
    setNotification({
      type: data.verification_status === 'approved' ? 'success' : 'error',
      message: message,
      reason: data.rejection_reason || null,
      timestamp: data.timestamp
    });
    // Auto-dismiss after 5 seconds
    setTimeout(() => setNotification(null), 5000);
  }, []);

  const {
    conversations,
    sendMessage:    wsSendMessage,
//    sendTyping,
    connected,
//    typingFor,
  } = useRealtimeChat(auth?.id, api, { onMatch: handleMatch, onVerificationUpdate: handleVerificationUpdate });

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

  if (!auth && !showAuthFlow) return <HomePage onGetStarted={() => setShowAuthFlow(true)} />;
  if (!auth) return <AuthScreen onAuth={setAuth} />;

  // Admin only sees verification interface
  if (auth?.is_admin) {
    return (
      <div style={{ minHeight: '100vh', background: '#FAFDF9', fontFamily: "var(--font-body)" }}>
        {/* Admin Header */}
        <div style={{
          background: '#fff',
          borderBottom: '1px solid #e0e0e0',
          padding: '16px 40px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: '50',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}>
          <div style={{ fontSize: '20px', fontWeight: '700', color: '#2c5f47', fontFamily: "var(--font-display)" }}>
            🔐 RoommatchKAZ Admin
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              style={{
                padding: '8px 16px',
                background: 'transparent',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                color: '#666',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => { e.target.style.borderColor = '#2c5f47'; e.target.style.color = '#2c5f47'; }}
              onMouseLeave={e => { e.target.style.borderColor = '#e0e0e0'; e.target.style.color = '#666'; }}
              onClick={() => setAuth(null)}
              title="Logout"
            >
              Logout
            </button>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: '#5a8f6f',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '700',
              fontSize: '14px'
            }}>
              {auth.initials}
            </div>
          </div>
        </div>

        {/* Admin Content */}
        <AdminPanel
          allProfiles={allProfiles}
          onVerify={async (profileId, status, reason) => {
            try {
              const token = localStorage.getItem('roommate_kz_token');
              const baseURL = process.env.REACT_APP_API_URL || "https://roommates-production.up.railway.app";
              const response = await fetch(`${baseURL}/api/verify/${profileId}`, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ verification_status: status, rejection_reason: reason })
              });
              if (response.ok) {
                setAllProfiles(prev => prev.map(p => p.id === profileId ? { ...p, verification_status: status, rejection_reason: reason } : p));
                setNotification({
                  type: 'success',
                  message: `Profile ${status === 'approved' ? 'approved' : 'rejected'}`,
                  reason: reason || ''
                });
              } else {
                alert('Failed to update verification status');
              }
            } catch (err) {
              console.error('Verification error:', err);
              alert('Error: ' + err.message);
            }
          }}
        />
      </div>
    );
  }

  return (
    <div style={{minHeight:"100vh",background:"#f8f9fa",fontFamily:"var(--font-body)"}}>
      {/* Notification */}
      {notification && (
        <div style={{position:"fixed",top:"80px",right:"20px",background:notification.type==='success'?"#E4F0E0":"#FEE2E2",border:`2px solid ${notification.type==='success'?"#7A9E7E":"#DC2626"}`,color:notification.type==='success'?"#7A9E7E":"#DC2626",padding:"16px 20px",borderRadius:"12px",boxShadow:"0 4px 12px rgba(0,0,0,0.15)",maxWidth:"400px",zIndex:1000,animation:"slideInRight 0.3s ease"}}>
          <div style={{fontWeight:600,marginBottom:notification.reason?"8px":"0",fontSize:"14px"}}>{notification.message}</div>
          {notification.reason && (
            <div style={{fontSize:"13px",opacity:0.8,marginTop:"8px",fontStyle:"italic"}}>Причина: {notification.reason}</div>
          )}
        </div>
      )}
      
      <style>{notification ? `@keyframes slideInRight { from { opacity: 0; transform: translateX(400px); } to { opacity: 1; transform: translateX(0); } }` : ''}</style>

      {/* Header */}
      <div style={{background:"#fff",borderBottom:"1px solid #e0e0e0",padding:"16px 40px",display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,zIndex:"50",boxShadow:"0 2px 8px rgba(0,0,0,0.04)"}}>
        <div style={{fontSize:"20px",fontWeight:"700",color:"#2c5f47",fontFamily:"var(--font-display)"}}>RoommatchKAZ</div>
        <div style={{display:"flex",gap:"12px",alignItems:"center"}}>
          <div title={connected ? "Подключено" : "Переподключение…"}
            style={{
              width: 8, height: 8, borderRadius: "50%",
              background: connected ? "#4caf50" : "#f59e0b",
              boxShadow: connected ? "0 0 6px rgba(76,175,80,.7)" : "none",
              transition: "all .4s",
            }}
          />
          <button style={{padding:"8px 16px",background:"transparent",border:"1px solid #e0e0e0",borderRadius:"8px",color:"#666",fontSize:"14px",fontWeight:"600",cursor:"pointer",transition:"all 0.2s"}} onMouseEnter={e=>{e.target.style.borderColor="#2c5f47"; e.target.style.color="#2c5f47";}} onMouseLeave={e=>{e.target.style.borderColor="#e0e0e0"; e.target.style.color="#666";}} onClick={()=>setAuth(null)} title="Выйти">
            Выход
          </button>
          <div style={{width:"40px",height:"40px",borderRadius:"50%",background:"#5a8f6f",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:"700",fontSize:"14px"}}>{auth.initials}</div>
        </div>
      </div>

      {/* Top Navigation Tabs */}
      <div style={{background:"#fff",borderBottom:"2px solid #e0e0e0",padding:"0",display:"flex",justifyContent:"center",gap:"0",zIndex:"40",position:"sticky",top:"60px"}}>
        {[["browse", "Обзор"],["swipe","Свайп"],["map","Карта"],["matches","Понрaвилось"],["profile","Профиль"],...(auth?.is_admin ? [["admin","Админ"]] : [])].map(([id,lb])=>(
          <button key={id} onClick={()=>setTab(id)} style={{padding:"16px 32px",background:"transparent",border:"none",color:tab===id?"#5a8f6f":"#999",fontSize:"15px",fontWeight:tab===id?"700":"500",display:"flex",alignItems:"center",gap:"8px",cursor:"pointer",transition:"all 0.2s",borderBottom:tab===id?"3px solid #5a8f6f":"3px solid transparent",marginBottom:"-2px",position:"relative"}} onMouseEnter={e=>{if(tab!==id) e.currentTarget.style.color="#2c5f47";}} onMouseLeave={e=>{if(tab!==id) e.currentTarget.style.color="#999";}}>
            <span style={{fontSize:"18px"}}>{id==="browse"?"🏠":id==="swipe"?"💬":id==="map"?"🗺️":id==="matches"?"❤️":id==="profile"?"👤":"🔐"}</span>
            <span>{lb}</span>
            {id==="matches"&&liked.size>0&&<span style={{background:"#ff6b6b",color:"#fff",borderRadius:"10px",padding:"2px 6px",fontSize:"11px",fontWeight:"700",marginLeft:"4px"}}>{liked.size}</span>}
          </button>
        ))}
      </div>

      {tab==="swipe"&&(
        <SwipeScreen
          allProfiles={rankedFiltered.filter(p => !liked.has(p.id) && !passed.has(p.id))}
          liked={liked}
          onSelectProfile={(p)=>{setSelected(p);setMsgText("");}}
          onLike={async (p)=>{
            setLiked(s=>{const n=new Set(s);n.add(p.id);return n;});
            try {
              const result = await api.likeProfile(p.id);
              if (result?.matched) {
                handleMatch(p.id);
              }
            } catch(e) { console.warn("likeProfile error:", e.message); }
          }}
          auth={auth}
        />
      )}

      {tab==="browse"&&(
        <div style={{background:"#FAFDF9",minHeight:"100vh"}}>
          <style>{`
            @keyframes softUp {
              from { opacity: 0; transform: translateY(22px); }
              to { opacity: 1; transform: translateY(0); }
            }
            @keyframes floatA { 0%,100%{transform:translateY(0) rotate(-1deg)} 50%{transform:translateY(-10px) rotate(-1deg)} }
            .float-a { animation: floatA 6s ease-in-out infinite; }
            .reveal { opacity: 0; transform: translateY(26px); transition: opacity 0.7s ease, transform 0.7s ease; }
            .reveal.visible { opacity: 1; transform: none; }
          `}</style>

          {/* VERIFICATION BANNER */}
          {auth?.verification_status !== 'approved' && (
            <div style={{background:"linear-gradient(135deg, #FEF3C7 0%, #FEFCE8 100%)",borderBottom:"2px solid #FEF08A",padding:"20px 72px",position:"sticky",top:0,zIndex:45}}>
              <div style={{maxWidth:"1200px",margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",gap:"24px"}}>
                <div style={{display:"flex",alignItems:"center",gap:"16px",flex:1}}>
                  <div style={{fontSize:"28px",flexShrink:0}}>⚠️</div>
                  <div>
                    <div style={{fontSize:"14px",fontWeight:600,color:"#92400E",marginBottom:"4px"}}>Ваш профиль не верифицирован</div>
                    <div style={{fontSize:"12px",color:"rgba(146,64,14,0.7)"}}>Загрузите документ для подтверждения личности и получите больше совпадений</div>
                  </div>
                </div>
                <button onClick={()=>setTab("profile")} style={{background:"#92400E",color:"white",border:"none",borderRadius:"12px",padding:"10px 20px",fontFamily:"'Geologica', sans-serif",fontSize:"13px",fontWeight:600,cursor:"pointer",transition:"all 0.2s",whiteSpace:"nowrap",flexShrink:0}}>
                   Верифицировать сейчас
                </button>
              </div>
            </div>
          )}

          {/* HERO SECTION */}
          <section style={{minHeight:"100vh",padding:"100px 72px",background:"#FAFDF9",position:"relative",display:"grid",gridTemplateColumns:"1fr 1fr",overflow:"hidden",alignItems:"center"}}>
            {/* Blobs */}
            <div style={{position:"absolute",width:"600px",height:"600px",borderRadius:"50%",background:"rgba(168,197,160,0.22)",top:"-100px",right:"-100px",filter:"blur(90px)",pointerEvents:"none"}}/>
            <div style={{position:"absolute",width:"400px",height:"400px",borderRadius:"50%",background:"rgba(200,222,196,0.18)",bottom:0,left:"20%",filter:"blur(90px)",pointerEvents:"none"}}/>

            {/* LEFT CONTENT */}
            <div style={{position:"relative",zIndex:2,display:"flex",flexDirection:"column",justifyContent:"center",paddingRight:"80px"}}>
              <div style={{display:"inline-flex",alignItems:"center",gap:"8px",background:"#E4F0E0",border:"1px solid #C8DEC4",padding:"6px 14px",borderRadius:"100px",width:"fit-content",marginBottom:"36px",fontSize:"0.76rem",fontWeight:500,color:"#7A9E7E",letterSpacing:"0.3px",animation:"softUp 0.8s ease both"}}>
                <span style={{width:"5px",height:"5px",background:"#7A9E7E",borderRadius:"50%"}}/>
                 Сделано в Казахстане
              </div>

              <h1 style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"clamp(3rem, 5vw, 4.5rem)",fontWeight:600,lineHeight:1.1,letterSpacing:"-1.5px",color:"#1C2B1E",marginBottom:"28px",animation:"softUp 0.8s 0.1s ease both"}}>
                Найдите своего<br/><em style={{fontStyle:"italic",color:"#7A9E7E"}}>идеального</em><br/>соседа
              </h1>

              <p style={{fontSize:"1rem",fontWeight:300,color:"rgba(28,43,30,0.6)",lineHeight:1.8,maxWidth:"420px",marginBottom:"44px",animation:"softUp 0.8s 0.2s ease both"}}>
                Умный подбор по образу жизни, не только по бюджету и площади
              </p>

              <div style={{display:"flex",gap:"14px",flexWrap:"wrap",animation:"softUp 0.8s 0.3s ease both"}}>
                <button onClick={()=>setTab("map")} style={{display:"inline-flex",alignItems:"center",gap:"10px",background:"#1C2B1E",color:"white",padding:"16px 32px",borderRadius:"100px",fontFamily:"'Geologica', sans-serif",fontSize:"0.92rem",fontWeight:500,textDecoration:"none",border:"none",cursor:"pointer",transition:"background 0.25s, transform 0.25s"}}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="5" stroke="white" strokeWidth="1.4"/><path d="M11 11L14 14" stroke="white" strokeWidth="1.4" strokeLinecap="round"/></svg>
                  Посмотрите анкеты
                </button>
              </div>

              <div style={{display:"flex",gap:0,marginTop:"60px",paddingTop:"44px",borderTop:"1px solid #C8DEC4",animation:"softUp 0.8s 0.4s ease both"}}>
                {[
                  {n:"4,200",s:"+",l:"Активных пользователей"},
                  {n:"17",s:"",l:"Городов по Казахстану"},
                  {n:"92",s:"%",l:"Удовлетворенность совпадений"}
                ].map((stat,i)=>(
                  <div key={i} style={{flex:1,paddingRight:i<2?"24px":0,paddingLeft:i>0?"24px":0,borderRight:i<2?"1px solid #C8DEC4":"none"}}>
                    <div style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"2.4rem",fontWeight:600,color:"#1C2B1E",letterSpacing:"-1px",lineHeight:1,marginBottom:"4px"}}>
                      {stat.n}<span style={{color:"#7A9E7E"}}>{stat.s}</span>
                    </div>
                    <div style={{fontSize:"0.78rem",fontWeight:300,color:"rgba(28,43,30,0.6)",letterSpacing:"0.3px"}}>{stat.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* FEATURES SECTION */}
          <section style={{padding:"100px 72px",background:"#FFFFFF",borderTop:"1px solid #C8DEC4"}}>
            <div style={{maxWidth:"1200px",margin:"0 auto"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:"64px"}}>
                <div>
                  <div style={{fontSize:"0.72rem",fontWeight:500,letterSpacing:"3px",textTransform:"uppercase",color:"#7A9E7E",marginBottom:"12px",display:"flex",alignItems:"center",gap:"8px"}}>
                    <span style={{width:"20px",height:"1px",background:"#7A9E7E"}}/>
                    Преимущества
                  </div>
                  <h2 style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"clamp(2rem, 3.5vw, 3rem)",fontWeight:600,letterSpacing:"-0.5px",lineHeight:1.08,color:"#1C2B1E"}}>Почему выбирают<br/>Roomate.kz</h2>
                </div>
              </div>

              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(280px, 1fr))",gap:"24px",marginBottom:"60px"}}>
                {[
                  {icon:"🛡️",title:"Проверка ИИН",desc:"Каждый профиль проверен и верифицирован для вашей безопасности"},
                  {icon:"🗺️",title:"17 городов",desc:"От Алматы до Актау — охватываем весь Казахстан"},
                  {icon:"💬",title:"3 языка",desc:"Общайтесь на казахском, русском или английском"},
                  {icon:"⚡",title:"Быстрый подбор",desc:"Найдите идеального соседа менее чем за неделю"},
                  {icon:"✨",title:"Совместимость",desc:"Детальный анализ совместимости по 20+ критериям"}
                ].map((feature,i)=>(
                  <div key={i} className="reveal" style={{background:"#FAFDF9",border:"1px solid #C8DEC4",borderRadius:"24px",padding:"32px 28px",textAlign:"center",transition:"all 0.3s"}}>
                    <div style={{fontSize:"2.8rem",marginBottom:"16px"}}>{feature.icon}</div>
                    <h3 style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"1.1rem",fontWeight:600,color:"#1C2B1E",marginBottom:"8px"}}>{feature.title}</h3>
                    <p style={{fontSize:"0.85rem",fontWeight:300,color:"rgba(28,43,30,0.6)",lineHeight:1.6}}>{feature.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* FEATURED PROFILES */}
          <section style={{padding:"100px 72px",background:"#FAFDF9"}}>
            <div style={{maxWidth:"1200px",margin:"0 auto"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:"64px"}}>
                <div>
                  <div style={{fontSize:"0.72rem",fontWeight:500,letterSpacing:"3px",textTransform:"uppercase",color:"#7A9E7E",marginBottom:"12px",display:"flex",alignItems:"center",gap:"8px"}}>
                    <span style={{width:"20px",height:"1px",background:"#7A9E7E"}}/>
                    Совместимые соседи
                  </div>
                  <h2 style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"clamp(2rem, 3.5vw, 3rem)",fontWeight:600,letterSpacing:"-0.5px",lineHeight:1.08,color:"#1C2B1E"}}>Исследуйте<br/>совместимые профили</h2>
                </div>
              </div>

              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(280px, 1fr))",gap:"24px",marginBottom:"60px"}}>
                {allProfiles.slice(0,6).map((profile,idx)=>{
                  const compatibility = Math.floor(Math.random()*30)+70;
                  return (
                    <div key={idx} onClick={()=>{setSelected(profile);setMsgText("");}} style={{background:"#FFFFFF",border:"1px solid #C8DEC4",borderRadius:"24px",padding:"20px",cursor:"pointer",transition:"transform 0.2s, box-shadow 0.2s",position:"relative",overflow:"hidden"}} onMouseEnter={(e)=>{e.currentTarget.style.transform="translateY(-4px)";e.currentTarget.style.boxShadow="0 12px 40px rgba(122,158,126,0.15)";}} onMouseLeave={(e)=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="0 0 0 transparent";}}>
                      {/* Header with Avatar */}
                      <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"16px"}}>
                        <div style={{width:"44px",height:"44px",borderRadius:"50%",background:"#E4F0E0",border:"2px solid #C8DEC4",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Cormorant Garamond', serif",fontSize:"1rem",fontWeight:600,color:"#7A9E7E",flexShrink:0}}>
                          {(profile.full_name||"").split(" ").map(n=>n[0]).join("").toUpperCase()||"?"}
                        </div>
                        <div>
                          <div style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"1rem",fontWeight:600,color:"#1C2B1E",lineHeight:1.2}}>{profile.full_name}</div>
                          <div style={{fontSize:"0.7rem",fontWeight:300,color:"rgba(28,43,30,0.6)",marginTop:"2px",display:"flex",alignItems:"center",gap:"3px"}}>
                            📍 {(profile.region||"Казахстан").split(",")[0]}
                          </div>
                        </div>
                      </div>

                      {/* Tags */}
                      <div style={{display:"flex",flexWrap:"wrap",gap:"5px",marginBottom:"14px"}}>
                        {[profile.gender||"—",profile.housing_type||"—",profile.occupation||"—",(profile.budget_min&&profile.budget_max)?`₸${profile.budget_min/1000 | 0}-${profile.budget_max/1000 | 0}k`:"Не указан"].map((tag,i)=>(
                          <span key={i} style={{fontSize:"0.65rem",fontWeight:400,padding:"4px 10px",borderRadius:"100px",background:i<2?"#E4F0E0":"#FFFFFF",color:i<2?"#7A9E7E":"rgba(28,43,30,0.6)",border:`1px solid ${i<2?"#C8DEC4":"rgba(28,43,30,0.08)"}`,letterSpacing:"0.2px"}}>
                            {tag}
                          </span>
                        ))}
                        {profile.verification_status === 'approved' && (
                          <span style={{fontSize:"0.7rem",fontWeight:600,padding:"4px 10px",borderRadius:"100px",background:"#E4F0E0",color:"#7A9E7E",border:"1px solid #C8DEC4",letterSpacing:"0.2px",display:"flex",alignItems:"center",gap:"4px"}}>
                            ✓ Верифицирован
                          </span>
                        )}
                        {profile.verification_status === 'pending' && (
                          <span style={{fontSize:"0.7rem",fontWeight:600,padding:"4px 10px",borderRadius:"100px",background:"#FEF3C7",color:"#92400E",border:"1px solid rgba(146,64,14,0.2)",letterSpacing:"0.2px",display:"flex",alignItems:"center",gap:"4px"}}>
                            ⏳ На проверке
                          </span>
                        )}
                        {((!profile.verification_status )||(profile.verification_status === 'rejected')) && (
                          <span style={{fontSize:"0.7rem",fontWeight:600,padding:"4px 10px",borderRadius:"100px",background:"#FEE2E2",color:"#DC2626",border:"1px solid rgba(220,38,38,0.2)",letterSpacing:"0.2px",display:"flex",alignItems:"center",gap:"4px"}}>
                            ⚠️ Не верифицирован
                          </span>
                        )}
                      </div>

                      {/* Compatibility Bar */}
                      <div style={{display:"flex",alignItems:"center",gap:"8px",padding:"10px 12px",background:"#F2F8F1",borderRadius:"12px"}}>
                        <span style={{fontSize:"0.7rem",color:"rgba(28,43,30,0.6)",fontWeight:300,flex:1}}>Совместимость</span>
                        <div style={{flex:2,height:"4px",background:"#C8DEC4",borderRadius:"2px"}}>
                          <div style={{height:"100%",borderRadius:"2px",background:"#7A9E7E",width:`${compatibility}%`}}/>
                        </div>
                        <span style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"1.1rem",fontWeight:600,color:"#7A9E7E"}}>{compatibility}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* CTA SECTION */}
          <section style={{padding:"100px 72px",background:"#FFFFFF"}}>
            <div style={{maxWidth:"1200px",margin:"0 auto"}}>
              <div style={{background:"linear-gradient(135deg, #5a8f6f 0%, #4a7a5f 100%)",borderRadius:"32px",padding:"80px 72px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:"60px",alignItems:"center",position:"relative",overflow:"hidden"}}>
                <div style={{position:"absolute",top:"-80px",right:"-80px",width:"320px",height:"320px",background:"rgba(255,255,255,0.08)",borderRadius:"50%"}}/>
                <div style={{position:"absolute",bottom:"-60px",left:"30%",width:"200px",height:"200px",background:"rgba(255,255,255,0.05)",borderRadius:"50%"}}/>
                <div style={{position:"relative",zIndex:2}}>
                  <h2 style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"clamp(2.2rem, 3.5vw, 3.2rem)",fontWeight:600,lineHeight:1.08,letterSpacing:"-0.5px",color:"white",marginBottom:"16px"}}>
                    Готовы найти<br/>вашего <em style={{fontStyle:"italic",color:"rgba(255,255,255,0.7)"}}>идеального</em> соседа?
                  </h2>
                  <p style={{fontSize:"0.95rem",fontWeight:300,color:"rgba(255,255,255,0.72)",lineHeight:1.75}}>
                    Присоединяйтесь к сообществу более 4,200 соседей по комнате, которые уже нашли идеальное совпадение на Roomate.kz
                  </p>
                </div>
                <div style={{position:"relative",zIndex:2}}>
                  <button onClick={()=>setTab("map")} style={{width:"100%",padding:"16px",borderRadius:"14px",border:"none",background:"white",color:"#7A9E7E",fontFamily:"'Geologica', sans-serif",fontSize:"0.92rem",fontWeight:600,cursor:"pointer",transition:"transform 0.2s, box-shadow 0.2s",display:"flex",alignItems:"center",justifyContent:"center",gap:"8px"}}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="#7A9E7E" strokeWidth="1.6" strokeLinecap="round"/></svg>
                    Посмотрите профили на карте
                  </button>
                  <div style={{fontSize:"0.72rem",color:"rgba(255,255,255,0.45)",marginTop:"10px",textAlign:"center",fontWeight:300}}>
                    Бесплатные совпадения · Проверенные профили
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {tab === "map" && (
        <MapScreenAdvanced 
          allProfiles={allProfiles}
          auth={auth}
          onSelectProfile={(p) => { setSelected(p); setMsgText(""); }}
          liked={liked}
          onLike={async (p) => {
            setLiked(s => { const n = new Set(s); n.add(p.id); return n; });
            try {
              const result = await api.likeProfile(p.id);
              if (result?.matched) await handleMatch(p.id);
            } catch(e) { console.warn("likeProfile error:", e.message); }
          }}
          conversations={conversations}
          onSendMessage={(profileId, msgText) => sendChat(profileId, msgText)}
          setTab={setTab}
        />
      )}

      {tab === "matches" && (
        <LikesScreen 
          allProfiles={allProfiles}
          liked={liked}
          onSelectProfile={(p) => { setSelected(p); setMsgText(""); }}
          onLike={async (p) => {
            setLiked(s => { const n = new Set(s); n.add(p.id); return n; });
            try {
              const result = await api.likeProfile(p.id);
              if (result?.matched) await handleMatch(p.id);
            } catch(e) { console.warn("likeProfile error:", e.message); }
          }}
          matchedProfiles={matchedProfiles}
          conversations={conversations}
          onSendMessage={(profileId, msgText) => sendChat(profileId, msgText)}
          activeChat={activeChat}
          setActiveChat={setActiveChat}
        />
      )}

      {tab==="profile"&&(
        <ProfileEditTab auth={auth} setAuth={setAuth} api={api} KZ_REGIONS={KZ_REGIONS} showVerificationModal={showVerificationModal} setShowVerificationModal={setShowVerificationModal} />
      )}

      {tab==="admin" && auth?.is_admin && (
        <AdminPanel allProfiles={allProfiles} onVerify={async (profileId, status, reason) => {
          try {
            const token = localStorage.getItem('roommate_kz_token');
            const baseURL = process.env.REACT_APP_API_URL || "https://roommates-production.up.railway.app";
            const response = await fetch(`${baseURL}/api/verify/${profileId}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ verification_status: status, rejection_reason: reason })
            });
            if (response.ok) {
              // Update local state after successful API call
              setAllProfiles(prev => prev.map(p => p.id === profileId ? {...p, verification_status: status, rejection_reason: reason} : p));
            } else {
              alert('Failed to update verification status');
            }
          } catch (err) {
            console.error('Verification error:', err);
            alert('Error: ' + err.message);
          }
        }} />
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
    <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(28,43,30,0.7)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:"20px"}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:"#FFFFFF",borderRadius:"32px",width:"100%",maxWidth:"520px",maxHeight:"90vh",overflow:"auto",boxShadow:"0 25px 80px rgba(122,158,126,0.25)"}}>
        
        {/* HERO IMAGE */}
        <div style={{position:"relative",height:"280px",background:p.photos[0]?.startsWith("http")?`url(${p.photos[0]}) center/cover`:`linear-gradient(135deg, #5a8f6f 0%, #4a7a5f 100%)`,backgroundSize:"cover",backgroundPosition:"center"}}>
          
          {/* Close Button */}
          <button onClick={onClose} style={{position:"absolute",top:"16px",right:"16px",width:"40px",height:"40px",borderRadius:"50%",background:"rgba(255,255,255,0.95)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.2s",boxShadow:"0 4px 12px rgba(0,0,0,0.15)"}}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M15 5L5 15M5 5L15 15" stroke="#1C2B1E" strokeWidth="2" strokeLinecap="round"/></svg>
          </button>

          {/* Photo Indicators */}
          <div style={{position:"absolute",bottom:"16px",left:"16px",display:"flex",gap:"6px"}}>
            {p.photos.map((_, i) => (
              <button key={i} onClick={() => setLocalPhoto(i)} style={{width:"10px",height:"10px",borderRadius:"50%",background:localPhoto===i?"white":"rgba(255,255,255,0.4)",border:"none",cursor:"pointer",transition:"all 0.2s"}}/>
            ))}
          </div>

          {/* Online Status */}
          {p.online && (
            <div style={{position:"absolute",bottom:"16px",right:"16px",background:"#FFFFFF",borderRadius:"100px",padding:"6px 12px",display:"flex",alignItems:"center",gap:"6px",fontSize:"12px",fontWeight:600,color:"#22C55E"}}>
              <span style={{width:"8px",height:"8px",borderRadius:"50%",background:"#22C55E"}}/>
              Онлайн
            </div>
          )}
        </div>

        {/* CONTENT */}
        <div style={{padding:"32px"}}>
          
          {/* Header */}
          <div style={{marginBottom:"24px"}}>
            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:"12px",marginBottom:"12px"}}>
              <div>
                <h2 style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"2rem",fontWeight:600,color:"#1C2B1E",margin:"0 0 4px 0",lineHeight:1}}>{p.name}, {p.age}</h2>
                <div style={{display:"flex",alignItems:"center",gap:"8px",flexWrap:"wrap"}}>
                  {p.verification_status === 'approved' && (
                    <div style={{display:"inline-flex",alignItems:"center",gap:"4px",background:"#E4F0E0",color:"#7A9E7E",padding:"4px 10px",borderRadius:"12px",fontSize:"12px",fontWeight:600}}>
                      ✓ Верифицирован
                    </div>
                  )}
                  {p.verification_status === 'pending' && (
                    <div style={{display:"inline-flex",alignItems:"center",gap:"4px",background:"#FEF3C7",color:"#92400E",padding:"4px 10px",borderRadius:"12px",fontSize:"12px",fontWeight:600}}>
                      ⏳ На проверке
                    </div>
                  )}
                  {((!p.verification_status )||(p.verification_status === 'rejected')) && (
                    <div style={{display:"inline-flex",alignItems:"center",gap:"4px",background:"#FEE2E2",color:"#DC2626",padding:"4px 10px",borderRadius:"12px",fontSize:"12px",fontWeight:600}}>
                      ⚠️ Не верифицирован
                    </div>
                  )}
                </div>
              </div>
              <button onClick={onLike} style={{background:liked?"#E4F0E0":"#F2F8F1",border:`2px solid ${liked?"#7A9E7E":"#C8DEC4"}`,borderRadius:"14px",padding:"10px 16px",cursor:"pointer",display:"flex",alignItems:"center",gap:"6px",fontSize:"13px",fontWeight:600,color:liked?"#7A9E7E":"#1C2B1E",transition:"all 0.2s",fontFamily:"'Geologica', sans-serif"}}>
                {liked?"❤️ В избранном":"🤍 В избранное"}
              </button>
            </div>
          </div>

          {/* Meta Info Grid */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"24px"}}>
            <div style={{background:"#F2F8F1",borderRadius:"16px",padding:"12px 14px",fontSize:"13px"}}>
              <div style={{color:"rgba(28,43,30,0.6)",fontWeight:500,marginBottom:"2px"}}>Локация</div>
              <div style={{color:"#1C2B1E",fontWeight:600}}>📍 {reg?.name || p.region}</div>
            </div>
            <div style={{background:"#F2F8F1",borderRadius:"16px",padding:"12px 14px",fontSize:"13px"}}>
              <div style={{color:"rgba(28,43,30,0.6)",fontWeight:500,marginBottom:"2px"}}>Бюджет</div>
              <div style={{color:"#1C2B1E",fontWeight:600}}>💰 ₸{(p.budget || 0).toLocaleString()}/мес</div>
            </div>
            <div style={{background:"#F2F8F1",borderRadius:"16px",padding:"12px 14px",fontSize:"13px"}}>
              <div style={{color:"rgba(28,43,30,0.6)",fontWeight:500,marginBottom:"2px"}}>Профессия</div>
              <div style={{color:"#1C2B1E",fontWeight:600}}>{p.occupation || "—"}</div>
            </div>
            <div style={{background:"#F2F8F1",borderRadius:"16px",padding:"12px 14px",fontSize:"13px"}}>
              <div style={{color:"rgba(28,43,30,0.6)",fontWeight:500,marginBottom:"2px"}}>Въезд</div>
              <div style={{color:"#1C2B1E",fontWeight:600}}>{p.move_in || "—"}</div>
            </div>
          </div>

          {/* Renter Type Badge */}
          {p.renterType && (
            <div style={{background:p.renterType==="has_place"?"linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)":"linear-gradient(135deg, #E0F2FE 0%, #BAE6FD 100%)",borderRadius:"16px",padding:"16px",marginBottom:"24px",border:`2px solid ${p.renterType==="has_place"?"#FBBF24":"#0EA5E9"}`,display:"flex",alignItems:"center",gap:"12px"}}>
              <span style={{fontSize:"28px"}}>{p.renterType==="has_place"?"🏠":"🔍"}</span>
              <div>
                <div style={{fontSize:"14px",fontWeight:600,color:p.renterType==="has_place"?"#92400E":"#075985"}}>{p.renterType==="has_place"?"Есть своё жильё":"Ищет жильё"}</div>
                <div style={{fontSize:"12px",color:p.renterType==="has_place"?"#92400E":"#075985",opacity:0.8}}>{p.renterType==="has_place"?"Ищет соседа к себе":"Ищет квартиру и соседа"}</div>
              </div>
            </div>
          )}

          {/* About Section */}
          <div style={{marginBottom:"24px"}}>
            <h3 style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"1.2rem",fontWeight:600,color:"#1C2B1E",margin:"0 0 12px 0"}}>О себе</h3>
            <p style={{fontSize:"14px",lineHeight:1.7,color:"rgba(28,43,30,0.7)",margin:0}}>{p.bio}</p>
            {(p.idealRoommate || p.quietHours) && (
              <div style={{marginTop:"12px",background:"#F2F8F1",borderRadius:"12px",padding:"12px 14px",fontSize:"12px",color:"rgba(28,43,30,0.7)",lineHeight:1.6,borderLeft:"4px solid #7A9E7E"}}>
                {p.idealRoommate && <div style={{marginBottom:"6px"}}><b style={{color:"#1C2B1E"}}>Идеальный сосед:</b> {p.idealRoommate}</div>}
                {p.quietHours && <div><b style={{color:"#1C2B1E"}}>Тихие часы:</b> {p.quietHours}</div>}
              </div>
            )}
          </div>

          {/* Lifestyle Section */}
          <div style={{marginBottom:"24px"}}>
            <h3 style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"1.2rem",fontWeight:600,color:"#1C2B1E",margin:"0 0 14px 0"}}>Образ жизни</h3>
            <div style={{display:"flex",flexDirection:"column",gap:"14px",marginBottom:"14px"}}>
              {[["Чистоплотность", p.cleanliness], ["Общительность", p.social]].map(([l, v]) => (
                <div key={l}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:"6px",fontSize:"13px"}}>
                    <span style={{fontWeight:600,color:"#1C2B1E"}}>{l}</span>
                    <span style={{fontWeight:600,color:"#7A9E7E"}}>{v || 0}/5</span>
                  </div>
                  <div style={{height:"6px",background:"#E4F0E0",borderRadius:"3px"}}>
                    <div style={{height:"100%",background:"#7A9E7E",borderRadius:"3px",width:`${((v || 0) / 5) * 100}%`}}/>
                  </div>
                </div>
              ))}
            </div>
            <div style={{display:"flex",flexWrap:"wrap",gap:"8px"}}>
              {p.pets && <span style={{background:"#E4F0E0",color:"#7A9E7E",padding:"6px 12px",borderRadius:"100px",fontSize:"12px",fontWeight:500}}>🐾 Питомец</span>}
              {p.remote && <span style={{background:"#E4F0E0",color:"#7A9E7E",padding:"6px 12px",borderRadius:"100px",fontSize:"12px",fontWeight:500}}>💻 Удалёнка</span>}
              {!p.smoking && <span style={{background:"#E4F0E0",color:"#7A9E7E",padding:"6px 12px",borderRadius:"100px",fontSize:"12px",fontWeight:500}}>🚭 Не курит</span>}
              {!p.alcohol && <span style={{background:"#E4F0E0",color:"#7A9E7E",padding:"6px 12px",borderRadius:"100px",fontSize:"12px",fontWeight:500}}>🥤 Не пьёт</span>}
            </div>
          </div>

          {/* Interests Section */}
          {p.tags && p.tags.length > 0 && (
            <div style={{marginBottom:"24px"}}>
              <h3 style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"1.2rem",fontWeight:600,color:"#1C2B1E",margin:"0 0 12px 0"}}>Интересы</h3>
              <div style={{display:"flex",flexWrap:"wrap",gap:"8px"}}>
                {p.tags.map(t => (
                  <span key={t} style={{background:"#F2F8F1",color:"#7A9E7E",padding:"6px 12px",borderRadius:"100px",fontSize:"12px",fontWeight:500,border:"1px solid #C8DEC4"}}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Message Section */}
          <div style={{borderTop:"1px solid #C8DEC4",paddingTop:"24px"}}>
            {p.matched && sent ? (
              <>
                <div style={{background:"linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)",borderRadius:"16px",padding:"14px 16px",display:"flex",alignItems:"center",gap:"10px",marginBottom:"14px",border:"1px solid #FBBF24"}}>
                  <span style={{fontSize:"20px"}}>🤝</span>
                  <div style={{fontSize:"13px",fontWeight:600,color:"#92400E"}}>Совпадение! {p.name.split(" ")[0]} хочет познакомиться</div>
                </div>
                <button style={{width:"100%",padding:"14px",background:"linear-gradient(135deg, #7A9E7E 0%, #5a8f6f 100%)",color:"white",border:"none",borderRadius:"14px",fontFamily:"'Geologica', sans-serif",fontSize:"14px",fontWeight:600,cursor:"pointer",transition:"transform 0.2s, box-shadow 0.2s"}} onClick={onClose}>
                  💬 Перейти в чат
                </button>
                <p style={{fontSize:"12px",color:"rgba(28,43,30,0.6)",textAlign:"center",marginTop:"10px"}}>Откройте вкладку «Избранное» для переписки</p>
              </>
            ) : sent ? (
              <>
                <div style={{background:"#E4F0E0",borderRadius:"14px",padding:"14px 16px",marginBottom:"12px",borderLeft:"4px solid #7A9E7E"}}>
                  <div style={{fontSize:"13px",fontWeight:600,color:"#7A9E7E",marginBottom:"4px"}}>✓ Сообщение отправлено!</div>
                  <div style={{fontSize:"12px",color:"rgba(28,43,30,0.7)"}}>Если ответят — откроется чат 💬</div>
                </div>
                <div style={{background:"#F2F8F1",borderRadius:"12px",padding:"12px 14px",fontSize:"13px",color:"rgba(28,43,30,0.7)",borderLeft:"4px solid #7A9E7E"}}>{msgText}</div>
              </>
            ) : (
              <>
                <h3 style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"1.1rem",fontWeight:600,color:"#1C2B1E",margin:"0 0 6px 0"}}>Написать сообщение</h3>
                <p style={{fontSize:"13px",color:"rgba(28,43,30,0.6)",margin:"0 0 12px 0"}}>Одно сообщение — сделайте его запоминающимся ✨</p>
                <textarea placeholder={`Привет, ${p.name.split(" ")[0]}! Увидел(а) твою анкету и…`} value={msgText} onChange={e => setMsgText(e.target.value.slice(0, max))} style={{width:"100%",padding:"12px 14px",border:"1px solid #C8DEC4",borderRadius:"12px",fontFamily:"'Geologica', sans-serif",fontSize:"13px",color:"#1C2B1E",background:"#FAFDF9",outline:"none",resize:"vertical",minHeight:"80px",boxSizing:"border-box",transition:"border-color 0.2s"}} onFocus={(e)=>e.target.style.borderColor="#7A9E7E"} onBlur={(e)=>e.target.style.borderColor="#C8DEC4"}/>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",margin:"8px 0 14px 0",fontSize:"12px",color:"rgba(28,43,30,0.6)"}}>
                  <span>Минимум 10 символов</span>
                  <span>{msgText.length}/{max}</span>
                </div>
                <button onClick={handleSend} disabled={msgText.trim().length < 10 || isSending} style={{width:"100%",padding:"14px",background:msgText.trim().length < 10?"#E4F0E0":"linear-gradient(135deg, #7A9E7E 0%, #5a8f6f 100%)",color:msgText.trim().length < 10?"#A8C5A0":"white",border:"none",borderRadius:"14px",fontFamily:"'Geologica', sans-serif",fontSize:"14px",fontWeight:600,cursor:msgText.trim().length < 10?"not-allowed":"pointer",transition:"all 0.2s",opacity:isSending?0.7:1}}>
                  {isSending?"✓ Отправляется…":"📤 Отправить"}
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

function ProfileEditTab({ auth, setAuth, api, KZ_REGIONS, showVerificationModal, setShowVerificationModal }) {
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
  const [verificationFile, setVerificationFile] = useState(null);
  const [verificationPreview, setVerificationPreview] = useState(null);
  const [uploadingVerification, setUploadingVerification] = useState(false);
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
      <div style={{marginTop:32,marginBottom:24}}>
        <h2 style={{fontSize:18,fontWeight:600,marginBottom:16,color:"#1C2B1E"}}>🔐 Проверка профиля</h2>
        <div style={{background:"#FAFDF9",border:"1px solid #C8DEC4",borderRadius:"16px",padding:"20px",marginBottom:16}}>
          <div style={{marginBottom:16}}>
            <div style={{fontSize:13,fontWeight:600,color:"#1C2B1E",marginBottom:8}}>Статус верификации</div>
            <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",borderRadius:"12px",background:auth.verification_status==="approved"?"#E4F0E0":auth.verification_status==="pending"?"#FEF3C7":"#FFFFFF",border:`1px solid ${auth.verification_status==="approved"?"#C8DEC4":auth.verification_status==="pending"?"rgba(146,64,14,0.2)":"#C8DEC4"}`}}>
              <span style={{fontSize:16}}>{auth.verification_status==="approved"?"✓":auth.verification_status==="pending"?"⏳":"⚠️"}</span>
              <span style={{fontSize:13,fontWeight:600,color:auth.verification_status==="approved"?"#7A9E7E":auth.verification_status==="pending"?"#92400E":"#7A9E7E"}}>
                {auth.verification_status==="approved"?"Верифицирован":auth.verification_status==="pending"?"На проверке":"Не проверен"}
              </span>
            </div>
          </div>
          {auth.verification_status!=="approved"&&(
            <div>
              <p style={{fontSize:13,color:"rgba(28,43,30,0.6)",marginBottom:12,lineHeight:1.6}}>
                Загрузите фото вашего удостоверения личности (паспорт или ИИН) для быстрой верификации вашего профиля. Проверка занимает менее 24 часов.
              </p>
              <button onClick={()=>setShowVerificationModal(true)} style={{width:"100%",padding:"12px",background:"#7A9E7E",color:"white",border:"none",borderRadius:"12px",fontFamily:"'Geologica', sans-serif",fontSize:13,fontWeight:600,cursor:"pointer",transition:"all 0.2s"}}>
                📤 Загрузить документ для проверки
              </button>
              <div style={{fontSize:12,color:"rgba(28,43,30,0.6)",marginTop:8,textAlign:"center"}}>
                Ваши документы безопасны и никогда не будут переданы третьим лицам
              </div>
            </div>
          )}
          {auth.verification_status==="approved"&&(
            <div style={{padding:"12px 14px",background:"#E4F0E0",borderRadius:"12px",fontSize:13,color:"#7A9E7E"}}>
              <strong>✓ Спасибо за верификацию!</strong> Ваш профиль теперь проверен и вы получите больше совпадений.
            </div>
          )}
        </div>
      </div>
      <button className="btn-primary" style={{marginTop:20,width:"100%",padding:"15px",fontSize:15}} onClick={handleSave} disabled={saving}>
        {saving?"⏳ Сохранение...":saved?"✅ Сохранено!":"Сохранить профиль"}
      </button>
      <div style={{height:40}}/>

      {/* VERIFICATION UPLOAD MODAL */}
      {showVerificationModal && (
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(28,43,30,0.7)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:2000,padding:"20px"}} onClick={e=>e.target===e.currentTarget&&setShowVerificationModal(false)}>
          <div style={{background:"#FFFFFF",borderRadius:"28px",width:"100%",maxWidth:"500px",maxHeight:"90vh",overflow:"auto",boxShadow:"0 25px 80px rgba(122,158,126,0.25)"}}>
            <div style={{padding:"24px",borderBottom:"2px solid #7A9E7E",display:"flex",alignItems:"center",justifyContent:"space-between",background:"linear-gradient(135deg, #F2F8F1 0%, #E4F0E0 100%)"}}>
              <h2 style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"1.6rem",fontWeight:600,color:"#7A9E7E",margin:0}}>📤 Верификация профиля</h2>
              <button onClick={()=>setShowVerificationModal(false)} style={{width:"36px",height:"36px",borderRadius:"50%",background:"#E4F0E0",border:"none",cursor:"pointer",fontSize:"18px",color:"#7A9E7E",fontWeight:600,transition:"all 0.2s"}} onMouseEnter={e=>{e.target.style.background="#C8DEC4"}} onMouseLeave={e=>{e.target.style.background="#E4F0E0"}}>✕</button>
            </div>
            <div style={{padding:"24px"}}>
              <p style={{fontSize:"14px",color:"rgba(28,43,30,0.6)",marginBottom:"20px",lineHeight:1.6}}>
                Загрузите четкое фото вашего паспорта или удостоверения личности (ИИН). Проверка проводится автоматически и занимает менее 24 часов.
              </p>

              {/* FILE INPUT */}
              <div style={{marginBottom:"20px"}}>
                <label style={{fontSize:"13px",fontWeight:600,color:"#7A9E7E",marginBottom:"10px",display:"flex",alignItems:"center",gap:"6px"}}>
                  <span style={{fontSize:"16px"}}>📋</span>
                  Выберите документ
                </label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e)=>{
                    if(e.target.files[0]){
                      setVerificationFile(e.target.files[0]);
                      const reader = new FileReader();
                      reader.onload = (ev) => setVerificationPreview(ev.target.result);
                      reader.readAsDataURL(e.target.files[0]);
                    }
                  }}
                  style={{display:"none"}}
                  id="verification-file-input"
                />
                <label htmlFor="verification-file-input" style={{display:"block",padding:"20px",border:"2px dashed #7A9E7E",borderRadius:"14px",textAlign:"center",cursor:"pointer",transition:"all 0.3s",background:verificationFile?"#E4F0E0":"#F2F8F1"}}>
                  <div style={{fontSize:"28px",marginBottom:"8px"}}>📸</div>
                  <div style={{fontSize:"13px",fontWeight:600,color:"#7A9E7E",marginBottom:"4px"}}>{verificationFile?"✓ Документ выбран":"Кликните или перетащите файл"}</div>
                  <div style={{fontSize:"12px",color:"rgba(122,158,126,0.7)"}}>{verificationFile?verificationFile.name:"JPG, PNG (макс 10MB)"}</div>
                </label>
              </div>

              {/* PREVIEW */}
              {verificationPreview && (
                <div style={{marginBottom:"20px"}}>
                  <label style={{fontSize:"13px",fontWeight:600,color:"#7A9E7E",marginBottom:"10px",display:"block",display:"flex",alignItems:"center",gap:"6px"}}>
                    <span style={{fontSize:"16px"}}>👁️</span>
                    Предпросмотр
                  </label>
                  <img src={verificationPreview} alt="preview" style={{width:"100%",borderRadius:"12px",border:"2px solid #C8DEC4",maxHeight:"200px",objectFit:"contain"}}/>
                </div>
              )}

              {/* ACTION BUTTONS */}
              <div style={{display:"flex",gap:"12px"}}>
                <button onClick={()=>{setShowVerificationModal(false);setVerificationFile(null);setVerificationPreview(null);}} style={{flex:1,padding:"12px",background:"#F2F8F1",color:"#7A9E7E",border:"2px solid #C8DEC4",borderRadius:"12px",fontFamily:"'Geologica', sans-serif",fontSize:"13px",fontWeight:600,cursor:"pointer",transition:"all 0.2s"}} onMouseEnter={e=>{e.target.style.background="#E4F0E0"}} onMouseLeave={e=>{e.target.style.background="#F2F8F1"}}>
                  ✕ Отмена
                </button>
                <button onClick={async()=>{
                  if(!verificationFile) return alert("Выберите документ");
                  setUploadingVerification(true);
                  try{
                    const formData = new FormData();
                    formData.append('file', verificationFile);
                    const response = await api.uploadVerification(formData);
                    setAuth(prev=>({...prev,verification_status:'pending',id_document_url:response.url}));
                    setShowVerificationModal(false);
                    setVerificationFile(null);
                    setVerificationPreview(null);
                    alert("✓ Документ загружен! Проверка займет менее 24 часов.");
                  }catch(err){
                    console.error("Upload error:", err);
                    alert("Ошибка загрузки: "+err.message);
                  }finally{
                    setUploadingVerification(false);
                  }
                }} disabled={!verificationFile||uploadingVerification} style={{flex:1,padding:"12px",background:"#7A9E7E",color:"white",border:"none",borderRadius:"12px",fontFamily:"'Geologica', sans-serif",fontSize:"13px",fontWeight:600,cursor:!verificationFile||uploadingVerification?"not-allowed":"pointer",transition:"all 0.2s",opacity:!verificationFile||uploadingVerification?0.5:1}} onMouseEnter={e=>{if(!uploadingVerification&&verificationFile)e.target.style.background="#5a8f6f"}} onMouseLeave={e=>{e.target.style.background="#7A9E7E"}}>
                  {uploadingVerification?"⏳ Загрузка...":"✓ Отправить"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div></div>
  );
}


const TRANSLATIONS = {
  ru: {
    appName: "RoommatchKAZ",
    findRoommate: "Найдите идеального соседа сегодня",
    connectRoommates: "Свяжитесь с соседями по всему Казахстану",
    verifiedRoommates: "Проверенные соседи",
    verifiedDesc: "Найдите надежных людей в поиске квартир по Казахстану",
    languagePreferences: "Предпочтения языка",
    languageDesc: "Общайтесь на казахском, русском или английском языке",
    smartMatching: "Умное сопоставление",
    smartDesc: "Подбор соседей на основе стиля жизни и предпочтений",
    createProfile: "Создайте профиль",
    findPerfectMatch: "Давайте найдем вашего идеального соседа",
    logIn: "Вход",
    signUp: "Регистрация",
    email: "Email",
    password: "Пароль",
    rememberMe: "Запомнить меня",
    forgotPassword: "Забыли пароль?",
    enterSanctuary: "Войти в RoommatchKAZ",
    prefLanguages: "Предпочтительные языки",
    next: "Далее →",
    back: "← Назад",
    createBtn: "Создать профиль 🎉",
    creating: "Создание...",
    welcomeBack: "С возвращением",
    signInMessage: "Войдите, чтобы найти идеального соседа",
    newToNeighborhood: "Еще не использовали RoommatchKAZ?",
    joinCommunity: "Присоединяйтесь к сообществу",
    alreadyHaveAccount: "Уже есть аккаунт?",
    basicInfo: "Основная информация",
    tellAboutYourself: "Расскажите нам о себе",
    name: "Имя",
    age: "Возраст",
    gender: "Пол",
    region: "Регион",
    budget: "Бюджет (₸/мес)",
    yourSituation: "Ваша ситуация",
    lookingForPlace: "Ищу квартиру",
    lookingForRoommate: "Ищу соседа",
    havePlace: "Есть квартира",
    lookingForRoommate2: "Ищу соседа",
    housing: "Жилье и работа",
    moveInDate: "Дата заезда",
    remoteWork: "Удаленная работа",
    schedule: "График",
    languages: "Языки",
    lifestyle: "Образ жизни",
    finalStep: "Последний шаг",
    profession: "Профессия / Учеба",
    cleanliness: "Чистоплотность",
    sociability: "Общительность",
    badHabits: "Вредные привычки",
    smoking: "Курение",
    alcohol: "Алкоголь",
    pets: "Питомцы",
    hasPet: "Есть питомец",
    noPet: "Нет питомца",
    guests: "Гости",
    noiseLevel: "Уровень шума",
    religion: "Вероисповедание",
    quiet: "Тихо",
    moderate: "Умеренно",
    loud: "Громко",
    yes: "Да",
    no: "Нет",
    never: "Никогда",
    rarely: "Редко",
    sometimes: "Иногда",
    often: "Часто",
    university: "Университет",
    aboutYourself: "О себе",
    saveProfile: "Сохранить профиль",
    saved: "Сохранено!",
    saving: "Сохранение...",
    resetPassword: "Сброс пароля",
    resetCode: "Код сброса",
    newPassword: "Новый пароль",
  }
};

function AuthScreen({onAuth}){
  const [mode, setMode]=useState("login");
  const uiLang = "ru";
  const [showReset, setShowReset] = useState(false);
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

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePassword = (password) => {
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return re.test(password);
  };

  const handleLoginSubmit = async () => {
    if (!form.email?.trim()) return alert("Введите email");
    if (!validateEmail(form.email.trim())) return alert("Введите корректный email");
    if (!form.password?.trim()) return alert("Введите пароль");
    if (!validatePassword(form.password)) return alert("Пароль должен содержать минимум 8 символов, включая заглавную букву, строчную букву, цифру и специальный символ");
    setLoading(true);
    try {
      const response = await api.login(form.email.trim(), form.password);
      if (!response?.token) throw new Error("No token provided");
      api.setToken(response.token);
      onAuth(normaliseProfile(response.user));
    } catch (err) {
      let errorMsg = "Не удалось войти в аккаунт";
      const errStr = (err.message || "").toLowerCase();
      
      if (errStr.includes("network error") || errStr.includes("unable to connect") || errStr.includes("failed to fetch")) {
        errorMsg = "Ошибка сети: Проверьте интернет-соединение или сервер может быть недоступен. Попробуйте снова.";
      } else if (errStr.includes("401") || errStr.includes("invalid credentials") || errStr.includes("unauthorized")) {
        errorMsg = "Неверный email или пароль";
      } else if (errStr.includes("404") || errStr.includes("not found") || errStr.includes("user not found")) {
        errorMsg = "Аккаунт не найден. Пожалуйста, зарегистрируйтесь";
      } else if (err.message && err.message !== "No token provided") {
        errorMsg = err.message;
      }
      alert(errorMsg);
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async () => {
    if (!form.name?.trim()) return alert("Введите имя");
    if (!form.age?.trim() || isNaN(parseInt(form.age))) return alert("Введите корректный возраст");
    if (!form.gender) return alert("Выберите пол");
    if (!form.email?.trim()) return alert("Введите email");
    if (!validateEmail(form.email.trim())) return alert("Введите корректный email");
    if (!form.password || !validatePassword(form.password)) return alert("Пароль должен содержать минимум 8 символов, включая заглавную букву, строчную букву, цифру и специальный символ");
    if (!form.region) return alert("Выберите регион");
    if (!form.budget?.trim() || isNaN(parseInt(form.budget))) return alert("Введите корректный бюджет");
    if (!form.renterType) return alert("Выберите ситуацию");
    if (form.renterType === "has_place" && (!form.address?.trim() || !form.lat || !form.lng)) return alert("Введите адрес жилья и выберите на карте");
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
        languages:   form.languages   || [],
        tags: withMetaTag(
          withMetaTag([], "uni", form.university),
          "commute", form.commuteMax
        ),
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
      setShowReset(false);
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
  const STEPS=["Основное","Жильё","Образ жизни + О себе"];

  const stepContent=()=>{
    if(step===0) return(
      <>
        <div className="step-title">Основная информация</div>
        <div className="step-sub">Расскажите немного о себе</div>
        <div className="grid2">
          <div className="fg-form"><label className="fl">Имя *</label><input className="fi" placeholder="Айгерим" value={form.name} onChange={e=>upd("name",e.target.value)}/></div>
          <div className="fg-form"><label className="fl">Возраст *</label><input className="fi" type="number" placeholder="23" value={form.age} onChange={e=>upd("age",e.target.value)}/></div>
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
        <div className="grid2">
          <div className="fg-form"><label className="fl">Регион *</label>
            <select className="fi" value={form.region} onChange={e=>upd("region",e.target.value)}>
              <option value="">Выберите регион</option>
              {KZ_REGIONS.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <div className="fg-form"><label className="fl">Бюджет (₸/мес) *</label><input className="fi" type="number" placeholder="80000" value={form.budget} onChange={e=>upd("budget",e.target.value)}/></div>
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
            <label className="fl" style={{color:"var(--accent2)"}}> Адрес вашего жилья *</label>
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
        <div className="step-sub">Ваши условия и требования</div>
        {form.renterType === "looking" && (
          <div className="fg-form"><label className="fl">Дата заезда</label><input className="fi" type="date" value={form.move_in} onChange={e=>upd("move_in",e.target.value)}/></div>
        )}
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
        {form.studyWork === "Учёба" && (
          <div className="fg-form">
            <label className="fl">Университет</label>
            <select className="fi" value={form.university} onChange={e=>upd("university",e.target.value)}>
              <option value="">Не выбрано</option>
              {UNIVERSITY_OPTIONS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        )}
      </>
    );
    if(step===2) return(
      <>
        <div className="step-title">Образ жизни + О себе</div>
        <div className="step-sub">Финальный шаг для лучших smart-рекомендаций</div>
        <div className="fg-form"><label className="fl">Профессия / учёба</label><input className="fi" placeholder="Студентка, дизайнер, врач…" value={form.occupation} onChange={e=>upd("occupation",e.target.value)}/></div>
        {form.studyWork === "Учёба" && (
          <div className="fg-form">
            <label className="fl">Университет</label>
            <select className="fi" value={form.university} onChange={e=>upd("university",e.target.value)}>
              <option value="">Не выбрано</option>
              {UNIVERSITY_OPTIONS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        )}
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
        <PhotoUpload photos={photos} onChange={setPhotos}/>
        <div className="fg-form">
          <label className="fl">Коротко о себе</label>
          <textarea className="fi" style={{height:"100px",resize:"vertical"}} placeholder="Я студентка 3-го курса, тихая и аккуратная…" value={form.bio} onChange={e=>upd("bio",e.target.value)}/>
        </div>
        <div style={{background:"var(--bg2)",borderRadius:"var(--rs)",padding:"16px",marginBottom:"16px"}}>
          <div style={{fontSize:"13px",fontWeight:"700",color:"var(--mid)",marginBottom:"10px"}}>📋 Ваша анкета:</div>
          <div style={{fontSize:"13px",color:"var(--mid)",lineHeight:"1.8"}}>
            <div>{form.name}, {form.age} лет · {form.gender==="female"?"♀ Девушка":"♂ Парень"}</div>
            <div>{KZ_REGIONS.find(r=>r.id===form.region)?.name||"Не указан"}</div>
            <div>{(+form.budget||0).toLocaleString()} ₸/мес · 📅 {form.move_in||"Не указано"}</div>
            <div>{form.schedule||"Не указан"} · {form.remote?"💻 Удалёнка":"🏢 Офис"}</div>
            <div>{form.studyWork === "Учёба" ? (form.university || "Университет не указан") : (form.occupation || "Профессия не указана")}</div>
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
        <div className="auth-left-content">
          <div style={{marginBottom:"48px"}}>
            <div style={{fontSize:"28px",fontWeight:"700",color:"#fff",marginBottom:"32px",fontFamily:"var(--font-display)",letterSpacing:"0.5px",opacity:"0.95"}}>RoommatchKAZ</div>
            <div style={{fontSize:"56px",fontWeight:"800",color:"#fff",lineHeight:"1.1",marginBottom:"28px",letterSpacing:"-1px"}}>
                <>Найдите Идеального <br/><span style={{color:"#A8D5BA"}}>Соседа</span><br/>в Казахстане</>
            </div>
            <p style={{color:"rgba(255,255,255,.8)",fontSize:"15px",marginBottom:"0",lineHeight:"1.7",fontWeight:"400"}}>{TRANSLATIONS[uiLang].connectRoommates}</p>
          </div>
          
          <div style={{display:"flex",flexDirection:"column",gap:"28px"}}>
            <div style={{display:"flex",gap:"16px",alignItems:"flex-start"}}>
              <div style={{width:"56px",height:"56px",minWidth:"56px",background:"rgba(255,255,255,.15)",backdropFilter:"blur(10px)",borderRadius:"14px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"26px",border:"1px solid rgba(255,255,255,.2)"}}>✓</div>
              <div style={{paddingTop:"4px"}}>
                <div style={{color:"#fff",fontSize:"16px",fontWeight:"700",marginBottom:"6px"}}>Настоящие профили</div>
                <div style={{color:"rgba(255,255,255,.75)",fontSize:"15px",lineHeight:"1.7"}}>Проверенные люди в поиске соседей</div>
              </div>
            </div>
            
            <div style={{display:"flex",gap:"16px",alignItems:"flex-start"}}>
              <div style={{width:"56px",height:"56px",minWidth:"56px",background:"rgba(255,255,255,.15)",backdropFilter:"blur(10px)",borderRadius:"14px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"26px",border:"1px solid rgba(255,255,255,.2)"}}>✓</div>
              <div style={{paddingTop:"4px"}}>
                <div style={{color:"#fff",fontSize:"16px",fontWeight:"700",marginBottom:"6px"}}>Интерактивные карты</div>
                <div style={{color:"rgba(255,255,255,.75)",fontSize:"15px",lineHeight:"1.7"}}>Исследуйте районы от Алматы до Астаны</div>
              </div>
            </div>
            
            <div style={{display:"flex",gap:"16px",alignItems:"flex-start"}}>
              <div style={{width:"56px",height:"56px",minWidth:"56px",background:"rgba(255,255,255,.15)",backdropFilter:"blur(10px)",borderRadius:"14px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"26px",border:"1px solid rgba(255,255,255,.2)"}}>✓</div>
              <div style={{paddingTop:"4px"}}>
                <div style={{color:"#fff",fontSize:"16px",fontWeight:"700",marginBottom:"6px"}}>Идеальная совместимость</div>
                <div style={{color:"rgba(255,255,255,.75)",fontSize:"15px",lineHeight:"1.7"}}>Подбор по образу жизни, не только по бюджету и площади</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="auth-right">
        <div className="auth-card-login">
          <div style={{textAlign:"center",marginBottom:"32px"}}>
            <div style={{fontSize:"28px",fontWeight:"800",color:"#1e4a36",marginBottom:"8px",letterSpacing:"-0.5px"}}>С возвращением</div>
            <p style={{fontSize:"15px",color:"#888",margin:0,fontWeight:"400",lineHeight:"1.6"}}>Войдите в свой аккаунт</p>
          </div>
          
          <div className="auth-tabs-container">
            <button className={`auth-tab ${mode==="login"?"active":""}`} onClick={()=>setMode("login")} style={{borderBottom:mode==="login"?"2px solid #5a8f6f":"1px solid #ddd",color:mode==="login"?"#1e4a36":"#999",fontWeight:mode==="login"?"600":"500",background:"none",padding:"12px 0",cursor:"pointer",fontSize:"15px",transition:"all 0.3s"}}>Вход</button>
            <button className={`auth-tab ${mode==="register"?"active":""}`} onClick={()=>{setMode("register");setStep(0);}} style={{borderBottom:mode==="register"?"2px solid #5a8f6f":"1px solid #ddd",color:mode==="register"?"#1e4a36":"#999",fontWeight:mode==="register"?"600":"500",background:"none",padding:"12px 0",cursor:"pointer",fontSize:"15px",transition:"all 0.3s"}}>Регистрация</button>
          </div>
          
          <div className="fg-form">
            <label className="fl">{TRANSLATIONS[uiLang].email}</label>
            <input className="fi" type="email" placeholder="nomad@almaty.kz" value={form.email} onChange={e=>upd("email",e.target.value)}/>
          </div>
          
          <div className="fg-form" style={{marginBottom:"8px"}}>
            <label className="fl">{TRANSLATIONS[uiLang].password}</label>
            <input className="fi" type="password" placeholder="••••••••" value={form.password} onChange={e=>upd("password",e.target.value)}/>
          </div>
          
          <div className="fg-form" style={{marginBottom:"24px"}}>
            <label className="fl">{TRANSLATIONS[uiLang].prefLanguages}</label>
            <div className="chip-row">
              {["Казахский","Русский","Английский"].map(l=>(
                <button key={l} className={`chip-sel ${form.languages.includes(l)?"on":""}`} onClick={()=>toggleLang(l)} style={{flex:1,fontSize:"12px",padding:"10px 12px"}}>{l==="Казахский"?"🇰🇿":l==="Русский"?"🇷🇺":"🌍"} {l}</button>
              ))}
            </div>
          </div>
          
          <div style={{textAlign:"right",marginBottom:"24px"}}>
            <span style={{fontSize:"13px",color:"#5a8f6f",cursor:"pointer",fontWeight:"600",transition:"all 0.2s ease"}} onMouseEnter={e=>e.target.style.opacity="0.8"} onMouseLeave={e=>e.target.style.opacity="1"} onClick={()=>setShowReset(true)}>{TRANSLATIONS[uiLang].forgotPassword}</span>
          </div>
          
          <button className="btn-enter-sanctuary" onClick={handleLoginSubmit} disabled={loading}>
            {loading ? "Загрузка..." : "Присоединиться →"}
          </button>
          
          <p style={{textAlign:"center",fontSize:"13px",color:"#999",marginTop:"28px"}}>
            {TRANSLATIONS[uiLang].newToNeighborhood} <span style={{color:"#5a8f6f",cursor:"pointer",fontWeight:"700",transition:"all 0.2s ease"}} onMouseEnter={e=>e.target.style.opacity="0.7"} onMouseLeave={e=>e.target.style.opacity="1"} onClick={()=>{setMode("register");setStep(0);}}>{TRANSLATIONS[uiLang].joinCommunity}</span>
          </p>
          
          {showReset && (
            <div style={{marginTop:"24px",padding:"20px",background:"var(--bg2)",borderRadius:"var(--rs)",border:"1px solid var(--border)"}}>
              <div style={{fontSize:"14px",fontWeight:"700",marginBottom:"12px"}}>Сброс пароля</div>
              <div className="fg-form">
                <label className="fl">Email</label>
                <input className="fi" type="email" placeholder="soosedi@almaty.kz" value={form.email} onChange={e=>upd("email",e.target.value)}/>
              </div>
              <div className="fg-form">
                <label className="fl">Код сброса</label>
                <input className="fi" placeholder="6-значный код" value={resetCode} onChange={e=>setResetCode(e.target.value.replace(/\D/g, "").slice(0, 6))}/>
              </div>
              <div className="fg-form" style={{marginBottom:"20px"}}>
                <label className="fl">Новый пароль</label>
                <input className="fi" type="password" placeholder="Минимум 8 символов" value={form.password} onChange={e=>upd("password",e.target.value)}/>
              </div>
              {!!devResetCode && (
                <div style={{background:"var(--accent-light)",border:"1px solid var(--accent)",padding:"10px 12px",borderRadius:"10px",fontSize:"12px",marginBottom:"14px",color:"var(--accent2)"}}>
                  Dev code: <b>{devResetCode}</b>
                </div>
              )}
              <div style={{display:"grid",gap:"8px"}}>
                <button className="btn-ghost" onClick={handleForgotRequest} disabled={loading}>Получить код</button>
                <button className="btn-primary" onClick={handleResetSubmit} disabled={loading}>{loading ? "Загрузка..." : "Сбросить пароль"}</button>
              </div>
              <p style={{textAlign:"center",fontSize:"12px",color:"var(--muted)",marginTop:"16px"}}>
                <span style={{color:"var(--accent)",cursor:"pointer",fontWeight:"700"}} onClick={()=>setShowReset(false)}>Вернуться к входу</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return(
    <div className="auth-wrap">
      <div className="auth-left">
        <div className="auth-left-content">
          <div style={{fontSize:"28px",fontWeight:"700",color:"#fff",marginBottom:"28px",fontFamily:"var(--font-display)"}}>RoommatchKAZ</div>
          <div style={{fontSize:"42px",fontWeight:"700",color:"#fff",lineHeight:"1.1",marginBottom:"20px"}}>
            Шаг {step+1} из {STEPS.length}
          </div>
          <p style={{color:"rgba(255,255,255,.8)",fontSize:"15px",marginBottom:"32px",lineHeight:"1.5"}}>{STEPS[step]}</p>
          
          <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
            {STEPS.map((s,i)=>(
              <div key={s} style={{display:"flex",alignItems:"center",gap:"12px",opacity:i<=step?1:.4}}>
                <div style={{width:"28px",height:"28px",borderRadius:"50%",background:i<step?"#A8D5BA":i===step?"#fff":"rgba(255,255,255,.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"13px",fontWeight:"700",color:i<step||i===step?"#5a8f6f":"#fff",flexShrink:0}}>{i<step?"✓":i+1}</div>
                <span style={{color:"rgba(255,255,255,.85)",fontSize:"14px",fontWeight:i===step?"700":"400"}}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="auth-right">
        <div className="auth-card-login">
          <div style={{textAlign:"center",marginBottom:"24px"}}>
            <div style={{fontSize:"22px",fontWeight:"700",color:"var(--txt)",marginBottom:"4px"}}>Создайте профиль</div>
            <p style={{fontSize:"13px",color:"var(--txt2)",margin:0}}>Давайте найдем вашего идеального соседа</p>
          </div>
          
          <div className="auth-tabs-container">
            <button className={`auth-tab ${mode==="login"?"active":""}`} onClick={()=>setMode("login")} style={{borderBottom:mode==="login"?"2px solid #5a8f6f":"1px solid #ddd",color:mode==="login"?"#1e4a36":"#999",fontWeight:mode==="login"?"600":"500",background:"none",padding:"12px 0",cursor:"pointer",fontSize:"15px",transition:"all 0.3s"}}>Вход</button>
            <button className={`auth-tab ${mode==="register"?"active":""}`} onClick={()=>{setMode("register");setStep(0);}} style={{borderBottom:mode==="register"?"2px solid #5a8f6f":"1px solid #ddd",color:mode==="register"?"#1e4a36":"#999",fontWeight:mode==="register"?"600":"500",background:"none",padding:"12px 0",cursor:"pointer",fontSize:"15px",transition:"all 0.3s"}}>Регистрация</button>
          </div>
          
          <div className="reg-steps" style={{marginBottom:"24px"}}>{STEPS.map((_,i)=><div key={i} className={`reg-step ${i<step?"done":i===step?"active":""}`}/>)}</div>
          
          <div style={{maxHeight:"calc(80vh - 280px)",overflowY:"auto",paddingRight:"8px"}}>{stepContent()}</div>
          
          <div className="step-nav" style={{marginTop:"24px"}}>
            {step>0&&<button className="btn-back" onClick={()=>setStep(s=>s-1)}>← Назад</button>}
            {step<STEPS.length-1?(
              <button className="btn-next" onClick={()=>setStep(s=>s+1)}>Далее →</button>
            ):(
              <button className="btn-next" onClick={handleRegisterSubmit} disabled={loading}>{loading ? "Создание..." : "Создать профиль 🎉"}</button>
            )}
          </div>
          
          <p style={{textAlign:"center",fontSize:"12px",color:"var(--txt2)",marginTop:"16px"}}>
            Уже есть аккаунт?&nbsp;<span style={{color:"#5a8f6f",cursor:"pointer",fontWeight:"600"}} onClick={()=>setMode("login")}>Войти</span>
          </p>
        </div>
      </div>
    </div>
  );
}

// ── ADMIN VERIFICATION DASHBOARD ──────────────────────────────────────────────
export function AdminVerificationDashboard({ allProfiles, onVerify }) {
  const [filter, setFilter] = useState('pending');
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

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

  return (
    <div style={{background:"#FAFDF9",minHeight:"100vh",padding:"40px 72px"}}>
      <style>{`
        @keyframes slideIn { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
        .admin-card { animation: slideIn 0.4s ease both; }
      `}</style>

      <div style={{maxWidth:"1400px",margin:"0 auto"}}>
        {/* Header */}
        <div style={{marginBottom:"40px"}}>
          <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"8px"}}>
            <h1 style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"2.4rem",fontWeight:600,color:"#1C2B1E",margin:0}}>
              Панель верификации
            </h1>
          </div>
          <p style={{fontSize:"15px",color:"rgba(28,43,30,0.6)",margin:0}}>Проверьте и верифицируйте профили</p>
        </div>

        {/* Filter Tabs */}
        <div style={{display:"flex",gap:"12px",marginBottom:"32px",borderBottom:"2px solid #C8DEC4",paddingBottom:"16px"}}>
          {[
            {id:'pending',label:`На проверке (${allProfiles.filter(p=>p.verification_status==='pending').length})`},
            {id:'approved',label:`✓ Верифицированы (${allProfiles.filter(p=>p.verification_status==='approved').length})`},
            {id:'rejected',label:`✗ Отклонены (${allProfiles.filter(p=>p.verification_status==='rejected').length})`}
          ].map(tab=>(
            <button key={tab.id} onClick={()=>setFilter(tab.id)} style={{padding:"10px 18px",borderRadius:"12px",border:"none",background:filter===tab.id?"#7A9E7E":"transparent",color:filter===tab.id?"white":"#1C2B1E",fontFamily:"'Geologica', sans-serif",fontSize:"13px",fontWeight:600,cursor:"pointer",transition:"all 0.2s"}}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Profiles Grid */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(300px, 1fr))",gap:"20px",marginBottom:"40px"}}>
          {filteredProfiles.map((profile)=>(
            <div key={profile.id} className="admin-card" style={{background:"#FFFFFF",border:"1px solid #C8DEC4",borderRadius:"20px",overflow:"hidden",boxShadow:"0 4px 12px rgba(0,0,0,0.08)",transition:"all 0.2s",cursor:"pointer"}} onMouseEnter={(e)=>{e.currentTarget.style.boxShadow="0 8px 24px rgba(122,158,126,0.2)";e.currentTarget.style.transform="translateY(-4px)";}} onMouseLeave={(e)=>{e.currentTarget.style.boxShadow="0 4px 12px rgba(0,0,0,0.08)";e.currentTarget.style.transform="translateY(0)";}}>
              <div style={{height:"180px",background:profile.photos?.[0]?.startsWith("http")?`url(${profile.photos[0]}) center/cover`:`linear-gradient(135deg, #5a8f6f 0%, #4a7a5f 100%)`,backgroundSize:"cover",backgroundPosition:"center",position:"relative"}}>
                <div style={{position:"absolute",top:"12px",right:"12px",background:profile.verification_status==="approved"?"#E4F0E0":profile.verification_status==="rejected"?"#FEE2E2":"#FEF3C7",color:profile.verification_status==="approved"?"#7A9E7E":profile.verification_status==="rejected"?"#DC2626":"#92400E",padding:"6px 12px",borderRadius:"100px",fontSize:"12px",fontWeight:600}}>
                  {profile.verification_status==="approved"?"✓":profile.verification_status==="rejected"?"✗":"⏳"}
                </div>
              </div>
              <div style={{padding:"16px"}}>
                <h3 style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"1.1rem",fontWeight:600,color:"#1C2B1E",margin:"0 0 4px 0"}}>{profile.full_name}</h3>
                <div style={{fontSize:"13px",color:"rgba(28,43,30,0.6)",marginBottom:"12px"}}>📍 {(profile.region || "—").split(",")[0]}</div>
                <button onClick={()=>setSelectedProfile(profile)} style={{width:"100%",padding:"10px",background:profile.verification_status==="pending"?"linear-gradient(135deg, #7A9E7E 0%, #5a8f6f 100%)":"#F2F8F1",color:profile.verification_status==="pending"?"white":"#7A9E7E",border:"none",borderRadius:"12px",fontFamily:"'Geologica', sans-serif",fontSize:"13px",fontWeight:600,cursor:"pointer",transition:"all 0.2s"}}>
                  {profile.verification_status==="pending"?"🔍 Проверить":"👁️ Детали"}
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredProfiles.length === 0 && (
          <div style={{textAlign:"center",padding:"60px 20px"}}>
            <div style={{fontSize:"3rem",marginBottom:"16px"}}>✓</div>
            <h2 style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"1.6rem",fontWeight:600,color:"#1C2B1E"}}>Нет профилей</h2>
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedProfile && (
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(28,43,30,0.7)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:2000,padding:"20px"}} onClick={e=>e.target===e.currentTarget&&setSelectedProfile(null)}>
          <div style={{background:"#FFFFFF",borderRadius:"28px",width:"100%",maxWidth:"600px",maxHeight:"90vh",overflow:"auto",boxShadow:"0 25px 80px rgba(122,158,126,0.25)"}}>
            <div style={{padding:"24px",borderBottom:"1px solid #C8DEC4",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <h2 style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"1.6rem",fontWeight:600,color:"#1C2B1E",margin:0}}>{selectedProfile.full_name}</h2>
              <button onClick={()=>setSelectedProfile(null)} style={{width:"36px",height:"36px",borderRadius:"50%",background:"#F2F8F1",border:"none",cursor:"pointer"}}>✕</button>
            </div>
            <div style={{padding:"24px"}}>
              <div style={{marginBottom:"24px"}}>
                <h3 style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"1rem",fontWeight:600,color:"#1C2B1E",marginBottom:"12px"}}>ℹ️ Информация</h3>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
                  {[
                    {label:"Возраст",value:selectedProfile.age},
                    {label:"Пол",value:selectedProfile.gender},
                    {label:"Регион",value:(selectedProfile.region||"—").split(",")[0]},
                    {label:"Бюджет",value:selectedProfile.budget?`₸${selectedProfile.budget}`:"-"}
                  ].map((item,i)=>(
                    <div key={i} style={{background:"#F2F8F1",borderRadius:"12px",padding:"12px"}}>
                      <div style={{fontSize:"12px",color:"rgba(28,43,30,0.6)",marginBottom:"4px"}}>{item.label}</div>
                      <div style={{fontSize:"14px",fontWeight:600,color:"#1C2B1E"}}>{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
              {selectedProfile.id_document_url && (
                <div style={{marginBottom:"24px"}}>
                  <h3 style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"1rem",fontWeight:600,color:"#1C2B1E",marginBottom:"12px"}}>📸 Загруженный документ</h3>
                  <img src={`/api/verify/file/${selectedProfile.id_document_url.split('/').pop()}`} alt="ID Document" style={{width:"100%",borderRadius:"12px",border:"1px solid #C8DEC4",maxHeight:"300px",objectFit:"contain",cursor:"pointer"}} title="Кликните для увеличения" loading="lazy"/>
                </div>
              )}
              {selectedProfile.verification_status === 'pending' && (
                <div style={{marginBottom:"24px"}}>
                  <h3 style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"1rem",fontWeight:600,color:"#1C2B1E",marginBottom:"12px"}}>💬 Причина отклонения</h3>
                  <textarea value={rejectionReason} onChange={(e)=>setRejectionReason(e.target.value)} placeholder="Причина..." style={{width:"100%",padding:"12px 14px",border:"1px solid #C8DEC4",borderRadius:"12px",fontFamily:"'Geologica', sans-serif",fontSize:"13px",color:"#1C2B1E",background:"#FAFDF9",outline:"none",resize:"vertical",minHeight:"70px",boxSizing:"border-box"}}/>
                </div>
              )}
              <div style={{marginBottom:"24px"}}>
                <div style={{background:selectedProfile.verification_status==="approved"?"#E4F0E0":selectedProfile.verification_status==="rejected"?"#FEE2E2":"#FEF3C7",color:selectedProfile.verification_status==="approved"?"#7A9E7E":selectedProfile.verification_status==="rejected"?"#DC2626":"#92400E",padding:"12px 14px",borderRadius:"12px",fontWeight:600,fontSize:"14px"}}>
                  {selectedProfile.verification_status==="approved"?"✓ Верифицирован":selectedProfile.verification_status==="rejected"?"✗ Отклонен":"⏳ На проверке"}
                </div>
              </div>
              {selectedProfile.verification_status === 'pending' && (
                <div style={{display:"flex",gap:"12px"}}>
                  <button onClick={()=>handleVerify(selectedProfile.id, false)} style={{flex:1,padding:"12px",background:"#FEE2E2",color:"#DC2626",border:"none",borderRadius:"12px",fontFamily:"'Geologica', sans-serif",fontSize:"13px",fontWeight:600,cursor:"pointer",transition:"all 0.2s"}} onMouseEnter={e=>{e.target.style.background="#FED7D7"}} onMouseLeave={e=>{e.target.style.background="#FEE2E2"}}>
                    ✗ Отклонить
                  </button>
                  <button onClick={()=>handleVerify(selectedProfile.id, true)} style={{flex:1,padding:"12px",background:"#E4F0E0",color:"#7A9E7E",border:"none",borderRadius:"12px",fontFamily:"'Geologica', sans-serif",fontSize:"13px",fontWeight:600,cursor:"pointer",transition:"all 0.2s"}} onMouseEnter={e=>{e.target.style.background="#D0E8C8"}} onMouseLeave={e=>{e.target.style.background="#E4F0E0"}}>
                    ✓ Верифицировать
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}