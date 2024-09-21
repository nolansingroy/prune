"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useFirebaseAuth } from "../services/authService";
import { PersonIcon, HamburgerMenuIcon } from "@radix-ui/react-icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authLogout } from "../services/authService";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase"; // Make sure the Firebase instance is correctly imported

const Header = () => {
  const { authUser } = useFirebaseAuth();
  const [userName, setUserName] = useState("");
  const [userTimezone, setUserTimezone] = useState("");

  // Fetch user data from Firestore
  useEffect(() => {
    const fetchUserData = async () => {
      if (authUser) {
        const userDocRef = doc(db, "users", authUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserName(`${userData.firstName} ${userData.lastName}`);
          setUserTimezone(userData.timezone || "Unknown Timezone");
        }
      }
    };

    fetchUserData();
  }, [authUser]);

  const handleLogOut = async () => {
    try {
      await authLogout();
      console.log("User logged out, redirecting...");
      window.location.href = "/";
    } catch (error) {
      console.error("Error during logout process:", error);
    }
  };

  const renderAvatar = () => {
    if (authUser) {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Avatar>
              <AvatarImage
                src={
                  authUser.photoURL ||
                  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSJjdXJyZW50Q29sb3IiPjxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjEwIiBmaWxsPSIjZjNmNGY2IiAvPjxwYXRoIGQ9Ik0xMiAxMmMyLjIxIDAgNC0xLjc5IDQtNHMtMS43OS00LTQtNC00IDEuNzktNCA0IDEuNzkgNCA0IDQtNC0yLjY3IDAtOCAxLjM0LTggNHYyIGgxNnYtMmMwLTIuNjYtNS4zMy00LTgtNHoiIGZpbGw9IiNhMGFlYzAiIC8+PC9zdmc+"
                }
                alt={userName}
              />
              <AvatarFallback>
                <PersonIcon className="text-white" />
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuItem>
              <span className="font-semibold">{userName}</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <span className="text-sm text-gray-500">{userTimezone}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Link href="/settings">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogOut}>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    } else {
      return <Link href="/signUp">Login</Link>;
    }
  };

  const renderHamburgerMenu = () => {
    if (authUser) {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <HamburgerMenuIcon className="h-8 w-8 cursor-pointer" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuItem>
              <Link href="/">Home</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Link href="/calendar">Calendar</Link>
            </DropdownMenuItem>
            <DropdownMenuItem disabled>Dashboard</DropdownMenuItem>
            <DropdownMenuItem>
              <Link href="/clients">Clients</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Link href="/settings">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogOut}>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }
  };

  return (
    <header className="bg-custom-fade-blue text-white">
      <nav>
        <ul className="flex items-center justify-between p-4">
          <li>{renderHamburgerMenu()}</li>
          <li className="flex items-center">
            <Link
              href="/"
              className="flex items-center text-3xl hover:text-gray-300 pl-10"
            >
              <Image
                src="/RebusPrimaryHorizontalDark.png"
                alt="RebusPro Logo"
                width={250}
                height={250}
                className="inline-block"
              />
            </Link>
          </li>
          <li>{renderAvatar()}</li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;
