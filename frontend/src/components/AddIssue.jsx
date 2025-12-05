// src/components/AddIssue.jsx

import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import { saveIssue, storage } from "../firebase";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";

export default function AddIssue({ onBack, onSaved }) {
  const mapEl = useRef(null);
  const map = useRef(null);
  const marker = useRef(null);

  const [coords, setCoords] = useState(null);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [saving, setSaving] = useState(false);

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

  const handleSubmit = async () => {
    if (!coords) return alert("Tap the map to place a pin first.");
    setSaving(true);

    try {
      let imageUrl = null;

      // -------------------------------
      // UPLOAD IMAGE
      // -------------------------------
      if (imageFile) {
        const filePath = `issues/${Date.now()}-${imageFile.name}`;
        const sref = storageRef(storage, filePath);
        await uploadBytes(sref, imageFile);
        imageUrl = await getDownloadURL(sref);
      }

      // -------------------------------
      // CREATE PAYLOAD
      // -------------------------------
      const payload = {
        title: title || "Untitled",
        description: desc || "",
        coords,
        imageUrl: imageUrl || null, // never empty string
        category: "unverified",
      };

      // -------------------------------
      // SAVE TO FIRESTORE
      // -------------------------------
      const docRef = await saveIssue(payload);

      console.log("Saved issue →", docRef.id);

      onSaved?.({ id: docRef.id, ...payload });

    } catch (err) {
      console.error("Save failed", err);
      alert("Save failed. See console.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 99999, overflow: "hidden" }}>
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
          cursor: "pointer",
          backdropFilter: "blur(10px)",
        }}
      >
        ← Back
      </button>

      {/* Floating CARD */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: 36,
          transform: "translateX(-50%)",
          width: 760,
          maxWidth: "92vw",
          borderRadius: 16,
          zIndex: 40,
          padding: 20,
          boxShadow: "0 20px 60px rgba(2,6,23,0.6)",
          background: "linear-gradient(180deg, rgba(12,12,12,0.75), rgba(6,6,6,0.65))",
          border: "1px solid rgba(255,255,255,0.04)",
          backdropFilter: "blur(24px)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <h3 style={{ color: "white", margin: 0, fontSize: 20 }}>Add Issue</h3>
          <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>
            Tap map to place a pin
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 240px", gap: 14 }}>
          <div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 10,
                background: "rgba(255,255,255,0.03)",
                color: "white",
                border: "1px solid rgba(255,255,255,0.06)",
                marginBottom: 10,
              }}
            />

            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Description"
              rows={4}
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 10,
                background: "rgba(255,255,255,0.03)",
                color: "white",
                border: "1px solid rgba(255,255,255,0.06)",
                resize: "vertical",
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: 140,
                borderRadius: 10,
                border: "1px dashed rgba(255,255,255,0.06)",
                background: "rgba(255,255,255,0.02)",
                color: "white",
                cursor: "pointer",
                textAlign: "center",
              }}
            >
              {imageFile ? (
                <img
                  src={URL.createObjectURL(imageFile)}
                  alt="preview"
                  style={{
                    maxWidth: "100%",
                    maxHeight: 140,
                    objectFit: "cover",
                    borderRadius: 8,
                  }}
                />
              ) : (
                <div style={{ padding: 8 }}>Upload image</div>
              )}

              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files[0])}
                style={{ display: "none" }}
              />
            </label>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={handleSubmit}
                disabled={saving}
                style={{
                  flex: 1,
                  padding: "12px 14px",
                  borderRadius: 10,
                  background: "linear-gradient(90deg,#34d399,#10b981)",
                  border: "none",
                  color: "#041014",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {saving ? "Saving…" : "Save & Submit"}
              </button>

              <button
                onClick={() => {
                  setTitle("");
                  setDesc("");
                  setImageFile(null);
                }}
                style={{
                  padding: "12px 14px",
                  borderRadius: 10,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  color: "white",
                  cursor: "pointer",
                }}
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
