"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image"; // Import the Image component from the correct package

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuViewport,
} from "../components/ui/navigation-menu";

import { navigationMenuTriggerStyle } from "@/components/ui/navigation-menu";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import useFirebaseAuth from "../services/authService";

const Header = () => {
  const { authUser } = useFirebaseAuth();

  return (
    <header className="bg-custom-purple text-white">
      <nav>
        <ul className="flex items-center justify-between p-4">
          {authUser && <li className="hamburger-menu text-2xl">☰</li>}
          <li>
            <Link href="/" className="text-3xl hover:text-gray-300">
              <Image
                src="/logo.svg"
                alt="Prune Logo"
                width={50}
                height={50}
                className="inline-block"
              />
            </Link>
          </li>
          <li>
            {authUser ? (
              <Avatar>
                <AvatarImage
                  src="https://github.com/shadcn.png"
                  alt="@shadcn"
                />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
            ) : (
              <Link href="/signUp">Login</Link>
            )}
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;
