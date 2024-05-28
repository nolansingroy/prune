// firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
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
const firestore = getFirestore(app);
const storage = getStorage(app);
let analytics;

if (typeof window !== "undefined") {
  analytics = getAnalytics(app);
}

export { app, auth, onAuthStateChanged, firestore, storage, analytics };
export type { User };
