"use client";
import { useState } from "react";
import TeamSelector from "@/components/TeamSelector";
import Roster from "@/components/Roster";

export default function TeamsPage() {
  const [selectedTeam, setSelectedTeam] = useState(null);

  return (
    <div>
      <h1 className='noprint'>Team & Roster Selector</h1>
      <TeamSelector onTeamSelect={setSelectedTeam} />
      <Roster team={selectedTeam} />
    </div>
  );
}
