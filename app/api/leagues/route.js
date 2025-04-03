import { NextResponse } from "next/server";
import pool from "@/lib/db"; // Assuming pool is your MySQL connection

export async function POST(req) {
  try {
    // Parse JSON data from the request body
    const leagues = await req.json();
    // Validate that "leagues" is an array of objects
    if (!leagues || !Array.isArray(leagues) || leagues.length === 0) {
      return NextResponse.json(
        { error: "Invalid data format. 'leagues' array is required." },
        { status: 400 }
      );
    }
    // Prepare dynamic MySQL query for inserting the data
    const fields = Object.keys(leagues[0]).join(", "); // "name, age, league"
    const placeholders = leagues.map(() => "(?)").join(", "); // "(?), (?)"
    const values = leagues.map((league) => Object.values(league)); // [[John's values], [Jane's values]]

    const query = `INSERT INTO leagues (${fields}) VALUES ?`;
    await pool.query(query, [values]); // ✅ Bulk insert
    // Respond with success
    return NextResponse.json({
      message: "Leagues data inserted successfully.",
    });
  } catch (error) {
    console.error("Error inserting leagues data:", error);
    return NextResponse.json(
      { error: "Failed to insert leagues data." },
      { status: 500 }
    );
  }
}
export async function GET(req) {
  try {
    const [rows] = await pool.query("SELECT * FROM leagues");

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("Error fetching All leagues:", error);
    return NextResponse.json(
      { error: "Failed to fetch All  leagues" },
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

      const query = `UPDATE leagues SET ${fields} WHERE id = ?`;
      await pool.query(query, values);

      // Fetch and store updated record
      const [updatedRecord] = await pool.query(
        `SELECT * FROM leagues WHERE id = ?`,
        [id]
      );
      updatedRecords.push(updatedRecord[0]); // Assuming MySQL returns an array
    });

    await Promise.all(updatePromises);

    return NextResponse.json({ updatedRecords });
  } catch (error) {
    console.error("Error updating league data:", error);
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

    const query = `DELETE FROM leagues WHERE id = ?`;
    await pool.query(query, [id]);

    return NextResponse.json({ message: "League data deleted successfully." });
  } catch (error) {
    console.error("Error deleting league data:", error);
    return NextResponse.json(
      { error: "Failed to delete league data." },
      { status: 500 }
    );
  }
}
