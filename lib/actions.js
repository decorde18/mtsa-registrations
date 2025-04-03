"use server";

import pool from "@/lib/db";

export async function getTeams() {
  const [rows] = await pool.execute("SELECT * FROM team_division_view");
  return rows;
}
export async function getPlayers(team, division) {
  try {
    const [rows] = await pool.execute(
      "SELECT * FROM player_team_view WHERE team_id = ? AND division_id = ?",
      [team, division]
    );

    return rows;
  } catch (error) {
    console.error("Error fetching players:", error);
    return []; // Example: return an empty array on error
  }
}
