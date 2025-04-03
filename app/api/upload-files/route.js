import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import * as ftp from "basic-ftp"; // Correct import

// import dotenv from "dotenv";
// dotenv.config();

async function uploadToHostinger(filePath, fileName) {
  const client = new ftp.Client(); // Properly initialize the client
  client.ftp.verbose = true; // Optional for logging FTP actions

  try {
    await client.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASS,
      secure: true, // FTPS
      rejectUnauthorized: false, // Allow insecure certificate verification
    });

    console.log(`Uploading ${fileName} to ${filePath}`);
    await client.uploadFrom(filePath, fileName); // Upload the file to Hostinger
  } catch (err) {
    console.error("FTP upload error:", err);
    throw new Error("FTP upload failed"); // Handle the error appropriately
  } finally {
    client.close(); // Ensure the client disconnects
  }
}

export async function POST(req) {
  try {
    // Parse FormData from the request object
    const formData = await req.formData();
    const file1 = formData.get("file1"); // Matches 'file' field in FileUploadPage.jsx
    const file2 = formData.get("file2"); // Matches 'file' field in FileUploadPage.jsx

    if (!file1 || !file2) {
      return NextResponse.json(
        { message: "No file uploaded" },
        { status: 400 }
      );
    }

    // Create a temporary directory for file storage
    const uploadDir = path.join(process.cwd(), "/public_html/uploads-MTSA");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Save the uploaded file to the temporary directory
    const tempFilePath = path.join(uploadDir, file1.name);
    const buffer = Buffer.from(await file1.arrayBuffer());
    fs.writeFileSync(tempFilePath, buffer);

    console.log(`File saved locally: ${tempFilePath}`);

    // Upload to Hostinger FTP
    await uploadToHostinger(tempFilePath, file1.name);
    await uploadToHostinger(tempFilePath, file2.name);

    return NextResponse.json({
      message: "File uploaded to Hostinger successfully",
    });
  } catch (error) {
    console.error("File upload error:", error);
    return NextResponse.json(
      { message: "Error uploading file" },
      { status: 500 }
    );
  }
}
