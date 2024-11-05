"use client";

import { useEffect } from "react";
import { useFirebaseAuth } from "@/services/authService";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const { authUser } = useFirebaseAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authUser) {
      router.replace("/");
    } else {
      router.push("/dashboard/calendar");
    }
  }, [authUser, router]);

  return null;
}
