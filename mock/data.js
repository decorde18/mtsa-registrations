// mock/data.js

const today = new Date().toISOString().split("T")[0];

const mockSeasons = [
  {
    id: 1,
    mtsa_name: "Spring 2025",
    actual_year: 2025,
    tnsoccer_year: 2024,
    tnsoccer_season_id: 2590,
    tnsoccer_season_name: "Spring 2025",
    is_active: true,
    playerCount: 200,
  },
  {
    id: 2,
    mtsa_name: "Fall 2024",
    actual_year: 2024,
    tnsoccer_year: 2024,
    tnsoccer_season_id: 2508,
    tnsoccer_season_name: "Fall 2024-2025",
    is_active: false,
    playerCount: 140,
  },
];

const mockPlayers = [
  {
    id: 1,
    firstName: "Jane",
    lastName: "Doe",
    unique_id: "JD2025",
    birthDate: "2012-05-14",
    teamId: 1,
  },
  {
    id: 2,
    firstName: "Emily",
    lastName: "Smith",
    unique_id: "ES2025",
    birthDate: "2011-09-09",
    teamId: 2,
  },
];

const mockMtsaPlayers = [
  {
    id: 1,
    player_id: 1,
    season_id: 1,
    team_id: 1,
    division_id: 1,
  },
];

const mockTnSoccerPlayerSeasons = [
  {
    id: 1,
    player_id: 2,
    season_id: 1,
    team_id: 2,
    league_id: 1,
  },
];

const mockDivisions = [
  { id: 1, name: "Division 1", season_id: 1 },
  { id: 2, name: "Division 2", season_id: 2 },
];

const mockTeams = [
  { id: 1, name: "Team Alpha", season_id: 1, division_id: 1 },
  { id: 2, name: "Team Bravo", season_id: 1, division_id: 1 },
];

const mockLeagues = [{ id: 1, name: "League A", season_id: 1 }];

const mockMissingPlayers = [
  {
    id: 3,
    firstName: "Unregistered",
    lastName: "Player",
    unique_id: "UP2025",
    teamId: 1,
  },
];

const mockData = {
  "/api/seasons": mockSeasons,
  "/api/players": mockPlayers,
  "/api/mtsaPlayers": mockMtsaPlayers,
  "/api/tnsoccerPlayerSeasons": mockTnSoccerPlayerSeasons,
  "/api/divisions": mockDivisions,
  "/api/teams": mockTeams,
  "/api/leagues": mockLeagues,
  "/api/missingPlayers": mockMissingPlayers,
};

export default mockData;
