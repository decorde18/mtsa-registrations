import { NextResponse } from "next/server";
import pool from "@/lib/db"; // Assuming pool is your MySQL connection

export async function GET(req) {
  try {
    const [rows] = await pool.query("SELECT * FROM 	missing_players_view");

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("Error fetching All players:", error);
    return NextResponse.json(
      { error: "Failed to fetch All  players" },
      { status: 500 }
    );
  }
}
