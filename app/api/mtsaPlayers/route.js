import { NextResponse } from "next/server";
import pool from "@/lib/db"; // Assuming pool is your MySQL connection

export async function POST(req) {
  try {
    const data = await req.json();
    const players = Array.isArray(data) ? data : [data];

    if (!players || !Array.isArray(players) || players.length === 0) {
      return NextResponse.json(
        { error: "Invalid data format. 'players' array is required." },
        { status: 400 }
      );
    }

    // Validate required fields
    const requiredFields = ["player_id", "division_id", "team_id", "season_id"];
    for (const player of players) {
      for (const field of requiredFields) {
        if (!player[field]) {
          return NextResponse.json(
            { error: `Missing required field: ${field}` },
            { status: 400 }
          );
        }
      }
    }

    let insertedPlayers = [];

    if (players.length === 1) {
      // Single insert - return the created record with ID
      const player = players[0];
      const fields = Object.keys(player).join(", ");
      const placeholders = Object.keys(player)
        .map(() => "?")
        .join(", ");
      const values = Object.values(player);

      const query = `INSERT INTO mtsa_players (${fields}) VALUES (${placeholders})`;
      const [result] = await pool.query(query, values);

      // Fetch the created record
      const [createdRecord] = await pool.query(
        "SELECT * FROM mtsa_players WHERE id = ?",
        [result.insertId]
      );

      return NextResponse.json({
        message: "MTSA player created successfully.",
        data: createdRecord[0],
        insertedCount: 1,
      });
    } else {
      // Bulk insert with transaction for data consistency
      const connection = await pool.getConnection();

      try {
        await connection.beginTransaction();

        const fields = Object.keys(players[0]).join(", ");
        const values = players.map((player) => Object.values(player));

        const query = `INSERT INTO mtsa_players (${fields}) VALUES ?`;
        const [result] = await connection.query(query, [values]);

        // Get the inserted records by ID range
        // This works because MySQL auto-increment IDs are sequential
        const startId = result.insertId;
        const endId = startId + result.affectedRows - 1;

        const [insertedRecords] = await connection.query(
          "SELECT * FROM mtsa_players WHERE id BETWEEN ? AND ? ORDER BY id",
          [startId, endId]
        );

        await connection.commit();

        return NextResponse.json({
          message: "MTSA players created successfully.",
          data: insertedRecords,
          insertedCount: result.affectedRows,
          firstInsertId: result.insertId,
        });
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    }
  } catch (error) {
    console.error("Error inserting MTSA players data:", error);

    // Handle specific database errors
    if (error.code === "ER_DUP_ENTRY") {
      return NextResponse.json(
        { error: "Duplicate MTSA player registration detected." },
        { status: 409 }
      );
    }

    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      return NextResponse.json(
        { error: "Invalid reference to player, division, team, or season." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to insert MTSA players data." },
      { status: 500 }
    );
  }
}
export async function GET(req) {
  try {
    const [rows] = await pool.query("SELECT * FROM mtsa_players_view");

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

      const query = `UPDATE mtsa_players SET ${fields} WHERE id = ?`;
      await pool.query(query, values);

      // Fetch and store updated record
      const [updatedRecord] = await pool.query(
        `SELECT * FROM mtsa_players WHERE id = ?`,
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

    const query = `DELETE FROM mtsa_players WHERE id = ?`;
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
