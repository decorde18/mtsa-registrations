"use client";

import { createContext, useContext, useState, useEffect } from "react";
import Spinner from "@/components/Spinner";

const DataContext = createContext();

const ENDPOINTS = {
  players: "/api/players",
  mtsaPlayers: "/api/mtsaPlayers",
  tnsoccerPlayerSeasons: "/api/tnsoccerPlayerSeasons",
  divisions: "/api/divisions",
  seasons: "/api/seasons",
  teams: "/api/teams",
  leagues: "/api/leagues",
  missingPlayers: "/api/missingPlayers",
};

export function DataProvider({ children }) {
  const [data, setData] = useState({
    players: [],
    mtsaPlayers: [],
    tnsoccerPlayerSeasons: [],
    divisions: [],
    seasons: [],
    teams: [],
    leagues: [],
    missingPlayers: [],
  });

  const [currentSeason, setCurrentSeason] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const useMockData =
    process.env.NODE_ENV === "development" &&
    process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";

  const fetchData = async (endpoint, key) => {
    try {
      if (useMockData) {
        const mockModule = await import("@/mock/data.js");
        const mockData = mockModule.default;
        console.log(`Using mock data for ${key}:`, mockData[key]?.length || 0);
        return mockData[key] || [];
      }

      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      const dataArray = result.data || result || [];
      return Array.isArray(dataArray) ? dataArray : [];
    } catch (error) {
      console.error(`Error fetching ${key} from ${endpoint}:`, error);
      setError((prev) => ({
        ...prev,
        [key]: `Failed to fetch ${key}: ${error.message}`,
      }));
      return [];
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    setError(null);

    try {
      // console.log("Starting data load...");

      const results = await Promise.allSettled(
        Object.entries(ENDPOINTS).map(async ([key, endpoint]) => {
          const result = await fetchData(endpoint, key);
          return [key, result];
        })
      );

      const newData = { ...data };
      const errors = {};

      results.forEach((result, index) => {
        const [key] = Object.entries(ENDPOINTS)[index];

        if (result.status === "fulfilled") {
          const [dataKey, value] = result.value;
          newData[dataKey] = value;
        } else {
          console.error(`Failed to load ${key}:`, result.reason);
          errors[key] = result.reason.message;
        }
      });

      setData(newData);

      // Set current season immediately after data is loaded
      if (newData.seasons?.length && newData.leagues?.length) {
        const current = newData.seasons.find(
          (season) => season.id === newData.leagues[0]?.recent_season
        );

        setCurrentSeason(current);
      }

      if (Object.keys(errors).length > 0) {
        setError(errors);
      }

      // console.log("Data load complete:", newData);
    } catch (error) {
      console.error("Error loading data:", error);
      setError({ general: "Failed to load data" });
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    loadAllData();
  }, []);

  // Setter functions for individual data types
  const setters = {
    setPlayers: (value) =>
      setData((prev) => ({
        ...prev,
        players: typeof value === "function" ? value(prev.players) : value,
      })),
    setMtsaPlayers: (value) =>
      setData((prev) => ({
        ...prev,
        mtsaPlayers:
          typeof value === "function" ? value(prev.mtsaPlayers) : value,
      })),
    setTnsoccerPlayerSeasons: (value) =>
      setData((prev) => ({
        ...prev,
        tnsoccerPlayerSeasons:
          typeof value === "function"
            ? value(prev.tnsoccerPlayerSeasons)
            : value,
      })),
    setMissingPlayers: (value) =>
      setData((prev) => ({
        ...prev,
        missingPlayers:
          typeof value === "function" ? value(prev.missingPlayers) : value,
      })),
    setDivisions: (value) =>
      setData((prev) => ({
        ...prev,
        divisions: typeof value === "function" ? value(prev.divisions) : value,
      })),
    setSeasons: (value) =>
      setData((prev) => ({
        ...prev,
        seasons: typeof value === "function" ? value(prev.seasons) : value,
      })),
    setTeams: (value) =>
      setData((prev) => ({
        ...prev,
        teams: typeof value === "function" ? value(prev.teams) : value,
      })),
    setLeagues: (value) =>
      setData((prev) => ({
        ...prev,
        leagues: typeof value === "function" ? value(prev.leagues) : value,
      })),
  };

  if (loading) {
    return <Spinner />;
  }

  // console.log(data);
  return (
    <DataContext.Provider
      value={{
        // Data
        ...data,
        currentSeason,

        // State
        loading,
        error,

        // Setters
        ...setters,
        setCurrentSeason,

        // Utilities
        refetch: loadAllData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}
export function useDataContext() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useDataContext must be used within a DataProvider");
  }
  return context;
}
