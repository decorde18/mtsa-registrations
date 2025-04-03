import { useState, useEffect, useCallback } from "react";

const useFetchData = (endpoint) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true; // Prevent state updates on unmounted components
    const fetchData = async () => {
      try {
        const response = await fetch(endpoint);
        if (!response.ok) {
          throw new Error(`Failed to fetch data from ${endpoint}`);
        }
        const result = await response.json();
        if (isMounted) {
          setData(result.data || []); // Ensure 'data' is always an array
        }
      } catch (error) {
        console.error(`Error fetching data from ${endpoint}:`, error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => {
      isMounted = false; // Cleanup function to avoid setting state on unmounted components
    };
  }, [endpoint]); // Only runs when endpoint changes

  return { data, setData, loading }; // Return setData for updates
};
// Custom hook to handle CRUD operations
const useCrudOperations = (endpoint) => {
  const { data, setData, loading } = useFetchData(endpoint);

  const createRecord = useCallback(
    async (newRecords) => {
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newRecords),
        });

        if (!response.ok) throw new Error("Failed to create record");

        const createdRecord = await response.json();
        setData((prevData) => [...prevData, createdRecord]);
      } catch (error) {
        console.error("Error creating record:", error);
      }
    },
    [endpoint, setData]
  );

  const updateRecord = async (updatedRecords) => {
    try {
      if (!Array.isArray(updatedRecords) || updatedRecords.length === 0) {
        throw new Error("Invalid input: expected an array of updated records.");
      }

      const response = await fetch(`${endpoint}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records: updatedRecords }),
      });

      if (!response.ok) {
        throw new Error("Failed to update records");
      }

      const { updatedRecords: updatedDataArray } = await response.json(); // Extract updated records

      setData((prevData) =>
        prevData.map((record) => {
          const updatedRecord = updatedDataArray.find(
            (upd) => upd.id === record.id
          );
          return updatedRecord ? updatedRecord : record;
        })
      );
    } catch (error) {
      console.error("Error updating records:", error);
    }
  };

  const deleteRecord = useCallback(
    async (id) => {
      try {
        const response = await fetch(`${endpoint}/${id}`, { method: "DELETE" });

        if (!response.ok) throw new Error("Failed to delete record");

        setData((prevData) => prevData.filter((record) => record.id !== id));
      } catch (error) {
        console.error("Error deleting record:", error);
      }
    },
    [endpoint, setData]
  );

  return { data, loading, createRecord, updateRecord, deleteRecord };
};

// Specific hooks for different endpoints
const useExistingPlayers = () => useCrudOperations("/api/players");
const useMtsaPlayers = () => useCrudOperations("/api/mtsaPlayers");
const useTnSoccerPlayerSeasons = () =>
  useCrudOperations("/api/tnsoccerPlayerSeasons");
const useDivisions = () => useCrudOperations("/api/divisions");
const useSeasons = () => useCrudOperations("/api/seasons");
const useTeams = () => useCrudOperations("/api/teams");
const useLeagues = () => useCrudOperations("/api/leagues");
const useMissingPlayers = () => useCrudOperations("/api/missingPlayers");

export {
  useExistingPlayers,
  useDivisions,
  useSeasons,
  useTeams,
  useTnSoccerPlayerSeasons,
  useMtsaPlayers,
  useLeagues,
  useMissingPlayers,
};
