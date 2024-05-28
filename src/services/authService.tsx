/**
 * Service file for authentication related functions.
 */

import error from "next/error";
import { auth, onAuthStateChanged, User } from "../../firebase";
import { useState, useEffect } from "react";

// Define the user object type
interface AuthUser {
  uid: string;
  email: string;
  // Add any other relevant user properties you need
}

/**
 * Listens for authentication state changes.
 * @param callback - A function that will be called with the user object when the authentication state changes.
 * @returns A function to unsubscribe from the authentication state changes.
 */
export const listenForAuthStateChanges = (
  callback: (user: User | null) => void
) => {
  return onAuthStateChanged(auth, callback);
};

// Login function
// this logic is currently in firebase.tsx and login.tsx

// Signup function
// this logic is currently in firebase.tsx and signUp.tsx

// Logout function
export const logout = () => {
  console.log("Logging out...");
  try {
    auth.signOut();
  } catch (error: any) {
    // Add type annotation to 'error' parameter
    console.error("Error logging out:", error?.message);
  }
  return null;
};

const formatAuthUser = (user: User | null): AuthUser | null => {
  if (user) {
    return {
      uid: user.uid,
      email: user.email || "", // Ensure email is not null
      // Add any other relevant user properties you need
    };
  }
  return null;
};

/**
 * Custom hook for handling Firebase authentication.
 *
 * @returns An object containing the authenticated user and a loading state.
 */
export default function useFirebaseAuth() {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const authStateChanged = async (authState: User | null) => {
    setAuthUser(formatAuthUser(authState));
    setLoading(false);
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(authStateChanged);
    return () => unsubscribe();
  }, []);

  return { authUser, loading };
}
