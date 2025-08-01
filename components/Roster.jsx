"use client";

import { useEffect, useState } from "react";
import styled from "styled-components";
import Button from "@/styles/components/Button";
import { useDataContext } from "@/contexts/DataContext";

const RosterContainer = styled.div`
  max-width: 80rem;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
`;
const RosterHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;
const Logo = styled.img`
  width: 8rem;
  height: auto;
`;
const TeamInfo = styled.div`
  display: flex;
  text-align: center;
  flex-direction: column;
  gap: 10px;
`;
const PrintButton = styled(Button)`
  background-color: ${({ theme }) => theme.colors.primary};
  color: white;
  border: none;
  padding: 1rem 1.5rem;
  font-size: 1.6rem;
  cursor: pointer;
  margin-bottom: 1rem;

  &:hover {
    background-color: ${({ theme }) => theme.colors.secondary};
  }

  @media print {
    display: none;
  }
`;
const RosterTable = styled.table`
  width: 100%;
  border-collapse: collapse;

  th,
  td {
    border: 1px solid ${({ theme }) => theme.colors.border};
    padding: 0.5rem;
  }

  th {
    background-color: ${({ theme }) => theme.colors.border};
    font-weight: bold;
  }

  @media print {
    th,
    td {
      border: 1px solid ${({ theme }) => theme.colors.border};
    }
  }
`;
const ResponsiveContainer = styled(RosterContainer)`
  @media (max-width: 768px) {
    max-width: 100%;
  }

  @media print {
    box-shadow: none;
    border: none;
  }
`;

export default function Roster({ team }) {
  const {
    mtsaPlayers,
    players: importedPlayers,
    currentSeason,
  } = useDataContext();
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    if (team) {
      const filteredPlayers = mtsaPlayers.filter(
        (player) =>
          player.season_id === currentSeason.id &&
          player.team_id === team.id &&
          player.division_id == team.division_id
      );
      setPlayers(
        importedPlayers.filter((player) =>
          filteredPlayers.some((p) => p.player_id === player.id)
        )
      );
    }
  }, [team]);

  const handlePrint = () => {
    window.print();
  };

  if (!team) return <p>Please select a team.</p>;
  if (!players.length) return <p>Loading roster...</p>;

  return (
    <ResponsiveContainer>
      {/* Header with logos */}
      <RosterHeader>
        <Logo src='/images/logo.png' alt='MTSA Logo' />
        <TeamInfo>
          <h1>Middle Tennessee Soccer Alliance</h1>
          <h2>{team.name}</h2>
          <h3>Season: {currentSeason.mtsa_name}</h3>
          <h3>Division: {team.division_name}</h3>
        </TeamInfo>
        <Logo src='/images/tnsoccer.png' alt='Right Logo' />
      </RosterHeader>

      {/* Print Button */}
      <PrintButton onClick={handlePrint}>Print Roster</PrintButton>

      {/* Table */}
      <RosterTable>
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
      </RosterTable>
    </ResponsiveContainer>
  );
}
