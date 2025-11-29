import React, { useEffect, useRef, useState } from "react";

/**
 * IssueDetails (C5)
 *
 * Props:
 *  - issue: { id, title, description, imageUrl, category, coords, createdAt }
 *  - onBack: () => void
 *  - openGroups: () => void
 *
 * Notes:
 *  - No external libraries used.
 *  - Image can be clicked to open a fullscreen viewer.
 *  - Slide-up animation uses CSS classes and inline style fallback.
 */

export default function IssueDetails({ issue, onBack, openGroups }) {
  const [open, setOpen] = useState(true); // drives slide-up
  const [viewerOpen, setViewerOpen] = useState(false);
  const sheetRef = useRef(null);

  useEffect(() => {
    // entrance animation
    requestAnimationFrame(() => setOpen(true));
  }, []);

  if (!issue) return null;

  const prettyDate = (ts) => {
    try {
      const d = ts ? new Date(ts) : null;
      return d ? d.toLocaleString() : "";
    } catch {
      return "";
    }
  };

  return (
    <>
      {/* backdrop */}
      <div
        onClick={() => { setOpen(false); setTimeout(onBack, 180); }}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.28)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          transition: "opacity 180ms ease",
          opacity: open ? 1 : 0,
          zIndex: 99998,
        }}
      />

      {/* sheet */}
      <div
        ref={sheetRef}
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 99999,
          display: "flex",
          justifyContent: "center",
          pointerEvents: "auto",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 920,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            margin: "0 16px",
            transform: open ? "translateY(0)" : "translateY(12vh)",
            transition: "transform 260ms cubic-bezier(.2,.9,.2,1)",
            background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
            boxShadow: "0 -18px 60px rgba(0,0,0,0.5)",
            backdropFilter: "blur(30px)",
            WebkitBackdropFilter: "blur(30px)",
            border: "1px solid rgba(255,255,255,0.06)",
            overflow: "hidden",
            maxHeight: "78vh",
          }}
        >
          {/* header */}
          <div style={{ display: "flex", alignItems: "center", padding: 14 }}>
            <button
              onClick={() => { setOpen(false); setTimeout(onBack, 180); }}
              style={{
                marginRight: 12,
                padding: "8px 12px",
                borderRadius: 12,
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
              <div style={{ fontSize: 20, fontWeight: 800, color: "white" }}>
                {issue.title}
              </div>
              <div style={{ fontSize: 13, opacity: 0.7, marginTop: 4 }}>
                {prettyDate(issue.createdAt)} • {issue.coords?.[1]?.toFixed?.(4)}, {issue.coords?.[0]?.toFixed?.(4)}
              </div>
            </div>

            {/* category pill */}
            <div
              style={{
                marginLeft: 12,
                padding: "8px 12px",
                borderRadius: 999,
                background:
                  issue.category === "waste" ? "rgba(239,68,68,0.12)" :
                  issue.category === "water" ? "rgba(59,130,246,0.12)" :
                  issue.category === "vegetation" ? "rgba(34,197,94,0.10)" :
                  issue.category === "rooftop" ? "rgba(245,158,11,0.10)" :
                  "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.04)",
                color: "white",
                fontWeight: 700,
                fontSize: 13,
                backdropFilter: "blur(8px)",
              }}
            >
              {issue.category ? issue.category.toUpperCase() : "UNVERIFIED"}
            </div>
          </div>

          {/* image cover */}
          {issue.imageUrl ? (
            <div style={{ width: "100%", position: "relative" }}>
              <img
                src={issue.imageUrl}
                alt="issue"
                onClick={() => setViewerOpen(true)}
                style={{
                  width: "100%",
                  height: 340,
                  objectFit: "cover",
                  display: "block",
                  cursor: "zoom-in",
                }}
              />
            </div>
          ) : (
            <div style={{ width: "100%", height: 220, background: "linear-gradient(90deg,#0b1020,#061018)" }} />
          )}

          {/* content scroll */}
          <div style={{ padding: 18, overflowY: "auto", maxHeight: "calc(78vh - 420px)" }}>
            <div style={{ color: "rgba(255,255,255,0.92)", fontSize: 15, lineHeight: 1.6 }}>
              {issue.description || "No description provided."}
            </div>

            {/* spacer */}
            <div style={{ height: 18 }} />

            {/* metadata row */}
            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ fontSize: 13, opacity: 0.75 }}>
                Reports: <strong style={{ color: "white" }}>{issue.reports ?? 1}</strong>
              </div>
              <div style={{ fontSize: 13, opacity: 0.75 }}>
                Severity: <strong style={{ color: "white" }}>{issue.severity ?? "N/A"}</strong>
              </div>
            </div>

            <div style={{ height: 20 }} />

            {/* actions */}
            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => openGroups && openGroups()}
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  borderRadius: 14,
                  background: "white",
                  color: "#061014",
                  fontWeight: 800,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Join / Create Group
              </button>

              <button
                onClick={() => {
                  // quick report confirmation (local)
                  alert("Thanks — your confirmation has been recorded (demo).");
                }}
                style={{
                  padding: "12px 14px",
                  borderRadius: 14,
                  background: "rgba(255,255,255,0.06)",
                  color: "white",
                  border: "1px solid rgba(255,255,255,0.06)",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Confirm
              </button>
            </div>

            <div style={{ height: 12 }} />
          </div>
        </div>
      </div>

      {/* Fullscreen image viewer */}
      {viewerOpen && (
        <div
          onClick={() => setViewerOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100000,
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
              objectFit: "contain",
              boxShadow: "0 20px 80px rgba(0,0,0,0.8)",
              borderRadius: 12,
            }}
          />
        </div>
      )}
    </>
  );
}
