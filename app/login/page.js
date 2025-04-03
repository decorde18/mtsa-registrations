"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import styles from "./Login.module.css";
import { useAuth } from "@/contexts/AuthContext";

function Login() {
  const router = useRouter();
  const { isLoggedIn, setIsLoggedIn } = useAuth(); // Access context
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (res.ok) {
      // The API sets the cookie. You may rely on middleware to redirect,
      // but here we force a redirection based on the response.
      const data = await res.json();
      if (data.user.role === "admin") {
        router.push("/admin/dashboard");
      } else {
        router.push("/user/home");
      }

      localStorage.setItem("token", data.token); // Store token locally
      setIsLoggedIn(true); // Update context
    } else {
      const err = await res.json();
      setError(err.error || "Login failed");
    }
  };

  return (
    <div className={styles.loginContainer}>
      <h1 className={styles.title}>Login</h1>
      <form onSubmit={handleLogin} className={styles.form}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Username: </label>
          <input
            type='text'
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={styles.input}
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label}>Password: </label>
          <input
            type='password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={styles.input}
          />
        </div>
        <button className={styles.button}>LOGIN</button>
      </form>
    </div>
  );
}

export default Login;
