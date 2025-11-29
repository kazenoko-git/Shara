import React from "react";
import { MdOutlineDelete, MdWater, MdPark, MdHome } from "react-icons/md";

const ICONS = {
  waste: <MdOutlineDelete size={18} />,
  water: <MdWater size={18} />,
  vegetation: <MdPark size={18} />,
  rooftop: <MdHome size={18} />
};

export default function Filters({ filters, setFilters, heatmap, setHeatmap }) {
  const categories = Object.keys(filters);

  return (
    <div
      style={{
        position: "absolute",
        left: 20,
        top: 84,
        zIndex: 9999999,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      {/* Glass container */}
      <div
        style={{
          padding: 12,
          borderRadius: 14,
          background: "rgba(255,255,255,0.06)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          color: "white",
          minWidth: 56,
        }}
      >
        {categories.map((k) => {
          const on = filters[k];
          return (
            <button
              key={k}
              onClick={() => setFilters((prev) => ({ ...prev, [k]: !prev[k] }))}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 8px",
                background: on ? "rgba(255,255,255,0.06)" : "transparent",
                borderRadius: 10,
                border: on ? "1px solid rgba(255,255,255,0.09)" : "none",
                cursor: "pointer",
                width: "100%",
                justifyContent: "center",
              }}
              title={k}
            >
              <div style={{ opacity: on ? 1 : 0.45 }}>{ICONS[k]}</div>
            </button>
          );
        })}

        {/* Heatmap toggle */}
        <div style={{ height: 8 }} />
        <button
          onClick={() => setHeatmap((s) => !s)}
          style={{
            width: "100%",
            padding: 8,
            marginTop: 6,
            borderRadius: 10,
            background: heatmap ? "linear-gradient(90deg,#34d399,#10b981)" : "rgba(255,255,255,0.03)",
            color: heatmap ? "#041014" : "white",
            fontWeight: 700,
            cursor: "pointer",
            fontSize: 13,
          }}
        >
          {heatmap ? "Heatmap ON" : "Heatmap"}
        </button>
      </div>
    </div>
  );
}
