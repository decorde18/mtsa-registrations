import { NextResponse } from "next/server";
import { serialize } from "cookie";

export async function GET() {
  // Forcefully clear the token cookie
  const cookie = serialize("token", "", {
    httpOnly: true,
    secure: false, // In development, set to false
    // secure: process.env.NODE_ENV === "production", // In production, set to true
    sameSite: "lax",
    path: "/",
    expires: new Date(0), // Expire immediately
  });

  return new NextResponse("Logout successful", {
    status: 200,
    headers: { "Set-Cookie": cookie },
  });
}
