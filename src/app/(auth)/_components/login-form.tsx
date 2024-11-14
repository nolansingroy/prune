"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { toast } from "sonner";
import { auth } from "../../../../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import {
  LoginFormValues,
  loginFormSchema,
} from "@/lib/validations/login-validations";
import { resetPassword } from "@/services/authService";

export default function LoginForm() {
  const [loading, startTransition] = useTransition();
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const router = useRouter();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const {
    handleSubmit,
    register,
    formState: { errors },
  } = form;

  const handleLogin = async (data: LoginFormValues) => {
    startTransition(async () => {
      try {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          data.email,
          data.password
        );
        const user = userCredential.user;
        const idToken = await user.getIdToken();

        await fetch("/api/login", {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        });

        toast.success("Login successful");
        router.refresh();
      } catch (error: any) {
        toast.error(
          error.message ||
            "An error occurred while logging in. Please try again."
        );
        console.error("Error logging in:", error.message);
      }
    });
  };

  const onSubmit = (data: LoginFormValues) => {
    handleLogin(data);
  };

  const resetPasswordFirebase = async () => {
    try {
      console.log(
        "Initiating password reset for email:",
        form.getValues("email")
      );
      await resetPassword(form.getValues("email"), auth);
      setResetDialogOpen(false);
      toast.success("Password reset email sent");
    } catch (error: any) {}
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
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="text" // Changed from "email" to "text"
              {...register("email")}
              disabled={loading}
            />
            {errors.email && (
              <p className="text-destructive text-sm">{errors.email.message}</p>
            )}
          </div>
          <div className="grid gap-2">
            <div className="flex items-center gap-24">
              <Label htmlFor="password">Password</Label>
              <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
                <DialogTrigger asChild>
                  <Link
                    href="#"
                    className="underline text-muted-foreground ps-2 sm:text-xs"
                    onClick={() => setResetDialogOpen(true)}
                  >
                    Forgot Password
                  </Link>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle className="">Forgot Password</DialogTitle>
                    <DialogDescription>
                      Enter your email below to reset your password
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      {...register("email")}
                      disabled={loading}
                    />
                  </div>
                  <DialogFooter>
                    <Button onClick={resetPasswordFirebase} disabled={loading}>
                      Reset Password
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <Input
              id="password"
              type="password"
              {...register("password")}
              disabled={loading}
            />
            {errors.password && (
              <p className="text-destructive text-sm">
                {errors.password.message}
              </p>
            )}
          </div>
          <Button
            variant="rebusPro"
            type="submit"
            className="w-full"
            disabled={loading}
          >
            LOGIN
          </Button>
        </form>
        <div className="mt-4 text-center text-sm">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="underline">
            Sign up
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
