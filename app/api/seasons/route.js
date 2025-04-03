import { NextResponse } from "next/server";
import pool from "@/lib/db"; // Assuming pool is your MySQL connection

export async function POST(req) {
  try {
    // Parse JSON data from the request body
    const seasons = await req.json();
    // Validate that "seasons" is an array of objects
    if (!seasons || !Array.isArray(seasons) || seasons.length === 0) {
      return NextResponse.json(
        { error: "Invalid data format. 'seasons' array is required." },
        { status: 400 }
      );
    }
    // Prepare dynamic MySQL query for inserting the data
    const fields = Object.keys(seasons[0]).join(", "); // "name, age, team"
    const placeholders = seasons.map(() => "(?)").join(", "); // "(?), (?)"
    const values = seasons.map((season) => Object.values(season)); // [[John's values], [Jane's values]]

    const query = `INSERT INTO seasons (${fields}) VALUES ?`;
    await pool.query(query, [values]); // ✅ Bulk insert
    // Respond with success
    return NextResponse.json({
      message: "Seasons data inserted successfully.",
    });
  } catch (error) {
    console.error("Error inserting seasons data:", error);
    return NextResponse.json(
      { error: "Failed to insert seasons data." },
      { status: 500 }
    );
  }
}
export async function GET(req) {
  try {
    const [rows] = await pool.query("SELECT * FROM seasons");

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("Error fetching All seasons:", error);
    return NextResponse.json(
      { error: "Failed to fetch All  seasons" },
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

      const query = `UPDATE seasons SET ${fields} WHERE id = ?`;
      await pool.query(query, values);

      // Fetch and store updated record
      const [updatedRecord] = await pool.query(
        `SELECT * FROM seasons WHERE id = ?`,
        [id]
      );
      updatedRecords.push(updatedRecord[0]); // Assuming MySQL returns an array
    });

    await Promise.all(updatePromises);

    return NextResponse.json({ updatedRecords });
  } catch (error) {
    console.error("Error updating season data:", error);
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

    const query = `DELETE FROM seasons WHERE id = ?`;
    await pool.query(query, [id]);

    return NextResponse.json({ message: "Season data deleted successfully." });
  } catch (error) {
    console.error("Error deleting season data:", error);
    return NextResponse.json(
      { error: "Failed to delete season data." },
      { status: 500 }
    );
  }
}
