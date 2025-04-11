"use client";

import UploadExcelTnSoccer from "@/components/UploadExcelTnSoccer";
import UploadExcelMTSA from "@/components/UploadExcelMTSA";
import { addUniqueId } from "@/util/functions";

import Spinner from "@/components/Spinner";
import { useDataContext } from "@/contexts/DataContext";

import MissingPlayers from "@/components/MissingPlayers";

function UploadContainer() {
  const {
    players,
    mtsaPlayers,
    tnsoccerPlayerSeasons,
    divisions,
    seasons,
    currentSeason,
    teams,
    leagues,
    missingPlayers,
    loading,
    createRecord,
    updateRecord,
    deleteRecord,
  } = useDataContext();

  if (loading) return <Spinner />;

  const filteredPlayers = players
    .filter(
      (player) =>
        player.dob &&
        player.first_name &&
        player.last_name &&
        typeof player.first_name === "string" &&
        typeof player.last_name === "string"
    )
    .map((player) => addUniqueId(player));

  const league = leagues[0];

  const seasonMissingPlayers = missingPlayers.filter(
    (player) => +player.tnsoccer_year === currentSeason.tnsoccer_year
  );
  return (
    <>
      <div>
        <UploadExcelTnSoccer
          existingPlayers={filteredPlayers}
          tnPlayers={tnsoccerPlayerSeasons}
          season={currentSeason}
          league={league}
          createRecord={createRecord}
          updateRecord={updateRecord}
          deleteRecord={deleteRecord}
        />
        <UploadExcelMTSA
          existingPlayers={filteredPlayers}
          mtsaPlayers={mtsaPlayers}
          season={currentSeason}
          divisions={divisions}
          teams={teams}
          league={league}
          createRecord={createRecord}
          updateRecord={updateRecord}
          deleteRecord={deleteRecord}
        />
      </div>
      <MissingPlayers
        missingPlayers={seasonMissingPlayers}
        leagues={leagues}
        currentSeason={currentSeason}
      />
    </>
  );
}

export default UploadContainer;
