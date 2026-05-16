import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Auth disabled for local development.
// To re-enable: replace this with `export { default } from "next-auth/middleware"`
// and add `export const config = { matcher: ["/dashboard/:path*"] }`
export function middleware(_req: NextRequest) {
  return NextResponse.next();
}

