import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function POST(req) {
  try {
    const data = await req.json();
    const teams = Array.isArray(data) ? data : [data];

    if (!teams || !Array.isArray(teams) || teams.length === 0) {
      return NextResponse.json(
        { error: "Invalid data format. 'teams' array is required." },
        { status: 400 }
      );
    }

    // Validate required fields
    const requiredFields = ["mtsa_name"];
    for (const team of teams) {
      for (const field of requiredFields) {
        if (!team[field]) {
          return NextResponse.json(
            { error: `Missing required field: ${field}` },
            { status: 400 }
          );
        }
      }
    }

    let insertedTeams = [];

    if (teams.length === 1) {
      // Single insert - return the created record with ID
      const team = teams[0];
      const fields = Object.keys(team).join(", ");
      const placeholders = Object.keys(team)
        .map(() => "?")
        .join(", ");
      const values = Object.values(team);

      const query = `INSERT INTO teams (${fields}) VALUES (${placeholders})`;
      const [result] = await pool.query(query, values);

      // Fetch the created record
      const [createdRecord] = await pool.query(
        "SELECT * FROM teams WHERE id = ?",
        [result.insertId]
      );

      return NextResponse.json({
        message: "Team created successfully.",
        data: createdRecord[0],
        insertedCount: 1,
      });
    } else {
      // Bulk insert with a more sophisticated approach for getting IDs
      const connection = await pool.getConnection();

      try {
        await connection.beginTransaction();

        const fields = Object.keys(teams[0]).join(", ");
        const values = teams.map((team) => Object.values(team));

        const query = `INSERT INTO teams (${fields}) VALUES ?`;
        const [result] = await connection.query(query, [values]);

        // Get the inserted records by ID range
        // This works because MySQL auto-increment IDs are sequential
        const startId = result.insertId;
        const endId = startId + result.affectedRows - 1;

        const [insertedRecords] = await connection.query(
          "SELECT * FROM teams WHERE id BETWEEN ? AND ? ORDER BY id",
          [startId, endId]
        );

        await connection.commit();

        return NextResponse.json({
          message: "Teams created successfully.",
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
    console.error("Error inserting teams data:", error);

    // Handle duplicate key errors more gracefully
    if (error.code === "ER_DUP_ENTRY") {
      return NextResponse.json(
        { error: "Duplicate team detected. Team may already exist." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to insert teams data." },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    const [rows] = await pool.query("SELECT * FROM teams");
    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("Error fetching All teams:", error);
    return NextResponse.json(
      { error: "Failed to fetch All teams" },
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

        // Filter out null/undefined values
        const filteredData = Object.fromEntries(
          Object.entries(data).filter(
            ([_, value]) => value !== null && value !== undefined
          )
        );

        if (Object.keys(filteredData).length === 0) {
          continue;
        }

        const fields = Object.keys(filteredData)
          .map((field) => `${field} = ?`)
          .join(", ");
        const values = [...Object.values(filteredData), id];

        const query = `UPDATE teams SET ${fields} WHERE id = ?`;
        await connection.query(query, values);

        // Fetch updated record
        const [updatedRecord] = await connection.query(
          `SELECT * FROM teams WHERE id = ?`,
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
    console.error("Error updating team data:", error);
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

    const query = `DELETE FROM teams WHERE id = ?`;
    const [result] = await pool.query(query, [id]);

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "Team not found." }, { status: 404 });
    }

    return NextResponse.json({
      message: "Team data deleted successfully.",
      deletedId: id,
    });
  } catch (error) {
    console.error("Error deleting team data:", error);
    return NextResponse.json(
      { error: "Failed to delete team data." },
      { status: 500 }
    );
  }
}
