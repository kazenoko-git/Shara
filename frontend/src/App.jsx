import React, { useState } from "react";

import MainMap from "./components/MainMap";
import AddIssue from "./components/AddIssue";
import IssueDetails from "./components/IssueDetails";
import Groups from "./components/Groups";
import GroupChat from "./components/GroupChat";
import Filters from "./components/Filters";

import useIssues from "./hooks/useIssues"; // ✅ THIS WAS THE MISSING PIECE

export default function App() {
  // ---------- USER ----------
  if (!localStorage.getItem("userId")) {
    localStorage.setItem(
      "userId",
      "u_" + Math.random().toString(36).slice(2)
    );
  }

  // ---------- DATA ----------
  const issues = useIssues();

  // ---------- UI STATE ----------
  const [overlay, setOverlay] = useState(null); 
  // null | "add" | "details" | "groups"

  const [selectedIssue, setSelectedIssue] = useState(null);
  const [activeGroup, setActiveGroup] = useState(null);

  // ---------- FILTERS ----------
  const [filters, setFilters] = useState({
    waste: true,
    water: true,
    vegetation: true,
    rooftop: true,
  });

  const [heatmap, setHeatmap] = useState(false);

  // ---------- HANDLERS ----------
  const openIssue = (issue) => {
    setSelectedIssue(issue);
    setOverlay("details");
  };

  const openGroups = () => setOverlay("groups");

  const closeOverlay = () => {
    setOverlay(null);
    setSelectedIssue(null);
  };

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden">
      {/* MAP ALWAYS EXISTS */}
      <MainMap
        issues={issues}
        onSelectIssue={openIssue}
        onAddIssue={() => setOverlay("add")}
        filters={filters}
        heatmap={heatmap}
      />

      {/* FILTERS FLOAT */}
      <Filters
        filters={filters}
        setFilters={setFilters}
        heatmap={heatmap}
        setHeatmap={setHeatmap}
      />

      {/* ADD ISSUE OVERLAY */}
      {overlay === "add" && (
        <AddIssue
          onBack={closeOverlay}
          onSaved={() => closeOverlay()}
        />
      )}

      {/* ISSUE DETAILS OVERLAY */}
      {overlay === "details" && selectedIssue && (
        <IssueDetails
          issue={selectedIssue}
          onBack={closeOverlay}
          openGroups={openGroups}
        />
      )}

      {/* GROUPS OVERLAY */}
      {overlay === "groups" && selectedIssue && (
        <Groups
          issue={selectedIssue}
          onBack={() => setOverlay("details")}
          onOpenChat={(g) => setActiveGroup(g)}
        />
      )}

      {/* CHAT — FLOATING, NOT A PAGE */}
      {activeGroup && (
        <GroupChat
          group={activeGroup}
          onMinimize={() => setActiveGroup(null)}
        />
      )}
    </div>
  );
}
