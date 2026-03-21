// logic/hooks.js
// ─────────────────────────────────────────────────────────────
// Custom React hooks. Pure logic — no JSX, no styles.
// ─────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useCallback } from "react";
import { BASE_URL } from "./constants";

/**
 * usePollingChat
 * Polls the server for new messages for each matched profile
 * and merges them into the conversations state.
 *
 * @param {string|number} authUserId      – current user's ID
 * @param {Array}         matchedProfiles – list of matched profile objects
 * @param {Function}      setConversations – state setter from parent
 * @returns {{ typingFor: string|null, startPolling: Function, stopPolling: Function }}
 */
export function usePollingChat(authUserId, matchedProfiles, setConversations) {
  const [typingFor, setTypingFor] = useState(null);
  const pollTimers = useRef({});

  const startPolling = useCallback(
    (profileId) => {
      if (pollTimers.current[profileId]) return; // already polling

      const poll = async () => {
        try {
          const token = localStorage.getItem("roommate_kz_token");
          const res = await fetch(`${BASE_URL}/api/messages/${profileId}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          if (!res.ok) return;

          const msgs = await res.json();

          setConversations((prev) => {
            const existing    = prev[profileId] || [];
            const existingIds = new Set(existing.map((m) => m.id));
            const incoming    = msgs
              .filter((m) => !existingIds.has(m.id))
              .map((m) => ({
                id:   m.id,
                text: m.text,
                mine: String(m.sender_id) === String(authUserId),
                time: new Date(m.created_at).toLocaleTimeString("ru", {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
              }));

            if (incoming.length === 0) return prev;

            // Show typing indicator for incoming messages
            if (incoming.some((m) => !m.mine)) {
              setTypingFor(profileId);
              setTimeout(() => setTypingFor(null), 1200);
            }

            return { ...prev, [profileId]: [...existing, ...incoming] };
          });
        } catch (_) {
          // Network errors are silently swallowed — polling will retry
        }
      };

      poll(); // immediate first fetch
      pollTimers.current[profileId] = setInterval(poll, 3000);
    },
    [authUserId, setConversations]
  );

  const stopPolling = useCallback((profileId) => {
    clearInterval(pollTimers.current[profileId]);
    delete pollTimers.current[profileId];
  }, []);

  // Auto-start polling for all matched profiles; clean up on unmount
  useEffect(() => {
    matchedProfiles.filter((p) => p.matched).forEach((p) => startPolling(p.id));
    return () => {
      Object.values(pollTimers.current).forEach(clearInterval);
      pollTimers.current = {};
    };
  }, [matchedProfiles, startPolling]);

  return { typingFor, startPolling, stopPolling };
}
