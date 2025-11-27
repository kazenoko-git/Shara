import React, { useState, useRef } from "react";
import EsriMap from "./components/EsriMap";
import Sidebar from "./components/Sidebar";

export default function App() {
  const [filters, setFilters] = useState({
    waste: true,
    water: true,
    vegetation: true,
    rooftop: true,
  });

  // Later we’ll attach bbox logic here
  const handleScan = () => {
    console.log("SCAN CLICKED");

    // TODO in Module 4: get bbox from map
    // TODO in Module 5: send to Rust backend
  };

  return (
    <div className="h-screen w-screen relative">
      <Sidebar
        onScan={handleScan}
        filters={filters}
        setFilters={setFilters}
      />

      <EsriMap />
    </div>
  );
}
