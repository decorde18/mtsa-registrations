"use client";

import styled from "styled-components";
import { Calendar, Upload, Users, FileText } from "lucide-react";

const TabContainer = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.lg};

  flex-wrap: wrap;
`;

const Tab = styled.button`
  background: ${(props) =>
    props.$active ? props.theme.colors.white : "rgba(255, 255, 255, 0.2)"};
  color: ${(props) =>
    props.$active ? props.theme.colors.secondary : props.theme.colors.white};
  border: none;
  padding: 15px 25px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: ${(props) =>
    props.$active ? "0 4px 12px rgba(0, 0, 0, 0.15)" : "none"};

  &:hover {
    background: ${(props) =>
      props.$active ? props.theme.colors.white : "rgba(255, 255, 255, 0.3)"};
    transform: translateY(-2px);
  }
`;

function TabNav({ activeTab, setActiveTab }) {
  return (
    <TabContainer>
      <Tab
        $active={activeTab === "seasons"}
        onClick={() => setActiveTab("seasons")}
      >
        <Calendar />
        Season Management
      </Tab>
      <Tab
        $active={activeTab === "uploads"}
        onClick={() => setActiveTab("uploads")}
      >
        <Upload />
        File Uploads
      </Tab>
      <Tab
        $active={activeTab === "comparison"}
        onClick={() => setActiveTab("comparison")}
      >
        <Users />
        Player Comparison
      </Tab>
      <Tab
        $active={activeTab === "reports"}
        onClick={() => setActiveTab("reports")}
      >
        <FileText />
        Reports
      </Tab>
    </TabContainer>
  );
}

export default TabNav;
