import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  doc,
} from "firebase/firestore";

export default function Groups({ issue, onBack, onOpenChat }) {
  const [groups, setGroups] = useState([]);
  const [newName, setNewName] = useState("");
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    if (!issue) return;

    const q = query(
      collection(db, "groups"),
      where("issueId", "==", issue.id)
    );

    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setGroups(list);
    });

    return () => unsub();
  }, [issue]);

  const createGroup = async () => {
    if (!newName.trim()) return;

    await addDoc(collection(db, "groups"), {
      issueId: issue.id,
      name: newName.trim(),
      createdAt: Date.now(),
      members: [userId],
    });

    setNewName("");
  };

  const joinGroup = async (groupId) => {
    await updateDoc(doc(db, "groups", groupId), {
      members: arrayUnion(userId),
    });
  };

  const leaveGroup = async (groupId) => {
    await updateDoc(doc(db, "groups", groupId), {
      members: arrayRemove(userId),
    });
  };

  const isMember = (g) => g.members?.includes(userId);

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-2xl"
      style={{ zIndex: 99999 }}
    >
      {/* HEADER */}
      <div
        style={{
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <button
          onClick={onBack}
          style={{
            padding: "8px 14px",
            borderRadius: 12,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "white",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          ← Back
        </button>

        <div style={{ color: "white", fontSize: 22, fontWeight: 800 }}>
          Groups for Issue
        </div>
      </div>

      {/* CONTENT */}
      <div
        style={{
          padding: "0 20px 120px",
          overflowY: "auto",
          height: "calc(100% - 70px)",
        }}
      >
        {/* CREATE GROUP */}
        <div
          style={{
            background: "rgba(255,255,255,0.05)",
            borderRadius: 18,
            padding: 18,
            marginBottom: 20,
            border: "1px solid rgba(255,255,255,0.06)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
          }}
        >
          <div style={{ color: "white", fontWeight: 700, marginBottom: 8 }}>
            Create a new group
          </div>

          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Group name..."
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: 12,
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "white",
              marginBottom: 10,
            }}
          />

          <button
            onClick={createGroup}
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: 12,
              background: "linear-gradient(90deg,#34d399,#10b981)",
              border: "none",
              color: "#041014",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Create Group
          </button>
        </div>

        {/* GROUP LIST */}
        <div style={{ color: "white", fontSize: 18, fontWeight: 700, marginBottom: 12 }}>
          Existing Groups
        </div>

        {groups.length === 0 && (
          <div style={{ opacity: 0.6, color: "white" }}>
            No groups yet. Create one!
          </div>
        )}

        {groups.map((g) => (
          <div
            key={g.id}
            style={{
              background: "rgba(255,255,255,0.05)",
              borderRadius: 18,
              padding: 18,
              marginBottom: 14,
              border: "1px solid rgba(255,255,255,0.06)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
            }}
          >
            {/* Group Header */}
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: "white",
                marginBottom: 6,
              }}
            >
              {g.name}
            </div>

            <div style={{ color: "rgba(255,255,255,0.7)", marginBottom: 10 }}>
              {g.members?.length || 0} members
            </div>

            {/* BUTTON ROW */}
            <div style={{ display: "flex", gap: 10 }}>
              {!isMember(g) ? (
                <button
                  onClick={() => joinGroup(g.id)}
                  style={{
                    flex: 1,
                    padding: "10px 14px",
                    borderRadius: 12,
                    border: "none",
                    background: "white",
                    color: "#041014",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Join
                </button>
              ) : (
                <button
                  onClick={() => leaveGroup(g.id)}
                  style={{
                    flex: 1,
                    padding: "10px 14px",
                    borderRadius: 12,
                    border: "none",
                    background: "rgba(255,255,255,0.15)",
                    color: "white",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Leave
                </button>
              )}

              {/* CHAT BUTTON */}
              <button
                onClick={() => onOpenChat(g)}
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  borderRadius: 12,
                  border: "none",
                  background: "linear-gradient(90deg,#34d399,#10b981)",
                  color: "#041014",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                Chat →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
