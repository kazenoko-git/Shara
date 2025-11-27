import React, { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";

export default function EsriMap() {
  const mapRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapRef.current,
      style: {
        version: 8,
        sources: {
          esri: {
            type: "raster",
            tiles: [
              "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            ],
            tileSize: 256,
          },
        },
        layers: [
          {
            id: "esri-layer",
            type: "raster",
            source: "esri",
          },
        ],
      },
      center: [77.2, 28.6], // Delhi
      zoom: 11,
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");

    return () => map.remove();
  }, []);

  return <div ref={mapRef} className="h-full w-full"></div>;
}
