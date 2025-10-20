import { NextResponse } from "next/server";

export function middleware(req) {
  const res = NextResponse.next();

  res.headers.set("X-Frame-Options", "ALLOW-FROM *");
  res.headers.set(
    "Content-Security-Policy",
    "frame-ancestors * https://* http://*;"
  );

  return res;
}

export const config = {
  matcher: "/:path*",
};
