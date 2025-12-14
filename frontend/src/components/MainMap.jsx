// src/components/MainMap.jsx
import React, { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export default function MainMap({
  issues = [],
  onSelectIssue,
  onAddIssue,
  filters = {},
  heatmap = false,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);

  // -----------------------
  // INIT MAP (ONCE)
  // -----------------------
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
      // SOURCE
      if (!map.getSource("shara-issues")) {
        map.addSource("shara-issues", {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });
      }

      // CIRCLES
      if (!map.getLayer("shara-circles")) {
        map.addLayer({
          id: "shara-circles",
          type: "circle",
          source: "shara-issues",
          paint: {
            "circle-color": [
              "match",
              ["get", "category"],
              "waste", "#EF4444",
              "water", "#3B82F6",
              "vegetation", "#22C55E",
              "rooftop", "#F59E0B",
              "#CBD5E1",
            ],
            "circle-radius": [
              "interpolate",
              ["linear"],
              ["zoom"],
              5, 4,
              12, 8,
              16, 14,
            ],
            "circle-stroke-width": 1,
            "circle-stroke-color": "rgba(255,255,255,0.3)",
          },
        });

        // CLICK HANDLER (ATTACH ONCE)
        map.on("click", "shara-circles", (e) => {
          const f = e.features?.[0];
          if (!f) return;

          onSelectIssue?.({
            id: f.properties.id,
            title: f.properties.title,
            description: f.properties.description,
            imageUrl: f.properties.imageUrl,
            category: f.properties.category,
            coords: f.geometry.coordinates,
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
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // -----------------------
  // UPDATE GEOJSON (CRITICAL FIX)
  // -----------------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const update = () => {
      const src = map.getSource("shara-issues");
      if (!src) return;

      const features = issues
        .filter((i) => Array.isArray(i.coords) && i.coords.length === 2)
        .filter((i) => {
          const cat = i.category ?? "unverified";
          if (cat === "unverified") return true;
          return filters?.[cat] ?? true;
        })
        .map((i) => ({
          type: "Feature",
          properties: {
            id: i.id,
            title: i.title ?? "",
            description: i.description ?? "",
            imageUrl: i.imageUrl ?? "",
            category: i.category ?? "unverified",
          },
          geometry: {
            type: "Point",
            coordinates: i.coords,
          },
        }));

      src.setData({
        type: "FeatureCollection",
        features,
      });

      // HEATMAP
      if (heatmap && !map.getLayer("shara-heat")) {
        map.addLayer(
          {
            id: "shara-heat",
            type: "heatmap",
            source: "shara-issues",
            paint: {
              "heatmap-radius": 30,
              "heatmap-opacity": 0.7,
            },
          },
          "shara-circles"
        );
      }

      if (!heatmap && map.getLayer("shara-heat")) {
        map.removeLayer("shara-heat");
      }
    };

    // TRY NOW, OR AFTER STYLE LOAD
    if (map.getSource("shara-issues")) {
      update();
    } else {
      map.once("load", update);
    }
  }, [issues, filters, heatmap]);

  return (
    <div style={{ width: "100%", height: "100vh", position: "relative" }}>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />

      <button
        onClick={onAddIssue}
        style={{
          position: "absolute",
          bottom: 30,
          right: 30,
          padding: "14px 22px",
          borderRadius: 16,
          background: "rgba(255,255,255,0.12)",
          backdropFilter: "blur(18px)",
          color: "white",
          fontWeight: 800,
          border: "1px solid rgba(255,255,255,0.25)",
          cursor: "pointer",
          zIndex: 9999,
        }}
      >
        + Add Issue
      </button>
    </div>
  );
}
