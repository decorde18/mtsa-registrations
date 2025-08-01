"use client";

import { useDataContext } from "@/contexts/DataContext";

import { useEffect, useState } from "react";
import styled from "styled-components";

const Div = styled.div`
  display: flex;
  padding: 2.5rem;
  display: flex;
  justify-content: center;
  gap: 2rem;
  @media (max-width: 768px) {
    width: 100%;
    flex-direction: column; /* Stack team and roster selector */
    gap: var(--padding-small);
    align-items: center;
    padding: var(--padding-small);
    font-size: 1.2rem; /* Reduce text size */
  }
`;

export default function TeamSelector({ onTeamSelect }) {
  const { divisions, teams, currentSeason, mtsaPlayers } = useDataContext();

  const [filteredDivisions, setFilteredDivisions] = useState([]);
  const [selectedDivision, setSelectedDivision] = useState();
  const [filteredTeams, setFilteredTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState("");

  useEffect(() => {
    if (currentSeason && mtsaPlayers.length > 0) {
      const filteredSeasonPlayers = mtsaPlayers.filter(
        (player) => player.season_id === currentSeason.id
      );
      const uniqueDivisions = [
        ...new Set(filteredSeasonPlayers.map((player) => player.division_id)),
      ];

      setFilteredDivisions(
        uniqueDivisions
          .filter((division) => division !== null)
          .map((division) => divisions.find((d) => d.id === division))
      );
    }
  }, [currentSeason, mtsaPlayers]);
  useEffect(() => {
    if (selectedDivision) {
      const filteredSeasonPlayers = mtsaPlayers
        .filter((player) => player.season_id === currentSeason.id)
        .filter((player) => player.division_id == selectedDivision);
      const uniqueTeams = [
        ...new Set(filteredSeasonPlayers.map((player) => player.team_id)),
      ];

      setFilteredTeams(
        uniqueTeams
          .filter((team) => team !== null)
          .map((team) => teams.find((t) => t.id === team))
      );

      setSelectedTeam();
      onTeamSelect("");
    }
  }, [currentSeason, selectedDivision, teams]);

  return (
    <div className='noprint'>
      <Div>
        <label>Select Division:</label>
        <select
          value={selectedDivision}
          onChange={(e) => setSelectedDivision(e.target.value)}
        >
          <option value=''>-- Select Division --</option>
          {filteredDivisions.map((division) => (
            <option key={division.id} value={division.id}>
              {division.mtsa_name}
            </option>
          ))}
        </select>

        {selectedDivision && (
          <>
            <label>Select Team:</label>
            <select
              value={selectedTeam}
              onChange={(e) => {
                const selected = {
                  ...filteredTeams.find(
                    (team) => `${team.id}-${selectedDivision}` == e.target.value
                  ),
                  division_id: selectedDivision,
                  division_name: divisions.find((d) => d.id == selectedDivision)
                    .mtsa_name,
                };
                setSelectedTeam(e.target.value);
                onTeamSelect(selected);
              }}
            >
              <option value=''>-- Select Team --</option>
              {filteredTeams.map((team) => (
                <option
                  key={`${team.id}-${selectedDivision}`}
                  value={`${team.id}-${selectedDivision}`}
                >
                  {team.name} (
                  {divisions.find((d) => d.id == selectedDivision).mtsa_name})
                </option>
              ))}
            </select>
          </>
        )}
      </Div>
    </div>
  );
}
