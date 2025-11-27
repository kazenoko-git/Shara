// firebase.js
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const issuesRef = collection(db, "issues");

export async function saveIssue(issue) {
  await addDoc(issuesRef, {
    ...issue,
    created: serverTimestamp(),
  });
}

export function listenIssues(callback) {
  const q = query(issuesRef, orderBy("created", "desc"));
  return onSnapshot(q, (snap) => {
    const arr = [];
    snap.forEach((doc) => arr.push({ id: doc.id, ...doc.data() }));
    callback(arr);
  });
}

export { db };
