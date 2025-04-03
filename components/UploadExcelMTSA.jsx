import React, { useState, useCallback } from "react";
import * as XLSX from "xlsx";
import { useDropzone } from "react-dropzone";
import { addUniqueId } from "@/util/functions";

const headerMap = {
  "Player Last Name": "last_name",
  "Player First Name": "first_name",
  "Street Address": "address",
  "Player Birth Date": "dob",
  Gender: "gender",
  City: "city",
  State: "state",
  "Postal Code": "zip",
  Cellphone: "phone",
  "User Email": "email",
};
const headerMapMtsa = {
  Unit: "unit",
  "Other Phone": "other_phone",
  "Order Date": "order_date",
  "Order No": "order_no",
  "Order Detail Description": "order_detail_description",
  "OrderItem Amount": "order_item_amount",
  "OrderItem Amount Paid": "order_item_amount_paid",
  "OrderItem Balance": "order_item_balance",
  "Order Payment Status": "order_payment_status",
  "Division Name": "division_name",
  "Team Name": "team_name",
  "Program Name": "program_name",
};

function UploadExcelMTSA({
  existingPlayers,
  mtsaPlayers,
  season,
  divisions,
  teams,
  league,
  createRecord,
  updateRecord,
  deleteRecord,
}) {
  const createPlayers = (newPlayer) =>
    createRecord("/api/players", newPlayer, "setPlayers");
  const updatePlayers = (updatedPlayers) =>
    updateRecord("/api/players", updatedPlayers, "setPlayers");

  const createMtsaPlayers = (newMtsaPlayer) =>
    createRecord("/api/mtsaPlayers", newMtsaPlayer, "setMtsaPlayers");
  const updateMtsaPlayers = (updatedMtsaPlayers) =>
    updateRecord("/api/mtsaPlayers", updatedMtsaPlayers, "setMtsaPlayers");

  const [data, setData] = useState([]);

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      const arrayBuffer = e.target.result;
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      // Function to find the header row
      const findHeaderRow = (rows) => {
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          if (row.some((header) => headerMap[header])) {
            return i;
          }
        }
        return -1; // Return -1 if no header row is found
      };

      const headerRowIndex = findHeaderRow(jsonData);

      if (headerRowIndex !== -1) {
        const retrievedHeaders = jsonData[headerRowIndex];
        const rows = jsonData.slice(headerRowIndex + 1);

        const mappedData = rows.map((row) => {
          const playerData = {};
          const mtsaData = {};

          retrievedHeaders.forEach((header, index) => {
            if (headerMap[header]) {
              playerData[headerMap[header]] = row[index];
            } else if (headerMapMtsa[header]) {
              mtsaData[headerMapMtsa[header]] = row[index];
            }
          });

          return { ...addUniqueId(playerData), mtsa: mtsaData };
        });
        setData(mappedData);
      }
    };

    reader.readAsArrayBuffer(file);
  }, []);

  const findUpdatedFields = () => {
    return data.reduce((acc, player) => {
      const { mtsa, ...newPlayer } = player;
      existingPlayers.forEach((existingPlayer) => {
        if (existingPlayer.unique_id === newPlayer.unique_id) {
          const updatedFields = {};

          Object.keys(newPlayer).forEach((key) => {
            if (newPlayer[key] !== existingPlayer[key]) {
              updatedFields[key] = newPlayer[key];
            }
          });

          if (Object.keys(updatedFields).length) {
            acc.push({ id: existingPlayer.id, ...updatedFields });
          }
        }
      });

      return acc;
    }, []);
  };

  const handleSubmit = async () => {
    const newPlayers = data
      .filter(
        (uploaded) =>
          !existingPlayers.some(
            (existing) => existing.unique_id === uploaded.unique_id
          )
      )
      .filter((obj) => obj.first_name?.length > 0)
      .map((player) => {
        const { unique_id, ...rest } = player;
        return rest;
      });

    const allPlayers = [...existingPlayers]; // Start with existing players

    // 1. Create new players and update allPlayers list
    if (newPlayers.length > 0) {
      const cleanedPlayers = newPlayers.map(({ mtsa, ...rest }) => rest);
      const savedPlayers = await createPlayers(cleanedPlayers);
      allPlayers.push(...savedPlayers); // Add newly created players to allPlayers list
    }

    const newMtsaEntries = data
      .map((player) => {
        const matchedPlayer = existingPlayers.find(
          (p) => p.unique_id === player.unique_id
        );
        if (!matchedPlayer) return null;

        const division = divisions.find(
          (d) => d.mtsa_name === player.mtsa.division_name.trim()
        );
        // const season = seasons.find(
        //   (s) => s.mtsa_name === player.mtsa.program_name.trim()
        // );
        const team = teams.find((t) => t.name === player.mtsa.team_name.trim());

        if (!division || !season || !team) return null; // Skip if any mapping fails

        const newEntry = {
          ...player.mtsa,
          player_id: matchedPlayer.id,
          division_id: division.id,
          season_id: season.id,
          team_id: team.id,
        };

        // Remove the unnecessary fields
        delete newEntry.division_name;
        delete newEntry.program_name;
        delete newEntry.team_name;

        return newEntry;
      })
      .filter((entry) => {
        if (!entry) return false; // Remove null values
        // Check if an entry with the same player_id, season_id, team_id, and division_id already exists
        return !mtsaPlayers.some(
          (existing) =>
            existing.player_id === entry.player_id &&
            existing.season_id === entry.season_id &&
            existing.team_id === entry.team_id &&
            existing.division_id === entry.division_id
        );
      });

    if (newMtsaEntries.length > 0) {
      await createMtsaPlayers(newMtsaEntries);
    }

    const updatedPlayers = findUpdatedFields();
    if (updatedPlayers.length) updatePlayers(updatedPlayers);
    setAcceptedFiles([]);
  };

  const { getRootProps, getInputProps, isDragActive, setAcceptedFiles } =
    useDropzone({
      onDrop,
    });

  return (
    <div>
      <div
        {...getRootProps()}
        style={{
          border: "2px dashed #ccc",
          padding: "20px",
          textAlign: "center",
        }}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the files here ...</p>
        ) : (
          <p>Drag 'n' drop some MTSA files here, or click to select files</p>
        )}
      </div>

      {data.length > 0 && (
        <div>
          <h2>MTSA Register:</h2>

          <button onClick={handleSubmit}>Submit to Server</button>
        </div>
      )}
    </div>
  );
}

export default UploadExcelMTSA;
