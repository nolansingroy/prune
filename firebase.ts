// firebase.ts
import { initializeApp } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  User,
  sendPasswordResetEmail,
} from "firebase/auth";
import {
  getFirestore,
  Timestamp,
  doc,
  collection, // Importing collection for use in services
  addDoc, // Importing addDoc for document creation
  updateDoc, // Importing updateDoc for document updates
  setDoc, // Importing setDoc for setting document data
  serverTimestamp, // Importing serverTimestamp for Firestore server time stamps
} from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBceYtkM6I4i1LLtbstidQ4-i8CAfsve28",
  authDomain: "prune-94ad9.firebaseapp.com",
  projectId: "prune-94ad9",
  storageBucket: "prune-94ad9.appspot.com",
  messagingSenderId: "964726998539",
  appId: "1:964726998539:web:b908661d1df1514374690e",
  measurementId: "G-Z5B6KECB5W",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
let analytics;

if (typeof window !== "undefined") {
  analytics = getAnalytics(app);
}

// Export all necessary Firebase functionalities
export {
  app,
  auth,
  onAuthStateChanged,
  sendPasswordResetEmail,
  db,
  storage,
  analytics,
  Timestamp,
  // Firestore utilities
  doc,
  collection,
  addDoc,
  updateDoc,
  setDoc,
  serverTimestamp,
};
export type { User };
