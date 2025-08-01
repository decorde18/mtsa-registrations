"use client";
import styled from "styled-components";
import { Settings } from "lucide-react";
const Header = styled.div`
  background: white;
  border-radius: 12px;
  padding: 30px;
  margin-bottom: 30px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
`;
const Title = styled.h1`
  color: #2d3748;
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0 0 10px 0;
  display: flex;
  align-items: center;
  gap: 15px;
`;
const Subtitle = styled.p`
  color: #718096;
  font-size: 1.1rem;
  margin: 0;
`;
function AdminDashboardHeader() {
  return (
    <Header>
      <Title>
        <Settings />
        Admin Dashboard
      </Title>
      <Subtitle>
        Manage seasons, upload player data, and generate state registration
        files
      </Subtitle>
    </Header>
  );
}

export default AdminDashboardHeader;
