// /middleware.js
import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET;

export async function middleware(req) {
  // Get the token from the cookie (Edge middleware automatically parses cookies)
  const token = req.cookies.get("token")?.value;

  // Handle /login page separately: if token exists and is valid, redirect away from login.
  if (req.nextUrl.pathname === "/login") {
    if (token) {
      try {
        const { payload } = await jwtVerify(
          token,
          new TextEncoder().encode(JWT_SECRET)
        );
        // Redirect based on role
        const redirectTo =
          payload.role === "admin" ? "/admin/dashboard" : "/user/home";
        return NextResponse.redirect(new URL(redirectTo, req.url));
      } catch (err) {
        console.error("JWT verification error:", err);
        // Let the user stay on /login if the token is invalid.
        return NextResponse.next();
      }
    }
    return NextResponse.next();
  }

  // For protected routes under /user or /admin
  if (
    req.nextUrl.pathname.startsWith("/user") ||
    req.nextUrl.pathname.startsWith("/admin")
  ) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    try {
      const { payload } = await jwtVerify(
        token,
        new TextEncoder().encode(JWT_SECRET)
      );
      // If trying to access admin routes but not an admin, redirect to user homepage.
      if (
        req.nextUrl.pathname.startsWith("/admin") &&
        payload.role !== "admin"
      ) {
        return NextResponse.redirect(new URL("/user/home", req.url));
      }
    } catch (err) {
      console.error("JWT verification error:", err);
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/user/:path*", "/admin/:path*"],
};
