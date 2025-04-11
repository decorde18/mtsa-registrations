import React, { useState, useCallback } from "react";
import * as XLSX from "xlsx";
import { useDropzone } from "react-dropzone";
import { addUniqueId, convertExcelDateTimeToMySQL } from "@/util/functions";
import { useCrud } from "@/hooks/useCrud";
import toast, { Toaster } from "react-hot-toast";

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
}) {
  const { create: createPlayers, update: updatePlayers } = useCrud("players");
  const { create: createMtsaPlayers } = useCrud("mtsaPlayers");

  const [uploads, setUploads] = useState([]);

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      const workbook = XLSX.read(e.target.result, {
        type: "array",
        cellText: true,
        cellDates: false,
      });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      const headerIndex = jsonData.findIndex((row) =>
        row.some((header) => headerMap[header] || headerMapMtsa[header])
      );

      if (headerIndex === -1) return;

      const headers = jsonData[headerIndex];
      const rows = jsonData.slice(headerIndex + 1);
      const data = [];

      for (const row of rows) {
        const player = {};
        const mtsa = {};

        headers.forEach((header, idx) => {
          if (headerMap[header]) player[headerMap[header]] = row[idx];
          if (headerMapMtsa[header]) mtsa[headerMapMtsa[header]] = row[idx];
        });

        data.push({ ...addUniqueId(player), mtsa });
      }

      setUploads(data);
    };

    reader.readAsArrayBuffer(file);
  }, []);

  const findUpdatedPlayers = (playersToCheck) => {
    return playersToCheck.reduce((updates, { mtsa, ...player }) => {
      const match = existingPlayers.find(
        (p) => p.unique_id === player.unique_id
      );
      if (!match) return updates;

      const changedFields = {};
      Object.keys(player).forEach((key) => {
        if (player[key] !== match[key]) changedFields[key] = player[key];
      });

      if (Object.keys(changedFields).length) {
        updates.push({ id: match.id, ...changedFields });
      }

      return updates;
    }, []);
  };

  const handleSubmit = async () => {
    const uniqueIds = new Set();
    const newPlayers = [];
    const playersToCheck = [];

    for (const { mtsa, ...player } of uploads) {
      if (!player.first_name) continue;
      if (!uniqueIds.has(player.unique_id)) {
        uniqueIds.add(player.unique_id);
        playersToCheck.push({ ...player, mtsa });
        if (!existingPlayers.some((p) => p.unique_id === player.unique_id)) {
          newPlayers.push(player);
        }
      }
    }

    // Add new players
    if (newPlayers.length > 0) {
      await createPlayers(newPlayers);
      toast.success(`${newPlayers.length} player(s) added`);
    }

    // Update existing players
    const updated = findUpdatedPlayers(playersToCheck);
    if (updated.length > 0) {
      await updatePlayers(updated);
      toast.success(`${updated.length} player(s) updated`);
    }

    // Add to MTSA
    let skippedCount = 0;
    let createdCount = 0;
    let attemptedCount = uploads.length;

    const newMtsa = uploads
      .map(({ mtsa, unique_id }) => {
        const player = existingPlayers.find((p) => p.unique_id === unique_id);
        if (!player) {
          skippedCount++;
          return null;
        }

        const division = divisions.find(
          (d) => d.mtsa_name === mtsa.division_name?.trim()
        );
        const team = teams.find((t) => t.name === mtsa.team_name?.trim());
        if (!division || !team || !season) {
          skippedCount++;
          return null;
        }

        const alreadyExists = mtsaPlayers.some(
          (mp) =>
            mp.player_id === player.id &&
            mp.team_id === team.id &&
            mp.division_id === division.id &&
            mp.season_id === season.id
        );
        if (alreadyExists) {
          skippedCount++;
          return null;
        }

        delete mtsa.division_name;
        delete mtsa.program_name;
        delete mtsa.team_name;
        createdCount++;
        return {
          ...mtsa,
          player_id: player.id,
          division_id: division.id,
          team_id: team.id,
          season_id: season.id,
          order_date: convertExcelDateTimeToMySQL(mtsa.order_date),
        };
      })
      .filter(Boolean);

    if (newMtsa.length > 0) {
      await createMtsaPlayers(newMtsa);
      toast(
        `Attempted: ${attemptedCount}, Added: ${createdCount}, Skipped: ${skippedCount}`
      );
    } else {
      toast("No new MTSA entries (already exist or mapping failed)");
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div>
      <Toaster position='top-right' />
      <div
        {...getRootProps()}
        style={{
          border: "2px dashed #ccc",
          padding: 20,
          textAlign: "center",
          marginBottom: 20,
        }}
      >
        <input {...getInputProps()} />
        <p>
          {isDragActive
            ? "Drop the file here..."
            : "Drag 'n' drop MTSA Excel file here or click to select"}
        </p>
      </div>

      {uploads.length > 0 && (
        <div>
          <h2>Preview</h2>
          <button onClick={handleSubmit}>Submit to Server</button>
        </div>
      )}
    </div>
  );
}

export default UploadExcelMTSA;
