import React, { useState, useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import { uploadBytes, ref, getDownloadURL } from "firebase/storage";
import { storage, db } from "../firebase";
import { collection, addDoc } from "firebase/firestore";

export default function AddIssue({ onBack, onSaved }) {
  const mapRef = useRef(null);
  const map = useRef(null);

  const [marker, setMarker] = useState(null);
  const [coords, setCoords] = useState(null);

  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [image, setImage] = useState(null);

  // ================================
  // INIT MAP
  // ================================
  useEffect(() => {
    map.current = new maplibregl.Map({
      container: mapRef.current,
      style: "https://tiles.stadiamaps.com/styles/alidade_smooth_dark.json",
      center: [77.216721, 28.6448],
      zoom: 12,
    });

    // place marker on tap
    map.current.on("click", (e) => {
      const { lng, lat } = e.lngLat;
      setCoords([lng, lat]);

      if (marker) marker.remove();

      const m = new maplibregl.Marker({ color: "#10b981" })
        .setLngLat([lng, lat])
        .addTo(map.current);

      setMarker(m);
    });

    return () => map.current?.remove();
  }, []);

  // ================================
  // SAVE ISSUE
  // ================================
  const handleSubmit = async () => {
    if (!coords) return alert("Tap the map to place a pin first.");

    let imageUrl = "";
    if (image) {
      const fileRef = ref(storage, `issues/${Date.now()}-${image.name}`);
      await uploadBytes(fileRef, image);
      imageUrl = await getDownloadURL(fileRef);
    }

    const issue = {
      title,
      description: desc,
      coords,
      imageUrl,
      createdAt: Date.now(),
    };

    // 🚀 save to Firestore
    await addDoc(collection(db, "issues"), issue);

    onSaved(issue);
  };

  // ================================
  // UI
  // ================================
  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden">

      {/* MAP */}
      <div
        ref={mapRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          zIndex: 1,
        }}
      />

      {/* BACK BUTTON */}
      <div
        onClick={onBack}
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          padding: "10px 18px",
          borderRadius: 14,
          background: "rgba(0,0,0,0.35)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          color: "white",
          cursor: "pointer",
          fontSize: 15,
          fontWeight: 500,
          zIndex: 99999,
        }}
      >
        ← Back
      </div>

      {/* BOTTOM GLASS SHEET */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: "100%",
          padding: "32px 24px",
          background: "rgba(12,12,12,0.55)",
          backdropFilter: "blur(35px)",
          WebkitBackdropFilter: "blur(35px)",
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          borderTop: "1px solid rgba(255,255,255,0.08)",
          color: "white",
          zIndex: 999999,
          maxHeight: "45%",
          overflowY: "auto",
        }}
      >
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 10 }}>
          Add Issue
        </h2>

        <p style={{ opacity: 0.7, marginBottom: 16 }}>
          Tap anywhere on the map to place a pin.
        </p>

        {/* Title */}
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          style={{
            width: "100%",
            padding: "12px 14px",
            marginBottom: 10,
            borderRadius: 12,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
            color: "white",
          }}
        />

        {/* Description */}
        <textarea
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Description"
          rows={3}
          style={{
            width: "100%",
            padding: "12px 14px",
            marginBottom: 12,
            borderRadius: 12,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
            color: "white",
          }}
        />

        {/* Image Picker */}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files[0])}
          style={{
            marginBottom: 20,
            color: "white",
          }}
        />

        <button
          onClick={handleSubmit}
          style={{
            width: "100%",
            padding: "14px 10px",
            fontSize: 17,
            fontWeight: 700,
            borderRadius: 14,
            background: "linear-gradient(90deg,#34d399,#10b981)",
            border: "none",
            cursor: "pointer",
            color: "#041014",
            boxShadow: "0 6px 16px rgba(16,185,129,0.25)",
          }}
        >
          Submit Issue
        </button>
      </div>
    </div>
  );
}
