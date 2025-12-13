import { useEffect, useState } from "react";

export default function useIssues() {
  const [issues, setIssues] = useState([]);

  useEffect(() => {
    let alive = true;

    const fetchIssues = async () => {
      try {
        const res = await fetch("http://localhost:8000/issues");
        if (!res.ok) throw new Error("Failed to fetch issues");
        const data = await res.json();
        if (alive) setIssues(data);
      } catch (err) {
        console.error("❌ Failed to load issues:", err);
      }
    };

    // initial load
    fetchIssues();

    // poll every 5s
    const interval = setInterval(fetchIssues, 5000);

    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, []);

  return issues;
}
