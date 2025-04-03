"use client";

import UploadExcelTnSoccer from "./UploadExcelTnSoccer";
import UploadExcelMTSA from "./UploadExcelMTSA";
import {
  useExistingPlayers,
  useDivisions,
  useSeasons,
  useTeams,
  useTnSoccerPlayerSeasons,
  useMtsaPlayers,
  useLeagues,
} from "../hooks/useFetchData";
import Spinner from "./Spinner";
import { addUniqueId, dateStringToExcelInt } from "@/util/functions";

function UploadContainer() {
  const mtsaPlayers = useMtsaPlayers();
  const playersCrud = useExistingPlayers();
  const tnsoccerPlayerSeasons = useTnSoccerPlayerSeasons();
  const divisions = useDivisions();
  const seasons = useSeasons();
  const teams = useTeams();
  const leagues = useLeagues();

  if (
    playersCrud.loading ||
    divisions.loading ||
    seasons.loading ||
    teams.loading ||
    tnsoccerPlayerSeasons.loading ||
    mtsaPlayers.loading ||
    leagues.loading
  )
    return <Spinner />;
  const players = playersCrud.data
    .filter(
      (player) =>
        player.dob &&
        player.first_name &&
        player.last_name &&
        typeof player.first_name === "string" &&
        typeof player.last_name === "string"
    )
    .map((player) => addUniqueId(player));
  return (
    <div>
      <UploadExcelTnSoccer
        playersCrud={playersCrud}
        existingPlayers={players}
        playersTn={tnsoccerPlayerSeasons}
        seasons={seasons}
      />
      <UploadExcelMTSA
        playersCrud={playersCrud}
        existingPlayers={players}
        playersMtsa={mtsaPlayers}
        seasons={seasons.data}
        divisions={divisions.data}
        teams={teams.data}
      />
    </div>
  );
}

export default UploadContainer;
