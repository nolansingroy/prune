import type { Metadata } from "next";
import AppSidebar from "@/components/layout/app-sidebar";
import "../globals.css";

export const metadata: Metadata = {
  title: "Rebus Pro - Dashboard",
  description: "Rebus Pro - The best way to manage your events",
};

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <AppSidebar>{children}</AppSidebar>
    </>
  );
}
