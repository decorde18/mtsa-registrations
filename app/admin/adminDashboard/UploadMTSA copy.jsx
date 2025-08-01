"use client";

import React, { useState, useCallback } from "react";
import styled from "styled-components";
import * as XLSX from "xlsx";
import { useDropzone } from "react-dropzone";
import toast, { Toaster } from "react-hot-toast";

import { ContentCard, SectionTitle } from "@/styles/components/Card";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { addUniqueId, convertExcelDateTimeToMySQL } from "@/utils/functions";
import { useDataContext } from "@/contexts/DataContext";
import { useDataOperations } from "@/hooks/useDataOperations";

const UploadSection = styled.div`
  border: 2px dashed #d1d5db;
  border-radius: 12px;
  padding: 40px;
  text-align: center;
  background: #f9fafb;
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    border-color: #4f46e5;
    background: #f0f9ff;
  }

  &.drag-active {
    border-color: #4f46e5;
    background: #eff6ff;
  }

  &.processing {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;
const UploadIcon = styled.div`
  font-size: 3rem;
  color: #9ca3af;
  margin-bottom: 16px;

  &.success {
    color: #22c55e;
  }
`;
const UploadText = styled.p`
  color: #6b7280;
  font-size: 1.1rem;
  margin: 0;
`;
const SubText = styled.p`
  color: #9ca3af;
  font-size: 0.9rem;
  margin-top: 10px;
`;
const PreviewSection = styled.div`
  margin-top: 20px;
  padding: 20px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
`;
const PreviewTitle = styled.h3`
  margin: 0 0 15px 0;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 8px;
