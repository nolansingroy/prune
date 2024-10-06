"use client";

import React from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { auth } from "../../../firebase";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { createUser } from "@/services/userService";
import { Timestamp } from "firebase/firestore";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const router = useRouter(); // Initialize useRouter

  // Handle the signUp logic here
  const handleSignUp = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = userCredential.user;
      // Update the user profile with first and last name
      await updateProfile(user, {
        displayName: `${firstName} ${lastName}`,
      });

      const userData = {
        uid: user.uid,
        displayName: `${firstName} ${lastName}`,
        email: user.email || "",
        emailVerified: user.emailVerified,
        firstName,
        lastName,
        photoURL: user.photoURL || "",
        role: "user", // default value
        loginType: "email", // default value
        contactPreference: "email", // default value
        creationTime: Timestamp.now(), // Create an instance of Timestamp
        updated_at: Timestamp.now(),
      };

      console.log("User data:", userData);
      await createUser(userData);

      console.log(
        "User created successfully with name:",
        `${firstName} ${lastName}`
      );

      // Redirect to the /calendar page after successful sign-up
      router.push("/calendar");
    } catch (error: any) {
      // Handle sign-up error (display error message, etc.)
      console.error("Error creating user:", error.message);
    }
  };

  //Google Sign Up
  const handleGoogleSignUp = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      // Handle successful sign-up (e.g., redirect to home page)
    } catch (error: any) {
      // Handle sign-up error (display error message, etc.)
      console.error("Error signing in with Google:", error.message);
    }
  };

  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader>
        <CardTitle className="text-xl text-black">Sign Up</CardTitle>
        <CardDescription>
          Enter your information to create an account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="first-name">First name</Label>
              <Input
                id="first-name"
                placeholder="Max"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="last-name">Last name</Label>
              <Input
                id="last-name"
                placeholder="Robinson"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" onClick={handleSignUp}>
            Create an account
          </Button>
          {/* <Button
          variant="outline"
          className="w-full"
          onClick={handleGoogleSignUp}
        >
          Sign up with Google
        </Button> */}
        </div>
        <div className="mt-4 text-center text-sm">
          Already have an account?{" "}
          <Link href="/login" className="underline">
            Sign in
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
