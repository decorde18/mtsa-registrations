"use client";

import React, { useState, useEffect } from "react";
import styled from "styled-components";
import {
  Calendar,
  Upload,
  Users,
  FileText,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react";
import TabNav from "../adminDashboard/TabNav";
import Header from "../adminDashboard/Header";

const AdminContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
`;

const ContentCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
`;
const SectionTitle = styled.h2`
  color: #2d3748;
  font-size: 1.8rem;
  font-weight: 600;
  margin: 0 0 20px 0;
  display: flex;
  align-items: center;
  gap: 12px;
`;
const SeasonGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;
const SeasonCard = styled.div`
  background: ${(props) =>
    props.active ? "linear-gradient(135deg, #4f46e5, #7c3aed)" : "#f8fafc"};
  color: ${(props) => (props.active ? "white" : "#2d3748")};
  border: 2px solid ${(props) => (props.active ? "#4f46e5" : "#e2e8f0")};
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: ${(props) => (props.active ? "#10b981" : "#e2e8f0")};
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
  }
`;
const SeasonHeader = styled.div`
  display: flex;
  justify-content: between;
  align-items: start;
  margin-bottom: 15px;
`;
const SeasonName = styled.h3`
  font-size: 1.4rem;
  font-weight: 600;
  margin: 0;
  flex: 1;
`;
const SeasonActions = styled.div`
  display: flex;
  gap: 8px;
`;
const ActionButton = styled.button`
  background: ${(props) =>
    props.variant === "danger" ? "#ef4444" : "rgba(255, 255, 255, 0.2)"};
  color: ${(props) => (props.variant === "danger" ? "white" : "inherit")};
  border: none;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: ${(props) =>
      props.variant === "danger" ? "#dc2626" : "rgba(255, 255, 255, 0.3)"};
    transform: scale(1.1);
  }
`;
const SeasonInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;
const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
  opacity: 0.9;
`;
const StatusBadge = styled.span`
  background: ${(props) => (props.active ? "#10b981" : "#6b7280")};
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
`;
const Button = styled.button`
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1rem;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(79, 70, 229, 0.3);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;
const Form = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;
const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;
const Label = styled.label`
  font-weight: 600;
  color: #374151;
  font-size: 0.9rem;
`;
const Input = styled.input`
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: #4f46e5;
  }
`;
const Select = styled.select`
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  background: white;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: #4f46e5;
  }
`;
const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;
const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  padding: 30px;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
`;
const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;
const ModalTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 600;
  color: #2d3748;
  margin: 0;
`;
const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6b7280;
  padding: 4px;
  border-radius: 4px;

  &:hover {
    background: #f3f4f6;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;
const StatCard = styled.div`
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  padding: 20px;
  border-radius: 12px;
  text-align: center;
`;
const StatValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 8px;
`;
const StatLabel = styled.div`
  font-size: 0.9rem;
  opacity: 0.9;
`;

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("seasons");
  const [seasons, setSeasons] = useState([
    {
      id: 1,
      name: "Spring 2025",
      startDate: "2025-03-01",
      endDate: "2025-06-30",
      soccerYear: 2025,
      is_active: true,
      playerCount: 245,
    },
    {
      id: 2,
      name: "Fall 2024",
      startDate: "2024-09-01",
      endDate: "2024-12-31",
      soccerYear: 2024,
      is_active: false,
      playerCount: 198,
    },
  ]);
  const [showModal, setShowModal] = useState(false);
  const [editingSeason, setEditingSeason] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    startDate: "",
    endDate: "",
    soccerYear: new Date().getFullYear(),
    is_active: false,
  });

  const handleSeasonSubmit = (e) => {
    e.preventDefault();
    if (editingSeason) {
      setSeasons(
        seasons.map((s) =>
          s.id === editingSeason.id
            ? { ...s, ...formData, id: editingSeason.id }
            : s
        )
      );
    } else {
      setSeasons([
        ...seasons,
        {
          ...formData,
          id: Date.now(),
          playerCount: 0,
        },
      ]);
    }
    setShowModal(false);
    setEditingSeason(null);
    setFormData({
      name: "",
      startDate: "",
      endDate: "",
      soccerYear: new Date().getFullYear(),
      is_active: false,
    });
  };

  const handleEdit = (season) => {
    setEditingSeason(season);
    setFormData({
      name: season.name,
      startDate: season.startDate,
      endDate: season.endDate,
      soccerYear: season.soccerYear,
      is_active: season.is_active,
    });
    setShowModal(true);
  };

  const handleDelete = (seasonId) => {
    if (window.confirm("Are you sure you want to delete this season?")) {
      setSeasons(seasons.filter((s) => s.id !== seasonId));
    }
  };

  const toggleSeasonStatus = (seasonId) => {
    setSeasons(
      seasons.map((s) =>
        s.id === seasonId ? { ...s, is_active: !s.is_active } : s
      )
    );
  };

  const activeSeasons = seasons.filter((s) => s.is_active);
  const totalPlayers = seasons.reduce((sum, s) => sum + s.playerCount, 0);

  return (
    <AdminContainer>
      <Header />
      <TabNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* {activeTab === "seasons" && (
        <ContentCard>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "30px",
            }}
          >
            <SectionTitle>
              <Calendar />
              Season Management
            </SectionTitle>
            <Button onClick={() => setShowModal(true)}>
              <Plus size={20} />
              Add Season
            </Button>
          </div>

          <StatsGrid>
            <StatCard>
              <StatValue>{seasons.length}</StatValue>
              <StatLabel>Total Seasons</StatLabel>
            </StatCard>
            <StatCard>
              <StatValue>{activeSeasons.length}</StatValue>
              <StatLabel>Active Seasons</StatLabel>
            </StatCard>
            <StatCard>
              <StatValue>{totalPlayers}</StatValue>
              <StatLabel>Total Players</StatLabel>
            </StatCard>
          </StatsGrid>

          <SeasonGrid>
            {seasons.map((season) => (
              <SeasonCard key={season.id} active={season.is_active}>
                <SeasonHeader>
                  <SeasonName>{season.name}</SeasonName>
                  <SeasonActions>
                    <ActionButton onClick={() => toggleSeasonStatus(season.id)}>
                      {season.is_active ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </ActionButton>
                    <ActionButton onClick={() => handleEdit(season)}>
                      <Edit2 size={16} />
                    </ActionButton>
                    <ActionButton
                      variant='danger'
                      onClick={() => handleDelete(season.id)}
                    >
                      <Trash2 size={16} />
                    </ActionButton>
                  </SeasonActions>
                </SeasonHeader>
                <SeasonInfo>
                  <InfoRow>
                    <span>Start Date:</span>
                    <span>
                      {new Date(season.startDate).toLocaleDateString()}
                    </span>
                  </InfoRow>
                  <InfoRow>
                    <span>End Date:</span>
                    <span>{new Date(season.endDate).toLocaleDateString()}</span>
                  </InfoRow>
                  <InfoRow>
                    <span>Soccer Year:</span>
                    <span>{season.soccerYear}</span>
                  </InfoRow>
                  <InfoRow>
                    <span>Players:</span>
                    <span>{season.playerCount}</span>
                  </InfoRow>
                  <InfoRow>
                    <span>Status:</span>
                    <StatusBadge active={season.is_active}>
                      {season.is_active ? "Active" : "Inactive"}
                    </StatusBadge>
                  </InfoRow>
                </SeasonInfo>
              </SeasonCard>
            ))}
          </SeasonGrid>
        </ContentCard>
      )} */}

      {/* {activeTab === "uploads" && (
        <ContentCard>
          <SectionTitle>
            <Upload />
            File Upload Center
          </SectionTitle>
          <UploadSection>
            <UploadIcon>📁</UploadIcon>
            <UploadText>
              Drag and drop your Excel files here, or click to browse
            </UploadText>
            <p
              style={{
                color: "#9ca3af",
                fontSize: "0.9rem",
                marginTop: "10px",
              }}
            >
              Supports MTSA and TN Soccer registration files
            </p>
          </UploadSection>
        </ContentCard>
      )} */}

      {activeTab === "comparison" && (
        <ContentCard>
          <SectionTitle>
            <Users />
            Player Comparison
          </SectionTitle>
          <p style={{ color: "#6b7280", marginBottom: "20px" }}>
            Compare league players against state registrations to identify who
            needs to be registered.
          </p>
          <Button>
            <Users />
            Run Comparison
          </Button>
        </ContentCard>
      )}

      {activeTab === "reports" && (
        <ContentCard>
          <SectionTitle>
            <FileText />
            Reports & Exports
          </SectionTitle>
          <p style={{ color: "#6b7280", marginBottom: "20px" }}>
            Generate state registration files and team rosters.
          </p>
          <div style={{ display: "flex", gap: "15px", flexWrap: "wrap" }}>
            <Button>
              <FileText />
              Export State Registration
            </Button>
            <Button>
              <Users />
              Generate Team Rosters
            </Button>
          </div>
        </ContentCard>
      )}

      {showModal && (
        <Modal>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>
                {editingSeason ? "Edit Season" : "Add New Season"}
              </ModalTitle>
              <CloseButton onClick={() => setShowModal(false)}>×</CloseButton>
            </ModalHeader>
            <Form>
              <FormGroup>
                <Label>Season Name</Label>
                <Input
                  type='text'
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder='e.g., Spring 2025'
                  required
                />
              </FormGroup>
              <FormGroup>
                <Label>Start Date</Label>
                <Input
                  type='date'
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  required
                />
              </FormGroup>
              <FormGroup>
                <Label>End Date</Label>
                <Input
                  type='date'
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                  required
                />
              </FormGroup>
              <FormGroup>
                <Label>Soccer Year</Label>
                <Input
                  type='number'
                  value={formData.soccerYear}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      soccerYear: parseInt(e.target.value),
                    })
                  }
                  min='2020'
                  max='2030'
                  required
                />
              </FormGroup>
              <FormGroup>
                <Label>
                  <input
                    type='checkbox'
                    checked={formData.is_active}
                    onChange={(e) =>
                      setFormData({ ...formData, is_active: e.target.checked })
                    }
                    style={{ marginRight: "8px" }}
                  />
                  Active Season
                </Label>
              </FormGroup>
              <div
                style={{
                  display: "flex",
                  gap: "15px",
                  justifyContent: "flex-end",
                }}
              >
                <Button
                  type='button'
                  onClick={() => setShowModal(false)}
                  style={{ background: "#6b7280" }}
                >
                  Cancel
                </Button>
                <Button type='button' onClick={handleSeasonSubmit}>
                  {editingSeason ? "Update Season" : "Create Season"}
                </Button>
              </div>
            </Form>
          </ModalContent>
        </Modal>
      )}
    </AdminContainer>
  );
}

export default AdminDashboard;
