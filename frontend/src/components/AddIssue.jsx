// frontend/src/components/AddIssue.jsx
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

  const runAI = async (imageUrl) => {
    setAiLoading(true);
    try {
      const res = await fetch("http://localhost:8000/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_url: imageUrl }),
      });

      if (!res.ok) throw new Error("AI failed");
      const data = await res.json();
      setAiResult(data);
      return data;
    } catch (e) {
      console.warn("AI error", e);
      setAiResult({ summary: "AI error or disabled.", confidence: 0, labels: [] });
      return { summary: "AI error or disabled.", confidence: 0, labels: [] };
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

      const ai = await runAI(imageUrl);

      const payload = {
        title: title || "Untitled",
        description: desc || "",
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

      if (!res.ok) {
        const text = await res.text();
        throw new Error("Save failed: " + text);
      }

      const saved = await res.json();
      onSaved?.(saved);
    } catch (err) {
      console.error("Save failed", err);
      alert("Save failed: " + (err.message || err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 99999 }}>
      <div ref={mapEl} style={{ position: "absolute", inset: 0 }} />

      <button
        onClick={onBack}
        style={{ position: "absolute", top: 20, left: 20, zIndex: 30, padding: "10px 16px", borderRadius: 12, background: "rgba(0,0,0,0.45)", color: "#fff", border: "none", }}
      >
        ← Back
      </button>

      <div style={{
        position: "absolute",
        left: "50%",
        bottom: 36,
        transform: "translateX(-50%)",
        width: 760,
        maxWidth: "92vw",
        borderRadius: 16,
        padding: 20,
        background: "rgba(12,12,12,0.85)",
        backdropFilter: "blur(14px)",
        color: "white",
        zIndex: 40
      }}>
        <h3 style={{ margin: 0, fontSize: 20 }}>Add Issue</h3>

        <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: "100%", marginTop: 10, padding: 10 }} />
        <textarea placeholder="Description" rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} style={{ width: "100%", marginTop: 8, padding: 10 }} />

        <div style={{ marginTop: 8 }}>
          <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0])} />
        </div>

        {aiLoading && <p>🔍 Running AI…</p>}

        {aiResult && (
          <div style={{ marginTop: 10, fontSize: 14 }}>
            <b>AI Result:</b><br />
            {aiResult.summary}<br />
            Confidence: {(aiResult.confidence * 100).toFixed(1)}%
          </div>
        )}

        <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
          <button onClick={handleSubmit} disabled={saving} style={{ flex: 1, padding: "12px 14px", borderRadius: 10, background: "#10b981", color: "#041014", fontWeight: 700 }}>
            {saving ? "Submitting…" : "Submit Issue"}
          </button>
          <button onClick={() => { setTitle(""); setDesc(""); setImageFile(null); setAiResult(null); }} style={{ padding: "12px 14px", borderRadius: 10, background: "rgba(255,255,255,0.06)", color: "white" }}>
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
