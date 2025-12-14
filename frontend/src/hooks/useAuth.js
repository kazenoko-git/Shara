// src/hooks/useAuth.js
import { useEffect, useState } from "react";

const API = "http://localhost:8000";

export default function useAuth() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [needsUsername, setNeedsUsername] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("authUser");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
        setReady(true);
        return;
      } catch {
        localStorage.removeItem("authUser");
      }
    }

    // No stored user → show username UI
    setNeedsUsername(true);
    setReady(true);
  }, []);

  async function createUser(username) {
    const clean = username.trim() || "Anonymous";

    const res = await fetch(`${API}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: clean }),
    });

    if (!res.ok) {
      throw new Error("Failed to create user");
    }

    const u = await res.json();
    const authUser = { id: u.id, username: u.username };

    localStorage.setItem("authUser", JSON.stringify(authUser));
    setUser(authUser);
    setNeedsUsername(false);
  }

  return {
    user,
    ready,
    needsUsername,
    createUser,
  };
}