`;
const PreviewStats = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
`;
const StatCard = styled.div`
  background: white;
  padding: 15px;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  text-align: center;
`;
const StatNumber = styled.div`
  font-size: 1.5rem;
  font-weight: bold;
  color: #4f46e5;
`;
const StatLabel = styled.div`
  font-size: 0.85rem;
  color: #6b7280;
  margin-top: 4px;
`;
const ActionButton = styled.button`
  background: #4f46e5;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 auto;

  &:hover:not(:disabled) {
    background: #4338ca;
    transform: translateY(-1px);
  }

  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
    transform: none;
  }
`;
const LoadingSpinner = styled.div`
  width: 20px;
  height: 20px;
  border: 2px solid #ffffff40;
  border-top: 2px solid #ffffff;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

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

function UploadMTSA() {
  const { players, mtsaPlayers, currentSeason, divisions, teams } =
    useDataContext();

  const { createRecord, updateRecords } = useDataOperations();

  const [uploads, setUploads] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewStats, setPreviewStats] = useState(null);

  const onDrop = useCallback(
    async (acceptedFiles) => {
      if (isProcessing) return;

      try {
        setIsProcessing(true);
        const file = acceptedFiles[0];

        if (!file) {
          toast.error("No file selected");
          return;
        }

        if (!file.name.match(/\.(xlsx|xls)$/i)) {
          toast.error("Please select an Excel file (.xlsx or .xls)");
          return;
        }

        toast.loading("Processing file...", { id: "file-processing" });

        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, {
          type: "array",
          cellText: true,
          cellDates: false,
        });

        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        const headerIndex = jsonData.findIndex((row) =>
          row.some((header) => headerMap[header] || headerMapMtsa[header])
        );

        if (headerIndex === -1) {
          toast.error("Invalid file format - required headers not found", {
            id: "file-processing",
          });
          return;
        }

        const headers = jsonData[headerIndex];
        const rows = jsonData.slice(headerIndex + 1);
        const processedData = [];

        for (const row of rows) {
          if (row.length < 5) continue;

          const player = {};
          const mtsa = {};

          headers.forEach((header, idx) => {
            if (headerMap[header]) player[headerMap[header]] = row[idx];
            if (headerMapMtsa[header]) mtsa[headerMapMtsa[header]] = row[idx];
          });

          if (player.first_name && player.last_name) {
            processedData.push({ ...addUniqueId(player), mtsa });
          }
        }

        if (processedData.length === 0) {
          toast.error("No valid player records found in file", {
            id: "file-processing",
          });
          return;
        }

        setUploads(processedData);
        generatePreviewStats(processedData);
        toast.success(`Successfully loaded ${processedData.length} records`, {
          id: "file-processing",
        });
      } catch (error) {
        console.error("File processing error:", error);
        toast.error("Failed to process file: " + error.message, {
          id: "file-processing",
        });
      } finally {
        setIsProcessing(false);
      }
    },
    [isProcessing, players, mtsaPlayers, currentSeason, divisions, teams]
  );

  const generatePreviewStats = (data) => {
    const uniqueIds = new Set();
    const newPlayers = [];
    const existingPlayers = [];
    const playersNeedingUpdate = [];
    const newDivisions = new Set();
    const newTeams = new Set();
    const newMtsaRegistrations = [];
    const existingMtsaRegistrations = [];

    for (const record of data) {
      if (!uniqueIds.has(record.unique_id)) {
        uniqueIds.add(record.unique_id);
        const existingPlayer = players.find(
          (p) => p.unique_id === record.unique_id
        );

        if (!existingPlayer) {
          newPlayers.push(record);
        } else {
          existingPlayers.push(record);
          // Check if player needs updates (simplified check)
          if (hasPlayerChanges(existingPlayer, record)) {
            playersNeedingUpdate.push(record);
          }
        }
      }

      // Check divisions and teams
      const { mtsa } = record;
      if (mtsa.division_name) {
        const divisionExists = divisions.some(
          (d) =>
            d.mtsa_name?.trim().toLowerCase() ===
            mtsa.division_name?.trim().toLowerCase()
        );
        if (!divisionExists) {
          newDivisions.add(mtsa.division_name);
        }
      }

      if (mtsa.team_name) {
        const teamExists = teams.some(
          (t) =>
            t.name?.trim().toLowerCase() ===
            mtsa.team_name?.trim().toLowerCase()
        );
        if (!teamExists) {
          newTeams.add(mtsa.team_name);
        }
      }

      // Check MTSA registrations
      const player =
        players.find((p) => p.unique_id === record.unique_id) || record;
      const division = divisions.find(
        (d) =>
          d.mtsa_name?.trim().toLowerCase() ===
          mtsa.division_name?.trim().toLowerCase()
      );
      const team = teams.find(
        (t) =>
          t.name?.trim().toLowerCase() === mtsa.team_name?.trim().toLowerCase()
      );

      if (player && division && team && currentSeason) {
        const existingMtsa = mtsaPlayers.find(
          (mp) =>
            mp.player_id === player.id &&
            mp.division_id === division.id &&
            mp.team_id === team.id &&
            mp.season_id === currentSeason.id
        );

        if (existingMtsa) {
          existingMtsaRegistrations.push(record);
        } else {
          newMtsaRegistrations.push(record);
        }
      }
    }

    setPreviewStats({
      totalRecords: data.length,
      newPlayers: newPlayers.length,
      existingPlayers: existingPlayers.length,
      playersNeedingUpdate: playersNeedingUpdate.length,
      newDivisions: newDivisions.size,
      newTeams: newTeams.size,
      newMtsaRegistrations: newMtsaRegistrations.length,
      existingMtsaRegistrations: existingMtsaRegistrations.length,
    });
  };

  const hasPlayerChanges = (existingPlayer, newPlayer) => {
    const fieldsToCheck = [
      "first_name",
      "last_name",
      "email",
      "phone",
      "address",
      "city",
      "state",
      "zip",
      "dob",
      "gender",
    ];
    return fieldsToCheck.some(
      (field) => existingPlayer[field] !== newPlayer[field]
    );
  };

  const handleSubmit = async () => {
    if (!currentSeason) {
      toast.error("No current season selected");
      return;
    }

    try {
      setIsProcessing(true);
      toast.loading("Processing records...", { id: "submit-processing" });

      // Step 1: Process players
      const uniqueIds = new Set();
      const newPlayersToCreate = [];
      const playersToUpdate = [];
      let allPlayers = [...players];

      for (const record of uploads) {
        if (!record.first_name || !record.last_name) continue;

        if (!uniqueIds.has(record.unique_id)) {
          uniqueIds.add(record.unique_id);
          const existingPlayer = players.find(
            (p) => p.unique_id === record.unique_id
          );

          if (!existingPlayer) {
            // New player - create it
            const { mtsa, unique_id, ...playerData } = record;
            newPlayersToCreate.push(playerData);
          } else if (hasPlayerChanges(existingPlayer, record)) {
            // Existing player needs update
            const changedFields = {};
            const fieldsToCheck = [
              "first_name",
              "last_name",
              "email",
              "phone",
              "address",
              "city",
              "state",
              "zip",
              "dob",
              "gender",
            ];

            fieldsToCheck.forEach((field) => {
              if (existingPlayer[field] !== record[field]) {
                changedFields[field] = record[field];
              }
            });

            if (Object.keys(changedFields).length > 0) {
              playersToUpdate.push({
                id: existingPlayer.id,
                ...changedFields,
              });
            }
          }
        }
      }

      // Create new players
      let createdPlayers = [];
      if (newPlayersToCreate.length > 0) {
        toast.loading(`Creating ${newPlayersToCreate.length} new players...`, {
          id: "creating-players",
        });

        for (const player of newPlayersToCreate) {
          try {
            const result = await createRecord("players", player);
            const newPlayer = result.data || { ...player, id: result.id };
            createdPlayers.push(newPlayer);
            allPlayers.push(newPlayer);
          } catch (error) {
            console.error("Error creating player:", error);
            toast.error(
              `Failed to create player: ${player.first_name} ${player.last_name}`
            );
          }
        }

        toast.success(`Created ${createdPlayers.length} new players`, {
          id: "creating-players",
        });
      }

      // Update existing players
      if (playersToUpdate.length > 0) {
        toast.loading(`Updating ${playersToUpdate.length} players...`, {
          id: "updating-players",
        });

        try {
          await updateRecords("players", playersToUpdate);
          toast.success(`Updated ${playersToUpdate.length} players`, {
            id: "updating-players",
          });
        } catch (error) {
          console.error("Error updating players:", error);
          toast.error("Failed to update some players", {
            id: "updating-players",
          });
        }
      }

      // Step 2: Create new divisions and teams
      const divisionsToCreate = new Set();
      const teamsToCreate = new Set();
      let allDivisions = [...divisions];
      let allTeams = [...teams];

      for (const { mtsa } of uploads) {
        // Check divisions
        if (mtsa.division_name) {
          const divisionExists = allDivisions.some(
            (d) =>
              d.mtsa_name?.trim().toLowerCase() ===
              mtsa.division_name?.trim().toLowerCase()
          );
          if (!divisionExists) {
            divisionsToCreate.add(mtsa.division_name);
          }
        }

        // Check teams
        if (mtsa.team_name) {
          const teamExists = allTeams.some(
            (t) =>
              t.name?.trim().toLowerCase() ===
              mtsa.team_name?.trim().toLowerCase()
          );
          if (!teamExists) {
            teamsToCreate.add(mtsa.team_name);
          }
        }
      }

      // Create new divisions
      if (divisionsToCreate.size > 0) {
        toast.loading(`Creating ${divisionsToCreate.size} new divisions...`, {
          id: "creating-divisions",
        });

        for (const divisionName of divisionsToCreate) {
          try {
            const result = await createRecord("divisions", {
              mtsa_name: divisionName,
            });
            const newDivision = result.data || {
              mtsa_name: divisionName,
              id: result.id,
            };
            allDivisions.push(newDivision);
          } catch (error) {
            console.error("Error creating division:", error);
            toast.error(`Failed to create division: ${divisionName}`);
          }
        }

        toast.success(`Created ${divisionsToCreate.size} new divisions`, {
          id: "creating-divisions",
        });
      }

      // Create new teams
      if (teamsToCreate.size > 0) {
        toast.loading(`Creating ${teamsToCreate.size} new teams...`, {
          id: "creating-teams",
        });

        for (const teamName of teamsToCreate) {
          try {
            const result = await createRecord("teams", { name: teamName });
            const newTeam = result.data || { name: teamName, id: result.id };
            allTeams.push(newTeam);
          } catch (error) {
            console.error("Error creating team:", error);
            toast.error(`Failed to create team: ${teamName}`);
          }
        }

        toast.success(`Created ${teamsToCreate.size} new teams`, {
          id: "creating-teams",
        });
      }

      // Step 3: Process MTSA registrations
      const mtsaRegistrationsToCreate = [];
      const mtsaRegistrationsToUpdate = [];

      for (const { mtsa, unique_id } of uploads) {
        const player = allPlayers.find((p) => p.unique_id === unique_id);
        if (!player) break;

        const division = allDivisions.find(
          (d) =>
            d.mtsa_name?.trim().toLowerCase() ===
            mtsa.division_name?.trim().toLowerCase()
        );
        const team = allTeams.find(
          (t) =>
            t.name?.trim().toLowerCase() ===
            mtsa.team_name?.trim().toLowerCase()
        );

        if (!division || !team) break;
        // if (!division || !team) continue;

        const existingMtsa = mtsaPlayers.find(
          (mp) =>
            mp.player_id === player.id &&
            mp.division_id === division.id &&
            mp.team_id === team.id &&
            mp.season_id === currentSeason.id
        );

        const mtsaData = {
          ...mtsa,
          player_id: player.id,
          division_id: division.id,
          team_id: team.id,
          season_id: currentSeason.id,
          order_date: mtsa.order_date
            ? convertExcelDateTimeToMySQL(mtsa.order_date)
            : null,
        };

        // Remove fields that don't belong in the database
        delete mtsaData.division_name;
        delete mtsaData.team_name;
        delete mtsaData.program_name;

        if (!existingMtsa) {
          mtsaRegistrationsToCreate.push(mtsaData);
        } else {
          // Check if update is needed
          const changedFields = {};
          Object.keys(mtsaData).forEach((field) => {
            if (field !== "id" && existingMtsa[field] !== mtsaData[field]) {
              changedFields[field] = mtsaData[field];
            }
          });

          if (Object.keys(changedFields).length > 0) {
            mtsaRegistrationsToUpdate.push({
              id: existingMtsa.id,
              ...changedFields,
            });
          }
        }
      }

      // Create new MTSA registrations
      if (mtsaRegistrationsToCreate.length > 0) {
        toast.loading(
          `Creating ${mtsaRegistrationsToCreate.length} MTSA registrations...`,
          {
            id: "creating-mtsa",
          }
        );

        let successCount = 0;
        for (const registration of mtsaRegistrationsToCreate) {
          try {
            await createRecord("mtsaPlayers", registration);
            successCount++;
          } catch (error) {
            console.error("Error creating MTSA registration:", error);
            toast.error(
              `Failed to create MTSA registration for player ID: ${registration.player_id}`
            );
          }
        }

        toast.success(`Created ${successCount} MTSA registrations`, {
          id: "creating-mtsa",
        });
      }

      // Update existing MTSA registrations
      if (mtsaRegistrationsToUpdate.length > 0) {
        toast.loading(
          `Updating ${mtsaRegistrationsToUpdate.length} MTSA registrations...`,
          {
            id: "updating-mtsa",
          }
        );

        try {
          await updateRecords("mtsaPlayers", mtsaRegistrationsToUpdate);
          toast.success(
            `Updated ${mtsaRegistrationsToUpdate.length} MTSA registrations`,
            {
              id: "updating-mtsa",
            }
          );
        } catch (error) {
          console.error("Error updating MTSA registrations:", error);
          toast.error("Failed to update some MTSA registrations", {
            id: "updating-mtsa",
          });
        }
      }

      // Success - reset form
      setUploads([]);
      setPreviewStats(null);
      toast.success("All records processed successfully!", {
        id: "submit-processing",
      });
    } catch (error) {
      console.error("Submission error:", error);
      toast.error(`Failed to process records: ${error.message}`, {
        id: "submit-processing",
      });
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
    <ContentCard>
      <Toaster position='top-right' />
      <SectionTitle>
        <Upload />
        MTSA Registration Upload
      </SectionTitle>

      <UploadSection
        {...getRootProps()}
        className={`${isDragActive ? "drag-active" : ""} ${isProcessing ? "processing" : ""}`}
      >
        <input {...getInputProps()} />
        <UploadIcon className={uploads.length > 0 ? "success" : ""}>
          {uploads.length > 0 ? (
            <CheckCircle size={48} />
          ) : (
            <FileSpreadsheet size={48} />
          )}
        </UploadIcon>
        <UploadText>
          {isProcessing
            ? "Processing file..."
            : isDragActive
              ? "Drop the MTSA file here..."
              : uploads.length > 0
                ? "File loaded successfully!"
                : "MTSA registration files"}
        </UploadText>
        <SubText>
          {uploads.length > 0
            ? `${uploads.length} records ready for processing`
            : "Drag and drop your Excel files here, or click to browse"}
        </SubText>
      </UploadSection>

      {previewStats && (
        <PreviewSection>
          <PreviewTitle>
            <AlertCircle size={20} />
            Upload Preview
          </PreviewTitle>

          <PreviewStats>
            <StatCard>
              <StatNumber>{previewStats.totalRecords}</StatNumber>
              <StatLabel>Total Records</StatLabel>
            </StatCard>
            <StatCard>
              <StatNumber>{previewStats.newPlayers}</StatNumber>
              <StatLabel>New Players</StatLabel>
            </StatCard>
            <StatCard>
              <StatNumber>{previewStats.playersNeedingUpdate}</StatNumber>
              <StatLabel>Players to Update</StatLabel>
            </StatCard>
            <StatCard>
              <StatNumber>{previewStats.newDivisions}</StatNumber>
              <StatLabel>New Divisions</StatLabel>
            </StatCard>
            <StatCard>
              <StatNumber>{previewStats.newTeams}</StatNumber>
              <StatLabel>New Teams</StatLabel>
            </StatCard>
            <StatCard>
              <StatNumber>{previewStats.newMtsaRegistrations}</StatNumber>
              <StatLabel>New MTSA Registrations</StatLabel>
            </StatCard>
          </PreviewStats>

          <ActionButton
            onClick={handleSubmit}
            disabled={isProcessing || uploads.length === 0}
          >
            {isProcessing ? (
              <>
                <LoadingSpinner />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle size={20} />
                Submit to Server
              </>
            )}
          </ActionButton>
        </PreviewSection>
      )}
    </ContentCard>
  );
}

export default UploadMTSA;
