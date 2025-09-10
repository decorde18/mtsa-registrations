"use client";

import { createContext, useContext, useState, useEffect, useMemo } from "react";
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

  // Memoized computed values
  const activeSeasons = useMemo(() => {
    return data.seasons
      .filter((season) => season.is_active === 1)
      .sort(
        (a, b) =>
          new Date(b.start_date || b.created_at) -
          new Date(a.start_date || a.created_at)
      );
  }, [data.seasons]);

  const mostRecentActiveSeason = useMemo(() => {
    return activeSeasons[0] || null;
  }, [activeSeasons]);

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

      if (Object.keys(errors).length > 0) {
        setError(errors);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      setError({ general: "Failed to load data" });
    } finally {
      setLoading(false);
    }
  };

  // Set current season when seasons data changes or when current season is null
  useEffect(() => {
    if (mostRecentActiveSeason && !currentSeason) {
      setCurrentSeason(mostRecentActiveSeason);
    }
  }, [mostRecentActiveSeason, currentSeason]);

  // Load data on mount
  useEffect(() => {
    loadAllData();
  }, []);

  // Create setter functions dynamically
  const createSetter = (key) => (value) =>
    setData((prev) => ({
      ...prev,
      [key]: typeof value === "function" ? value(prev[key]) : value,
    }));

  const setters = useMemo(() => {
    const setterMap = {};
    Object.keys(data).forEach((key) => {
      const setterName = `set${key.charAt(0).toUpperCase()}${key.slice(1)}`;
      setterMap[setterName] = createSetter(key);
    });
    return setterMap;
  }, []);

  if (loading) {
    return <Spinner />;
  }

  return (
    <DataContext.Provider
      value={{
        // Data
        ...data,
        currentSeason,
        activeSeasons,
        mostRecentActiveSeason,

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
