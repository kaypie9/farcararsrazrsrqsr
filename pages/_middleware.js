import { NextResponse } from "next/server";

export function middleware(req) {
  const res = NextResponse.next();

  // Allow embedding inside Farcaster / Warpcast
  res.headers.set("X-Frame-Options", "ALLOWALL");

  // More flexible CSP for iFrame
  res.headers.set(
    "Content-Security-Policy",
    "frame-ancestors * https://* http://*;"
  );

  return res;
}
