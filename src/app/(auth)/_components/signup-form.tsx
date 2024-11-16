"use client";

import React, { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { auth } from "../../../../firebase";
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
import { toast } from "sonner";
import {
  registerFormSchema,
  registerFormValues,
} from "@/lib/validations/register-validations";

export default function SignupForm() {
  const [loading, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<registerFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
    },
  });

  const handleSignUp = (data: registerFormValues) => {
    startTransition(async () => {
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

        toast.success("Account created successfully, please login");

        router.push("/login");
      } catch (error: any) {
        toast.error(
          error.message ||
            "An error occurred while creating an account. Please try again."
        );
        console.error("Error creating user:", error.message);
      }
    });
  };

  const onSubmit = (data: registerFormValues) => {
    handleSignUp(data);
  };

  const handleGoogleSignUp = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
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
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="first-name">First name</Label>
              <Input
                id="first-name"
                placeholder="Max"
                {...form.register("firstName")}
                disabled={loading}
                className="text-base" // Ensure font size is at least 16px
              />
              {form.formState.errors.firstName && (
                <p className="text-destructive text-sm">
                  {form.formState.errors.firstName.message}
                </p>
              )}
            </div>
            <div className="flex-1">
              <Label htmlFor="last-name">Last name</Label>
              <Input
                id="last-name"
                placeholder="Robinson"
                {...form.register("lastName")}
                disabled={loading}
                className="text-base" // Ensure font size is at least 16px
              />
              {form.formState.errors.lastName && (
                <p className="text-destructive text-sm">
                  {form.formState.errors.lastName.message}
                </p>
              )}
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="text" // Changed from "email" to "text" to disable HTML validation
              placeholder="m@example.com"
              {...form.register("email")}
              disabled={loading}
              className="text-base" // Ensure font size is at least 16px
            />
            {form.formState.errors.email && (
              <p className="text-destructive text-sm">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              {...form.register("password")}
              disabled={loading}
              className="text-base" // Ensure font size is at least 16px
            />
            {form.formState.errors.password && (
              <p className="text-destructive text-sm">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>
          <Button
            variant="rebusPro"
            type="submit"
            className="w-full"
            disabled={loading}
          >
            Create an account
          </Button>
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
