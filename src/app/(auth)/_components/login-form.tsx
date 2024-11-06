"use client";

import { useState, useEffect, useTransition, FormEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import { app } from "../../../../firebase";
import { signInWithEmailAndPassword, getAuth } from "firebase/auth";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  email: z.string().email({ message: "Enter a valid email address" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" }),
});

type LoginFormValues = z.infer<typeof formSchema>;

export default function LoginForm() {
  const [loading, startTransition] = useTransition();
  // const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const router = useRouter();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // useEffect(() => {
  //   const unsubscribe = listenForAuthStateChanges((user) => {
  //     if (user) {
  //       setIsAuthenticated(true);
  //     } else {
  //       setIsAuthenticated(false);
  //     }
  //   });

  //   return () => unsubscribe();
  // }, []);

  const handleLogin = async (data: LoginFormValues) => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        getAuth(app),
        data.email,
        data.password
      );
      const user = userCredential.user;
      const idToken = await user.getIdToken();

      try {
        await fetch("/api/login", {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        });
      } catch (error) {
        console.error("Failed to send ID token to API", error);
      }

      console.log("User logged in successfully with email:", user.email);
      console.log("ID token:", idToken);
      router.push("/");
    } catch (error: any) {
      console.error("Error logging in:", error.message);
      console.error(`Error logging in: ${data.email} +  ${data.password}`);
    }
  };

  const onSubmit = (data: LoginFormValues) => {
    startTransition(() => {
      handleLogin(data);
      toast.success("Login successful");
    });
  };

  const resetPasswordFirebase = async () => {
    try {
      console.log(
        "Initiating password reset for email:",
        form.getValues("email")
      );
      await resetPassword(form.getValues("email"), getAuth(app));
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
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                {...form.register("email")}
                disabled={loading}
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
                        className="underline text-muted-foreground ps-2 sm:text-xs"
                        onClick={() => setResetDialogOpen(true)}
                      >
                        Forgot Password
                      </a>
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
                          {...form.register("email")}
                          disabled={loading}
                        />
                      </div>
                      <DialogFooter>
                        <Button
                          onClick={resetPasswordFirebase}
                          disabled={loading}
                        >
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
                {...form.register("password")}
                disabled={loading}
              />
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
        </Form>
        <div className="mt-4 text-center text-sm">
          Don&apos;t have an account?{" "}
          <Link href="register" className="underline">
            Sign up
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
