"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { getAuth, signInWithCustomToken } from "firebase/auth";

interface User {
  id: string;
  email: string;
}

interface ImpersonateViewProps {
  users: User[];
}

export default function ImpersonateView({ users }: ImpersonateViewProps) {
  const router = useRouter();

  const handleImpersonate = async (userId: string) => {
    try {
      const response = await fetch("/api/impersonate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        const { token } = await response.json();
        const auth = getAuth();
        const userCredential = await signInWithCustomToken(auth, token);
        const user = userCredential.user;
        const idToken = await user.getIdToken();

        await fetch("/api/login", {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        });

        // Refresh the page to reflect the new user session
        router.refresh();
      } else {
        console.error("Failed to impersonate user");
      }
    } catch (error: any) {
      console.error("Error impersonating user:", error.message);
    }
  };

  return (
    <ul className="space-y-1">
      {users.map((user) => (
        <li key={user.id} className="flex items-center justify-between">
          <span>{user.email}</span>
          <button
            onClick={() => {
              handleImpersonate(user.id);
            }}
            className="ml-4 p-2 bg-blue-500 text-white rounded"
          >
            Impersonate
          </button>
        </li>
      ))}
    </ul>
  );
}
