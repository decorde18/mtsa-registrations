import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function POST(req) {
  try {
    const data = await req.json();
    const divisions = Array.isArray(data) ? data : [data];

    if (!divisions || !Array.isArray(divisions) || divisions.length === 0) {
      return NextResponse.json(
        { error: "Invalid data format. 'divisions' array is required." },
        { status: 400 }
      );
    }

    // Validate required fields
    const requiredFields = ["mtsa_name"];
    for (const division of divisions) {
      for (const field of requiredFields) {
        if (!division[field]) {
          return NextResponse.json(
            { error: `Missing required field: ${field}` },
            { status: 400 }
          );
        }
      }
    }

    let insertedDivisions = [];

    if (divisions.length === 1) {
      // Single insert - return the created record with ID
      const division = divisions[0];
      const fields = Object.keys(division).join(", ");
      const placeholders = Object.keys(division)
        .map(() => "?")
        .join(", ");
      const values = Object.values(division);

      const query = `INSERT INTO divisions (${fields}) VALUES (${placeholders})`;
      const [result] = await pool.query(query, values);

      // Fetch the created record
      const [createdRecord] = await pool.query(
        "SELECT * FROM divisions WHERE id = ?",
        [result.insertId]
      );

      return NextResponse.json({
        message: "Division created successfully.",
        data: createdRecord[0],
        insertedCount: 1,
      });
    } else {
      // Bulk insert with a more sophisticated approach for getting IDs
      const connection = await pool.getConnection();

      try {
        await connection.beginTransaction();

        const fields = Object.keys(divisions[0]).join(", ");
        const values = divisions.map((division) => Object.values(division));

        const query = `INSERT INTO divisions (${fields}) VALUES ?`;
        const [result] = await connection.query(query, [values]);

        // Get the inserted records by ID range
        // This works because MySQL auto-increment IDs are sequential
        const startId = result.insertId;
        const endId = startId + result.affectedRows - 1;

        const [insertedRecords] = await connection.query(
          "SELECT * FROM divisions WHERE id BETWEEN ? AND ? ORDER BY id",
          [startId, endId]
        );

        await connection.commit();

        return NextResponse.json({
          message: "Divisions created successfully.",
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
    console.error("Error inserting divisions data:", error);

    // Handle duplicate key errors more gracefully
    if (error.code === "ER_DUP_ENTRY") {
      return NextResponse.json(
        { error: "Duplicate division detected. Division may already exist." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to insert divisions data." },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    const [rows] = await pool.query("SELECT * FROM divisions");
    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("Error fetching All divisions:", error);
    return NextResponse.json(
      { error: "Failed to fetch All divisions" },
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

        const query = `UPDATE divisions SET ${fields} WHERE id = ?`;
        await connection.query(query, values);

        // Fetch updated record
        const [updatedRecord] = await connection.query(
          `SELECT * FROM divisions WHERE id = ?`,
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
    console.error("Error updating division data:", error);
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

    const query = `DELETE FROM divisions WHERE id = ?`;
    const [result] = await pool.query(query, [id]);

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: "Division not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Division data deleted successfully.",
      deletedId: id,
    });
  } catch (error) {
    console.error("Error deleting division data:", error);
    return NextResponse.json(
      { error: "Failed to delete division data." },
      { status: 500 }
    );
  }
}
