import { env } from "../config/env.js";

export async function verifyGoogleCredential(credential) {
  const token = String(credential || "").trim();
  if (!token) {
    throw new Error("Google credential is required");
  }

  if (!env.GOOGLE_CLIENT_ID) {
    throw new Error("Google authentication is not configured on the server");
  }

  const res = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(token)}`
  );

  if (!res.ok) {
    throw new Error("Invalid Google credential");
  }

  const payload = await res.json();

  if (payload.aud !== env.GOOGLE_CLIENT_ID) {
    throw new Error("Google client mismatch");
  }

  if (payload.email_verified !== "true") {
    throw new Error("Google account email is not verified");
  }

  return {
    sub: payload.sub,
    email: String(payload.email || "").trim().toLowerCase(),
    name: String(payload.name || payload.given_name || "Google User").trim(),
  };
}
