// src/components/UsernameGate.jsx
import { useState } from "react";

const API = "http://localhost:8000";

export default function UsernameGate({ onDone }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    const trimmed = name.trim();
    if (!trimmed) return;

    setLoading(true);
    try {
      const res = await fetch(`${API}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: trimmed }),
      });

      const u = await res.json();
      const authUser = { id: u.id, username: u.username };
      localStorage.setItem("authUser", JSON.stringify(authUser));
      onDone(authUser);
    } catch {
      alert("Failed to create user");
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(28px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100000,
      }}
    >
      <div
        style={{
          width: 420,
          maxWidth: "92vw",
          padding: 28,
          borderRadius: 24,
          background:
            "linear-gradient(180deg, rgba(28,28,28,0.92), rgba(18,18,18,0.92))",
          border: "1px solid rgba(255,255,255,0.14)",
          color: "white",
          boxShadow: "0 40px 120px rgba(0,0,0,0.75)",
          boxSizing: "border-box",
        }}
      >
        {/* HEADER */}
        <div style={{ marginBottom: 18 }}>
          <div
            style={{
              fontSize: 28,
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            Welcome <span>👋</span>
          </div>
          <div style={{ marginTop: 6, fontSize: 15, opacity: 0.7 }}>
            Choose a display name. This will be visible in groups and chat.
          </div>
        </div>

        {/* INPUT WRAPPER */}
        <div
          style={{
            width: "100%",
            height: 52,
            borderRadius: 14,
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.18)",
            padding: "0 16px",
            boxSizing: "border-box",

            display: "flex",
            alignItems: "center",
            overflow: "hidden",
          }}
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Your name"
            maxLength={16}
            autoFocus
            style={{
              width: "100%",
              minWidth: 0, // 🔥 THIS fixes the spill
              border: "none",
              outline: "none",
              background: "transparent",
              color: "white",
              fontSize: 16,
              lineHeight: "20px",
              padding: 0,
              margin: 0,
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* CHAR COUNTER (optional but nice) */}
        <div
          style={{
            marginTop: 6,
            fontSize: 12,
            opacity: 0.5,
            textAlign: "right",
          }}
        >
          {name.length}/16
        </div>

        {/* BUTTON */}
        <button
          onClick={submit}
          disabled={loading}
          style={{
            marginTop: 16,
            width: "100%",
            height: 50,
            borderRadius: 16,
            background: "linear-gradient(135deg,#22c55e,#16a34a)",
            color: "#041014",
            fontWeight: 900,
            fontSize: 16,
            border: "none",
            cursor: "pointer",
            opacity: loading ? 0.6 : 1,
          }}
        >
          Enter App →
        </button>
      </div>
    </div>
  );
}
