// src/components/GroupChat.jsx
import React, { useEffect, useRef, useState } from "react";

const API = "http://localhost:8000";

export default function GroupChat({ group, user, onMinimize }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [minimized, setMinimized] = useState(false);

  const endRef = useRef(null);
  const seenIds = useRef(new Set());

  // ===========================
  // LOAD HISTORY
  // ===========================
  useEffect(() => {
    fetch(`${API}/groups/${group.id}/messages`)
      .then((r) => r.json())
      .then((msgs) => {
        msgs.forEach((m) => seenIds.current.add(m.id));
        setMessages(msgs);
      })
      .catch(console.error);
  }, [group.id]);

  // ===========================
  // SSE LIVE UPDATES
  // ===========================
  useEffect(() => {
    if (minimized) return;

    const es = new EventSource(`${API}/groups/${group.id}/stream`);

    es.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (seenIds.current.has(msg.id)) return;
      seenIds.current.add(msg.id);
      setMessages((m) => [...m, msg]);
    };

    return () => es.close();
  }, [group.id, minimized]);

  // ===========================
  // AUTO SCROLL
  // ===========================
  useEffect(() => {
    if (!minimized) {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, minimized]);

  // ===========================
  // SEND MESSAGE
  // ===========================
  async function sendMessage() {
    if (!text.trim()) return;

    const res = await fetch(`${API}/groups/${group.id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        senderId: user.id,
        senderName: user.username,
        text,
      }),
    });

    if (!res.ok) return alert("Failed to send");

    const msg = await res.json();
    if (!seenIds.current.has(msg.id)) {
      seenIds.current.add(msg.id);
      setMessages((m) => [...m, msg]);
    }
    setText("");
  }

  // ===========================
  // MINIMIZED VIEW (GLASS)
  // ===========================
  if (minimized) {
    return (
      <div
        onClick={() => setMinimized(false)}
        style={{
          position: "fixed",
          bottom: 20,
          left: 20,
          padding: "10px 16px",
          background: "rgba(20,20,20,0.55)",
          backdropFilter: "blur(22px)",
          borderRadius: 16,
          border: "1px solid rgba(255,255,255,0.2)",
          color: "white",
          cursor: "pointer",
          zIndex: 99999,
          fontWeight: 700,
        }}
      >
        💬 {group.name}
      </div>
    );
  }

  // ===========================
  // FULL CHAT
  // ===========================
  return (
    <div
      style={{
        position: "fixed",
        left: 20,
        bottom: 20,
        width: 360,
        height: 440,
        background: "rgba(20,20,20,0.6)",
        backdropFilter: "blur(26px)",
        borderRadius: 22,
        border: "1px solid rgba(255,255,255,0.18)",
        display: "flex",
        flexDirection: "column",
        zIndex: 99999,
        color: "white",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          padding: 14,
          display: "grid",
          gridTemplateColumns: "1fr auto",
          alignItems: "center",
          borderBottom: "1px solid rgba(255,255,255,0.12)",
        }}
      >
        <strong>{group.name}</strong>

        <div style={{ display: "flex", gap: 8 }}>
          <HeaderButton onClick={() => setMinimized(true)}>—</HeaderButton>
          <HeaderButton onClick={onMinimize}>✕</HeaderButton>
        </div>
      </div>

      {/* MESSAGES */}
      <div
        style={{
          flex: 1,
          padding: 14,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {messages.map((m) => {
          const mine = m.senderId === user.id;
          return (
            <div
              key={m.id}
              style={{
                alignSelf: mine ? "flex-end" : "flex-start",
                maxWidth: "80%",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  opacity: 0.65,
                  marginBottom: 4,
                  textAlign: mine ? "right" : "left",
                }}
              >
                {mine ? "You" : m.senderName}
              </div>

              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: 16,
                  background: mine
                    ? "linear-gradient(135deg,#22c55e,#16a34a)"
                    : "rgba(255,255,255,0.14)",
                  color: mine ? "black" : "white",
                }}
              >
                {m.text}
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {/* INPUT */}
      <div
        style={{
          display: "flex",
          padding: 12,
          gap: 10,
          borderTop: "1px solid rgba(255,255,255,0.12)",
        }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Message…"
          style={{
            flex: 1,
            padding: "10px 12px",
            borderRadius: 12,
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.2)",
            color: "white",
            outline: "none",
          }}
        />
        <button
          onClick={sendMessage}
          style={{
            padding: "0 16px",
            borderRadius: 12,
            background: "rgba(255,255,255,0.18)",
            border: "1px solid rgba(255,255,255,0.28)",
            color: "white",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}

function HeaderButton({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 36,
        height: 36,
        display: "grid",
        placeItems: "center",
        borderRadius: 10,
        background: "rgba(255,255,255,0.14)",
        border: "1px solid rgba(255,255,255,0.28)",
        color: "white",
        cursor: "pointer",
        fontSize: 18,
        lineHeight: 1,
      }}
    >
      {children}
    </button>
  );
}
