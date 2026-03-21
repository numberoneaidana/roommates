/**
 * api-client.js  –  Front-end API client for roommate-kz
 *
 * Talks to the Node.js / Express backend.
 * Token is stored in localStorage under "roommate_kz_token".
 */

const BASE = "https://roommates-production.up.railway.app";

export default class ApiClient {
  constructor() {
    this._token = localStorage.getItem("roommate_kz_token") ?? null;
  }

  // ── Token management ────────────────────────────────────────────────────────
  setToken(token) {
    this._token = token;
    if (token) localStorage.setItem("roommate_kz_token", token);
    else        localStorage.removeItem("roommate_kz_token");
  }

  getToken() {
    return this._token;
  }

  /** WebSocket URL with the JWT as a query param */
  wsUrl() {
    const protocol = BASE.startsWith("https") ? "wss" : "ws";
    const host = BASE.replace(/^https?:\/\//, "");
    return `${protocol}://${host}/ws?token=${this._token}`;
  }

  // ── Core fetch helper ────────────────────────────────────────────────────────
  async _fetch(path, options = {}) {
    const headers = { "Content-Type": "application/json", ...options.headers };
    if (this._token) headers["Authorization"] = `Bearer ${this._token}`;

    const res = await fetch(`${BASE}${path}`, { ...options, headers });

    if (!res.ok) {
      let msg = `HTTP ${res.status}`;
      try { const body = await res.json(); msg = body.error ?? msg; } catch {}
      throw new Error(msg);
    }

    const text = await res.text();
    return text ? JSON.parse(text) : null;
  }

  // ── Auth ─────────────────────────────────────────────────────────────────────
  async register(payload) {
    const data = await this._fetch("/api/auth/register", {
      method: "POST",
      body:   JSON.stringify(payload),
    });
    if (data?.token) this.setToken(data.token);
    return data;
  }

  async login(email, password) {
    const data = await this._fetch("/api/auth/login", {
      method: "POST",
      body:   JSON.stringify({ email, password }),
    });
    if (data?.token) this.setToken(data.token);
    return data;
  }

  async forgotPassword(email) {
    return this._fetch("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(email, code, newPassword) {
    return this._fetch("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ email, code, newPassword }),
    });
  }

  async getCurrentUser() {
    return this._fetch("/api/auth/me");
  }

  async updateProfile(payload) {
    return this._fetch("/api/auth/me", {
      method: "PUT",
      body:   JSON.stringify(payload),
    });
  }

  // ── Profiles ─────────────────────────────────────────────────────────────────
  async getProfiles(filters = {}) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(filters)) {
      if (v !== undefined && v !== null && v !== "") params.set(k, v);
    }
    const qs = params.toString();
    return this._fetch(`/api/profiles${qs ? `?${qs}` : ""}`);
  }

  async getProfile(id) {
    return this._fetch(`/api/profiles/${id}`);
  }

  /**
   * Like a profile.
   * Returns { liked: true, matched: boolean, match_id?: string }
   */
  async likeProfile(id) {
    return this._fetch(`/api/profiles/like/${id}`, { method: "POST" });
  }

  async passProfile(id) {
    return this._fetch(`/api/profiles/pass/${id}`, { method: "POST" });
  }

  // ── Matches ──────────────────────────────────────────────────────────────────
  async getMatches() {
    return this._fetch("/api/matches");
  }

  async unmatch(matchId) {
    return this._fetch(`/api/matches/${matchId}`, { method: "DELETE" });
  }

  // ── Messages ─────────────────────────────────────────────────────────────────
  /**
   * @param {string|number} profileId  – the other user's ID
   * @param {string|number|null} sinceId – only fetch messages after this ID (incremental poll)
   */
  async getMessages(profileId, sinceAt = null) {
    const qs = sinceAt ? `?since_at=${encodeURIComponent(sinceAt)}` : "";
    return this._fetch(`/api/messages/${profileId}${qs}`);
  }

  async sendMessage(profileId, content) {
    return this._fetch(`/api/messages/${profileId}`, {
      method: "POST",
      body:   JSON.stringify({ content }),
    });
  }

  async markMessagesRead(profileId) {
    return this._fetch(`/api/messages/${profileId}/read`, { method: "PUT" });
  }
}