import { NextResponse } from "next/server";

export function middleware(req) {
  const res = NextResponse.next();

  // Allow iframe embedding (for Farcaster Mini App)
  res.headers.set("X-Frame-Options", "ALLOWALL");
  res.headers.set("Content-Security-Policy", "frame-ancestors *");

  return res;
}
