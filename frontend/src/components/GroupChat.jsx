import React, { useState, useEffect, useRef } from "react";

export default function GroupChat({ group, onBack }) {
  const [msg, setMsg] = useState("");
  const [messages, setMessages] = useState([
    { id: 1, sender: "them", text: "Welcome to the group!" },
    { id: 2, sender: "you", text: "Glad to help!" },
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

  // scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "rgba(0,0,0,0.25)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        display: "flex",
        flexDirection: "column",
        padding: 20,
        color: "white",
      }}
    >
      {/* BACK BUTTON */}
      <button
        onClick={onBack}
        style={{
          padding: "8px 14px",
          background: "rgba(255,255,255,0.15)",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.2)",
          marginBottom: 20,
          width: "fit-content",
        }}
      >
        ← Back
      </button>

      {/* GROUP NAME */}
      <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 20 }}>
        {group.name}
      </div>

      {/* CHAT MESSAGES */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          paddingRight: 8,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {messages.map((m) => (
          <div
            key={m.id}
            style={{
              alignSelf: m.sender === "you" ? "flex-end" : "flex-start",
              maxWidth: "70%",
              background:
                m.sender === "you"
                  ? "rgba(255,255,255,0.95)"
                  : "rgba(255,255,255,0.12)",
              color: m.sender === "you" ? "#111" : "white",
              padding: "10px 14px",
              borderRadius: 16,
              backdropFilter: "blur(10px)",
            }}
          >
            {m.text}
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* INPUT BAR */}
      <div
        style={{
          display: "flex",
          gap: 10,
          marginTop: 14,
        }}
      >
        <input
          className="flex-1 p-3 rounded-xl bg-white/10 text-white outline-none"
          placeholder="Type a message..."
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
        />

        <button
          onClick={sendMessage}
          style={{
            padding: "0 22px",
            background: "white",
            color: "#111",
            borderRadius: 12,
            fontWeight: 700,
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
