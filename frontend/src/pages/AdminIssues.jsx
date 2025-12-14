import React, { useEffect, useState } from "react";

export default function AdminIssues() {
  const [issues, setIssues] = useState([]);

  useEffect(() => {
    fetch("http://localhost:8000/issues")
      .then(r => r.json())
      .then(setIssues);
  }, []);

  const deleteIssue = async (id) => {
    if (!window.confirm("Delete this issue permanently?")) return;

    await fetch(`http://localhost:8000/admin/issues/${id}`, {
      method: "DELETE",
    });

    setIssues((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <div style={{ padding: 24, color: "white" }}>
      <h2>Admin — Issues</h2>

      {issues.map((i) => (
        <div
          key={i.id}
          style={{
            marginTop: 12,
            padding: 12,
            borderRadius: 10,
            background: "rgba(255,255,255,0.06)",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span>{i.title}</span>
          <button
            onClick={() => deleteIssue(i.id)}
            style={{
              background: "#EF4444",
              color: "white",
              border: "none",
              borderRadius: 8,
              padding: "6px 10px",
              cursor: "pointer",
            }}
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}
