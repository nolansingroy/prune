"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

import axios from "axios";

import { app } from "../../firebase";
import {
  addDoc,
  collection,
  doc,
  getFirestore,
  setDoc,
} from "firebase/firestore";
// Initialize Firestore
const db = getFirestore(app);

export function Signup() {
  const [email, setEmail] = useState("");

  // Now you can use 'db' to interact with Firestore
  // For example:
  // const docRef = doc(db, "users", "user_id");

  //"https://hooks.slack.com/services/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",

  const handleSignup = async () => {
    try {
      // Reference the collection where you want to add the document
      const collectionRef = collection(db, "signups");

      // Use addDoc to create a new document in the collection
      await addDoc(collectionRef, {
        email,
        timestamp: new Date(),
      });
      setEmail(""); // Clear the email input field
    } catch (error) {
      console.error("Error during signup:", error);
    }
  };

  return (
    <div className="flex w-full max-w-sm items-center space-x-2 bg-custom-purple text-black ps-8">
      <Input
        type="email"
        placeholder="Email"
        style={{ backgroundColor: "white" }}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Button type="submit" onClick={handleSignup}>
        Sign Up
      </Button>
    </div>
  );
}

export default Signup;
