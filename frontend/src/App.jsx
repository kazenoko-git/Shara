// src/App.jsx
import React, { useState } from "react";

import MainMap from "./components/MainMap";
import AddIssue from "./components/AddIssue";
import IssueDetails from "./components/IssueDetails";
import Groups from "./components/Groups";
import GroupChat from "./components/GroupChat";
import Filters from "./components/Filters";

import useIssues from "./hooks/useIssues";

export default function App() {
  // USER
  if (!localStorage.getItem("userId")) {
    localStorage.setItem("userId", "u_" + Math.random().toString(36).slice(2));
  }

  const issues = useIssues();

  const [overlay, setOverlay] = useState(null); // null | add | details | groups
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [activeGroup, setActiveGroup] = useState(null);

  const [filters, setFilters] = useState({
    waste: true,
    water: true,
    vegetation: true,
    rooftop: true,
  });

  const [heatmap, setHeatmap] = useState(false);

  const openIssue = (issue) => {
    setSelectedIssue(issue);
    setOverlay("details");
  };

  return (
    <div style={{ width: "100vw", height: "100vh", background: "black" }}>
      <MainMap
        issues={issues}
        onSelectIssue={openIssue}
        onAddIssue={() => setOverlay("add")}
      />

      {overlay === "add" && (
        <AddIssue onBack={() => setOverlay(null)} onSaved={() => setOverlay(null)} />
      )}

      {overlay === "details" && selectedIssue && (
        <IssueDetails
          issue={selectedIssue}
          onBack={() => setOverlay(null)}
          openGroups={() => setOverlay("groups")}
        />
      )}

      {overlay === "groups" && selectedIssue && (
        <Groups
          issue={selectedIssue}
          onBack={() => setOverlay("details")}
          onOpenChat={(g) => setActiveGroup(g)}
        />
      )}

      {activeGroup && (
        <GroupChat
          group={activeGroup}
          onMinimize={() => setActiveGroup(null)}
        />
      )}
    </div>
  );
}
