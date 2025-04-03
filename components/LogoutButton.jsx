"use client"; // Make this component client-side

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    // Clear the token from localStorage (client-side)
    localStorage.removeItem("token");

    // Call the logout API to clear the token cookie (server-side)
    await fetch("/api/logout", {
      method: "GET",
    });

    // Redirect the user to the login page
    router.push("/login");
  }

  return (
    <button
      onClick={handleLogout}
      className='bg-red-500 text-white px-4 py-2 rounded hover:bg-red-700'
    >
      Logout
    </button>
  );
}
