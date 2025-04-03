import pool from "./db";

export async function getUserByUsername(username) {
  const [rows] = await pool.query("SELECT * FROM users WHERE username = ?", [
    username,
  ]);
  return rows[0]; // Return user object (or undefined if not found)
}
