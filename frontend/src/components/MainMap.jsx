// src/components/MainMap.jsx
import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export default function MainMap({
  issues = [],
  onSelectIssue,
  onAddIssue,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const [helpOpen, setHelpOpen] = useState(false);

  // =========================
  // INIT MAP (ONCE)
  // =========================
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: "https://tiles.stadiamaps.com/styles/alidade_smooth_dark.json",
      center: [77.216721, 28.6448],
      zoom: 12,
      attributionControl: false,
    });

    map.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "top-right"
    );

    map.on("load", () => {
      map.addSource("shara-issues", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
      });

      map.addLayer({
        id: "shara-circles",
        type: "circle",
        source: "shara-issues",
        paint: {
          "circle-color": "#E5E7EB",
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            10, 6,
            14, 10,
            17, 16,
          ],
          "circle-stroke-width": 1.5,
          "circle-stroke-color": "rgba(0,0,0,0.4)",
        },
      });

      map.on("click", "shara-circles", (e) => {
        const f = e.features?.[0];
        if (!f) return;

        onSelectIssue?.({
          id: f.properties.id,
          title: f.properties.title,
          description: f.properties.description,
          imageUrl: f.properties.imageUrl,
          coords: f.geometry.coordinates,
          ai: f.properties.ai
            ? JSON.parse(f.properties.ai)
            : null,
        });
      });

      map.on("mouseenter", "shara-circles", () => {
        map.getCanvas().style.cursor = "pointer";
      });

      map.on("mouseleave", "shara-circles", () => {
        map.getCanvas().style.cursor = "";
      });
    });

    mapRef.current = map;
    return () => map.remove();
  }, []);

  // =========================
  // UPDATE DATA
  // =========================
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const src = map.getSource("shara-issues");
    if (!src) return;

    src.setData({
      type: "FeatureCollection",
      features: issues
        .filter((i) => Array.isArray(i.coords))
        .map((i) => ({
          type: "Feature",
          properties: {
            id: i.id,
            title: i.title ?? "",
            description: i.description ?? "",
            imageUrl: i.imageUrl ?? "",
            ai: i.ai ? JSON.stringify(i.ai) : null,
          },
          geometry: {
            type: "Point",
            coordinates: i.coords,
          },
        })),
    });
  }, [issues]);

  // =========================
  // UI
  // =========================
  return (
    <div style={{ width: "100%", height: "100vh", position: "relative" }}>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />

      {/* HELP WINDOW */}
      {helpOpen && (
        <div
          style={{
            position: "absolute",
            bottom: 96,
            right: 30,
            width: 280,
            padding: 16,
            borderRadius: 14,
            background: "rgba(20,20,20,0.9)",
            backdropFilter: "blur(16px)",
            color: "white",
            zIndex: 9999,
            border: "1px solid rgba(255,255,255,0.15)",
          }}
        >
          <div style={{ fontWeight: 800, marginBottom: 8 }}>
            How to use
          </div>

          <ul style={{ paddingLeft: 16, fontSize: 14, lineHeight: 1.6 }}>
            <li>Click a pin to view road damage</li>
            <li>Use <b>Add Issue</b> to report damage</li>
            <li>Upload a photo for verification</li>
          </ul>

          <button
            onClick={() => setHelpOpen(false)}
            style={{
              marginTop: 12,
              width: "100%",
              padding: "8px 0",
              borderRadius: 10,
              background: "rgba(255,255,255,0.1)",
              color: "white",
              border: "none",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Got it
          </button>
        </div>
      )}

      {/* FAB CLUSTER (CLEAN) */}
      <div
        style={{
          position: "absolute",
          bottom: 30,
          right: 30,
          display: "flex",
          alignItems: "center",
          gap: 12,
          zIndex: 9999,
        }}
      >
        <button
          onClick={() => setHelpOpen((s) => !s)}
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(255,255,255,0.14)",
            backdropFilter: "blur(12px)",
            color: "white",
            fontWeight: 800,
            fontSize: 18,
            border: "1px solid rgba(255,255,255,0.25)",
            cursor: "pointer",
          }}
        >
          ?
        </button>

        <button
          onClick={onAddIssue}
          style={{
            height: 48,
            padding: "0 22px",
            borderRadius: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(255,255,255,0.12)",
            backdropFilter: "blur(18px)",
            color: "white",
            fontWeight: 800,
            fontSize: 16,
            border: "1px solid rgba(255,255,255,0.25)",
            cursor: "pointer",
          }}
        >
          Add Issue
        </button>
      </div>
    </div>
  );
}
