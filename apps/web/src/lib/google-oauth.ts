// Standalone Google OAuth 2.0 flow for the per-business "Connect Google Reviews"
// step (incremental authorization). This is deliberately SEPARATE from NextAuth:
// owner sign-in (lib/auth.ts) stays identity-only ("openid email profile", no
// consent screen warning — ADR-0003). Connecting Google is an explicit opt-in that
// requests the heavy `business.manage` scope + an offline refresh token, and stores
// the grant on the owner's Business row (not the session), so it survives logout and
// is scoped to one location.

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

const BUSINESS_MANAGE_SCOPE =
  "https://www.googleapis.com/auth/business.manage";

export const GOOGLE_CONNECT_REDIRECT_URI = `${
  process.env.NEXTAUTH_URL ?? "http://localhost:3000"
}/api/google/callback`;

export interface GoogleTokens {
  accessToken: string;
  refreshToken?: string;
  // Absolute expiry as a Date (computed from `expires_in`).
  expiresAt: Date;
}

// Build the consent URL the owner is redirected to. `state` is an opaque,
// app-signed value we verify on callback (CSRF + which business to link).
export function buildConsentUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: GOOGLE_CONNECT_REDIRECT_URI,
    response_type: "code",
    scope: BUSINESS_MANAGE_SCOPE,
    // Refresh token + force the consent screen so we reliably get one even on
    // re-connect (Google only returns a refresh_token when prompted). We also force
    // the account chooser: the browser's active Google session is often NOT the
    // account that manages the location, and without this Google silently uses it
    // (and an "Access blocked" page then offers no way to switch).
    access_type: "offline",
    prompt: "select_account consent",
    include_granted_scopes: "true",
    state,
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

function toTokens(payload: {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
}): GoogleTokens {
  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
    expiresAt: new Date(Date.now() + (payload.expires_in ?? 3600) * 1000),
  };
}

// Exchange the one-time authorization code for tokens (first connect).
export async function exchangeCode(code: string): Promise<GoogleTokens> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: "authorization_code",
      code,
      redirect_uri: GOOGLE_CONNECT_REDIRECT_URI,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Token exchange failed ${res.status}: ${JSON.stringify(data)}`);
  }
  return toTokens(data);
}

// Mint a fresh access token from a stored refresh token. Google does not return a
// new refresh_token here, so callers keep the existing one.
export async function refreshAccessToken(
  refreshToken: string
): Promise<GoogleTokens> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Token refresh failed ${res.status}: ${JSON.stringify(data)}`);
  }
  return toTokens(data);
}
