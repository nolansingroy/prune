"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth, signInWithCustomToken } from "firebase/auth";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface User {
  id: string;
  email: string;
}

interface ImpersonateViewProps {
  users: User[];
}

export default function ImpersonateView({ users }: ImpersonateViewProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const handleImpersonate = async (userId: string) => {
    try {
      const response = await fetch("/api/impersonate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        const { token } = await response.json();
        const auth = getAuth();
        const userCredential = await signInWithCustomToken(auth, token);
        const user = userCredential.user;
        const idToken = await user.getIdToken();

        await fetch("/api/login", {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        });

        // Refresh the page to reflect the new user session
        router.refresh();
      } else {
        console.error("Failed to impersonate user");
      }
    } catch (error: any) {
      console.error("Error impersonating user:", error.message);
    }
  };

  const filteredUsers = users.filter((user) =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <Input
          type="text"
          placeholder="Search by email"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mb-4 p-2 border border-gray-300 rounded"
        />
      </div>
      <ScrollArea className="h-[calc(80vh-220px)] rounded-md border md:h-[calc(90dvh-240px)] grid">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User ID</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.id}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Button
                    size={"sm"}
                    variant={"rebusPro"}
                    onClick={() => handleImpersonate(user.id)}
                  >
                    Switch user
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
