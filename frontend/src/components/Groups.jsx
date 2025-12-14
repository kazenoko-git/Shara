// src/components/Groups.jsx
import React, { useEffect, useState } from "react";

export default function Groups({ issue, user, onBack, onOpenChat }) {
  const [groups, setGroups] = useState([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  // ---------------------------
  // LOAD GROUPS
  // ---------------------------
  useEffect(() => {
    if (!issue?.id) return;

    fetch(`http://localhost:8000/groups?issueId=${issue.id}`)
      .then((r) => r.json())
      .then(setGroups)
      .catch(console.error);
  }, [issue]);

  // ---------------------------
  // CREATE GROUP
  // ---------------------------
  async function createGroup() {
    if (!name.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issueId: issue.id,
          name: name.trim(),
          userId: user.id,
        }),
      });

      if (!res.ok) throw new Error("Create failed");

      const group = await res.json();
      setGroups((g) => [...g, group]);
      setName("");
    } catch (e) {
      console.error(e);
      alert("Failed to create group");
    } finally {
      setLoading(false);
    }
  }

  // ---------------------------
  // JOIN GROUP
  // ---------------------------
  async function joinGroup(id) {
    await fetch(`http://localhost:8000/groups/${id}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id }),
    });

    setGroups((gs) =>
      gs.map((g) =>
        g.id === id && !g.members.includes(user.id)
          ? { ...g, members: [...g.members, user.id] }
          : g
      )
    );
  }

  // ---------------------------
  // LEAVE GROUP
  // ---------------------------
  async function leaveGroup(id) {
    await fetch(`http://localhost:8000/groups/${id}/leave`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id }),
    });

    setGroups((gs) =>
      gs.map((g) =>
        g.id === id
          ? { ...g, members: g.members.filter((m) => m !== user.id) }
          : g
      )
    );
  }

  // ---------------------------
  // OPEN CHAT (AUTO-JOIN)
  // ---------------------------
  async function openChat(group) {
    if (!group.members.includes(user.id)) {
      await joinGroup(group.id);
    }
    onOpenChat(group);
  }

  const isMember = (g) => g.members.includes(user.id);

  // ---------------------------
  // UI
  // ---------------------------
  return (
    <>
      {/* BACKDROP */}
      <div
        onClick={onBack}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(14px)",
          zIndex: 99998,
        }}
      />

      {/* MODAL */}
      <div
        style={{
          position: "fixed",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: 560,
          maxWidth: "92vw",
          background: "rgba(12,12,12,0.9)",
          borderRadius: 22,
          padding: 22,
          zIndex: 99999,
          color: "white",
          boxShadow: "0 40px 120px rgba(0,0,0,0.7)",
        }}
      >
        {/* HEADER */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={onBack}
            style={{
              padding: "8px 12px",
              borderRadius: 10,
              background: "rgba(255,255,255,0.06)",
              color: "white",
              border: "none",
              cursor: "pointer",
            }}
          >
            ← Back
          </button>

          <div>
            <h2 style={{ margin: 0 }}>Groups</h2>
            <div style={{ fontSize: 13, opacity: 0.65 }}>
              for “{issue.title}”
            </div>
          </div>
        </div>

        {/* CREATE GROUP */}
        <div
          style={{
            marginTop: 18,
            display: "flex",
            gap: 10,
          }}
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="New group name"
            style={{
              flex: 1,
              padding: "12px 14px",
              borderRadius: 12,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "white",
              outline: "none",
            }}
          />
          <button
            onClick={createGroup}
            disabled={loading}
            style={{
              padding: "12px 16px",
              borderRadius: 12,
              background: "linear-gradient(90deg,#34d399,#10b981)",
              color: "#041014",
              fontWeight: 800,
              border: "none",
              cursor: "pointer",
            }}
          >
            Create
          </button>
        </div>

        {/* GROUP LIST */}
        <div style={{ marginTop: 22 }}>
          {groups.length === 0 && (
            <div style={{ opacity: 0.6, textAlign: "center", padding: 20 }}>
              No groups yet — be the first 👀
            </div>
          )}

          {groups.map((g) => (
            <div
              key={g.id}
              style={{
                padding: 14,
                borderRadius: 14,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                marginBottom: 12,
              }}
            >
              <div style={{ fontWeight: 700 }}>{g.name}</div>
              <div style={{ fontSize: 13, opacity: 0.65 }}>
                {g.members.length} members
              </div>

              <div
                style={{
                  marginTop: 10,
                  display: "flex",
                  gap: 8,
                }}
              >
                {!isMember(g) ? (
                  <button
                    onClick={() => joinGroup(g.id)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 10,
                      background: "rgba(255,255,255,0.1)",
                      color: "white",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    Join
                  </button>
                ) : (
                  <button
                    onClick={() => leaveGroup(g.id)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 10,
                      background: "rgba(239,68,68,0.2)",
                      color: "#fecaca",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    Leave
                  </button>
                )}

                <button
                  onClick={() => openChat(g)}
                  style={{
                    marginLeft: "auto",
                    padding: "8px 12px",
                    borderRadius: 10,
                    background: "rgba(255,255,255,0.12)",
                    color: "white",
                    border: "none",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  Open Chat →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
