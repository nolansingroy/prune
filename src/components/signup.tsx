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
  const [firstName, setfirstName] = useState("");
  const [lastName, setlastName] = useState("");

  const handleSignup = async () => {
    try {
      // Reference the collection where you want to add the document
      const collectionRef = collection(db, "signups");

      // Use addDoc to create a new document in the collection
      await addDoc(collectionRef, {
        email,
        firstName,
        lastName,
        timestamp: new Date(),
      });
      setEmail(""); // Clear the email input field
      setfirstName("");
      setlastName("");
    } catch (error) {
      console.error("Error during signup:", error);
    }
  };

  return (
    <div className="flex w-full max-w-sm items-center flex-col bg-custom-grey text-black ps-8">
      <div className="flex space-x-2 pb-4">
        <Input
          type="firstName"
          placeholder="first name"
          style={{ backgroundColor: "white" }}
          value={firstName}
          onChange={(e) => setfirstName(e.target.value)}
        />
        <Input
          type="lastName"
          placeholder="last name"
          style={{ backgroundColor: "white" }}
          value={lastName}
          onChange={(e) => setlastName(e.target.value)}
        />
      </div>

      <div className="flex w-full">
        <Input
          type="email"
          placeholder="email"
          style={{ backgroundColor: "white" }}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button
          className="text-custom-green ml-2"
          type="submit"
          onClick={handleSignup}
        >
          Sign Up
        </Button>
      </div>
    </div>
  );
}

export default Signup;
