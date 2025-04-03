import React, { useState, useCallback, useEffect } from "react";
import * as XLSX from "xlsx";
import { useDropzone } from "react-dropzone";
import { addUniqueId, dateStringToExcelInt } from "@/util/functions";
import ExcelJS from "exceljs";

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

function UploadExcelTnSoccer({
  existingPlayers,
  tnPlayers,
  season,
  league,
  createRecord,
  updateRecord,
  deleteRecord,
}) {
  const createPlayers = (newPlayer) =>
    createRecord("/api/players", newPlayer, "setPlayers");
  const updatePlayers = (updatedPlayers) =>
    updateRecord("/api/players", updatedPlayers, "setPlayers");

  const createTnSoccerPlayers = (newTnSoccerPlayer) =>
    createRecord(
      "/api/tnsoccerPlayers",
      newTnSoccerPlayer,
      "setTnSoccerPlayers"
    );
  const updateTnSoccerPlayers = (updatedTnSoccerPlayers) =>
    updateRecord(
      "/api/tnsoccerPlayers",
      updatedTnSoccerPlayers,
      "setTnSoccerPlayers"
    );

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

      // Find the header row dynamically
      const findHeaderRow = (rows) => {
        for (let i = 0; i < rows.length; i++) {
          if (
            rows[i].some(
              (header) => headerMap[header] || headerMapTnsoccer[header]
            )
          ) {
            return i;
          }
        }
        return -1;
      };

      const headerRowIndex = findHeaderRow(jsonData);
      if (headerRowIndex === -1) return;

      const retrievedHeaders = jsonData[headerRowIndex];
      const rows = jsonData.slice(headerRowIndex + 1);

      const mappedData = rows.map((row) => {
        const playerData = {};
        const tnSoccerData = {};

        retrievedHeaders.forEach((header, index) => {
          if (headerMap[header]) {
            playerData[headerMap[header]] = row[index];
          } else if (headerMapTnsoccer[header]) {
            tnSoccerData[headerMapTnsoccer[header]] = row[index];
          }
        });

        return { ...addUniqueId(playerData), tnSoccer: tnSoccerData };
      });

      setData(mappedData);
    };

    reader.readAsArrayBuffer(file);
  }, []);
  const { getRootProps, getInputProps, isDragActive, setAcceptedFiles } =
    useDropzone({
      onDrop,
    });
  const findUpdatedPlayerIds = () => {
    return data.reduce((acc, newPlayer) => {
      const existingPlayer = existingPlayers.find(
        (ep) => ep.unique_id === newPlayer.unique_id
      );

      if (existingPlayer && !newPlayer.player_id) {
        acc.push({ id: existingPlayer.id, player_id: newPlayer.player_id });
      }

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
      const cleanedPlayers = newPlayers.map(({ key, ...rest }) => rest);
      const savedPlayers = await createPlayers(cleanedPlayers);
      allPlayers.push(...savedPlayers); // Add newly created players to allPlayers list
    }

    // 2. Find missing `tnsoccer_player_seasons` entries
    const missingTnSoccerEntries = data
      .map((player) => {
        const matchedPlayer = allPlayers.find(
          (p) => p.unique_id === player.unique_id
        );
        if (!matchedPlayer) return null;

        // Check if player already exists in tnsoccer_player_seasons
        const isAlreadyInTnSoccer = tnPlayers.some(
          (tn) =>
            tn.player_id === matchedPlayer.id && tn.season_id === season.id
        );

        if (!isAlreadyInTnSoccer) {
          return {
            ...player.tnSoccer,
            player_id: matchedPlayer.id,
            season_id: season.id,
          };
        }

        return null;
      })
      .filter((entry) => entry !== null); // Remove null values
    //2 update previous tnsoccer players any fields that need updating in db

    const updatedPlayers = findUpdatedPlayerIds();
    if (updatedPlayers.length) updatePlayers(updatedPlayers);

    // 3. Add missing `tnsoccer_player_seasons` records
    if (missingTnSoccerEntries.length > 0) {
      await createTnSoccerPlayers(missingTnSoccerEntries);
    }
    setAcceptedFiles([]);
  };

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
          <p>
            Drag 'n' drop some TNSoccer Players files here, or click to select
            files
          </p>
        )}
      </div>

      {data.length > 0 && (
        <div>
          <h2>TNSoccer Players Register:</h2>

          <button onClick={handleSubmit}>Submit to Server</button>
        </div>
      )}
    </div>
  );
}

export default UploadExcelTnSoccer;
