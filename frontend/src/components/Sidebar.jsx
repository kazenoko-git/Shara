import React, { useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { MdDelete, MdWater, MdPark, MdHome } from "react-icons/md";

export default function Sidebar({ onScan, filters, setFilters }) {
  const [open, setOpen] = useState(true);

  const WIDTH_OPEN = 320;
  const WIDTH_COLLAPSED = 78;

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
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        background: "rgba(10,10,10,0.42)", // GLASS PANEL
        borderRight: "1px solid rgba(255,255,255,0.09)",
        boxShadow: "0 0 40px rgba(0,0,0,0.35)",
        zIndex: 999999,
        overflow: "hidden",
        transition: "width 260ms ease",
        display: "flex",
        flexDirection: "column",
        padding: open ? "24px" : "14px 8px",
      }}
    >
      {/* GLASS collapse button */}
      <button
  onClick={() => setOpen(!open)}
  style={{
    position: "absolute",
    top: 22,
    left: open ? WIDTH_OPEN - 14 : WIDTH_COLLAPSED - 14,
    transform: "translateX(-50%)",

    // SIZE
    height: 44,
    width: 44,

    // PURE CIRCLE
    borderRadius: "999px",
    padding: 0,
    margin: 0,
    lineHeight: 0,

    // STOP BROWSER INTERFERENCE
    appearance: "none",
    WebkitAppearance: "none",
    outline: "none",

    // GLASS
    background: "rgba(255,255,255,0.08)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    border: "1px solid rgba(255,255,255,0.15)",

    // CENTERING
    display: "flex",
    alignItems: "center",
    justifyContent: "center",

    // AESTHETICS
    cursor: "pointer",
    color: "white",
    boxShadow: "0 6px 18px rgba(0,0,0,0.45)",
    transition: "left 250ms ease, background 200ms ease",
    zIndex: 99999999,
  }}
>
  {open ? <FiChevronLeft size={18} /> : <FiChevronRight size={18} />}
</button>


      {/* FULL VIEW */}
      {open ? (
        <>
          {/* Title */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 36, fontWeight: 800, color: "#fff" }}>
              SHARA
            </div>
            <div style={{ marginTop: 6, fontSize: 13, color: "#c7c9cc" }}>
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
              boxShadow: "0 6px 20px rgba(16,185,129,0.25)",
            }}
          >
            Scan Area
          </button>

          {/* Filters */}
          <div style={{ fontSize: 18, fontWeight: 700, color: "white", marginBottom: 12 }}>
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
                    background: on ? "rgba(50,213,131,0.10)" : "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.05)",
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
                    <div style={{ color: "#b0b4b8", fontSize: 12 }}>
                      {k === "waste" && "illegal dumping, debris"}
                      {k === "water" && "ponds, streams"}
                      {k === "vegetation" && "trees, grass"}
                      {k === "rooftop" && "solar, roof area"}
                    </div>
                  </div>

                  {/* toggle */}
                  <div
                    style={{
                      width: 44,
                      height: 24,
                      borderRadius: 999,
                      padding: 3,
                      background: on
                        ? "linear-gradient(90deg,#34d399,#10b981)"
                        : "rgba(255,255,255,0.07)",
                      display: "flex",
                      justifyContent: on ? "flex-end" : "flex-start",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 999,
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
        /* COLLAPSED VIEW — FIXED CENTERING */
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",  // PERFECT VERTICAL CENTERING
            alignItems: "center",
            gap: 32,
          }}
        >
          {Object.keys(filters).map((k) => (
            <div key={k} style={{ opacity: filters[k] ? 1 : 0.35 }}>
              {icons[k]}
            </div>
          ))}
        </div>
      )}

      {/* FOOTER FIXED + SPACED */}
      <div
        style={{
          paddingBottom: 22,
          paddingTop: 18,
          textAlign: "center",
          color: "#b2b6bb",
          fontSize: 13,
          opacity: 0.7,
          letterSpacing: 0.4,
          borderTop: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        SHARA · 2025
      </div>
    </aside>
  );
}
