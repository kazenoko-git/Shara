import React, { useState, useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export default function AddIssue({ onBack, onSaved }) {
  const mapEl = useRef(null);
  const map = useRef(null);
  const marker = useRef(null);

  const [coords, setCoords] = useState(null);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [image, setImage] = useState(null);

  useEffect(() => {
    console.log("🔥 Mounting AddIssue map…");

    if (!mapEl.current) {
      console.log("❌ mapEl is null → DOM not mounted yet");
      return;
    }

    // --- CREATE MAP ---
    map.current = new maplibregl.Map({
      container: mapEl.current,
      style: "https://tiles.stadiamaps.com/styles/alidade_smooth_dark.json",
      center: [77.216721, 28.6448],
      zoom: 12,
      attributionControl: false,
    });

    map.current.on("load", () => {
      console.log("🟢 AddIssue map is LOADED");

      // Force resize (MapLibre bug in portals)
      setTimeout(() => {
        map.current.resize();
        console.log("🔧 Forced resize");
      }, 50);

      // Click handler
      map.current.on("click", (e) => {
        const { lng, lat } = e.lngLat;
        setCoords([lng, lat]);

        if (marker.current) marker.current.remove();

        marker.current = new maplibregl.Marker({ color: "#10b981" })
          .setLngLat([lng, lat])
          .addTo(map.current);
      });
    });

    return () => {
      if (map.current) {
        console.log("🧹 Unmounting AddIssue map");
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // --- SUBMIT ---
  const submit = () => {
    if (!coords) return alert("Tap the map to place a pin first!");
    const issue = { title, desc, coords, imageUrl: "" };
    onSaved(issue);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        overflow: "hidden",
        background: "#000", // fallback
        zIndex: 99999,
      }}
    >
      {/* MAP ITSELF */}
      <div
        ref={mapEl}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          zIndex: 1,
        }}
      />

      {/* BACK BUTTON */}
      <button
        onClick={onBack}
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          zIndex: 20,
          padding: "10px 18px",
          background: "rgba(0,0,0,0.4)",
          backdropFilter: "blur(12px)",
          borderRadius: 14,
          color: "white",
          border: "none",
          cursor: "pointer",
          fontWeight: 600,
        }}
      >
        ← Back
      </button>

      {/* GLASS SHEET */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          width: "100%",
          height: "260px",
          padding: "20px",
          background: "rgba(18,18,18,0.45)",
          backdropFilter: "blur(30px)",
          borderTop: "1px solid rgba(255,255,255,0.1)",
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          zIndex: 20,
        }}
      >
        <h2
          style={{
            fontWeight: 700,
            marginBottom: 10,
            fontSize: 20,
            color: "white",
          }}
        >
          Add Issue
        </h2>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: 12,
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.12)",
            marginBottom: 10,
            color: "white",
          }}
        />

        <textarea
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Description"
          rows={2}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: 12,
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.12)",
            marginBottom: 10,
            color: "white",
          }}
        />

        <button
          onClick={submit}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: 14,
            background: "linear-gradient(90deg,#34d399,#10b981)",
            color: "#041014",
            fontWeight: 800,
            border: "none",
            cursor: "pointer",
          }}
        >
          Submit Issue
        </button>
      </div>
    </div>
  );
}
