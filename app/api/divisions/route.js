import { NextResponse } from "next/server";
import pool from "@/lib/db"; // Assuming pool is your MySQL connection

export async function POST(req) {
  try {
    // Parse JSON data from the request body
    const divisions = await req.json();
    // Validate that "divisions" is an array of objects
    if (!divisions || !Array.isArray(divisions) || divisions.length === 0) {
      return NextResponse.json(
        { error: "Invalid data format. 'divisions' array is required." },
        { status: 400 }
      );
    }
    // Prepare dynamic MySQL query for inserting the data
    const fields = Object.keys(divisions[0]).join(", "); // "name, age, team"
    const placeholders = divisions.map(() => "(?)").join(", "); // "(?), (?)"
    const values = divisions.map((division) => Object.values(division)); // [[John's values], [Jane's values]]

    const query = `INSERT INTO divisions (${fields}) VALUES ?`;
    await pool.query(query, [values]); // ✅ Bulk insert
    // Respond with success
    return NextResponse.json({
      message: "Divisions data inserted successfully.",
    });
  } catch (error) {
    console.error("Error inserting divisions data:", error);
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
      { error: "Failed to fetch All  divisions" },
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

      const query = `UPDATE divisions SET ${fields} WHERE id = ?`;
      await pool.query(query, values);

      // Fetch and store updated record
      const [updatedRecord] = await pool.query(
        `SELECT * FROM divisions WHERE id = ?`,
        [id]
      );
      updatedRecords.push(updatedRecord[0]); // Assuming MySQL returns an array
    });

    await Promise.all(updatePromises);

    return NextResponse.json({ updatedRecords });
  } catch (error) {
    console.error("Error updating division data:", error);
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

    const query = `DELETE FROM divisions WHERE id = ?`;
    await pool.query(query, [id]);

    return NextResponse.json({
      message: "Division data deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting division data:", error);
    return NextResponse.json(
      { error: "Failed to delete division data." },
      { status: 500 }
    );
  }
}
