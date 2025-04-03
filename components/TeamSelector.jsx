"use client";

import { getTeams } from "@/lib/actions";
import { useEffect, useState } from "react";
import styles from "./teamSelector.module.css";

export default function TeamSelector({ onTeamSelect }) {
  const [teams, setTeams] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [selectedDivision, setSelectedDivision] = useState("");
  const [filteredTeams, setFilteredTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState("");

  useEffect(() => {
    getTeams().then((data) => {
      setTeams(data);
      setDivisions([...new Set(data.map((team) => team.division_name))]);
    });
  }, []);

  useEffect(() => {
    if (selectedDivision) {
      setFilteredTeams(
        teams.filter((team) => team.division_name === selectedDivision)
      );
      setSelectedTeam("");
    }
  }, [selectedDivision, teams]);

  return (
    <div className='noprint'>
      <div className={styles.div}>
        <label>Select Division:</label>
        <select
          value={selectedDivision}
          onChange={(e) => setSelectedDivision(e.target.value)}
        >
          <option value=''>-- Select Division --</option>
          {divisions.map((division) => (
            <option key={division} value={division}>
              {division}
            </option>
          ))}
        </select>

        {selectedDivision && (
          <>
            <label>Select Team:</label>
            <select
              value={selectedTeam}
              onChange={(e) => {
                const selected = filteredTeams.find(
                  (team) =>
                    `${team.team_id}-${team.division_id}` === e.target.value
                );
                setSelectedTeam(e.target.value);
                onTeamSelect(selected);
              }}
            >
              <option value=''>-- Select Team --</option>
              {filteredTeams.map((team) => (
                <option
                  key={`${team.team_id}-${team.division_id}`}
                  value={`${team.team_id}-${team.division_id}`}
                >
                  {team.team_name} ({team.division_name})
                </option>
              ))}
            </select>
          </>
        )}
      </div>
    </div>
  );
}
