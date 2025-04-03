"use client";

import UploadExcelTnSoccer from "@/components/UploadExcelTnSoccer";
import UploadExcelMTSA from "@/components/UploadExcelMTSA";
import { addUniqueId } from "@/util/functions";

import Spinner from "@/components/Spinner";
import { useDataContext } from "@/contexts/DataContext";
import ExcelJS from "exceljs";

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
  async function createAffinityWorkbook(filteredData) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Filtered New Records");

    // Define column headers and keys
    worksheet.columns = [
      { header: "SIDCode", key: "sidCode", width: 20 }, // Assuming this comes from your data
      { header: "Season", key: "season", width: 20 }, // Assuming this comes from your data

      { header: "PlayerLastName", key: "last_name", width: 20 },
      { header: "PlayerFirstName", key: "first_name", width: 20 },
      { header: "MiddleInitialName", key: "middle_initial", width: 10 }, // You need to add this to your data if available
      { header: "PlayerSuffix", key: "suffix", width: 10 }, // You need to add this to your data if available
      { header: "Alias", key: "alias", width: 10 }, // You need to add this to your data if available
      { header: "Gender", key: "gender", width: 10 },
      {
        header: "DOB",
        key: "dob",
        width: 15,
        style: { numFmt: "MM/DD/YYYY" },
      },
      { header: "PlayLevelCode", key: "play_type", width: 10 },
      { header: "Address1", key: "address", width: 30 },
      { header: "City", key: "city", width: 20 },
      { header: "State", key: "state", width: 15 },
      {
        header: "ZIPCODE",
        key: "zip",
        width: 10,
        style: { numFmt: "0" },
      },
      { header: "Affinity Use Only", key: "affinity_use_only", width: 10 }, // You need to add this to your data if available
      { header: "Affinity Use Only2", key: "affinity_use_only2", width: 10 }, // You need to add this to your data if available
      { header: "SeasonID", key: "season_id", width: 10 }, // Assuming this comes from your data
      { header: "Home Phone", key: "home_phone", width: 10 }, // You need to add this to your data if available
      { header: "Cell Phone", key: "phone", width: 15 },
      { header: "Email", key: "email", width: 25 },

      { header: "Affinity Use Only3", key: "affinity_use_only3", width: 10 }, // You need to add this to your data if available
      { header: "Affinity Use Only4", key: "affinity_use_only4", width: 10 }, // You need to add this to your data if available
      { header: "Affinity Use Only5", key: "affinity_use_only5", width: 10 }, // You need to add this to your data if available
      { header: "Affinity Use Only6", key: "affinity_use_only6", width: 10 }, // You need to add this to your data if available
      { header: "Affinity Use Only7", key: "affinity_use_only7", width: 10 }, // You need to add this to your data if available
      { header: "Alternate Player ID", key: "alternate_player_id", width: 25 }, // You need to add this to your data if available

      { header: "TeamID", key: "team_id", width: 20 }, // You need to add this to your data if available
      { header: "TeamName", key: "team_name", width: 20 }, // You need to add this to your data if available
      { header: "School", key: "school", width: 20 }, // You need to add this to your data if available
    ];

    // Map filteredData to worksheet rows
    filteredData.forEach((record) => {
      const row = {
        sidCode: leagues[0].sid_code, // Assuming leagues[0].sid_code is accessible
        season: currentSeason.tnsoccer_season_name, // Assuming currentSeason.tnsoccer_season_name is accessible
        season_id: currentSeason.tnsoccer_season_id, // Assuming currentSeason.tnsoccer_season_id is accessible
        last_name: record.last_name,
        first_name: record.first_name,
        gender: record.gender,
        dob: record.dob,
        play_type: record.play_type,
        address: record.address,
        city: record.city,
        state: record.state,
        zip: +record.zip,
        phone: record.phone,
        email: record.email,
      };
      worksheet.addRow(row);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "filtered_new_records.xlsx";
    link.click();
  }

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
      <button onClick={() => createAffinityWorkbook(missingPlayers)}>
        Click to Add
      </button>
    </>
  );
}

export default UploadContainer;
