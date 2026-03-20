import jwt from "jsonwebtoken";
import { supabaseAdmin } from "../supabase.js";

/**
 * Verifies the Bearer JWT and attaches req.user = { id, email }
 * Returns 401 if the token is missing or invalid.
 */
export async function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = header.slice(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: String(decoded.sub ?? decoded.id), email: decoded.email };
    return next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

/**
 * Like authMiddleware but does NOT reject unauthenticated requests –
 * just sets req.user = null if no valid token.
 */
export async function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    req.user = null;
    return next();
  }
  const token = header.slice(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: String(decoded.sub ?? decoded.id), email: decoded.email };
  } catch {
    req.user = null;
  }
  next();
}
