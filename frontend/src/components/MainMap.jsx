import React, { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";

/**
 * Props:
 *  - issues: Firestore issues
 *  - onSelectIssue(issue)
 *  - onAddIssue()
 *  - filters
 *  - heatmap
 */
export default function MainMap({
  issues = [],
  onSelectIssue,
  onAddIssue,
  filters = {},
  heatmap = false,
}) {
  const mapRef = useRef(null); // DOM container
  const map = useRef(null); // map instance

  // ============================================================
  // MAP INITIALIZE
  // ============================================================
  useEffect(() => {
    map.current = new maplibregl.Map({
      container: mapRef.current,
      style: "https://tiles.stadiamaps.com/styles/alidade_smooth_dark.json",
      center: [77.216721, 28.6448],
      zoom: 12,
    });

    map.current.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "top-right"
    );

    map.current.on("load", () => {
      console.log("🌍 MAP STYLE LOADED");

      // initialize empty source
      if (!map.current.getSource("shara-issues")) {
        map.current.addSource("shara-issues", {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });
      }
    });

    return () => map.current?.remove();
  }, []);

  // ============================================================
  // UPDATE ISSUE MARKERS (AFTER MAP LOAD)
  // ============================================================
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;

    const srcId = "shara-issues";
    const mapInstance = map.current;

    // Build filtered GeoJSON
    const features = issues
      .filter((it) => it.coords && Array.isArray(it.coords))
      .filter((it) => {
        const cat = it.category ?? it.type ?? "unverified";
        if (!filters || !Object.prototype.hasOwnProperty.call(filters, cat))
          return true;
        return filters[cat];
      })
      .map((it) => ({
        type: "Feature",
        properties: {
          id: it.id,
          title: it.title,
          description: it.description,
          imageUrl: it.imageUrl,
          category: it.category ?? "unverified",
        },
        geometry: { type: "Point", coordinates: it.coords },
      }));

    const geo = { type: "FeatureCollection", features };

    // update source
    if (mapInstance.getSource(srcId)) {
      mapInstance.getSource(srcId).setData(geo);
    }

    // CIRCLE LAYER
    const circleLayerId = "shara-circles";

    if (!mapInstance.getLayer(circleLayerId)) {
      mapInstance.addLayer({
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
    }

    // CLICK HANDLER
    const onClick = (e) => {
      const feat = e.features?.[0];
      if (!feat) return;

      const p = feat.properties;

      onSelectIssue({
        id: p.id,
        title: p.title,
        description: p.description,
        imageUrl: p.imageUrl,
        category: p.category,
        coords: feat.geometry.coordinates,
      });
    };

    mapInstance.on("click", circleLayerId, onClick);
    mapInstance.on("mouseenter", circleLayerId, () => {
      mapInstance.getCanvas().style.cursor = "pointer";
    });
    mapInstance.on("mouseleave", circleLayerId, () => {
      mapInstance.getCanvas().style.cursor = "";
    });

    // HEATMAP LAYER
    const heatLayerId = "shara-heat";

    if (heatmap) {
      if (!mapInstance.getLayer(heatLayerId)) {
        mapInstance.addLayer(
          {
            id: heatLayerId,
            type: "heatmap",
            source: srcId,
            maxzoom: 16,
            paint: {
              "heatmap-weight": 1,
              "heatmap-intensity": [
                "interpolate",
                ["linear"],
                ["zoom"],
                0, 0.5,
                15, 1.5,
              ],
              "heatmap-radius": [
                "interpolate",
                ["linear"],
                ["zoom"],
                0, 8,
                15, 40,
              ],
              "heatmap-opacity": 0.75,
            },
          },
          circleLayerId
        );
      }
    } else {
      if (mapInstance.getLayer(heatLayerId)) {
        mapInstance.removeLayer(heatLayerId);
      }
    }

    return () => {
      try {
        mapInstance.off("click", circleLayerId, onClick);
      } catch {}
    };
  }, [issues, filters, heatmap]);

  // ============================================================
  // UI
  // ============================================================
  return (
    <div style={{ width: "100%", height: "100vh", position: "relative" }}>
      <div
        ref={mapRef}
        style={{ width: "100%", height: "100%", position: "absolute" }}
      />

      {/* Floating Add Issue button (Apple glass style) */}
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
