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
  const [uploadSummary, setUploadSummary] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewMode, setPreviewMode] = useState("players"); // "players" or "mtsa"

  const onDrop = useCallback(
    (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (!file) return;

      toast.loading("Processing file...");
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const workbook = XLSX.read(e.target.result, { type: "array" });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          const headerIndex = jsonData.findIndex((row) =>
            row.some((header) => headerMap[header] || headerMapMtsa[header])
          );

          if (headerIndex === -1) {
            toast.error("Could not find valid headers in the Excel file");
            return;
          }

          const headers = jsonData[headerIndex];
          const rows = jsonData.slice(headerIndex + 1);
          const data = [];

          for (const row of rows) {
            if (!row.length) continue; // Skip empty rows

            const player = {};
            const mtsa = {};

            headers.forEach((header, idx) => {
              if (headerMap[header] && row[idx] !== undefined) {
                player[headerMap[header]] = row[idx];
              }
              if (headerMapMtsa[header] && row[idx] !== undefined) {
                mtsa[headerMapMtsa[header]] = row[idx];
              }
            });

            // Only add if we have minimum required player info
            if (player.first_name && player.last_name) {
              data.push({ ...addUniqueId(player), mtsa });
            }
          }

          setUploads(data);
          toast.dismiss();
          toast.success(`Successfully loaded ${data.length} records from file`);

          // Generate upload summary
          const newPlayers = data.filter(
            ({ unique_id }) =>
              !existingPlayers.some((p) => p.unique_id === unique_id)
          );

          const existingPlayerIds = new Set(
            existingPlayers.map((p) => p.unique_id)
          );
          const playersToUpdate = data.filter(({ unique_id }) =>
            existingPlayerIds.has(unique_id)
          );

          // Count potential new MTSA entries
          const potentialMtsaEntries = data.filter(({ mtsa, unique_id }) => {
            const player =
              existingPlayers.find((p) => p.unique_id === unique_id) ||
              newPlayers.find((p) => p.unique_id === unique_id);

            if (!player) return false;

            const division = divisions.find(
              (d) =>
                d.mtsa_name?.trim().toLowerCase() ===
                mtsa.division_name?.trim().toLowerCase()
            );
            const team = teams.find(
              (t) =>
                t.name?.trim().toLowerCase() ===
                mtsa.team_name?.trim().toLowerCase()
            );

            return division && team && season?.id;
          });

          setUploadSummary({
            total: data.length,
            newPlayers: newPlayers.length,
            existingPlayers: playersToUpdate.length,
            potentialMtsaEntries: potentialMtsaEntries.length,
          });
        } catch (error) {
          console.error("File processing error:", error);
          toast.error("Error processing file");
        }
      };

      reader.readAsArrayBuffer(file);
    },
    [existingPlayers, divisions, teams, season]
  );

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

      if (Object.keys(changedFields).length > 0) {
        updates.push({ id: match.id, ...changedFields });
      }

      return updates;
    }, []);
  };

  const handleSubmit = async () => {
    if (uploads.length === 0) {
      toast.error("No data to upload");
      return;
    }

    if (!season?.id) {
      toast.error("No active season selected");
      return;
    }

    setIsProcessing(true);
    const toastId = toast.loading("Processing uploads...");

    try {
      const uniqueIds = new Set();
      const newPlayers = [];
      const playersToCheck = [];
      const results = {
        newPlayersCount: 0,
        updatedPlayersCount: 0,
        newMtsaCount: 0,
        skippedMtsaCount: 0,
        errors: [],
      };

      // First, prepare player data and filter duplicates
      for (const { mtsa, ...player } of uploads) {
        if (!player.first_name || !player.last_name) continue;

        if (!uniqueIds.has(player.unique_id)) {
          uniqueIds.add(player.unique_id);
          playersToCheck.push({ ...player, mtsa });
          const exists = existingPlayers.some(
            (p) => p.unique_id === player.unique_id
          );
          if (!exists) {
            newPlayers.push(player);
          }
        }
      }

      // Add new players
      if (newPlayers.length > 0) {
        try {
          // Remove unique_id before sending to server
          const playersToCreate = newPlayers.map((player) => {
            const { unique_id, ...playerData } = player;
            return playerData;
          });

          const createdPlayers = await createPlayers(playersToCreate);
          results.newPlayersCount = newPlayers.length;

          // Add newly created players to existingPlayers for MTSA processing
          if (Array.isArray(createdPlayers)) {
            existingPlayers.push(...createdPlayers);
          }
        } catch (error) {
          console.error("Failed to create players:", error);
          results.errors.push("Failed to create some players");
        }
      }

      // Update players
      const updatedPlayers = findUpdatedPlayers(playersToCheck);
      if (updatedPlayers.length > 0) {
        try {
          // Remove unique_id before sending to server
          const playersToUpdate = updatedPlayers.map((player) => {
            const { unique_id, ...playerData } = player;
            return playerData;
          });

          await updatePlayers(playersToUpdate);
          results.updatedPlayersCount = updatedPlayers.length;
        } catch (error) {
          console.error("Failed to update players:", error);
          results.errors.push("Failed to update some players");
        }
      }

      // Add MTSA entries
      const newMtsa = [];

      for (const { mtsa, unique_id } of uploads) {
        const player = existingPlayers.find((p) => p.unique_id === unique_id);
        if (!player) {
          results.skippedMtsaCount++;
          continue;
        }

        const division = divisions.find(
          (d) =>
            d.mtsa_name?.trim().toLowerCase() ===
            mtsa.division_name?.trim().toLowerCase()
        );
        const team = teams.find(
          (t) =>
            t.name?.trim().toLowerCase() ===
            mtsa.team_name?.trim().toLowerCase()
        );

        if (!division || !team || !season?.id) {
          results.skippedMtsaCount++;
          continue;
        }

        const alreadyExists = mtsaPlayers.some(
          (mp) =>
            mp.player_id === player.id &&
            mp.team_id === team.id &&
            mp.division_id === division.id &&
            mp.season_id === season.id
        );

        if (alreadyExists) {
          results.skippedMtsaCount++;
          continue;
        }

        const mtsaEntry = {
          ...mtsa,
          player_id: player.id,
          division_id: division.id,
          team_id: team.id,
          season_id: season.id,
          order_date: mtsa.order_date
            ? convertExcelDateTimeToMySQL(mtsa.order_date)
            : null,
        };

        // Remove fields that don't belong in the database
        delete mtsaEntry.division_name;
        delete mtsaEntry.program_name;
        delete mtsaEntry.team_name;

        newMtsa.push(mtsaEntry);
      }

      if (newMtsa.length > 0) {
        try {
          await createMtsaPlayers(newMtsa);
          results.newMtsaCount = newMtsa.length;
        } catch (error) {
          console.error("Failed to create MTSA entries:", error);
          results.errors.push("Failed to create some MTSA entries");
        }
      }

      // Show success message
      toast.dismiss(toastId);
      toast.success(
        `Complete! Added ${results.newPlayersCount} players, updated ${results.updatedPlayersCount} players, added ${results.newMtsaCount} MTSA entries, skipped ${results.skippedMtsaCount} MTSA entries.`
      );

      if (results.errors.length > 0) {
        toast.error(`Errors occurred: ${results.errors.join(", ")}`);
      }

      // Reset state
      setUploads([]);
      setUploadSummary(null);
    } catch (error) {
      console.error("Upload error:", error);
      toast.dismiss(toastId);
      toast.error("An error occurred during processing");
    } finally {
      setIsProcessing(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
      "application/vnd.ms-excel": [".xls"],
    },
    multiple: false,
    disabled: isProcessing,
  });

  return (
    <div className='upload-container'>
      <Toaster position='top-right' />

      <div
        {...getRootProps()}
        className={`dropzone ${isDragActive ? "active" : ""} ${isProcessing ? "disabled" : ""}`}
        style={{
          border: "2px dashed #ccc",
          padding: 20,
          textAlign: "center",
          marginBottom: 20,
          backgroundColor: isDragActive ? "#f0f8ff" : "#f9f9f9",
          cursor: isProcessing ? "not-allowed" : "pointer",
        }}
      >
        <input {...getInputProps()} />
        <p>
          {isDragActive
            ? "Drop the file here..."
            : isProcessing
              ? "Processing..."
              : "Drag 'n' drop MTSA Excel file here or click to select"}
        </p>
      </div>

      {uploadSummary && (
        <div className='upload-summary' style={{ marginBottom: 20 }}>
          <h3>Upload Summary</h3>
          <ul>
            <li>Total records: {uploadSummary.total}</li>
            <li>New players to add: {uploadSummary.newPlayers}</li>
            <li>
              Existing players that might be updated:{" "}
              {uploadSummary.existingPlayers}
            </li>
            <li>
              Potential new MTSA entries: {uploadSummary.potentialMtsaEntries}
            </li>
          </ul>
        </div>
      )}

      {uploads.length > 0 && (
        <div className='data-preview'>
          <h3>Preview Loaded Data</h3>

          <div className='preview-tabs' style={{ marginBottom: 15 }}>
            <button
              onClick={() => setPreviewMode("players")}
              style={{
                fontWeight: previewMode === "players" ? "bold" : "normal",
                marginRight: 10,
                padding: "5px 10px",
              }}
            >
              Players Data
            </button>
            <button
              onClick={() => setPreviewMode("mtsa")}
              style={{
                fontWeight: previewMode === "mtsa" ? "bold" : "normal",
                padding: "5px 10px",
              }}
            >
              MTSA Data
            </button>
          </div>

          <div
            className='preview-table-container'
            style={{ overflowX: "auto", maxHeight: "300px", overflowY: "auto" }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {previewMode === "players" ? (
                    <>
                      <th
                        style={{
                          padding: 8,
                          borderBottom: "1px solid #ddd",
                          textAlign: "left",
                        }}
                      >
                        First Name
                      </th>
                      <th
                        style={{
                          padding: 8,
                          borderBottom: "1px solid #ddd",
                          textAlign: "left",
                        }}
                      >
                        Last Name
                      </th>
                      <th
                        style={{
                          padding: 8,
                          borderBottom: "1px solid #ddd",
                          textAlign: "left",
                        }}
                      >
                        Email
                      </th>
                      <th
                        style={{
                          padding: 8,
                          borderBottom: "1px solid #ddd",
                          textAlign: "left",
                        }}
                      >
                        Status
                      </th>
                    </>
                  ) : (
                    <>
                      <th
                        style={{
                          padding: 8,
                          borderBottom: "1px solid #ddd",
                          textAlign: "left",
                        }}
                      >
                        Player
                      </th>
                      <th
                        style={{
                          padding: 8,
                          borderBottom: "1px solid #ddd",
                          textAlign: "left",
                        }}
                      >
                        Division
                      </th>
                      <th
                        style={{
                          padding: 8,
                          borderBottom: "1px solid #ddd",
                          textAlign: "left",
                        }}
                      >
                        Team
                      </th>
                      <th
                        style={{
                          padding: 8,
                          borderBottom: "1px solid #ddd",
                          textAlign: "left",
                        }}
                      >
                        Status
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {uploads.slice(0, 20).map((item, index) => {
                  const { mtsa, unique_id, first_name, last_name, email } =
                    item;
                  const playerExists = existingPlayers.some(
                    (p) => p.unique_id === unique_id
                  );

                  if (previewMode === "players") {
                    return (
                      <tr key={index}>
                        <td
                          style={{ padding: 8, borderBottom: "1px solid #ddd" }}
                        >
                          {first_name}
                        </td>
                        <td
                          style={{ padding: 8, borderBottom: "1px solid #ddd" }}
                        >
                          {last_name}
                        </td>
                        <td
                          style={{ padding: 8, borderBottom: "1px solid #ddd" }}
                        >
                          {email}
                        </td>
                        <td
                          style={{ padding: 8, borderBottom: "1px solid #ddd" }}
                        >
                          {playerExists ? (
                            <span style={{ color: "blue" }}>Existing</span>
                          ) : (
                            <span style={{ color: "green" }}>New</span>
                          )}
                        </td>
                      </tr>
                    );
                  } else {
                    // MTSA mode
                    const player = existingPlayers.find(
                      (p) => p.unique_id === unique_id
                    );
                    const division = divisions.find(
                      (d) =>
                        d.mtsa_name?.trim().toLowerCase() ===
                        mtsa.division_name?.trim().toLowerCase()
                    );
                    const team = teams.find(
                      (t) =>
                        t.name?.trim().toLowerCase() ===
                        mtsa.team_name?.trim().toLowerCase()
                    );

                    let status = "Unknown";
                    let color = "red";

                    if (!player && !playerExists) {
                      status = "Player Missing";
                    } else if (!division) {
                      status = "Division Not Found";
                    } else if (!team) {
                      status = "Team Not Found";
                    } else {
                      const existingMtsa =
                        player &&
                        mtsaPlayers.some(
                          (mp) =>
                            mp.player_id === player.id &&
                            mp.team_id === team.id &&
                            mp.division_id === division.id &&
                            mp.season_id === season?.id
                        );

                      if (existingMtsa) {
                        status = "Already Exists";
                        color = "blue";
                      } else {
                        status = "Will Add";
                        color = "green";
                      }
                    }

                    return (
                      <tr key={index}>
                        <td
                          style={{ padding: 8, borderBottom: "1px solid #ddd" }}
                        >
                          {first_name} {last_name}
                        </td>
                        <td
                          style={{ padding: 8, borderBottom: "1px solid #ddd" }}
                        >
                          {mtsa.division_name || "N/A"}
                        </td>
                        <td
                          style={{ padding: 8, borderBottom: "1px solid #ddd" }}
                        >
                          {mtsa.team_name || "N/A"}
                        </td>
                        <td
                          style={{
                            padding: 8,
                            borderBottom: "1px solid #ddd",
                            color,
                          }}
                        >
                          {status}
                        </td>
                      </tr>
                    );
                  }
                })}
              </tbody>
            </table>
            {uploads.length > 20 && (
              <p style={{ textAlign: "center", color: "#666" }}>
                Showing 20 of {uploads.length} records
              </p>
            )}
          </div>

          <div className='action-buttons' style={{ marginTop: 20 }}>
            <button
              onClick={handleSubmit}
              disabled={isProcessing}
              style={{
                padding: "8px 16px",
                backgroundColor: "#4CAF50",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: isProcessing ? "not-allowed" : "pointer",
                opacity: isProcessing ? 0.7 : 1,
              }}
            >
              {isProcessing ? "Processing..." : "Submit to Server"}
            </button>

            <button
              onClick={() => {
                setUploads([]);
                setUploadSummary(null);
              }}
              disabled={isProcessing}
              style={{
                marginLeft: 10,
                padding: "8px 16px",
                backgroundColor: "#f44336",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: isProcessing ? "not-allowed" : "pointer",
                opacity: isProcessing ? 0.7 : 1,
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default UploadExcelMTSA;
