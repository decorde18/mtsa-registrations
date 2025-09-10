// UploadMTSA.jsx – Part 1: Setup & Imports

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

import {
  headerMap,
  headerMapMtsa,
  playerFieldsToCheck,
} from "@/utils/constants";
import {
  normalize,
  buildLookupMap,
  hasPlayerChanges,
  getChangedPlayerFields,
  resolveOrCreateSeason,
} from "@/utils/dataHelpers";

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

// NEW: Include seasons in context destructure
const UploadMTSA = () => {
  const {
    players,
    mtsaPlayers,
    currentSeason,
    divisions,
    teams,
    seasons, // <-- newly added
  } = useDataContext();

  const { createRecord, updateRecords } = useDataOperations();

  const [uploads, setUploads] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewStats, setPreviewStats] = useState(null);

  // File drop, parsing, and submit handlers will go below...
  const onDrop = useCallback(
    async (acceptedFiles) => {
      if (isProcessing) return;

      try {
        setIsProcessing(true);
        const file = acceptedFiles[0];

        if (!file) return toast.error("No file selected");
        if (!file.name.match(/\.(xlsx|xls)$/i)) {
          return toast.error("Please select an Excel file (.xlsx or .xls)");
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
          return toast.error(
            "Invalid file format - required headers not found",
            {
              id: "file-processing",
            }
          );
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
          return toast.error("No valid player records found in file", {
            id: "file-processing",
          });
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
    [isProcessing, players, mtsaPlayers, divisions, teams]
  );
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
      const { mtsa, unique_id } = record;

      if (!uniqueIds.has(unique_id)) {
        uniqueIds.add(unique_id);
        const existingPlayer = players.find((p) => p.unique_id === unique_id);

        if (!existingPlayer) {
          newPlayers.push(record);
        } else {
          existingPlayers.push(record);
          if (hasPlayerChanges(existingPlayer, record)) {
            playersNeedingUpdate.push(record);
          }
        }
      }

      // Divisions and Teams
      if (mtsa.division_name) {
        const exists = divisions.some(
          (d) => normalize(d.mtsa_name) === normalize(mtsa.division_name)
        );
        if (!exists) newDivisions.add(mtsa.division_name);
      }

      if (mtsa.team_name) {
        const exists = teams.some(
          (t) => normalize(t.name) === normalize(mtsa.team_name)
        );
        if (!exists) newTeams.add(mtsa.team_name);
      }

      // MTSA Registration
      const player = players.find((p) => p.unique_id === unique_id) || record;
      const division = divisions.find(
        (d) => normalize(d.mtsa_name) === normalize(mtsa.division_name)
      );
      const team = teams.find(
        (t) => normalize(t.name) === normalize(mtsa.team_name)
      );

      if (player && division && team && currentSeason) {
        const exists = mtsaPlayers.find(
          (mp) =>
            mp.player_id === player.id &&
            mp.division_id === division.id &&
            mp.team_id === team.id &&
            mp.season_id === currentSeason.id
        );

        if (exists) existingMtsaRegistrations.push(record);
        else newMtsaRegistrations.push(record);
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
  const handleSubmit = async () => {
    try {
      setIsProcessing(true);
      toast.loading("Processing records...", { id: "submit-processing" });

      const playerMap = buildLookupMap(players, (p) => p.unique_id);
      const divisionMap = buildLookupMap(divisions, (d) =>
        normalize(d.mtsa_name)
      );
      const teamMap = buildLookupMap(teams, (t) => normalize(t.name));
      const seasonMap = buildLookupMap(seasons, (s) => normalize(s.name));

      const newPlayers = [];
      const updates = [];
      const divisionsToCreate = new Set();
      const teamsToCreate = new Set();

      // STEP 1: Player create/update
      for (const record of uploads) {
        const { unique_id } = record;
        const existing = playerMap.get(unique_id);
        if (!existing) {
          const { mtsa, unique_id, ...playerData } = record;
          newPlayers.push(playerData);
        } else {
          const changed = getChangedPlayerFields(existing, record);
          if (Object.keys(changed).length > 0) {
            updates.push({ id: existing.id, ...changed });
          }
        }
      }

      let createdPlayers = [];
      for (const player of newPlayers) {
        const res = await createRecord("players", player);
        const newPlayer = res.data || { id: res.id, ...player };
        playerMap.set(newPlayer.unique_id, newPlayer);
        createdPlayers.push(newPlayer);
      }

      if (updates.length) await updateRecords("players", updates);

      // STEP 2: Resolve divisions & teams
      for (const record of uploads) {
        const { mtsa } = record;
        if (
          mtsa.division_name &&
          !divisionMap.has(normalize(mtsa.division_name))
        ) {
          divisionsToCreate.add(mtsa.division_name);
        }
        if (mtsa.team_name && !teamMap.has(normalize(mtsa.team_name))) {
          teamsToCreate.add(mtsa.team_name);
        }
      }

      for (const name of divisionsToCreate) {
        const res = await createRecord("divisions", { mtsa_name: name });
        const div = res.data || { id: res.id, mtsa_name: name };
        divisionMap.set(normalize(name), div);
      }

      for (const name of teamsToCreate) {
        const res = await createRecord("teams", { name });
        const team = res.data || { id: res.id, name };
        teamMap.set(normalize(name), team);
      }

      // STEP 3: Resolve Season (from program_name)
      // no-op: per-record season resolution now handled individually
      // STEP 4: Process MTSA records
      const mtsaCreates = [];
      const mtsaUpdates = [];

      for (const { unique_id, mtsa } of uploads) {
        const player = playerMap.get(unique_id);
        const division = divisionMap.get(normalize(mtsa.division_name));
        const team = teamMap.get(normalize(mtsa.team_name));
        // Resolve season per record
        let season = null;
        if (mtsa.program_name) {
          const progKey = normalize(mtsa.program_name);
          if (!seasonMap.has(progKey)) {
            const newSeason = await resolveOrCreateSeason(
              mtsa.program_name,
              seasons,
              createRecord
            );
            seasonMap.set(progKey, newSeason);
          }
          season = seasonMap.get(progKey);
        }

        if (!player || !division || !team || !season) continue;

        const existingMtsa = mtsaPlayers.find(
          (mp) =>
            mp.player_id === player.id &&
            mp.division_id === division.id &&
            mp.team_id === team.id &&
            mp.season_id === season.id
        );

        const base = {
          player_id: player.id,
          division_id: division.id,
          team_id: team.id,
          season_id: season.id,
          order_date: mtsa.order_date
            ? convertExcelDateTimeToMySQL(mtsa.order_date)
            : null,
          other_phone: mtsa.other_phone || null,
          order_no: mtsa.order_no || null,
          order_detail_description: mtsa.order_detail_description || null,
          order_item_amount: mtsa.order_item_amount || null,
          order_item_amount_paid: mtsa.order_item_amount_paid || null,
          order_item_balance: mtsa.order_item_balance || null,
          order_payment_status: mtsa.order_payment_status || null,
        };

        if (!existingMtsa) {
          mtsaCreates.push(base);
        } else {
          const changed = {};
          for (const key in base) {
            if (base[key] !== existingMtsa[key]) {
              changed[key] = base[key];
            }
          }
          if (Object.keys(changed).length > 0) {
            mtsaUpdates.push({ id: existingMtsa.id, ...changed });
          }
        }
      }

      for (const data of mtsaCreates) await createRecord("mtsaPlayers", data);
      if (mtsaUpdates.length) await updateRecords("mtsaPlayers", mtsaUpdates);

      setUploads([]);
      setPreviewStats(null);
      toast.success("All records processed successfully!", {
        id: "submit-processing",
      });
    } catch (err) {
      console.error(err);
      toast.error("Error processing records: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ContentCard>
      <Toaster position='top-right' />
      <SectionTitle>
        <Upload />
        MTSA Registration Upload
      </SectionTitle>

      <UploadSection
        {...getRootProps()}
        className={`upload-box ${isDragActive ? "drag-active" : ""} ${isProcessing ? "processing" : ""}`}
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
};

export default UploadMTSA;
