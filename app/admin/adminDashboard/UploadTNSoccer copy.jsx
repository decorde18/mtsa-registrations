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
import { addUniqueId } from "@/utils/functions";
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
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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

function UploadTNSoccer() {
  const { players, tnsoccerPlayerSeasons, currentSeason } = useDataContext();

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
          row.some((header) => headerMap[header] || headerMapTnsoccer[header])
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
          const tnSoccer = {};

          headers.forEach((header, idx) => {
            if (headerMap[header]) player[headerMap[header]] = row[idx];
            if (headerMapTnsoccer[header])
              tnSoccer[headerMapTnsoccer[header]] = row[idx];
          });

          if (player.first_name && player.last_name) {
            processedData.push({ ...addUniqueId(player), tnSoccer });
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
    [isProcessing, players, tnsoccerPlayerSeasons, currentSeason]
  );

  const generatePreviewStats = (data) => {
    const uniqueIds = new Set();
    const newPlayers = [];
    const existingPlayers = [];
    const playersNeedingUpdate = [];

    for (const player of data) {
      if (!uniqueIds.has(player.unique_id)) {
        uniqueIds.add(player.unique_id);
        const existingPlayer = players.find(
          (p) => p.unique_id === player.unique_id
        );

        if (!existingPlayer) {
          newPlayers.push(player);
        } else {
          existingPlayers.push(player);
          if (!existingPlayer.player_id && player.player_id) {
            playersNeedingUpdate.push(player);
          }
        }
      }
    }

    const newSeasonRegistrations = data.filter(({ unique_id }) => {
      const matchedPlayer = players.find((p) => p.unique_id === unique_id);
      if (!matchedPlayer || !currentSeason) return false;

      return !tnsoccerPlayerSeasons.some(
        (tp) =>
          tp.player_id === matchedPlayer.id && tp.season_id === currentSeason.id
      );
    });

    setPreviewStats({
      totalRecords: data.length,
      newPlayers: newPlayers.length,
      existingPlayers: existingPlayers.length,
      playersNeedingUpdate: playersNeedingUpdate.length,
      newRegistrations: newSeasonRegistrations.length,
    });
  };

  const handleSubmit = async () => {
    if (!currentSeason) {
      toast.error("No current season selected");
      return;
    }

    try {
      setIsProcessing(true);
      toast.loading("Processing records...", { id: "submit-processing" });

      // Step 1: Create new players and identify players needing player_id updates
      const uniqueIds = new Set();
      const newPlayersToCreate = [];
      const playersToUpdate = [];

      for (const player of uploads) {
        if (!player.first_name || !player.last_name) continue;

        if (!uniqueIds.has(player.unique_id)) {
          uniqueIds.add(player.unique_id);
          const existingPlayer = players.find(
            (p) => p.unique_id === player.unique_id
          );

          if (!existingPlayer) {
            // New player - create it
            newPlayersToCreate.push(player);
          } else if (!existingPlayer.player_id && player.player_id) {
            // Existing player missing player_id - update it
            playersToUpdate.push({
              id: existingPlayer.id,
              player_id: player.player_id,
            });
          }
        }
      }

      // Create new players (one by one since no batch create exists)
      let createdPlayers = [];
      if (newPlayersToCreate.length > 0) {
        toast.loading(`Creating ${newPlayersToCreate.length} new players...`, {
          id: "creating-players",
        });

        for (const player of newPlayersToCreate) {
          try {
            const result = await createRecord("players", player);
            createdPlayers.push(result.data || { ...player, id: result.id });
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

      // Update existing players with missing player_ids (batch update)
      if (playersToUpdate.length > 0) {
        toast.loading(`Updating ${playersToUpdate.length} player IDs...`, {
          id: "updating-players",
        });

        try {
          await updateRecords("players", playersToUpdate);
          toast.success(
            `Updated ${playersToUpdate.length} players with TN Soccer IDs`,
            { id: "updating-players" }
          );
        } catch (error) {
          console.error("Error updating players:", error);
          toast.error("Failed to update some player IDs", {
            id: "updating-players",
          });
        }
      }

      // Step 2: Build updated players list including newly created ones
      const allPlayers = [...players, ...createdPlayers];

      // Step 3: Create TN Soccer season registrations in batch
      const seasonRegistrationsToCreate = [];

      for (const { tnSoccer, unique_id } of uploads) {
        const matchedPlayer = allPlayers.find((p) => p.unique_id === unique_id);
        if (!matchedPlayer) continue;

        const alreadyExists = tnsoccerPlayerSeasons.some(
          (tp) =>
            tp.player_id === matchedPlayer.id &&
            tp.season_id === currentSeason.id
        );

        if (!alreadyExists) {
          seasonRegistrationsToCreate.push({
            ...tnSoccer,
            player_id: matchedPlayer.id,
            season_id: currentSeason.id,
          });
        }
      }

      // Step 3: Create TN Soccer season registrations (one by one)
      if (seasonRegistrationsToCreate.length > 0) {
        toast.loading(
          `Creating ${seasonRegistrationsToCreate.length} season registrations...`,
          { id: "creating-registrations" }
        );

        let successCount = 0;
        try {
          await createRecord(
            "tnsoccerPlayerSeasons",
            seasonRegistrationsToCreate
          );
          toast.success("All registrations created successfully.");
        } catch (batchError) {
          console.warn(
            "Batch insert failed, falling back to individual records..."
          );

          let successCount = 0;
          for (const registration of seasonRegistrationsToCreate) {
            try {
              await createRecord("tnsoccerPlayerSeasons", registration);
              successCount++;
            } catch (error) {
              toast.error(
                `Failed to create registration for player ID: ${registration.player_id}`
              );
            }
          }
        }

        toast.success(`Created ${successCount} season registrations`, {
          id: "creating-registrations",
        });
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
        TN Soccer Registration Upload
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
              ? "Drop the TN Soccer file here..."
              : uploads.length > 0
                ? "File loaded successfully!"
                : "TN Soccer registration files"}
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
              <StatNumber>{previewStats.existingPlayers}</StatNumber>
              <StatLabel>Existing Players</StatLabel>
            </StatCard>
            <StatCard>
              <StatNumber>{previewStats.playersNeedingUpdate}</StatNumber>
              <StatLabel>Players to Update</StatLabel>
            </StatCard>
            <StatCard>
              <StatNumber>{previewStats.newRegistrations}</StatNumber>
              <StatLabel>New Registrations</StatLabel>
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

export default UploadTNSoccer;
