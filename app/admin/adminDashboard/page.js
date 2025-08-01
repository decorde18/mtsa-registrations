"use client";
import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { useDataContext } from "@/contexts/DataContext";

import SeasonsContentCard from "./SeasonsContentCard";
import AdminDashboardHeader from "./Header";
import TabNav from "./TabNav";
import UploadContainer from "./UploadContainer";
import PlayerComparison from "./PlayerComparison";

const AdminContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(
    135deg,
    ${({ theme }) => theme.colors.primary},
    ${({ theme }) => theme.colors.secondary} 100%
  );
  padding: 20px;
`;

function Dashboard() {
  const {
    players,
    mtsaPlayers,
    tnsoccerPlayerSeasons,
    divisions,
    seasons: loadedSeasons,
    currentSeason,
    teams,
    leagues,
    missingPlayers,

    createRecord,
    updateRecord,
    deleteRecord,
  } = useDataContext();
  const [activeTab, setActiveTab] = useState("seasons");

  return (
    <AdminContainer>
      <AdminDashboardHeader />
      <TabNav activeTab={activeTab} setActiveTab={setActiveTab} />
      {activeTab === "seasons" && <SeasonsContentCard />}
      {activeTab === "uploads" && <UploadContainer />}
      {activeTab === "comparison" && <PlayerComparison />}
    </AdminContainer>
  );
}

export default Dashboard;
