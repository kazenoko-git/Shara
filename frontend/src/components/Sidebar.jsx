import React, { useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { MdDelete, MdWater, MdPark, MdHome } from "react-icons/md";

export default function Sidebar({ onScan, filters, setFilters }) {
  const [open, setOpen] = useState(true);

  const WIDTH_OPEN = 320;
  const WIDTH_COLLAPSED = 72;

  const icons = {
    waste: <MdDelete size={22} color="#E6EEF2" />,
    water: <MdWater size={22} color="#E6EEF2" />,
    vegetation: <MdPark size={22} color="#E6EEF2" />,
    rooftop: <MdHome size={22} color="#E6EEF2" />,
  };

  const toggleFilter = (k) => setFilters((prev) => ({ ...prev, [k]: !prev[k] }));

  return (
    <aside
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        height: "100vh",
        width: open ? WIDTH_OPEN : WIDTH_COLLAPSED,
        background: "linear-gradient(180deg,#0b0d10,#070809)",
        borderRight: "1px solid rgba(255,255,255,0.05)",
        zIndex: 999999, // ABOVE MAP ALWAYS
        overflow: "hidden",
        transition: "width 220ms ease",
        display: "flex",
        flexDirection: "column",
        padding: open ? 24 : 8,
      }}
    >

      {/* COLLAPSE BUTTON (fixed, always outside map layer) */}
      {/* GLASS COLLAPSE BUTTON */}
<button
  onClick={() => setOpen((s) => !s)}
  style={{
    position: "absolute",
    top: 24,
    left: open ? WIDTH_OPEN - 12 : WIDTH_COLLAPSED - 12,
    transform: "translateX(-50%)",
    height: 44,
    width: 44,
    borderRadius: 999,
    background: "rgba(255,255,255,0.08)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    border: "1px solid rgba(255,255,255,0.15)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#ffffff",
    cursor: "pointer",
    boxShadow: "0 4px 18px rgba(0,0,0,0.45)",
    transition: "left 220ms ease, background 200ms ease",
    zIndex: 99999999,
  }}
>
  {open ? <FiChevronLeft size={18} /> : <FiChevronRight size={18} />}
</button>


      {/* CONTENT AREA */}
      {open ? (
        <>
          {/* Header */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 36, fontWeight: 800, color: "#fff" }}>SHARA</div>
            <div style={{ marginTop: 6, fontSize: 13, color: "#9aa0a6" }}>
              Saving the planet, one step at a time
            </div>
          </div>

          {/* Scan Button */}
          <button
            onClick={onScan}
            style={{
              width: "100%",
              padding: "14px 10px",
              fontSize: 17,
              fontWeight: 700,
              borderRadius: 14,
              background: "linear-gradient(90deg,#34d399,#10b981)",
              border: "none",
              cursor: "pointer",
              color: "#041014",
              marginBottom: 24,
              boxShadow: "0 6px 16px rgba(16,185,129,0.2)",
            }}
          >
            Scan Area
          </button>

          {/* Filters */}
          <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 14 }}>
            Filters
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {Object.keys(filters).map((k) => {
              const on = filters[k];
              return (
                <div
                  key={k}
                  onClick={() => toggleFilter(k)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "12px",
                    borderRadius: 14,
                    background: on ? "rgba(50,213,131,0.08)" : "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.04)",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ width: 32, display: "flex", justifyContent: "center" }}>
                    {icons[k]}
                  </div>

                  <div style={{ flex: 1, marginLeft: 8 }}>
                    <div style={{ color: "white", fontWeight: 700, textTransform: "capitalize" }}>
                      {k}
                    </div>
                    <div style={{ color: "#9aa0a6", fontSize: 12, marginTop: 3 }}>
                      {k === "waste" && "illegal dumping, debris"}
                      {k === "water" && "ponds, streams"}
                      {k === "vegetation" && "trees, grass"}
                      {k === "rooftop" && "solar, roof area"}
                    </div>
                  </div>

                  {/* Toggle Chip */}
                  <div
                    style={{
                      width: 44,
                      height: 24,
                      borderRadius: 999,
                      background: on
                        ? "linear-gradient(90deg,#34d399,#10b981)"
                        : "rgba(255,255,255,0.07)",
                      padding: 3,
                      display: "flex",
                      justifyContent: on ? "flex-end" : "flex-start",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        background: on ? "#041014" : "#0c0f11",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.5)",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        /* COLLAPSED VIEW */
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 26,
            paddingTop: 80,
          }}
        >
          {Object.keys(filters).map((k) => (
            <div key={k} style={{ opacity: filters[k] ? 1 : 0.35 }}>
              {icons[k]}
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
<div
  style={{
    marginTop: "auto",
    paddingBottom: 26,
    paddingTop: 14,
    textAlign: "center",
    color: "#8b9199",
    fontSize: 13,
    opacity: 0.75,
    letterSpacing: 0.4,
  }}
>
  SHARA · 2025
</div>

    </aside>
  );
}
