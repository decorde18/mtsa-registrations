"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { useDataContext } from "@/contexts/DataContext";
import styled from "styled-components";
import Button from "@/styles/components/Button";

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

const SelectWrapper = styled.div`
  flex-grow: 1;
  max-width: 400px;
  margin: 0;

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
const Buttons = styled.div`
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
  transition: background-color 0.2s;
  font-size: 1.5rem;

  &:hover {
    background-color: ${({ theme }) => theme.colors.secondary};
    color: ${({ theme }) => theme.colors.white};
  }

  @media (max-width: 768px) {
    display: none;
  }
`;

function Header() {
  const router = useRouter();
  const { seasons, currentSeason, setCurrentSeason } = useDataContext();
  const { isLoggedIn, setIsLoggedIn } = useAuth();

  useEffect(() => {
    async function fetchStatus() {
      try {
        const response = await fetch("/api/auth/status");
        const data = await response.json();
        setIsLoggedIn(data.isAuthenticated);
      } catch (err) {
        console.error("Error fetching auth status:", err);
        setIsLoggedIn(false);
      }
    }
    fetchStatus();
  }, []);

  function updateCurrentSeason(e) {
    setCurrentSeason(seasons.find((sea) => sea.id === +e.target.value));
  }

  async function handleLogout(e) {
    e.preventDefault();
    localStorage.removeItem("token");
    await fetch("/api/logout", { method: "GET" });
    setIsLoggedIn(false);
    router.push("/login");
  }
  function handleClick() {
    router.push("/");
  }

  return (
    <HeaderContainer>
      <LogoContainer onClick={handleClick}>
        <img src='/images/logo.png' alt='MTSA Logo' />
        <Title>Middle Tennessee Soccer Alliance</Title>
      </LogoContainer>
      <Controls>
        <SelectWrapper>
          <select
            name='season'
            onChange={updateCurrentSeason}
            value={currentSeason.id}
          >
            {seasons.map((season) => (
              <option key={season.id} value={season.id}>
                {season.mtsa_name}
              </option>
            ))}
          </select>
        </SelectWrapper>
      </Controls>
      <Nav>
        <ul>
          <li>
            {isLoggedIn ? (
              <Buttons>
                <AuthButton
                  onClick={() => router.push("/admin/adminDashboard")}
                >
                  Admin
                </AuthButton>
                <AuthButton onClick={handleLogout}>Logout</AuthButton>
              </Buttons>
            ) : (
              <Link href='/login'>
                <AuthButton>Admin Login</AuthButton>
              </Link>
            )}
          </li>
        </ul>
      </Nav>
    </HeaderContainer>
  );
}

export default Header;
