import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET;

export async function GET(req) {
  try {
    const token = req.cookies.get("token")?.value; // Ensure cookies API works

    if (!token) {
      return new Response(JSON.stringify({ isAuthenticated: false }), {
        status: 200,
      });
    }

    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(JWT_SECRET)
    );

    return new Response(
      JSON.stringify({ isAuthenticated: true, role: payload.role }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error verifying JWT:", error);
    return new Response(JSON.stringify({ isAuthenticated: false }), {
      status: 200,
    });
  }
}
