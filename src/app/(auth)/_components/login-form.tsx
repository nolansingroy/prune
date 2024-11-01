"use client";

import { useState, useEffect } from "react";

import {
  listenForAuthStateChanges,
  resetPassword,
} from "@/services/authService";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { auth, db } from "../../../../firebase";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { collection, addDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  // figure out auth state of the user
  useEffect(() => {
    const unsubscribe = listenForAuthStateChanges((user) => {
      if (user) {
        setIsAuthenticated(true); // User is authenticated
      } else {
        setIsAuthenticated(false); // User is not authenticated
      }
    });

    return () => unsubscribe();
  }, []);

  // Handle the signUp logic Here
  const handleLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      console.log("User logged in successfully with email:", user.email);
      // Redirect to dashboard
      router.push("dashboard/calendar");
    } catch (error: any) {
      // Add type annotation to catch clause variable
      console.error("Error logging in:", error.message);
      console.error(`Error logging in: ${email} +  ${password}`);
    }
  };
  // const timestamp = new Date().toLocaleDateString();
  const timestamp = new Date().toLocaleString();

  const resetPasswordFirebase = async () => {
    try {
      console.log("Initiating password reset for email:", email);
      await resetPassword(email, auth);
      setResetDialogOpen(false);

      toast({
        title: "Reset successful, please check your email!",
        description: `${timestamp}`,
      });
    } catch (error: any) {}
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };
  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Login</CardTitle>
        <CardDescription>
          Enter your email below to login to your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <div className="flex items-center gap-24">
              <Label htmlFor="password">Password</Label>
              <div>
                <Dialog
                  open={resetDialogOpen}
                  onOpenChange={setResetDialogOpen}
                >
                  <DialogTrigger asChild>
                    <a
                      href="#"
                      className="underline ps-12 sm:text-xs"
                      onClick={() => setResetDialogOpen(true)}
                    >
                      Forgot Password
                    </a>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Forgot Password</DialogTitle>
                      <DialogDescription>
                        Enter your email below to reset your password
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <Input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    <DialogFooter>
                      <Button onClick={resetPasswordFirebase}>
                        Reset Password
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          <Button type="submit" className="w-full" onClick={handleLogin}>
            Login
          </Button>
        </div>
        <div className="mt-4 text-center text-sm">
          Don&apos;t have an account?{" "}
          <Link href="signUp" className="underline">
            Sign up
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
