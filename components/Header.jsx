"use client";
import Link from "next/link";
import styles from "./Header.module.css";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { useDataContext } from "@/contexts/DataContext";

function Header() {
  const router = useRouter();
  const { seasons, currentSeason, setCurrentSeason } = useDataContext();
  const { isLoggedIn, setIsLoggedIn } = useAuth(); // Access context

  useEffect(() => {
    async function fetchStatus() {
      try {
        const response = await fetch("/api/auth/status");
        const data = await response.json();
        setIsLoggedIn(data.isAuthenticated); // Set login state based on response
      } catch (err) {
        console.error("Error fetching auth status:", err);
        setIsLoggedIn(false); // Default to logged out on error
      }
    }
    fetchStatus();
  }, []);
  function updateCurrentSeason(e) {
    setCurrentSeason(seasons.find((sea) => sea.id === +e.target.value));
  }
  async function handleLogout(e) {
    e.preventDefault();
    localStorage.removeItem("token"); // Clear token from client-side storage

    await fetch("/api/logout", { method: "GET" }); // Clear server-side session
    setIsLoggedIn(false); // Update context state
    router.push("/login");
  }

  return (
    <header className={styles.header}>
      <div className={styles.logoContainer}>
        <img src='/images/logo.png' alt='MTSA Logo' className={styles.logo} />
        <h1 className={styles.title}>Middle Tennessee Soccer Alliance</h1>
      </div>
      <div className={styles.controls}>
        <div className={styles.selectWrapper}>
          <select
            name='season'
            className={styles.select}
            onChange={updateCurrentSeason}
            value={currentSeason.id}
          >
            {seasons.map((season) => (
              <option key={season.id} value={season.id}>
                {season.mtsa_name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <nav className={styles.nav}>
        <ul>
          <li>
            {isLoggedIn ? (
              <button className={styles.logoutButton} onClick={handleLogout}>
                Logout
              </button>
            ) : (
              <Link href='/login'>
                <button className={styles.loginButton}>Admin Login</button>
              </Link>
            )}
          </li>
        </ul>
      </nav>
    </header>
  );
}

export default Header;
