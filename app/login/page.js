"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/contexts/AuthContext";
import styled from "styled-components";
import Button from "@/styles/components/Button";

const LoginContainer = styled.div`
  max-width: 40rem;
  margin: 0 auto;
  padding: 2rem;
  border: 1px solid ${({ theme }) => theme.colors.primary};
  border-radius: 0.5rem;
  background-color: ${({ theme }) => theme.colors.background};
`;

const Title = styled.h1`
  text-align: center;
  margin-bottom: 2rem;
  font-size: 2.4rem;
  color: var(--text-color);
`;
const FormGroup = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.paddingMedium};
  margin-bottom: 1.5rem;
`;

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
        router.push("/admin/adminDashboard");
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
    <LoginContainer>
      <Title>Login</Title>
      <form onSubmit={handleLogin}>
        <FormGroup>
          <label>Username: </label>
          <input
            type='text'
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </FormGroup>
        <FormGroup>
          <label>Password: </label>
          <input
            type='password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </FormGroup>
        <Button>LOGIN</Button>
      </form>
    </LoginContainer>
  );
}

export default Login;
