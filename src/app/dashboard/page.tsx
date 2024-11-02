"use client";

import { useFirebaseAuth } from "@/services/authService";
import { redirect } from "next/navigation";

export default function Dashboard() {
  const { authUser } = useFirebaseAuth();

  if (!authUser) {
    return redirect("/");
  } else {
    redirect("/dashboard/calendar");
  }
}
