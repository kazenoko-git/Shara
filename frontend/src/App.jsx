import React, { useState } from "react";
import EsriMap from "./components/EsriMap";
import Sidebar from "./components/Sidebar";
import useIssues from "./hooks/useIssues";

export default function App() {
  const [filters, setFilters] = useState({
    waste: true,
    water: true,
    vegetation: true,
    rooftop: true,
  });

  // 🔥 Realtime Firestore issues
  const issues = useIssues();

  const handleScan = () => {
    console.log("SCAN CLICKED");
    // TODO Module 4: get bbox from map
    // TODO Module 5: send to Rust backend
  };

  return (
    <div className="h-screen w-screen relative overflow-hidden">
      <Sidebar
        onScan={handleScan}
        filters={filters}
        setFilters={setFilters}
      />

      <EsriMap 
        issues={issues}     // 🔥 pass issues to map
        filters={filters}   // 🔥 map will filter layers later
      />
    </div>
  );
}
