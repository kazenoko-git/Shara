import React, { useEffect, useRef, useState } from "react";

export default function GroupChat({ group, onMinimize }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const endRef = useRef(null);

  const userId = localStorage.getItem("userId");

  // Load messages
  useEffect(() => {
    fetch(`http://localhost:8000/groups/${group.id}/messages`)
      .then((r) => r.json())
      .then(setMessages)
      .catch(console.error);
  }, [group.id]);

  // Auto-scroll
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!text.trim()) return;

    const res = await fetch(
      `http://localhost:8000/groups/${group.id}/messages`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: userId,
          text,
        }),
      }
    );

    if (!res.ok) {
      alert("Failed to send message");
      return;
    }

    const msg = await res.json();
    setMessages((m) => [...m, msg]);
    setText("");
  }

  return (
    <div
      style={{
        position: "fixed",
        right: 20,
        bottom: 20,
        width: 360,
        height: 420,
        background: "rgba(0,0,0,0.85)",
        backdropFilter: "blur(20px)",
        borderRadius: 18,
        border: "1px solid rgba(255,255,255,0.08)",
        display: "flex",
        flexDirection: "column",
        zIndex: 99999,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <strong>{group.name}</strong>

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onMinimize}>▁</button>
          <button onClick={onMinimize}>✕</button>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, padding: 12, overflowY: "auto" }}>
        {messages.map((m) => (
          <div
            key={m.id}
            style={{
              marginBottom: 8,
              alignSelf: m.senderId === userId ? "flex-end" : "flex-start",
              background:
                m.senderId === userId
                  ? "#22c55e"
                  : "rgba(255,255,255,0.1)",
              padding: "6px 10px",
              borderRadius: 10,
              maxWidth: "80%",
            }}
          >
            {m.text}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div style={{ display: "flex", padding: 10, gap: 8 }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Message…"
          style={{ flex: 1, borderRadius: 8, padding: 8 }}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}
