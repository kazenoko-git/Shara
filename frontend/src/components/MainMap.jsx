// src/components/MainMap.jsx
import React, { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";

/**
 * Props:
 *  - issues: Firestore issues array
 *  - onSelectIssue(issue)
 *  - onAddIssue()
 *  - filters: object
 *  - heatmap: boolean
 */
export default function MainMap({
  issues = [],
  onSelectIssue,
  onAddIssue,
  filters = {},
  heatmap = false,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);

  // helper: safe accessor
  const isMapReady = () => mapRef.current && mapRef.current.isStyleLoaded && mapRef.current.isStyleLoaded();

  // Initialize map
  useEffect(() => {
    if (mapRef.current) return; // already inited

    mapRef.current = new maplibregl.Map({
      container: containerRef.current,
      style: "https://tiles.stadiamaps.com/styles/alidade_smooth_dark.json",
      center: [77.216721, 28.6448],
      zoom: 12,
    });

    mapRef.current.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    // ensure empty source created AFTER style loads
    const onLoad = () => {
      console.log("🌍 MAP STYLE LOADED");
      try {
        if (!mapRef.current.getSource("shara-issues")) {
          mapRef.current.addSource("shara-issues", {
            type: "geojson",
            data: { type: "FeatureCollection", features: [] },
          });
        }
      } catch (err) {
        console.warn("source init error", err);
      }
    };

    if (mapRef.current.isStyleLoaded && mapRef.current.isStyleLoaded()) {
      onLoad();
    } else {
      mapRef.current.once("load", onLoad);
    }

    return () => {
      try {
        mapRef.current?.remove();
        mapRef.current = null;
      } catch (e) {}
    };
  }, []);

  // Sync issues → source & layers (defensive)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const ensureReadyThenRun = (fn) => {
      if (map.isStyleLoaded && map.isStyleLoaded()) {
        fn();
      } else {
        // wait for style load then run once
        const cb = () => {
          try { fn(); } catch (e) { console.error(e); }
          map.off("load", cb);
        };
        map.on("load", cb);
      }
    };

    ensureReadyThenRun(() => {
      const srcId = "shara-issues";
      // Build filtered GeoJSON
      const features = (issues || [])
        .filter((it) => it.coords && Array.isArray(it.coords))
        .filter((it) => {
          const cat = it.category ?? it.type ?? "unverified";
          if (!filters || !Object.prototype.hasOwnProperty.call(filters, cat)) return true;
          return filters[cat];
        })
        .map((it) => ({
          type: "Feature",
          properties: {
            id: it.id ?? it._id ?? "",
            title: it.title ?? "",
            description: it.description ?? it.desc ?? "",
            imageUrl: it.imageUrl ?? "",
            category: it.category ?? "unverified",
          },
          geometry: { type: "Point", coordinates: it.coords },
        }));

      const geo = { type: "FeatureCollection", features };

      // update source safely
      try {
        if (map.getSource(srcId)) {
          map.getSource(srcId).setData(geo);
        } else {
          map.addSource(srcId, { type: "geojson", data: geo });
        }
      } catch (e) {
        console.warn("source update failed", e);
      }

      // circle layer
      const circleLayerId = "shara-circles";
      if (!map.getLayer(circleLayerId)) {
        try {
          map.addLayer({
            id: circleLayerId,
            type: "circle",
            source: srcId,
            paint: {
              "circle-color": [
                "match",
                ["get", "category"],
                "waste", "#EF4444",
                "water", "#3B82F6",
                "vegetation", "#22C55E",
                "rooftop", "#F59E0B",
                /* default */ "#CBD5E1",
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
              "circle-stroke-color": "rgba(255,255,255,0.25)",
            },
          });
        } catch (err) {
          console.warn("add circle layer failed", err);
        }
      }

      // heatmap layer toggle (if heatmap on, ensure added; else remove)
      const heatLayerId = "shara-heat";
      if (heatmap) {
        if (!map.getLayer(heatLayerId)) {
          try {
            map.addLayer({
              id: heatLayerId,
              type: "heatmap",
              source: srcId,
              maxzoom: 16,
              paint: {
                "heatmap-weight": 1,
                "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 0, 0.5, 15, 1.5],
                "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 0, 8, 15, 40],
                "heatmap-opacity": 0.75,
                "heatmap-color": [
                  "interpolate",
                  ["linear"],
                  ["heatmap-density"],
                  0, "rgba(0,0,0,0)",
                  0.2, "rgb(34,197,94)",
                  0.5, "rgb(250,204,21)",
                  0.8, "rgb(239,68,68)",
                ],
              },
            }, "shara-circles"); // add below circles
          } catch (err) {
            console.warn("add heatmap failed", err);
          }
        }
      } else {
        if (map.getLayer(heatLayerId)) {
          try { map.removeLayer(heatLayerId); } catch (e) {}
        }
      }

      // attach/reattach click handlers for circles (clear first)
      const clickHandler = (e) => {
        try {
          const feat = e.features && e.features[0];
          if (!feat) return;
          const p = feat.properties || {};
          const issue = {
            id: p.id,
            title: p.title,
            description: p.description,
            imageUrl: p.imageUrl,
            category: p.category,
            coords: feat.geometry.coordinates,
          };
          onSelectIssue && onSelectIssue(issue);
        } catch (err) {
          console.warn("click handler error", err);
        }
      };

      // Remove any previous handlers safely
      try {
        map.off("click", "shara-circles", clickHandler);
      } catch (e) {}

      try {
        map.on("click", "shara-circles", clickHandler);
        map.on("mouseenter", "shara-circles", () => (map.getCanvas().style.cursor = "pointer"));
        map.on("mouseleave", "shara-circles", () => (map.getCanvas().style.cursor = ""));
      } catch (err) {
        console.warn("attach handlers failed", err);
      }
    });

    // cleanup not required here because handlers are re-bound each update
  }, [issues, filters, heatmap, onSelectIssue]);

  // UI
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
          WebkitBackdropFilter: "blur(18px)",
          color: "white",
          fontWeight: 700,
          border: "1px solid rgba(255,255,255,0.2)",
          cursor: "pointer",
          zIndex: 99999,
          boxShadow: "0 4px 18px rgba(0,0,0,0.35)",
        }}
      >
        + Add Issue
      </button>
    </div>
  );
}
