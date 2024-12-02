import type { Metadata } from "next";
import AppSidebar from "@/components/layout/app-sidebar";
import { getTokens } from "next-firebase-auth-edge";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { authConfig } from "../../../config/server-config";

export const metadata: Metadata = {
  title: "Rebus Pro - Dashboard",
  description: "Rebus Pro - The best way to manage your events",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AppSidebar>{children}</AppSidebar>
    </>
  );
}
