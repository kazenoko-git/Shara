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
  const mapLoadedRef = useRef(false);
  const [helpOpen, setHelpOpen] = useState(false);

  // =========================
  // INIT MAP (STRICTMODE SAFE)
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
      mapLoadedRef.current = true;

      if (!map.getSource("shara-issues")) {
        map.addSource("shara-issues", {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });
      }

      if (!map.getLayer("shara-circles")) {
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
      }
    });

    mapRef.current = map;

    return () => {
      mapLoadedRef.current = false;
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // =========================
  // UPDATE DATA (SAFE)
  // =========================
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!mapLoadedRef.current) return;

    const src = map.getSource("shara-issues");
    if (!src) return;

    src.setData({
      type: "FeatureCollection",
      features: issues
        .filter((i) => Array.isArray(i.coords) && i.coords.length === 2)
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
          <b>How to use</b>
          <ul style={{ paddingLeft: 16, fontSize: 14, marginTop: 8 }}>
            <li>Click a pin to view issue</li>
            <li>Add Issue to report damage</li>
            <li>Upload image for proof</li>
          </ul>
          <button
            onClick={() => setHelpOpen(false)}
            style={{
              marginTop: 10,
              width: "100%",
              padding: 8,
              borderRadius: 10,
              background: "rgba(255,255,255,0.1)",
              color: "white",
              border: "none",
              cursor: "pointer",
            }}
          >
            Got it
          </button>
        </div>
      )}

      {/* FAB */}
      <div
        style={{
          position: "absolute",
          bottom: 30,
          right: 30,
          display: "flex",
          gap: 12,
          zIndex: 9999,
        }}
      >
        <button
          onClick={() => setHelpOpen((v) => !v)}
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.14)",
            backdropFilter: "blur(12px)",
            color: "white",
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
            background: "rgba(255,255,255,0.12)",
            backdropFilter: "blur(18px)",
            color: "white",
            fontWeight: 800,
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
