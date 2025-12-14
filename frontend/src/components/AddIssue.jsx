// frontend/src/components/AddIssue.jsx
import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { uploadToCloudinary } from "../utils/uploadToCloudinary";

const API = import.meta.env.VITE_API_URL;

export default function AddIssue({ onBack, onSaved }) {
  const mapEl = useRef(null);
  const map = useRef(null);
  const marker = useRef(null);
  const fileInputRef = useRef(null);


  const [coords, setCoords] = useState(null);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [imageFile, setImageFile] = useState(null);

  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (!mapEl.current) return;

    map.current = new maplibregl.Map({
      container: mapEl.current,
      style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
      center: [77.216721, 28.6448],
      zoom: 12,
      attributionControl: false,
    });

    map.current.on("load", () => {
      setTimeout(() => map.current.resize(), 50);
    });

    map.current.on("click", (e) => {
      const { lng, lat } = e.lngLat;
      setCoords([lng, lat]);

      if (marker.current) marker.current.remove();

      marker.current = new maplibregl.Marker({ color: "#10b981" })
        .setLngLat([lng, lat])
        .addTo(map.current);
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  const runAI = async (imageUrl) => {
    setAiLoading(true);
    try {
      await fetch(`${API}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_url: imageUrl }),
      });
    } catch (e) {
      console.warn("AI failed silently", e);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!coords) return alert("Place a pin first");
    if (!imageFile) return alert("Upload an image");

    setSaving(true);

    try {
      const imageUrl = await uploadToCloudinary(imageFile);

      // 🔇 Silent AI run
      runAI(imageUrl);

      const payload = {
        title: title || "Untitled",
        description: desc || "",
        coords,
        imageUrl,
        createdAt: Date.now(),
      };

      const res = await fetch(`${API}/issues`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error("Save failed: " + text);
      }

      const saved = await res.json();
      onSaved?.(saved);
    } catch (err) {
      console.error("Save failed", err);
      alert("Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 99999 }}>
      <div ref={mapEl} style={{ position: "absolute", inset: 0 }} />

      <button
        onClick={onBack}
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          zIndex: 30,
          padding: "10px 16px",
          borderRadius: 12,
          background: "rgba(0,0,0,0.45)",
          color: "#fff",
          border: "none",
          cursor: "pointer",
        }}
      >
        ← Back
      </button>

      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: 36,
          transform: "translateX(-50%)",
          width: 760,
          maxWidth: "92vw",
          borderRadius: 18,
          padding: 20,
          background: "rgba(12,12,12,0.85)",
          backdropFilter: "blur(14px)",
          color: "white",
          zIndex: 40,
          boxSizing: "border-box",
        }}
      >
        <h3 style={{ margin: 0, fontSize: 20 }}>Add Issue</h3>

        <input
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={inputStyle}
        />

        <textarea
          placeholder="Description"
          rows={3}
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          style={{ ...inputStyle, resize: "none" }}
        />

        <div style={{ marginTop: 12 }}>
  <input
    ref={fileInputRef}
    type="file"
    accept="image/*"
    style={{ display: "none" }}
    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
  />

  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 12,
    }}
  >
    <button
      type="button"
      onClick={() => fileInputRef.current?.click()}
      style={{
        padding: "10px 14px",
        borderRadius: 10,
        background: "rgba(255,255,255,0.08)",
        color: "white",
        border: "1px solid rgba(255,255,255,0.15)",
        cursor: "pointer",
        fontSize: 14,
      }}
    >
      Upload image
    </button>

    <span
      style={{
        fontSize: 13,
        opacity: 0.75,
        maxWidth: 360,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      }}
    >
      {imageFile ? imageFile.name : "No image selected"}
    </span>
  </div>
</div>


        <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
          <button
            onClick={handleSubmit}
            disabled={saving}
            style={{
              flex: 1,
              padding: "12px 14px",
              borderRadius: 12,
              background: "#10b981",
              color: "#041014",
              fontWeight: 700,
              border: "none",
              cursor: "pointer",
            }}
          >
            {saving ? "Submitting…" : "Submit Issue"}
          </button>

          <button
            onClick={() => {
              setTitle("");
              setDesc("");
              setImageFile(null);
            }}
            style={{
              padding: "12px 14px",
              borderRadius: 12,
              background: "rgba(255,255,255,0.06)",
              color: "white",
              border: "none",
              cursor: "pointer",
            }}
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  marginTop: 10,
  padding: "12px 14px",
  borderRadius: 12,
  background: "rgba(255,255,255,0.06)",
  color: "white",
  border: "1px solid rgba(255,255,255,0.12)",
  outline: "none",
  boxSizing: "border-box",
  fontSize: 14,
};
