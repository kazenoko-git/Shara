// useIssues.js
import { useEffect, useState } from "react";
import { listenIssues } from "../firebase";

export default function useIssues() {
  const [issues, setIssues] = useState([]);

  useEffect(() => {
    const unsub = listenIssues(setIssues);
    return () => unsub();
  }, []);

  return issues;
}
