import { NextResponse } from "next/server";
import pool from "@/lib/db";

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

    // Validate that all players have required fields
    const requiredFields = ["first_name", "last_name"];
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

      const query = `INSERT INTO players (${fields}) VALUES (${placeholders})`;
      const [result] = await pool.query(query, values);

      // Fetch the created record
      const [createdRecord] = await pool.query(
        "SELECT * FROM players WHERE id = ?",
        [result.insertId]
      );

      insertedPlayers = createdRecord;

      return NextResponse.json({
        message: "Player created successfully.",
        data: createdRecord[0],
        insertedCount: 1,
      });
    } else {
      // Bulk insert
      const fields = Object.keys(players[0]).join(", ");
      const values = players.map((player) => Object.values(player));

      const query = `INSERT INTO players (${fields}) VALUES ?`;
      const [result] = await pool.query(query, [values]);

      // For bulk inserts, we can't easily return all created records
      // since MySQL doesn't return them directly. We'd need to either:
      // 1. Fetch by a range of IDs (if we know the starting insertId)
      // 2. Use a different approach like INSERT...SELECT with a temp table
      // 3. Accept that we don't return the full records for bulk inserts

      return NextResponse.json({
        message: "Players created successfully.",
        insertedCount: result.affectedRows,
        firstInsertId: result.insertId,
        // Note: For full record data in bulk inserts, you'd need to modify this
        // to fetch the records by ID range or implement a different strategy
      });
    }
  } catch (error) {
    console.error("Error inserting players data:", error);

    // Handle duplicate key errors more gracefully
    if (error.code === "ER_DUP_ENTRY") {
      return NextResponse.json(
        { error: "Duplicate entry detected. Player may already exist." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to insert players data." },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    const [rows] = await pool.query("SELECT * FROM players_view");
    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("Error fetching All players:", error);
    return NextResponse.json(
      { error: "Failed to fetch All players" },
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

    const updatedRecords = [];
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      for (const record of records) {
        const { id, ...data } = record;

        if (!id || typeof id !== "number") {
          throw new Error("Each record must have a valid numeric 'id'");
        }

        // Filter out null/undefined values to avoid unnecessary updates
        const filteredData = Object.fromEntries(
          Object.entries(data).filter(
            ([_, value]) => value !== null && value !== undefined
          )
        );

        if (Object.keys(filteredData).length === 0) {
          continue; // Skip if no valid fields to update
        }

        const fields = Object.keys(filteredData)
          .map((field) => `${field} = ?`)
          .join(", ");
        const values = [...Object.values(filteredData), id];

        const query = `UPDATE players SET ${fields} WHERE id = ?`;
        await connection.query(query, values);

        // Fetch updated record
        const [updatedRecord] = await connection.query(
          `SELECT * FROM players WHERE id = ?`,
          [id]
        );
        if (updatedRecord[0]) {
          updatedRecords.push(updatedRecord[0]);
        }
      }

      await connection.commit();

      return NextResponse.json({
        updatedRecords,
        updatedCount: updatedRecords.length,
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error updating player data:", error);
    return NextResponse.json(
      { error: "Failed to update records: " + error.message },
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

    const query = `DELETE FROM players WHERE id = ?`;
    const [result] = await pool.query(query, [id]);

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "Player not found." }, { status: 404 });
    }

    return NextResponse.json({
      message: "Player data deleted successfully.",
      deletedId: id,
    });
  } catch (error) {
    console.error("Error deleting player data:", error);
    return NextResponse.json(
      { error: "Failed to delete player data." },
      { status: 500 }
    );
  }
}
