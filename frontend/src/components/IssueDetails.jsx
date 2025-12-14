import React, { useEffect, useState } from "react";

export default function IssueDetails({ issue, onBack, openGroups }) {
  const [open, setOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setOpen(true));
  }, []);

  if (!issue) return null;

  const prettyDate = (ts) => {
    try {
      return ts ? new Date(ts).toLocaleString() : "";
    } catch {
      return "";
    }
  };

  const close = () => {
    setOpen(false);
    setTimeout(onBack, 180);
  };

  return (
    <>
      {/* BACKDROP */}
      <div
        onClick={close}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.35)",
          backdropFilter: "blur(8px)",
          transition: "opacity 180ms ease",
          opacity: open ? 1 : 0,
          zIndex: 9998,
        }}
      />

      {/* SHEET */}
      <div
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
          display: "flex",
          justifyContent: "center",
          pointerEvents: "auto",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 900,
            margin: "0 16px",
            background: "rgba(15,15,15,0.95)",
            backdropFilter: "blur(24px)",
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 -20px 60px rgba(0,0,0,0.6)",
            transform: open ? "translateY(0)" : "translateY(20vh)",
            transition: "transform 260ms cubic-bezier(.2,.9,.2,1)",
            maxHeight: "70vh",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* HEADER */}
          <div
            style={{
              padding: 14,
              display: "flex",
              alignItems: "center",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
              flexShrink: 0,
            }}
          >
            <button
              onClick={close}
              style={{
                marginRight: 12,
                padding: "8px 12px",
                borderRadius: 10,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.06)",
                color: "white",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              ← Back
            </button>

            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 800 }}>
                {issue.title}
              </div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>
                {prettyDate(issue.createdAt)} •{" "}
                {issue.coords?.[1]?.toFixed?.(4)},{" "}
                {issue.coords?.[0]?.toFixed?.(4)}
              </div>
            </div>

            <div
              style={{
                padding: "6px 12px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.08)",
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {issue.category?.toUpperCase() ?? "UNVERIFIED"}
            </div>
          </div>

          {/* IMAGE */}
          {issue.imageUrl && (
            <div
              style={{
                flexShrink: 0,
                height: 200,
                overflow: "hidden",
                cursor: "zoom-in",
              }}
              onClick={() => setViewerOpen(true)}
            >
              <img
                src={issue.imageUrl}
                alt="issue"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            </div>
          )}

          {/* SCROLLABLE CONTENT */}
          <div
            style={{
              padding: 16,
              overflowY: "auto",
              flex: 1,
            }}
          >
            <div style={{ lineHeight: 1.6, opacity: 0.9 }}>
              {issue.description || "No description provided."}
            </div>

            <div style={{ height: 16 }} />

            <div style={{ fontSize: 13, opacity: 0.7 }}>
              Reports: <strong>{issue.reports ?? 1}</strong> • Severity:{" "}
              <strong>{issue.severity ?? "N/A"}</strong>
            </div>
          </div>

          {/* ACTIONS (STICKY) */}
          <div
            style={{
              padding: 14,
              display: "flex",
              gap: 12,
              borderTop: "1px solid rgba(255,255,255,0.08)",
              flexShrink: 0,
            }}
          >
            <button
              onClick={openGroups}
              style={{
                flex: 1,
                padding: "12px",
                borderRadius: 14,
                background: "white",
                color: "#111",
                fontWeight: 800,
                border: "none",
                cursor: "pointer",
              }}
            >
              Join / Create Group
            </button>

            <button
              onClick={() =>
                alert("Thanks — your confirmation has been recorded (demo).")
              }
              style={{
                padding: "12px 14px",
                borderRadius: 14,
                background: "rgba(255,255,255,0.08)",
                color: "white",
                border: "1px solid rgba(255,255,255,0.08)",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Confirm
            </button>
          </div>
        </div>
      </div>

      {/* FULLSCREEN IMAGE */}
      {viewerOpen && (
        <div
          onClick={() => setViewerOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10000,
            background: "rgba(0,0,0,0.95)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "zoom-out",
          }}
        >
          <img
            src={issue.imageUrl}
            alt="full"
            style={{
              maxWidth: "96%",
              maxHeight: "96%",
              borderRadius: 12,
            }}
          />
        </div>
      )}
    </>
  );
}
