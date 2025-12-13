// src/components/Groups.jsx
import React, { useEffect, useState } from "react";

export default function Groups({ issue, onBack, onOpenChat }) {
  const [groups, setGroups] = useState([]);
  const [newName, setNewName] = useState("");
  const userId = localStorage.getItem("userId");

  const STORAGE_KEY = `groups_${issue.id}`;

  // ---------------------------
  // LOAD GROUPS (LOCAL)
  // ---------------------------
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setGroups(JSON.parse(saved));
    }
  }, [STORAGE_KEY]);

  // ---------------------------
  // SAVE GROUPS
  // ---------------------------
  const persist = (list) => {
    setGroups(list);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  };

  // ---------------------------
  // CREATE GROUP
  // ---------------------------
  const createGroup = () => {
    if (!newName.trim()) return;

    const group = {
      id: "grp_" + Date.now(),
      name: newName.trim(),
      members: [userId],
      messages: [
        { id: 1, sender: "system", text: "Welcome to the group 👋" },
      ],
    };

    persist([...groups, group]);
    setNewName("");
  };

  // ---------------------------
  // JOIN / LEAVE
  // ---------------------------
  const joinGroup = (id) => {
    persist(
      groups.map((g) =>
        g.id === id && !g.members.includes(userId)
          ? { ...g, members: [...g.members, userId] }
          : g
      )
    );
  };

  const leaveGroup = (id) => {
    persist(
      groups.map((g) =>
        g.id === id
          ? { ...g, members: g.members.filter((m) => m !== userId) }
          : g
      )
    );
  };

  const isMember = (g) => g.members.includes(userId);

  // ---------------------------
  // UI
  // ---------------------------
  return (
    <div className="absolute inset-0 bg-black text-white z-50">
      {/* HEADER */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-white/10">
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-bold">Groups for Issue</h1>
      </div>

      {/* CONTENT */}
      <div className="p-6 max-w-xl">
        {/* CREATE */}
        <div className="mb-6">
          <div className="text-lg font-semibold mb-2">Create a group</div>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Group name…"
            className="w-full p-3 mb-3 rounded-lg bg-white/10"
          />
          <button
            onClick={createGroup}
            className="w-full py-3 rounded-lg bg-emerald-400 text-black font-bold"
          >
            Create Group
          </button>
        </div>

        {/* LIST */}
        {groups.length === 0 && (
          <div className="opacity-60">No groups yet.</div>
        )}

        {groups.map((g) => (
          <div
            key={g.id}
            className="mb-4 p-4 rounded-xl bg-white/5 border border-white/10"
          >
            <div className="text-lg font-bold">{g.name}</div>
            <div className="opacity-70 mb-3">
              {g.members.length} members
            </div>

            <div className="flex gap-2">
              {!isMember(g) ? (
                <button
                  onClick={() => joinGroup(g.id)}
                  className="flex-1 py-2 rounded-lg bg-white text-black font-bold"
                >
                  Join
                </button>
              ) : (
                <button
                  onClick={() => leaveGroup(g.id)}
                  className="flex-1 py-2 rounded-lg bg-white/20"
                >
                  Leave
                </button>
              )}

              <button
                onClick={() => onOpenChat(g)}
                className="flex-1 py-2 rounded-lg bg-emerald-400 text-black font-bold"
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
