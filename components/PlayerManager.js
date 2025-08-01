// components/PlayerManager.js
import { useDataContext } from "@/context/DataContext";
import { useDataOperations } from "@/hooks/useDataOperations";
import { useState } from "react";

export default function PlayerManager() {
  const { players, loading, error } = useDataContext();
  const { createRecord, updateRecord, deleteRecord } = useDataOperations();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreatePlayer = async (playerData) => {
    setIsSubmitting(true);
    try {
      await createRecord("players", playerData);
      // Player is automatically added to context via the hook
    } catch (error) {
      console.error("Failed to create player:", error);
      // Handle error (show toast, etc.)
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdatePlayer = async (playerId, updatedData) => {
    try {
      await updateRecord("players", playerId, updatedData);
      // Player is automatically updated in context
    } catch (error) {
      console.error("Failed to update player:", error);
    }
  };

  const handleDeletePlayer = async (playerId) => {
    try {
      await deleteRecord("players", playerId);
      // Player is automatically removed from context
    } catch (error) {
      console.error("Failed to delete player:", error);
    }
  };

  if (loading) return <div>Loading players...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Players ({players.length})</h2>
      {/* Your player list and forms here */}
    </div>
  );
}
