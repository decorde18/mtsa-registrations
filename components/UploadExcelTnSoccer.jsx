import React, { useState, useCallback } from "react";
import * as XLSX from "xlsx";
import { useDropzone } from "react-dropzone";
import { addUniqueId, convertExcelDateTimeToMySQL } from "@/util/functions";
import { useCrud } from "@/hooks/useCrud";
import toast, { Toaster } from "react-hot-toast";

const headerMap = {
  PlayerID: "player_id",
  "Last Name": "last_name",
  "First Name": "first_name",
  DOB: "dob",
  Gender: "gender",
  Address: "address",
  City: "city",
  State: "state",
  Zip: "zip",
  "Home Ph#": "phone",
  email: "email",
};

const headerMapTnsoccer = {
  "Play Type": "play_type",
  TeamID: "team_id",
  Age: "age",
  "Play Level": "play_level",
  "Team Name": "team_name",
};

function UploadExcelTnSoccer({ existingPlayers, tnPlayers, season }) {
  const { create: createPlayers, update: updatePlayers } = useCrud("players");
  const { create: createTnSoccerPlayers } = useCrud("tnsoccerPlayerSeasons");

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
        row.some((header) => headerMap[header] || headerMapTnsoccer[header])
      );

      if (headerIndex === -1) return;

      const headers = jsonData[headerIndex];
      const rows = jsonData.slice(headerIndex + 1);
      const data = [];

      for (const row of rows) {
        const player = {};
        const tnSoccer = {};
        if (row.length < 5) continue;
        headers.forEach((header, idx) => {
          if (headerMap[header]) player[headerMap[header]] = row[idx];
          if (headerMapTnsoccer[header])
            tnSoccer[headerMapTnsoccer[header]] = row[idx];
        });
        data.push({ ...addUniqueId(player), tnSoccer });
      }

      setUploads(data);
    };

    reader.readAsArrayBuffer(file);
  }, []);

  const findUpdatedPlayerIds = () => {
    return uploads.reduce((acc, newPlayer) => {
      const existingPlayer = existingPlayers.find(
        (ep) => ep.unique_id === newPlayer.unique_id
      );

      if (!existingPlayer.player_id) {
        acc.push({ id: existingPlayer.id, player_id: newPlayer.player_id });
      }
      return acc;
    }, []);
  };

  const handleSubmit = async () => {
    const uniqueIds = new Set();
    const newPlayers = [];

    for (const { tnSoccer, ...player } of uploads) {
      if (!player.first_name) continue;
      if (!uniqueIds.has(player.unique_id)) {
        uniqueIds.add(player.unique_id);
        const exists = existingPlayers.some(
          (p) => p.unique_id === player.unique_id
        );
        if (!exists) {
          newPlayers.push(player);
        }
      }
    }

    if (newPlayers.length > 0) {
      await createPlayers(newPlayers);
      toast.success(`${newPlayers.length} new player(s) added`);
    }

    const updates = findUpdatedPlayerIds();
    if (updates.length > 0) {
      await updatePlayers(updates);
      toast.success(`${updates.length} player(s) updated`);
    }

    const newTnSoccer = uploads
      .map(({ tnSoccer, unique_id }) => {
        const matchedPlayer = existingPlayers.find(
          (p) => p.unique_id === unique_id
        );
        if (!matchedPlayer || !season) return null;

        const alreadyExists = tnPlayers.some(
          (tp) =>
            tp.player_id === matchedPlayer.id && tp.season_id === season.id
        );

        if (alreadyExists) return null;

        return {
          ...tnSoccer,
          player_id: matchedPlayer.id,
          season_id: season.id,
        };
      })
      .filter(Boolean);

    if (newTnSoccer.length > 0) {
      await createTnSoccerPlayers(newTnSoccer);
      toast.success(`${newTnSoccer.length} TN Soccer entries added`);
    } else {
      toast("No new TN Soccer entries (already exist or mapping failed)");
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
            ? "Drop the TN Soccer file here..."
            : "Drag 'n' drop TN Soccer Excel file here or click to select"}
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

export default UploadExcelTnSoccer;
