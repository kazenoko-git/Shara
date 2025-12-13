// frontend/src/components/GroupChat.jsx
import React, { useEffect, useRef, useState } from "react";

export default function GroupChat({ group, onBack, initialMinimized = false }) {
  const [msg, setMsg] = useState("");
  const [messages, setMessages] = useState([]);
  const [minimized, setMinimized] = useState(initialMinimized);
  const bottomRef = useRef(null);
  const userId = localStorage.getItem("userId") || "u_anonymous";

  useEffect(() => {
    if (!group) return;
    loadMessages();
    const id = setInterval(() => loadMessages(), 3000);
    return () => clearInterval(id);
  }, [group]);

  async function loadMessages() {
    try {
      const res = await fetch(`http://localhost:8000/groups/${group.id}/messages`);
      if (!res.ok) return;
      const data = await res.json();
      setMessages(data);
    } catch (e) {
      console.warn("load messages fail", e);
    }
  }

  async function sendMessage() {
    if (!msg.trim()) return;
    const payload = { senderId: userId, text: msg, createdAt: Date.now() };
    const res = await fetch(`http://localhost:8000/groups/${group.id}/messages`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
    });
    if (res.ok) {
      setMsg("");
      loadMessages();
    } else {
      console.error("send failed", await res.text());
    }
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, minimized]);

  if (!group) return null;

  // floating bottom-right styling
  const wrapperStyle = {
    position: "fixed",
    right: 20,
    bottom: 20,
    width: 360,
    maxWidth: "calc(100vw - 40px)",
    height: minimized ? 56 : 420,
    background: "#0b0b0b",
    color: "white",
    borderRadius: 14,
    boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
    zIndex: 99999,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  };

  return (
    <div style={wrapperStyle}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 12, borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <div style={{ fontWeight: 800 }}>{group.name}</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setMinimized((s) => !s)} style={{ padding: "6px 10px", borderRadius: 8, background: "rgba(255,255,255,0.06)", color: "white" }}>
            {minimized ? "▴" : "▾"}
          </button>
          <button onClick={() => { onBack?.(); }} style={{ padding: "6px 10px", borderRadius: 8, background: "rgba(255,255,255,0.06)", color: "white" }}>
            ✕
          </button>
        </div>
      </div>

      {!minimized && (
        <>
          <div style={{ flex: 1, overflowY: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
            {messages.map((m) => (
              <div key={m.id} style={{ alignSelf: m.senderId === userId ? "flex-end" : "flex-start", maxWidth: "75%" }}>
                <div style={{
                  padding: "8px 12px",
                  borderRadius: 18,
                  background: m.senderId === userId ? "white" : "rgba(255,255,255,0.08)",
                  color: m.senderId === userId ? "#111" : "white"
                }}>
                  {m.text}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <div style={{ padding: 12, display: "flex", gap: 8 }}>
            <input value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Type a message..." style={{ flex: 1, padding: 10, borderRadius: 12, border: "none", background: "rgba(255,255,255,0.03)", color: "white" }} />
            <button onClick={sendMessage} style={{ padding: "8px 14px", borderRadius: 12, background: "#10b981", color: "#041014", fontWeight: 700 }}>Send</button>
          </div>
        </>
      )}
    </div>
  );
}
