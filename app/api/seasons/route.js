import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function POST(req) {
  try {
    const newRecord = await req.json();

    if (!newRecord || typeof newRecord !== "object") {
      return NextResponse.json(
        { error: "Invalid data format. Record object is required." },
        { status: 400 }
      );
    }

    // Handle single record creation
    const fields = Object.keys(newRecord).join(", ");
    const placeholders = Object.keys(newRecord)
      .map(() => "?")
      .join(", ");
    const values = Object.values(newRecord);

    const query = `INSERT INTO seasons (${fields}) VALUES (${placeholders})`;
    const [result] = await pool.execute(query, values);

    // Fetch the created record to return it
    const [createdRecord] = await pool.execute(
      `SELECT * FROM seasons WHERE id = ?`,
      [result.insertId]
    );

    return NextResponse.json({
      message: "Season created successfully.",
      data: createdRecord[0],
      id: result.insertId,
    });
  } catch (error) {
    console.error("Error creating season:", error);
    return NextResponse.json(
      { error: "Failed to create season." },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    console.log("Fetching seasons from database...");

    // Use execute instead of query for consistency
    const [rows] = await pool.execute("SELECT * FROM seasons_view");

    console.log("Seasons fetched:", rows?.length || 0);

    // Add some debugging
    if (!rows || rows.length === 0) {
      console.log("No seasons found in database");
      // Check if table exists and has data
      const [tableCheck] = await pool.execute("SHOW TABLES LIKE 'seasons'");
      console.log("Table exists:", tableCheck.length > 0);

      if (tableCheck.length > 0) {
        const [count] = await pool.execute(
          "SELECT COUNT(*) as count FROM seasons"
        );
        console.log("Total seasons in table:", count[0]?.count || 0);
      }
    }

    return NextResponse.json({
      data: rows || [],
      count: rows?.length || 0,
    });
  } catch (error) {
    console.error("Error fetching seasons:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
      sql: error.sql,
    });

    return NextResponse.json(
      {
        error: "Failed to fetch seasons",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req) {
  try {
    const requestBody = await req.json();

    // Check if it's a batch update (has records array) or single update
    if (requestBody.records && Array.isArray(requestBody.records)) {
      // Handle batch update (existing logic)
      const { records } = requestBody;
      console.log("Batch update:", records);

      if (records.length === 0) {
        return NextResponse.json(
          { error: "Invalid request. Expected an array of records." },
          { status: 400 }
        );
      }

      const updatedRecords = [];

      for (const record of records) {
        const { id, ...data } = record;

        if (!id || typeof id !== "number") {
          throw new Error("Each record must have a valid numeric 'id'");
        }

        // Remove empty/undefined values
        const cleanData = Object.fromEntries(
          Object.entries(data).filter(
            ([_, value]) => value !== undefined && value !== null
          )
        );

        if (Object.keys(cleanData).length === 0) {
          continue; // Skip if no data to update
        }

        const fields = Object.keys(cleanData)
          .map((field) => `${field} = ?`)
          .join(", ");
        const values = [...Object.values(cleanData), id];

        const query = `UPDATE seasons SET ${fields} WHERE id = ?`;
        await pool.execute(query, values);

        // Fetch updated record
        const [updatedRecord] = await pool.execute(
          `SELECT * FROM seasons WHERE id = ?`,
          [id]
        );

        if (updatedRecord[0]) {
          updatedRecords.push(updatedRecord[0]);
        }
      }

      return NextResponse.json({ updatedRecords });
    } else {
      // Handle single record update
      const { id, ...data } = requestBody;

      if (!id || typeof id !== "number") {
        return NextResponse.json(
          { error: "Invalid data format. Valid 'id' is required." },
          { status: 400 }
        );
      }

      // Remove empty/undefined values
      const cleanData = Object.fromEntries(
        Object.entries(data).filter(
          ([_, value]) => value !== undefined && value !== null
        )
      );

      if (Object.keys(cleanData).length === 0) {
        return NextResponse.json(
          { error: "No data to update." },
          { status: 400 }
        );
      }

      // Check if record exists
      const [existing] = await pool.execute(
        "SELECT id FROM seasons WHERE id = ?",
        [id]
      );

      if (existing.length === 0) {
        return NextResponse.json(
          { error: "Season not found." },
          { status: 404 }
        );
      }

      const fields = Object.keys(cleanData)
        .map((field) => `${field} = ?`)
        .join(", ");
      const values = [...Object.values(cleanData), id];

      const query = `UPDATE seasons SET ${fields} WHERE id = ?`;
      await pool.execute(query, values);

      // Fetch updated record
      const [updatedRecord] = await pool.execute(
        `SELECT * FROM seasons WHERE id = ?`,
        [id]
      );

      return NextResponse.json({
        message: "Season updated successfully.",
        data: updatedRecord[0],
      });
    }
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
    const id = searchParams.get("id");

    if (!id || isNaN(Number(id))) {
      return NextResponse.json(
        { error: "Invalid data format. Valid 'id' is required." },
        { status: 400 }
      );
    }

    const numericId = Number(id);

    // Check if record exists before deleting
    const [existing] = await pool.execute(
      "SELECT id FROM seasons WHERE id = ?",
      [numericId]
    );

    if (existing.length === 0) {
      return NextResponse.json({ error: "Season not found." }, { status: 404 });
    }

    const query = `DELETE FROM seasons WHERE id = ?`;
    await pool.execute(query, [numericId]);

    return NextResponse.json({
      message: "Season data deleted successfully.",
      deletedId: numericId,
    });
  } catch (error) {
    console.error("Error deleting season data:", error);
    return NextResponse.json(
      { error: "Failed to delete season data." },
      { status: 500 }
    );
  }
}
