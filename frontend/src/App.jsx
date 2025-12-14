// src/App.jsx
import React, { useState } from "react";

import MainMap from "./components/MainMap";
import AddIssue from "./components/AddIssue";
import IssueDetails from "./components/IssueDetails";
import Groups from "./components/Groups";
import GroupChat from "./components/GroupChat";

import useIssues from "./hooks/useIssues";
import useAuth from "./hooks/useAuth";

export default function App() {
  const { user, ready, needsUsername, createUser } = useAuth();
  const issues = useIssues();

  const [overlay, setOverlay] = useState(null);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [activeGroup, setActiveGroup] = useState(null);

  const [nameInput, setNameInput] = useState("");
  const [loading, setLoading] = useState(false);

  const openIssue = (issue) => {
    setSelectedIssue(issue);
    setOverlay("details");
  };

  // ===========================
  // LOADING BOOT
  // ===========================
  if (!ready) {
    return (
      <FullScreenCenter>
        Initializing…
      </FullScreenCenter>
    );
  }

  // ===========================
  // USERNAME SCREEN
  // ===========================
  if (needsUsername) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "radial-gradient(circle at top, #111, #000)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
        }}
      >
        <div
          style={{
            width: 420,
            maxWidth: "90vw",
            padding: 28,
            borderRadius: 24,
            background: "rgba(255,255,255,0.08)",
            backdropFilter: "blur(24px)",
            border: "1px solid rgba(255,255,255,0.15)",
            boxShadow: "0 40px 120px rgba(0,0,0,0.6)",
          }}
        >
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>
            Welcome 👋
          </h2>

          <p style={{ opacity: 0.75, marginTop: 8, fontSize: 14 }}>
            Choose a display name. This will be visible in groups and chat.
          </p>

{/* INPUT */}
<div style={{ marginTop: 20 }}>
  <input
    autoFocus
    value={nameInput}
    onChange={(e) => setNameInput(e.target.value)}
    onKeyDown={(e) => e.key === "Enter" && submit()}
    placeholder="Your name"
    maxLength={16}
    style={{
      width: "100%",
      height: 52,                     // ✅ fixed, predictable
      padding: "0 18px",              // ✅ horizontal only
      borderRadius: 14,
      background: "rgba(255,255,255,0.12)",
      border: "1px solid rgba(255,255,255,0.22)",
      color: "white",
      fontSize: 16,
      outline: "none",
      boxSizing: "border-box",
      lineHeight: "52px",             // ✅ hard lock vertical alignment
    }}
  />

  <div
    style={{
      marginTop: 6,
      fontSize: 12,
      opacity: 0.55,
      textAlign: "right",
    }}
  >
    {nameInput.length}/16
  </div>
</div>


          <button
            onClick={submit}
            disabled={loading}
            style={{
              marginTop: 16,
              width: "100%",
              padding: "14px",
              borderRadius: 16,
              background: "linear-gradient(135deg,#22c55e,#16a34a)",
              color: "#041014",
              fontWeight: 900,
              border: "none",
              cursor: "pointer",
              fontSize: 15,
            }}
          >
            Enter App →
          </button>
        </div>
      </div>
    );
  }

  async function submit() {
    if (loading) return;
    setLoading(true);
    try {
      await createUser(nameInput);
    } catch {
      alert("Backend not reachable");
    } finally {
      setLoading(false);
    }
  }

  // ===========================
  // MAIN APP
  // ===========================
  return (
    <div style={{ width: "100vw", height: "100vh", background: "black" }}>
      <MainMap
        issues={issues}
        onSelectIssue={openIssue}
        onAddIssue={() => setOverlay("add")}
      />

      {overlay === "add" && (
        <AddIssue
          user={user}
          onBack={() => setOverlay(null)}
          onSaved={() => setOverlay(null)}
        />
      )}

      {overlay === "details" && selectedIssue && (
        <IssueDetails
          issue={selectedIssue}
          user={user}
          onBack={() => setOverlay(null)}
          openGroups={() => setOverlay("groups")}
        />
      )}

      {overlay === "groups" && selectedIssue && (
        <Groups
          issue={selectedIssue}
          user={user}
          onBack={() => setOverlay("details")}
          onOpenChat={(g) => setActiveGroup(g)}
        />
      )}

      {activeGroup && (
        <GroupChat
          group={activeGroup}
          user={user}
          onMinimize={() => setActiveGroup(null)}
        />
      )}
    </div>
  );
}

// ===========================
// SMALL HELPER
// ===========================
function FullScreenCenter({ children }) {
  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "black",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 20,
        fontWeight: 700,
      }}
    >
      {children}
    </div>
  );
}
