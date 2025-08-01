import { NextResponse } from "next/server";
import pool from "@/lib/db"; // Assuming pool is your MySQL connection

export async function POST(req) {
  try {
    const data = await req.json();

    // Normalize input to always be an array
    const players = Array.isArray(data) ? data : [data];

    // Validate the array
    if (players.length === 0 || typeof players[0] !== "object") {
      return NextResponse.json(
        {
          error: "Invalid data format. Must be an object or array of objects.",
        },
        { status: 400 }
      );
    }

    const fields = Object.keys(players[0]).join(", ");
    const placeholders = players.map(() => "(?)").join(", ");
    const values = players.map((player) => Object.values(player));

    const query = `INSERT INTO tnsoccer_player_seasons (${fields}) VALUES ?`;
    await pool.query(query, [values]);

    return NextResponse.json({
      message: "Players data inserted successfully.",
    });
  } catch (error) {
    console.error("Error inserting players data:", error);
    return NextResponse.json(
      { error: "Failed to insert players data." },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM tnsoccer_player_seasons_view"
    );

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("Error fetching All players:", error);
    return NextResponse.json(
      { error: "Failed to fetch All  players" },
      { status: 500 }
    );
  }
}

export async function PATCH(req) {
  try {
    const { records } = await req.json();

    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json(
        { error: "Invalid request. Expected an array of records." },
        { status: 400 }
      );
    }

    // Store updated records to return
    const updatedRecords = [];

    const updatePromises = records.map(async (record) => {
      const { id, ...data } = record;

      if (!id || typeof id !== "number") {
        throw new Error("Each record must have a valid numeric 'id'");
      }

      const fields = Object.keys(data)
        .map((field) => `${field} = COALESCE(?, ${field})`)
        .join(", ");
      const values = [...Object.values(data), id];

      const query = `UPDATE tnsoccer_player_seasons SET ${fields} WHERE id = ?`;
      await pool.query(query, values);

      // Fetch and store updated record
      const [updatedRecord] = await pool.query(
        `SELECT * FROM tnsoccer_player_seasons WHERE id = ?`,
        [id]
      );
      updatedRecords.push(updatedRecord[0]); // Assuming MySQL returns an array
    });

    await Promise.all(updatePromises);

    return NextResponse.json({ updatedRecords });
  } catch (error) {
    console.error("Error updating player data:", error);
    return NextResponse.json(
      { error: "Failed to update records." },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get("id"));

    if (!id) {
      return NextResponse.json(
        { error: "Invalid data format. 'id' is required." },
        { status: 400 }
      );
    }

    const query = `DELETE FROM tnsoccer_player_seasons WHERE id = ?`;
    await pool.query(query, [id]);

    return NextResponse.json({ message: "Player data deleted successfully." });
  } catch (error) {
    console.error("Error deleting player data:", error);
    return NextResponse.json(
      { error: "Failed to delete player data." },
      { status: 500 }
    );
  }
}
