export default function App() {
  const issues = useIssues();

  if (!localStorage.getItem("userId")) {
    localStorage.setItem("userId", "u_" + Math.random().toString(36).slice(2));
  }

  const [selectedIssue, setSelectedIssue] = useState(null);
  const [showGroups, setShowGroups] = useState(false);
  const [activeGroup, setActiveGroup] = useState(null);

  const [filters, setFilters] = useState({
    waste: true,
    water: true,
    vegetation: true,
    rooftop: true,
  });

  const [heatmap, setHeatmap] = useState(false);

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden">

      {/* MAP ALWAYS LIVES */}
      <MainMap
        issues={issues}
        onSelectIssue={setSelectedIssue}
        onAddIssue={() => {}}
        filters={filters}
        heatmap={heatmap}
      />

      <Filters
        filters={filters}
        setFilters={setFilters}
        heatmap={heatmap}
        setHeatmap={setHeatmap}
      />

      {/* ISSUE DETAILS MODAL */}
      {selectedIssue && (
        <IssueDetails
          issue={selectedIssue}
          onBack={() => setSelectedIssue(null)}
          openGroups={() => setShowGroups(true)}
        />
      )}

      {/* GROUPS MODAL */}
      {showGroups && selectedIssue && (
        <Groups
          issue={selectedIssue}
          onBack={() => setShowGroups(false)}
          onOpenChat={(g) => setActiveGroup(g)}
        />
      )}

      {/* FLOATING CHAT */}
      {activeGroup && (
        <GroupChat
          group={activeGroup}
          onMinimize={() => setActiveGroup(null)}
        />
      )}
    </div>
  );
}
