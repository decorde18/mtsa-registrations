// hooks/useDataOperations.js

import { useDataContext } from "@/contexts/DataContext";

export function useDataOperations() {
  const {
    setPlayers,
    setMtsaPlayers,
    setTnsoccerPlayerSeasons,
    setMissingPlayers,
    setDivisions,
    setSeasons,
    setTeams,
    setLeagues,
    refetch,
  } = useDataContext();

  const apiCall = async (endpoint, options = {}) => {
    // console.log(`Making API call to ${endpoint}`, options);

    const response = await fetch(endpoint, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `API call failed: ${response.status} ${response.statusText}`,
        errorText
      );
      throw new Error(
        `API call failed: ${response.status} ${response.statusText}: ${errorText}`
      );
    }

    const result = await response.json();
    // console.log(`API response from ${endpoint}:`, result);
    return result;
  };

  const createRecord = async (entity, newRecord) => {
    try {
      // console.log(`Creating ${entity} record:`, newRecord);

      const result = await apiCall(`/api/${entity}`, {
        method: "POST",
        body: JSON.stringify(newRecord),
      });

      // console.log(`Created ${entity} record:`, result);

      // Update the appropriate state
      const setterMap = {
        players: setPlayers,
        mtsaPlayers: setMtsaPlayers,
        tnsoccerPlayerSeasons: setTnsoccerPlayerSeasons,
        missingPlayers: setMissingPlayers,
        divisions: setDivisions,
        seasons: setSeasons,
        teams: setTeams,
        leagues: setLeagues,
      };

      const setter = setterMap[entity];
      if (setter) {
        // Use the returned data from the API
        const newRecordWithId = result.data || {
          ...newRecord,
          id: result.id || Date.now(),
        };

        setter((prev) => [...prev, newRecordWithId]);
        // console.log(
        //   `Updated ${entity} state with new record:`,
        //   newRecordWithId
        // );
      } else {
        console.warn(`No setter found for entity: ${entity}`);
      }

      return result;
    } catch (error) {
      console.error(`Error creating ${entity}:`, error);
      throw error;
    }
  };

  const updateRecord = async (entity, id, updatedData) => {
    try {
      // console.log(`Updating ${entity} record ${id}:`, updatedData);

      // Send the complete update data including the ID
      const result = await apiCall(`/api/${entity}`, {
        method: "PATCH",
        body: JSON.stringify({ id, ...updatedData }),
      });

      // console.log(`Updated ${entity} record:`, result);

      const setterMap = {
        players: setPlayers,
        mtsaPlayers: setMtsaPlayers,
        tnsoccerPlayerSeasons: setTnsoccerPlayerSeasons,
        missingPlayers: setMissingPlayers,
        divisions: setDivisions,
        seasons: setSeasons,
        teams: setTeams,
        leagues: setLeagues,
      };

      const setter = setterMap[entity];
      if (setter) {
        setter((prev) =>
          prev.map((item) => {
            if (item.id === id) {
              // Use the returned data from the API if available
              return result.data || { ...item, ...updatedData };
            }
            return item;
          })
        );
      }

      return result;
    } catch (error) {
      console.error(`Error updating ${entity}:`, error);
      throw error;
    }
  };

  const deleteRecord = async (entity, id) => {
    try {
      // console.log(`Deleting ${entity} record ${id}`);

      const result = await apiCall(`/api/${entity}?id=${id}`, {
        method: "DELETE",
      });

      const setterMap = {
        players: setPlayers,
        mtsaPlayers: setMtsaPlayers,
        tnsoccerPlayerSeasons: setTnsoccerPlayerSeasons,
        missingPlayers: setMissingPlayers,
        divisions: setDivisions,
        seasons: setSeasons,
        teams: setTeams,
        leagues: setLeagues,
      };

      const setter = setterMap[entity];
      if (setter) {
        setter((prev) => prev.filter((item) => item.id !== id));
      }

      // console.log(`Deleted ${entity} record ${id}`);
      return result;
    } catch (error) {
      console.error(`Error deleting ${entity}:`, error);
      throw error;
    }
  };

  // Batch operations
  const updateRecords = async (entity, records) => {
    try {
      // console.log(`Batch updating ${entity} records:`, records);

      const result = await apiCall(`/api/${entity}`, {
        method: "PATCH",
        body: JSON.stringify({ records }),
      });

      // console.log(`Batch updated ${entity} records:`, result);

      const setterMap = {
        seasons: setSeasons,
        players: setPlayers,
        mtsaPlayers: setMtsaPlayers,
        tnsoccerPlayerSeasons: setTnsoccerPlayerSeasons,
        missingPlayers: setMissingPlayers,
        divisions: setDivisions,
        teams: setTeams,
        leagues: setLeagues,
      };

      const setter = setterMap[entity];
      if (setter && result.updatedRecords) {
        setter((prev) =>
          prev.map((item) => {
            const updated = result.updatedRecords.find((r) => r.id === item.id);
            return updated ? { ...item, ...updated } : item;
          })
        );
      }

      return result;
    } catch (error) {
      console.error(`Error batch updating ${entity}:`, error);
      throw error;
    }
  };

  return {
    createRecord,
    updateRecord,
    deleteRecord,
    updateRecords,
    refetch,
  };
}
