"use client";

import styled from "styled-components";
import { useState } from "react";
import { Calendar, Plus, Edit2, Trash2, Eye, EyeOff } from "lucide-react";
import SeasonsContentCardModal from "./SeasonsContentCardModal";
import Button from "@/styles/components/Button";
import { useDataOperations } from "@/hooks/useDataOperations";
import { useDataContext } from "@/contexts/DataContext";
import {
  ContentCard,
  HeaderContainer,
  HeaderLeft,
  SectionTitle,
} from "@/styles/components/Card";

const YearSelect = styled.select`
  background: ${({ theme }) => theme.colors.white};
  border: 2px solid ${({ theme }) => theme.colors.border};
  border-radius: 8px;
  padding: 12px 16px;
  font-size: ${({ theme }) => theme.fontSize.small};
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  cursor: pointer;
  transition: all 0.2s ease;
  outline: none;
  min-width: 140px;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
  }

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;
const AddButton = styled.button`
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.white};
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  &:hover {
    background: ${({ theme }) => theme.colors.secondary};
    transform: translateY(-1px);
  }
`;
const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
`;
const StatCard = styled.div`
  background: linear-gradient(
    135deg,
    ${({ theme }) => theme.colors.primary},
    ${({ theme }) => theme.colors.secondary}
  );
  color: ${({ theme }) => theme.colors.white};
  padding: 24px;
  border-radius: 12px;
  text-align: center;
  transition: transform 0.2s ease;
  &:hover {
    transform: translateY(-2px);
  }
`;
const StatValue = styled.div`
  font-size: 2.5rem;
  font-weight: 800;
  margin-bottom: 8px;
  line-height: 1;
`;
const StatLabel = styled.div`
  font-size: ${({ theme }) => theme.fontSize.small};
  opacity: 0.9;
  font-weight: 500;
`;
const SeasonGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
`;
const SeasonCard = styled.div`
  background: ${({ $active, theme }) =>
    $active
      ? `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`
      : theme.colors.white};
  color: ${({ $active, theme }) =>
    $active ? theme.colors.white : theme.colors.text};
  border: 2px solid
    ${({ $active, theme }) =>
      $active ? theme.colors.primary : theme.colors.border};
  border-radius: 16px;
  padding: 24px;
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
    background: ${({ $active, theme }) =>
      $active ? theme.colors.accent : theme.colors.border};
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
  }
`;
const SeasonHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  gap: 12px;
`;
const SeasonName = styled.h3`
  font-size: ${({ theme }) => theme.fontSize.medium};
  font-weight: 700;
  margin: 0;
  flex: 1;
  line-height: 1.3;
`;
const SeasonActions = styled.div`
  display: flex;
  gap: 8px;
  flex-shrink: 0;
`;
const ActionButton = styled.button`
  background: ${({ variant, $active, theme }) => {
    if (variant === "danger") return theme.colors.error;
    return $active ? "rgba(255, 255, 255, 0.2)" : theme.colors.muted;
  }};
  color: ${({ variant, $active, theme }) => {
    if (variant === "danger") return theme.colors.white;
    return $active ? theme.colors.white : theme.colors.text;
  }};
  border: none;
  padding: 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: ${({ variant, theme }) =>
      variant === "danger" ? theme.colors.errorHover : "rgba(0, 0, 0, 0.1)"};
    transform: scale(1.05);
  }
`;
const SeasonInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;
const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: ${({ theme }) => theme.fontSize.small};
  opacity: 0.9;
  font-weight: 500;
