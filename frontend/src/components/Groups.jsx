import React, { useEffect, useState } from "react";

export default function Groups({ issue, onBack, onOpenChat }) {
  const [groups, setGroups] = useState([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const userId = localStorage.getItem("userId");

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
  // CREATE GROUP (🔥 FIXED)
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
          userId,               // ✅ REQUIRED
        }),
      });

      if (!res.ok) {
        const t = await res.text();
        throw new Error(t);
      }

      const group = await res.json();
      setGroups((g) => [...g, group]);
      setName("");
    } catch (e) {
      console.error("Create group failed:", e);
      alert("Failed to create group");
    } finally {
      setLoading(false);
    }
  }

  // ---------------------------
  // JOIN / LEAVE
  // ---------------------------
  async function joinGroup(id) {
    await fetch(`http://localhost:8000/groups/${id}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });

    setGroups((gs) =>
      gs.map((g) =>
        g.id === id ? { ...g, members: [...g.members, userId] } : g
      )
    );
  }

  async function leaveGroup(id) {
    await fetch(`http://localhost:8000/groups/${id}/leave`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });

    setGroups((gs) =>
      gs.map((g) =>
        g.id === id
          ? { ...g, members: g.members.filter((m) => m !== userId) }
          : g
      )
    );
  }

  const isMember = (g) => g.members.includes(userId);

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
          background: "rgba(0,0,0,0.45)",
          backdropFilter: "blur(10px)",
          zIndex: 99998,
        }}
      />

      {/* DIALOG */}
      <div
        style={{
          position: "fixed",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: 520,
          maxWidth: "92vw",
          background: "rgba(15,15,15,0.9)",
          borderRadius: 20,
          padding: 20,
          zIndex: 99999,
          color: "white",
          boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
        }}
      >
        <button onClick={onBack} style={{ marginBottom: 12 }}>
          ← Back
        </button>

        <h2>Groups</h2>
        <p style={{ opacity: 0.7 }}>for “{issue.title}”</p>

        <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Group name"
            style={{ flex: 1 }}
          />
          <button onClick={createGroup} disabled={loading}>
            Create
          </button>
        </div>

        <div style={{ marginTop: 20 }}>
          {groups.length === 0 && (
            <div style={{ opacity: 0.6 }}>No groups yet</div>
          )}

          {groups.map((g) => (
            <div key={g.id} style={{ marginTop: 12 }}>
              <b>{g.name}</b> — {g.members.length} members
              <div style={{ marginTop: 6 }}>
                {!isMember(g) ? (
                  <button onClick={() => joinGroup(g.id)}>Join</button>
                ) : (
                  <button onClick={() => leaveGroup(g.id)}>Leave</button>
                )}
                <button onClick={() => onOpenChat(g)}>Chat →</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
