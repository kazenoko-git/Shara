// frontend/src/components/Groups.jsx
import React, { useEffect, useState } from "react";

export default function Groups({ issue, onBack, onOpenChat }) {
  const [groups, setGroups] = useState([]);
  const [newName, setNewName] = useState("");
  const userId = localStorage.getItem("userId") || "u_anonymous";

  useEffect(() => {
    if (!issue) return;
    load();
  }, [issue]);

  async function load() {
    try {
      const res = await fetch(`http://localhost:8000/groups?issueId=${encodeURIComponent(issue.id)}`);
      if (!res.ok) throw new Error("groups failed");
      const data = await res.json();
      setGroups(data);
    } catch (e) {
      console.error("Failed to load groups", e);
    }
  }

  async function createGroup() {
    if (!newName.trim()) return;
    const payload = { issueId: issue.id, name: newName.trim(), members: [userId], createdAt: Date.now() };
    const res = await fetch("http://localhost:8000/groups", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (!res.ok) {
      console.error("create group failed", await res.text());
      return;
    }
    const g = await res.json();
    setGroups((prev) => [...prev, g]);
    setNewName("");
  }

  async function joinGroup(id) {
    await fetch(`http://localhost:8000/groups/${id}/join`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId }) });
    setGroups((prev) => prev.map(g => g.id === id ? { ...g, members: Array.from(new Set([...(g.members||[]), userId])) } : g));
  }

  async function leaveGroup(id) {
    await fetch(`http://localhost:8000/groups/${id}/leave`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId }) });
    setGroups((prev) => prev.map(g => g.id === id ? { ...g, members: (g.members||[]).filter(m => m !== userId) } : g));
  }

  const isMember = (g) => (g.members || []).includes(userId);

  return (
    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", color: "white", zIndex: 99999 }}>
      <div style={{ padding: 16 }}>
        <button onClick={onBack} style={{ padding: 10, borderRadius: 10, background: "rgba(255,255,255,0.06)", color: "white" }}>← Back</button>
        <h1 style={{ marginTop: 8 }}>Groups for Issue</h1>

        <div style={{ marginTop: 16, maxWidth: 640 }}>
          <div style={{ marginBottom: 8, fontWeight: 700 }}>Create a group</div>
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Group name..." style={{ width: "100%", padding: 12, borderRadius: 8, background: "rgba(255,255,255,0.04)", color: "white", border: "1px solid rgba(255,255,255,0.06)" }} />
          <button onClick={createGroup} style={{ marginTop: 8, padding: "12px 16px", borderRadius: 10, background: "#10b981", color: "#041014", fontWeight: 700 }}>Create Group</button>
        </div>

        <div style={{ marginTop: 24, maxWidth: 640 }}>
          {groups.length === 0 && <div>No groups yet.</div>}

          {groups.map((g) => (
            <div key={g.id} style={{ marginTop: 12, padding: 12, background: "rgba(255,255,255,0.03)", borderRadius: 10 }}>
              <div style={{ fontWeight: 800 }}>{g.name}</div>
              <div style={{ color: "rgba(255,255,255,0.7)" }}>{(g.members||[]).length} members</div>
              <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                {!isMember(g) ? (
                  <button onClick={() => joinGroup(g.id)} style={{ padding: "10px 12px", borderRadius: 8, background: "white", color: "#111", fontWeight: 700 }}>Join</button>
                ) : (
                  <button onClick={() => leaveGroup(g.id)} style={{ padding: "10px 12px", borderRadius: 8, background: "rgba(255,255,255,0.08)", color: "white", fontWeight: 700 }}>Leave</button>
                )}

                <button onClick={() => onOpenChat(g)} style={{ padding: "10px 12px", borderRadius: 8, background: "#10b981", color: "#041014", fontWeight: 800 }}>Chat →</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
