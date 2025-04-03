import { getUserByUsername } from "@/lib/userService";
import jwt from "jsonwebtoken";

export async function GET(req) {
  const token = req.headers.get("Authorization")?.split(" ")[1];
  const JWT_SECRET = process.env.JWT_SECRET;

  if (!token) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await getUserByUsername(decoded.username);

    if (user) {
      return new Response(JSON.stringify({ user }), { status: 200 });
    } else {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: "Invalid token" }), {
      status: 401,
    });
  }
}
