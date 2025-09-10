"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useCallback } from "react";
import { useDataContext } from "@/contexts/DataContext";
import styled from "styled-components";

const HeaderContainer = styled.header`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.paddingMedium};
  box-shadow: 0px 4px 8px ${({ theme }) => theme.colors.shadow};
  text-align: center;
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.white};

  @media print {
    display: none;
  }

  @media (max-width: 768px) {
    flex-direction: column;
    padding: ${({ theme }) => theme.spacing.paddingSmall};
  }
`;

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  cursor: pointer;
  margin-bottom: ${({ theme }) => theme.spacing.paddingSmall};
  width: 30%;

  img {
    height: auto;
    width: ${({ theme }) => theme.logo.width};
    margin-right: ${({ theme }) => theme.spacing.paddingSmall};
  }

  @media (max-width: 768px) {
    width: 100%;
    justify-content: center;
    margin-bottom: ${({ theme }) => theme.spacing.paddingSmall};

    img {
      width: ${({ theme }) => theme.logo.widthSmall};
    }
  }
`;

const Title = styled.h1`
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  font-size: 2.5rem;
  margin: 0;

  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

const Controls = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.paddingSmall};
  width: 40%;

  @media (max-width: 768px) {
    flex-direction: column;
    width: 100%;
    gap: ${({ theme }) => theme.spacing.paddingSmall};
  }
`;

const StyledSelect = styled.select`
  flex-grow: 1;
  max-width: 400px;
  margin: 0;
  padding: ${({ theme }) => theme.spacing.paddingSmall};
  border-radius: ${({ theme }) => theme.borderRadius.default};
  border: 2px solid ${({ theme }) => theme.colors.white};
  background-color: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.primary};
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.secondary};
  }

  @media (max-width: 768px) {
    width: 90%;
    max-width: 300px;
  }
`;

const Nav = styled.nav`
  width: 30%;

  ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    justify-content: flex-end;
  }

  li {
    margin: 0;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.paddingMedium};
`;

const AuthButton = styled.button`
  padding: ${({ theme }) => theme.spacing.paddingMedium};
  background-color: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.primary};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.default};
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 1.5rem;
  font-weight: ${({ theme }) => theme.fontWeight.medium || "500"};

  &:hover {
    background-color: ${({ theme }) => theme.colors.secondary};
    color: ${({ theme }) => theme.colors.white};
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }

  @media (max-width: 768px) {
    display: none;
  }
`;

function Header() {
  const router = useRouter();
  const { activeSeasons, currentSeason, setCurrentSeason } = useDataContext();
  const { isLoggedIn, setIsLoggedIn } = useAuth();

  // Check authentication status
  useEffect(() => {
    const fetchAuthStatus = async () => {
      try {
        const response = await fetch("/api/auth/status");
        const data = await response.json();
        setIsLoggedIn(data.isAuthenticated);
      } catch (err) {
        console.error("Error fetching auth status:", err);
        setIsLoggedIn(false);
      }
    };

    fetchAuthStatus();
  }, [setIsLoggedIn]);

  const handleSeasonChange = useCallback(
    (e) => {
      const selectedSeasonId = parseInt(e.target.value, 10);
      const selectedSeason = activeSeasons.find(
        (season) => season.id === selectedSeasonId
      );

      if (selectedSeason) {
        setCurrentSeason(selectedSeason);
      }
    },
    [activeSeasons, setCurrentSeason]
  );

  const handleLogout = useCallback(
    async (e) => {
      e.preventDefault();

      try {
        localStorage.removeItem("token");
        await fetch("/api/logout", { method: "GET" });
        setIsLoggedIn(false);
        router.push("/login");
      } catch (error) {
        console.error("Logout error:", error);
        // Still redirect even if logout request fails
        setIsLoggedIn(false);
        router.push("/login");
      }
    },
    [setIsLoggedIn, router]
  );

  const handleLogoClick = useCallback(() => {
    router.push("/");
  }, [router]);

  const handleAdminClick = useCallback(() => {
    router.push("/admin/adminDashboard");
  }, [router]);

  // Don't render season selector if no active seasons or current season
  const shouldShowSeasonSelector = activeSeasons.length > 0 && currentSeason;

  return (
    <HeaderContainer>
      <LogoContainer onClick={handleLogoClick}>
        <img src='/images/logo.png' alt='MTSA Logo' />
        <Title>Middle Tennessee Soccer Alliance</Title>
      </LogoContainer>

      <Controls>
        {shouldShowSeasonSelector && (
          <StyledSelect
            name='season'
            onChange={handleSeasonChange}
            value={currentSeason.id}
            aria-label='Select season'
          >
            {activeSeasons.map((season) => (
              <option key={season.id} value={season.id}>
                {season.mtsa_name}
              </option>
            ))}
          </StyledSelect>
        )}
      </Controls>

      <Nav>
        <ul>
          <li>
            {isLoggedIn ? (
              <ButtonGroup>
                <AuthButton
                  onClick={handleAdminClick}
                  aria-label='Go to admin dashboard'
                >
                  Admin
                </AuthButton>
                <AuthButton onClick={handleLogout} aria-label='Logout'>
                  Logout
                </AuthButton>
              </ButtonGroup>
            ) : (
              <Link href='/login'>
                <AuthButton aria-label='Admin login'>Admin Login</AuthButton>
              </Link>
            )}
          </li>
        </ul>
      </Nav>
    </HeaderContainer>
  );
}

export default Header;
