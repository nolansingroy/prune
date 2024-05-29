/**
 * Service file for authentication related functions.
 */
import { Auth } from "firebase/auth";
import {
  auth,
  onAuthStateChanged,
  User,
  sendPasswordResetEmail,
} from "../../firebase";
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
/**
 * Logs the user out by calling the `auth.signOut()` method.
 *
 * @returns A Promise that resolves to void.
 */
const authLogout = async (): Promise<void> => {
  console.log("Logging out...");
  try {
    await auth.signOut();
    console.log("Successfully logged out.");
  } catch (error: any) {
    console.error("Error logging out:", error?.message);
  }
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
const useFirebaseAuth = () => {
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
};

const resetPassword = async (email: string, auth: Auth) => {
  try {
    await sendPasswordResetEmail(auth, email); // Correct order: auth first, then email
    console.log(`Password reset email sent successfully to: ${email}`);
  } catch (error: any) {
    console.error("Error sending password reset email:", error?.message);
  }
};

export { useFirebaseAuth, authLogout, resetPassword };
