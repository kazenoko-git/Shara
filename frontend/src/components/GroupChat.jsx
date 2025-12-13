// src/components/GroupChat.jsx
import React, { useEffect, useRef, useState } from "react";

export default function GroupChat({ group, onMinimize }) {
  const [msg, setMsg] = useState("");
  const [messages, setMessages] = useState([
    { id: 1, sender: "system", text: "Welcome to the group 👋" },
  ]);

  const bottomRef = useRef(null);

  function sendMessage() {
    if (!msg.trim()) return;

    setMessages((prev) => [
      ...prev,
      { id: Date.now(), sender: "you", text: msg },
    ]);

    setMsg("");
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!group) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 20,
        right: 20,
        width: 360,
        height: 480,
        zIndex: 99999,
        background: "rgba(15,15,15,0.95)",
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.12)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        backdropFilter: "blur(16px)",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          padding: "12px 14px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          color: "white",
          fontWeight: 700,
        }}
      >
        <span>{group.name}</span>
        <button
          onClick={onMinimize}
          style={{
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 8,
            padding: "4px 10px",
            color: "white",
            cursor: "pointer",
          }}
        >
          ✕
        </button>
      </div>

      {/* MESSAGES */}
      <div
        style={{
          flex: 1,
          padding: 12,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {messages.map((m) => (
          <div
            key={m.id}
            style={{
              alignSelf: m.sender === "you" ? "flex-end" : "flex-start",
              background:
                m.sender === "you"
                  ? "#10b981"
                  : "rgba(255,255,255,0.1)",
              color: m.sender === "you" ? "#000" : "#fff",
              padding: "8px 12px",
              borderRadius: 14,
              maxWidth: "80%",
              fontSize: 14,
            }}
          >
            {m.text}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* INPUT */}
      <div
        style={{
          padding: 10,
          display: "flex",
          gap: 8,
          borderTop: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <input
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          placeholder="Message…"
          style={{
            flex: 1,
            padding: "8px 12px",
            borderRadius: 10,
            background: "rgba(255,255,255,0.1)",
            color: "white",
            outline: "none",
            border: "none",
          }}
        />
        <button
          onClick={sendMessage}
          style={{
            padding: "0 16px",
            borderRadius: 10,
            background: "#10b981",
            fontWeight: 800,
            color: "#000",
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