`;
const StatusBadge = styled.span`
  background: ${({ $active, theme }) =>
    $active ? theme.colors.success : theme.colors.muted};
  color: ${({ theme }) => theme.colors.white};
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;
const ToastContainer = styled.div`
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: 9999;
`;
const Toast = styled.div`
  background: ${({ type, theme }) => {
    switch (type) {
      case "success":
        return theme.colors.success;
      case "error":
        return theme.colors.error;
      default:
        return theme.colors.primary;
    }
  }};
  color: ${({ theme }) => theme.colors.white};
  padding: 16px 24px;
  border-radius: 12px;
  margin-bottom: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  font-weight: 600;
  animation: slideIn 0.3s ease;

  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;

function SeasonsContentCard({}) {
  const { seasons: loadedSeasons } = useDataContext();
  const [seasons, setSeasons] = useState(loadedSeasons);
  const [editingSeason, setEditingSeason] = useState(null);
  const [formData, setFormData] = useState({
    mtsa_name: "",
    tnsoccer_year: new Date().getFullYear(),
    tnsoccer_season_id: "",
    tnsoccer_season_name: "",
    actual_year: new Date().getFullYear(),
    is_active: true,
  });
  const { deleteRecord, updateRecord } = useDataOperations();

  const [showModal, setShowModal] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [selectedYear, setSelectedYear] = useState("all");

  const showToast = (message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3000);
  };

  // Get unique years from seasons for the dropdown
  const uniqueYears = [...new Set(seasons.map((s) => s.tnsoccer_year))].sort(
    (a, b) => b - a
  );

  // Filter seasons based on selected year
  const filteredSeasons =
    selectedYear === "all"
      ? seasons
      : seasons.filter((s) => s.tnsoccer_year === parseInt(selectedYear));

  const activeSeasons = filteredSeasons.filter((s) => s.is_active);
  const totalTnPlayers = filteredSeasons.reduce(
    (sum, s) => sum + s.total_tnsoccer_players,
    0
  );
  const totalMtsaPlayers = filteredSeasons.reduce(
    (sum, s) => sum + s.unique_mtsa_players,
    0
  );

  const handleEdit = (season) => {
    setEditingSeason(season);
    setFormData({
      mtsa_name: season.mtsa_name,
      tnsoccer_year: season.tnsoccer_year,
      tnsoccer_season_id: season.tnsoccer_season_id,
      tnsoccer_season_name: season.tnsoccer_season_name,
      actual_year: season.actual_year,
      is_active: season.is_active,
    });

    setShowModal(true);
  };

  const handleDelete = async (seasonId) => {
    if (window.confirm("Are you sure you want to delete this season?")) {
      setSeasons(seasons.filter((s) => s.id !== seasonId));
      showToast("Season deleted successfully", "success");
    }
    try {
      await deleteRecord("seasons", seasonId);
    } catch (error) {
      console.log("Failed to delete season", error);
    }
  };

  const toggleSeasonStatus = async (seasonId) => {
    const season = seasons.find((s) => s.id === seasonId);
    setSeasons(
      seasons.map((s) =>
        s.id === seasonId ? { ...s, is_active: !s.is_active } : s
      )
    );
    try {
      await updateRecord("seasons", season.id, {
        is_active: !seasons.find((s) => s.id === seasonId).is_active,
      });
    } catch (error) {
      console.log("Failed to edit season", error);
    }
    showToast(
      `Season ${season.is_active ? "deactivated" : "activated"} successfully`,
      "success"
    );
  };

  const handleYearChange = (e) => {
    setSelectedYear(e.target.value);
  };

  return (
    <>
      <ContentCard>
        <HeaderContainer>
          <HeaderLeft>
            <SectionTitle>
              <Calendar />
              Season Management
            </SectionTitle>
            <YearSelect value={selectedYear} onChange={handleYearChange}>
              <option value='all'>All Years</option>
              {uniqueYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </YearSelect>
          </HeaderLeft>
          <AddButton onClick={() => setShowModal(true)}>
            <Plus size={20} />
            Add Season
          </AddButton>
        </HeaderContainer>

        <StatsGrid>
          <StatCard>
            <StatValue>{filteredSeasons.length}</StatValue>
            <StatLabel>Total Seasons</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>{activeSeasons.length}</StatValue>
            <StatLabel>Active Seasons</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>{totalMtsaPlayers}</StatValue>
            <StatLabel>Total MTSA Players</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>{totalTnPlayers}</StatValue>
            <StatLabel>Total TNSoccer Players</StatLabel>
          </StatCard>
        </StatsGrid>

        <SeasonGrid>
          {filteredSeasons.map((season) => (
            <SeasonCard key={season.id} $active={season.is_active}>
              <SeasonHeader>
                <SeasonName>{season.mtsa_name}</SeasonName>
                <SeasonActions>
                  <ActionButton
                    $active={season.is_active}
                    onClick={() => toggleSeasonStatus(season.id)}
                  >
                    {season.is_active ? (
                      <EyeOff size={16} />
                    ) : (
                      <Eye size={16} />
                    )}
                  </ActionButton>
                  <ActionButton
                    $active={season.is_active}
                    onClick={() => handleEdit(season)}
                  >
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
                  <span>{new Date(season.startDate).toLocaleDateString()}</span>
                </InfoRow>
                <InfoRow>
                  <span>End Date:</span>
                  <span>{new Date(season.endDate).toLocaleDateString()}</span>
                </InfoRow>
                <InfoRow>
                  <span>Soccer Year:</span>
                  <span>{season.tnsoccer_year}</span>
                </InfoRow>
                <InfoRow>
                  <span>TNSoccer Players:</span>
                  <span>{season.total_tnsoccer_players}</span>
                </InfoRow>
                <InfoRow>
                  <span>MTSA Players:</span>
                  <span>{season.total_mtsa_players}</span>
                </InfoRow>
                <InfoRow>
                  <span>Status:</span>
                  <StatusBadge $active={season.is_active}>
                    {season.is_active ? "Active" : "Inactive"}
                  </StatusBadge>
                </InfoRow>
              </SeasonInfo>
            </SeasonCard>
          ))}
        </SeasonGrid>

        {showModal && (
          <SeasonsContentCardModal
            seasons={seasons}
            setSeasons={setSeasons}
            editingSeason={editingSeason}
            formData={formData}
            setEditingSeason={setEditingSeason}
            setFormData={setFormData}
            onClose={() => setShowModal(false)}
            showToast={showToast}
          />
        )}
      </ContentCard>

      <ToastContainer>
        {toasts.map((toast) => (
          <Toast key={toast.id} type={toast.type}>
            {toast.message}
          </Toast>
        ))}
      </ToastContainer>
    </>
  );
}

export default SeasonsContentCard;
