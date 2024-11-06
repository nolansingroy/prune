"use client";

import React, { useTransition, FormEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { auth, app } from "../../../../firebase";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  getAuth,
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
import { toast } from "sonner";

const formSchema = z.object({
  firstName: z.string().min(1, { message: "First name is required" }),
  lastName: z.string().min(1, { message: "Last name is required" }),
  email: z.string().email({ message: "Enter a valid email address" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" }),
});

type SignupFormValues = z.infer<typeof formSchema>;

export default function SignupForm() {
  const [loading, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
    },
  });

  const handleSignUp = async (data: SignupFormValues) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );

      const user = userCredential.user;
      await updateProfile(user, {
        displayName: `${data.firstName} ${data.lastName}`,
      });

      const userData = {
        uid: user.uid,
        displayName: `${data.firstName} ${data.lastName}`,
        email: user.email || "",
        emailVerified: user.emailVerified,
        firstName: data.firstName,
        lastName: data.lastName,
        photoURL: user.photoURL || "",
        role: "user",
        loginType: "email",
        contactPreference: "email",
        creationTime: Timestamp.now(),
        updated_at: Timestamp.now(),
      };

      console.log("User data:", userData);
      await createUser(userData);

      console.log(
        "User created successfully with name:",
        `${data.firstName} ${data.lastName}`
      );

      router.push("/login");
    } catch (error: any) {
      console.error("Error creating user:", error.message);
    }
  };

  const onSubmit = (data: SignupFormValues) => {
    startTransition(() => {
      handleSignUp(data);
      toast.success("Account created successfully, please login");
    });
  };

  const handleGoogleSignUp = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      // Handle successful sign-up (e.g., redirect to home page)
    } catch (error: any) {
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
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="first-name">First name</Label>
              <Input
                id="first-name"
                placeholder="Max"
                required
                {...form.register("firstName")}
                disabled={loading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="last-name">Last name</Label>
              <Input
                id="last-name"
                placeholder="Robinson"
                required
                {...form.register("lastName")}
                disabled={loading}
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
              {...form.register("email")}
              disabled={loading}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              {...form.register("password")}
              disabled={loading}
            />
          </div>
          <Button
            variant={"rebusPro"}
            type="submit"
            className="w-full"
            disabled={loading}
          >
            Create an account
          </Button>
          {/* <Button
            variant="outline"
            className="w-full"
            onClick={handleGoogleSignUp}
          >
            Sign up with Google
          </Button> */}
        </form>
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
