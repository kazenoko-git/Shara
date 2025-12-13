import React, { useState } from "react";

import MainMap from "./components/MainMap";
import AddIssue from "./components/AddIssue";
import IssueDetails from "./components/IssueDetails";
import Groups from "./components/Groups";
import GroupChat from "./components/GroupChat";
import Filters from "./components/Filters";

import useIssues from "./hooks/useIssues";

export default function App() {
  // 🔥 Real-time issues from Firestore
  const issues = useIssues();
  if (!localStorage.getItem("userId")) {
  localStorage.setItem("userId", "u_" + Math.random().toString(36).slice(2));
}


  // Navigation
  const [page, setPage] = useState("map");

  // Context state
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [activeGroup, setActiveGroup] = useState(null);

  // FILTERS: category visibility
  const [filters, setFilters] = useState({
    waste: true,
    water: true,
    vegetation: true,
    rooftop: true,
  });

  // HEATMAP toggle
  const [heatmap, setHeatmap] = useState(false);

  // ----------------------
  // PAGE TRANSITIONS
  // ----------------------

  // MAP → ISSUE DETAILS
  const handleSelectIssue = (issue) => {
    setSelectedIssue(issue);
    setPage("details");
  };

  // MAP/FLOATING BTN → ADD ISSUE
  const handleAddIssue = () => setPage("add");

  // DETAILS → GROUPS PAGE
  const openGroups = () => setPage("groups");

  // GROUPS → CHAT PAGE
  const openChat = (group) => {
    setActiveGroup(group);
    setPage("chat");
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black">

      {/* 🌍 MAIN MAP */}
      {page === "map" && (
        <>
          <MainMap
            issues={issues}
            onSelectIssue={handleSelectIssue}
            onAddIssue={handleAddIssue}
            filters={filters}
            heatmap={heatmap}
          />

          {/* Floating Filters UI (glass) */}
          <Filters
            filters={filters}
            setFilters={setFilters}
            heatmap={heatmap}
            setHeatmap={setHeatmap}
          />
        </>
      )}

      {/* ➕ ADD ISSUE SCREEN */}
      {page === "add" && (
        <AddIssue
          onBack={() => setPage("map")}
          onSaved={(saved) => {
  console.log("saved", saved);
  setPage("map");
}}

        />
      )}

      {/* ℹ️ ISSUE DETAILS */}
      {page === "details" && selectedIssue && (
        <IssueDetails
          issue={selectedIssue}
          onBack={() => setPage("map")}
          openGroups={openGroups}
        />
      )}

      {/* 👥 GROUPS PAGE */}
      {page === "groups" && selectedIssue && (
        <Groups
          issue={selectedIssue}
          onBack={() => setPage("details")}
          onOpenChat={openChat}
        />
      )}

      {/* 💬 CHAT PAGE */}
      {activeGroup && (
  <GroupChat
    group={activeGroup}
    onMinimize={() => setActiveGroup(null)}
  />
)}

    </div>
  );
}
