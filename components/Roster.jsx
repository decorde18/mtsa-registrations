"use client";

import { getPlayers } from "@/lib/actions";
import { useEffect, useState } from "react";
import styles from "./roster.module.css";

export default function Roster({ team }) {
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    if (team) {
      getPlayers(team.team_id, team.division_id).then(setPlayers);
    }
  }, [team]);

  const handlePrint = () => {
    window.print();
  };
  if (!team) return <p>Please select a team.</p>;
  if (!players.length) return <p>Loading roster...</p>;

  return (
    <div className={styles.roster_container}>
      {/* Header with logos */}
      <div className={styles.roster_header}>
        <img src='/images/logo.png' alt='MTSA Logo' className={styles.logo} />
        <div className={styles.team_info}>
          <h1>Middle Tennessee Soccer Alliance</h1>
          <h2>{team.team_name}</h2>
          <p>Division: {team.division_name}</p>
          <p>Season: {team.season_name}</p>
        </div>
        <img
          src='/images/tnsoccer.png'
          alt='Right Logo'
          className={styles.logo}
        />
      </div>
      {/* Print Button */}
      <button onClick={handlePrint} className={styles.print_button}>
        Print Roster
      </button>

      {/* Table */}
      <table className={styles.roster_table}>
        <thead>
          <tr>
            <th>Full Name</th>
            <th>Season Age</th>
            <th>Player ID</th>
          </tr>
        </thead>
        <tbody>
          {players.map((player) => (
            <tr key={player.id}>
              <td>{player.fullname}</td>
              <td>{player.age}</td>
              <td>{player.player_id}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
