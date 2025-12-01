// src/firebase.js
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);

// collection ref
const issuesRef = collection(db, "issues");

/**
 * Save an issue object to Firestore (handles timestamp).
 * issue: { title, description, coords, imageUrl, category? }
 */
export async function saveIssue(issue) {
  // normalize fields
  const payload = {
    title: issue.title ?? "Untitled",
    description: issue.description ?? issue.desc ?? "",
    coords: issue.coords,
    imageUrl: issue.imageUrl ?? "",
    category: issue.category ?? "unverified",
    created: serverTimestamp(),
  };

  const docRef = await addDoc(issuesRef, payload);
  return { id: docRef.id, ...payload };
}

/**
 * Real-time listener to issues collection.
 * callback receives an array of issue objects: [{ id, ...data }]
 * Returns unsubscribe function.
 */
export function listenIssues(callback) {
  const q = query(issuesRef, orderBy("created", "desc"));
  const unsub = onSnapshot(
    q,
    (snap) => {
      const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(arr);
    },
    (err) => {
      console.error("listenIssues error", err);
      callback([]);
    }
  );
  return unsub;
}
