// src/components/AddIssue.jsx

import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { uploadToCloudinary } from "../utils/uploadToCloudinary";

export default function AddIssue({ onBack, onSaved }) {
  const mapEl = useRef(null);
  const map = useRef(null);
  const marker = useRef(null);

  const [coords, setCoords] = useState(null);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [imageFile, setImageFile] = useState(null);

  const [saving, setSaving] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  // -------------------------------
  // MAP INIT
  // -------------------------------
  useEffect(() => {
    if (!mapEl.current) return;

    map.current = new maplibregl.Map({
      container: mapEl.current,
      style: "https://tiles.stadiamaps.com/styles/alidade_smooth_dark.json",
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

  // -------------------------------
  // AI ANALYSIS
  // -------------------------------
  const runAI = async (imageUrl) => {
  setAiLoading(true);
  try {
    const res = await fetch("http://localhost:8000/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image_url: imageUrl }),
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(txt || "AI failed");
    }

    const data = await res.json();
    setAiResult(data);
    return data;
  } catch (e) {
    setAiResult({
      summary: "AI unavailable. Image saved without analysis.",
      confidence: 0,
      labels: [],
    });
    return null;
  } finally {
    setAiLoading(false);
  }
};


  // -------------------------------
  // SUBMIT
  // -------------------------------
  const handleSubmit = async () => {
    if (!coords) return alert("Place a pin first");
    if (!imageFile) return alert("Upload an image");

    setSaving(true);

    try {
      // 1️⃣ Upload image
      const imageUrl = await uploadToCloudinary(imageFile);

      // 2️⃣ Run AI
      let ai = null;
      try {
        ai = await runAI(imageUrl);
      } catch {}


      // 3️⃣ Save issue
      const payload = {
        title: title || "Untitled",
        description: desc,
        coords,
        imageUrl,
        ai,
        createdAt: Date.now(),
      };

      const res = await fetch("http://localhost:8000/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Save failed");

      const saved = await res.json();
      onSaved?.(saved);

    } catch (err) {
      console.error(err);
      alert("Submission failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 99999 }}>
      <div ref={mapEl} style={{ position: "absolute", inset: 0 }} />

      {/* Back */}
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
        }}
      >
        ← Back
      </button>

      {/* Floating Card */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: 36,
          transform: "translateX(-50%)",
          width: 760,
          maxWidth: "92vw",
          borderRadius: 16,
          padding: 20,
          background: "rgba(12,12,12,0.75)",
          backdropFilter: "blur(24px)",
          color: "white",
        }}
      >
        <h3>Add Issue</h3>

        <input
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ width: "100%", marginBottom: 8 }}
        />

        <textarea
          placeholder="Description"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          rows={3}
          style={{ width: "100%", marginBottom: 8 }}
        />

        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files[0])}
        />

        {aiLoading && <p>🔍 Running AI…</p>}

        {aiResult && (
          <div style={{ marginTop: 10, fontSize: 14 }}>
            <b>AI Result:</b><br />
            {aiResult.summary}<br />
            Confidence: {(aiResult.confidence * 100).toFixed(1)}%
          </div>
        )}

        <button onClick={handleSubmit} disabled={saving}>
          {saving ? "Submitting…" : "Submit Issue"}
        </button>
      </div>
    </div>
  );
}
