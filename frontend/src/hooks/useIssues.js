// frontend/src/hooks/useIssues.js
import { useEffect, useState, useRef } from "react";

const API = import.meta.env.VITE_API_URL;


export default function useIssues(pollIntervalMs = 3000) {
  const [issues, setIssues] = useState([]);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;

    async function fetchIssues() {
      try {
        const res = await fetch(`${API}/issues`);
        if (!res.ok) throw new Error("failed fetch issues");
        const data = await res.json();
        if (mounted.current) setIssues(data);
      } catch (e) {
        console.warn("Failed to load issues:", e);
      }
    }

    fetchIssues();
    const id = setInterval(fetchIssues, pollIntervalMs);

    return () => {
      mounted.current = false;
      clearInterval(id);
    };
  }, [pollIntervalMs]);

  return issues;
}
