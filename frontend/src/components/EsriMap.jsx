import React, { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";

export default function EsriMap({ issues = [], filters }) {
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);

  // --------------------------------------
  // 1. INITIALIZE MAP ONLY ONCE
  // --------------------------------------
  useEffect(() => {
    if (mapRef.current) return;

    mapRef.current = new maplibregl.Map({
      container: mapContainerRef.current,
      style: {
        version: 8,
        sources: {
          esri: {
            type: "raster",
            tiles: [
              "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
            ],
            tileSize: 256,
          },
        },
        layers: [
          {
            id: "esri-base",
            type: "raster",
            source: "esri",
          },
        ],
      },
      center: [77.2090, 28.6139],
      zoom: 12,
    });
  }, []);

  // --------------------------------------
  // 2. RE-RENDER POLYGONS WHEN ISSUES CHANGE
  // --------------------------------------
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    if (!map.isStyleLoaded()) {
      map.once("styledata", () => renderLayers(map));
    } else {
      renderLayers(map);
    }
  }, [issues, filters]);

  // --------------------------------------
  // 3. FUNCTION: ADD SOURCES + LAYERS
  // --------------------------------------
  const renderLayers = (map) => {
    // Remove old layers if they exist
    cleanupLayers(map);

    // Convert issues → GeoJSON
    const geojson = {
      type: "FeatureCollection",
      features: issues.map((issue) => ({
        type: "Feature",
        geometry: issue.geometry, // expecting your Rust backend to return GeoJSON polygons
        properties: {
          type: issue.type,
        },
      })),
    };

    // Add source
    if (!map.getSource("issues")) {
      map.addSource("issues", {
        type: "geojson",
        data: geojson,
      });
    } else {
      map.getSource("issues").setData(geojson);
    }

    // Color per category
    const colors = {
      waste: "#EF4444",
      water: "#3B82F6",
      vegetation: "#22C55E",
      rooftop: "#F59E0B",
    };

    Object.keys(filters).forEach((key) => {
      if (!filters[key]) return; // skip disabled layers

      map.addLayer({
        id: `layer-${key}`,
        type: "fill",
        source: "issues",
        paint: {
          "fill-color": colors[key],
          "fill-opacity": [
            "match",
            ["get", "type"],
            key, 0.45,
            0
          ],
        },
      });

      // white outline
      map.addLayer({
        id: `outline-${key}`,
        type: "line",
        source: "issues",
        paint: {
          "line-color": "white",
          "line-width": 1,
        },
        filter: ["==", "type", key],
      });
    });

    // --------------------------------------
    // OPTIONAL HEATMAP
    // --------------------------------------
    if (!map.getLayer("heatmap")) {
      map.addLayer({
        id: "heatmap",
        type: "heatmap",
        source: "issues",
        maxzoom: 16,
        paint: {
          "heatmap-weight": 1,
          "heatmap-radius": 25,
          "heatmap-opacity": 0.35,
          "heatmap-color": [
            "interpolate",
            ["linear"],
            ["heatmap-density"],
            0, "rgba(0,0,0,0)",
            1, "rgba(34,197,94,0.9)"
          ],
        },
      });
    }
  };

  // --------------------------------------
  // HELPERS — remove old layers before re-render
  // --------------------------------------
  const cleanupLayers = (map) => {
    const layers = map.getStyle()?.layers || [];
    layers.forEach((l) => {
      if (
        l.id.startsWith("layer-") ||
        l.id.startsWith("outline-") ||
        l.id === "heatmap"
      ) {
        if (map.getLayer(l.id)) map.removeLayer(l.id);
      }
    });

    if (map.getSource("issues")) {
      map.removeSource("issues");
    }
  };

  // --------------------------------------
  // RENDER MAP CONTAINER
  // --------------------------------------
  return (
    <div
      ref={mapContainerRef}
      style={{
        height: "100vh",
        width: "100vw",
        position: "absolute",
        top: 0,
        left: 0,
        zIndex: 1,
      }}
    />
  );
}
