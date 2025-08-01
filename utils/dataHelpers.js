// utils/dataHelpers.js

import { playerFieldsToCheck } from "@/utils/constants";
import { convertExcelDateTimeToMySQL } from "@/utils/functions";

export const normalize = (str) => str?.trim().toLowerCase() || "";

export const buildLookupMap = (array, keyFn) => {
  const map = new Map();
  array.forEach((item) => map.set(keyFn(item), item));
  return map;
};

export const hasPlayerChanges = (existingPlayer, newPlayer) => {
  return playerFieldsToCheck.some(
    (field) => existingPlayer[field] !== newPlayer[field]
  );
};

export const getChangedPlayerFields = (existingPlayer, newPlayer) => {
  const changes = {};
  playerFieldsToCheck.forEach((field) => {
    if (existingPlayer[field] !== newPlayer[field]) {
      changes[field] = newPlayer[field];
    }
  });
  return changes;
};

export const resolveOrCreateSeason = async (
  programName,
  seasons,
  createRecord
) => {
  const normalizedName = normalize(programName);
  const season = seasons.find((s) => normalize(s.mtsa_name) === normalizedName);
  if (season) return season;

  const result = await createRecord("seasons", { name: programName });
  return result.data || { id: result.id, name: programName };
};
