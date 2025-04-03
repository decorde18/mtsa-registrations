"use client";

import { createContext, useContext, useState, useEffect } from "react";
import Spinner from "@/components/Spinner"; // Import a spinner component for loading

const DataContext = createContext();

export function DataProvider({ children }) {
  const [players, setPlayers] = useState([]);
  const [mtsaPlayers, setMtsaPlayers] = useState([]);
  const [tnsoccerPlayerSeasons, setTnsoccerPlayerSeasons] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [currentSeason, setCurrentSeason] = useState([]);
  const [teams, setTeams] = useState([]);
  const [leagues, setLeagues] = useState([]);
  const [missingPlayers, setMissingPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData(endpoint, setState) {
      try {
        const response = await fetch(endpoint);
        if (!response.ok) throw new Error(`Failed to fetch ${endpoint}`);
        const result = await response.json();
        setState(result.data || []);
      } catch (error) {
        console.error(`Error fetching ${endpoint}:`, error);
      }
    }

    async function loadAllData() {
      setLoading(true);
      await Promise.all([
        fetchData("/api/players", setPlayers),
        fetchData("/api/mtsaPlayers", setMtsaPlayers),
        fetchData("/api/tnsoccerPlayerSeasons", setTnsoccerPlayerSeasons),
        fetchData("/api/divisions", setDivisions),
        fetchData("/api/seasons", setSeasons),
        fetchData("/api/teams", setTeams),
        fetchData("/api/leagues", setLeagues),
        fetchData("/api/missingPlayers", setMissingPlayers),
      ]);
      setLoading(false);
    }

    loadAllData();
  }, []);

  useEffect(() => {
    if (!seasons.length || !leagues.length) return;
    setCurrentSeason(seasons.find((sea) => sea.id === leagues[0].id));
  }, [leagues, seasons]);

  async function createRecord(endpoint, newRecord, setState) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRecord),
      });
      if (!response.ok) throw new Error("Failed to create record");
      const createdRecord = await response.json();
      setState((prev) => [...prev, createdRecord]);
    } catch (error) {
      console.error("Error creating record:", error);
    }
  }

  async function updateRecord(endpoint, updatedRecords, setState) {
    try {
      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records: updatedRecords }),
      });
      if (!response.ok) throw new Error("Failed to update records");
      const { updatedRecords: updatedDataArray } = await response.json();
      setState((prev) =>
        prev.map(
          (record) =>
            updatedDataArray.find((upd) => upd.id === record.id) || record
        )
      );
    } catch (error) {
      console.error("Error updating records:", error);
    }
  }

  async function deleteRecord(endpoint, id, setState) {
    try {
      const response = await fetch(`${endpoint}/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete record");
      setState((prev) => prev.filter((record) => record.id !== id));
    } catch (error) {
      console.error("Error deleting record:", error);
    }
  }

  if (loading) {
    return <Spinner />; // Show Spinner while loading is true
  }

  return (
    <DataContext.Provider
      value={{
        players,
        mtsaPlayers,
        tnsoccerPlayerSeasons,
        divisions,
        seasons,
        currentSeason,
        setCurrentSeason,
        teams,
        leagues,
        missingPlayers,
        loading,
        createRecord,
        updateRecord,
        deleteRecord,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useDataContext() {
  return useContext(DataContext);
}
